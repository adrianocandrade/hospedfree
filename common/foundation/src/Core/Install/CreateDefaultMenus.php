<?php

namespace Common\Core\Install;

use Common\Settings\LoadDefaultSettings;
use Common\Settings\Models\Setting;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class CreateDefaultMenus
{
    public function execute(): void
    {
        $defaultMenus = json_decode(
            Arr::first(
                (new LoadDefaultSettings())->execute(),
                fn($value) => $value['name'] === 'menus',
            )['value'],
            true,
        );

        foreach ($defaultMenus as $menuIndex => $menu) {
            if (!isset($menu['id'])) {
                $defaultMenus[$menuIndex]['id'] = Str::random(6);
            }
            foreach (($menu['items'] ?? []) as $itemIndex => $item) {
                if (!isset($item['id'])) {
                    $defaultMenus[$menuIndex]['items'][$itemIndex][
                        'id'
                    ] = Str::random(6);
                }
                if (!isset($item['order'])) {
                    $defaultMenus[$menuIndex]['items'][$itemIndex][
                        'order'
                    ] = $itemIndex;
                }
            }
        }

        $setting = Setting::firstOrNew(['name' => 'menus']);
        $currentMenus = $setting->exists && is_array($setting->value)
            ? $setting->value
            : [];
        $menus = (new MergeDefaultMenus())->execute(
            $currentMenus,
            $defaultMenus,
        );

        if ($setting->exists && $menus === $currentMenus) {
            return;
        }

        $setting->value = $menus;
        $setting->save();

        Cache::forget('settings.public');
    }
}
