<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    private const MENU_ITEM_ID = 'hf-admin-payments';

    private const MENU_ITEM_ACTION = '/admin/settings/subscriptions';

    public function up(): void
    {
        $setting = DB::table('settings')->where('name', 'menus')->first();

        if (! $setting) {
            return;
        }

        $menus = json_decode($setting->value, true);

        if (! is_array($menus)) {
            return;
        }

        $menuIndex = collect($menus)->search(
            fn ($menu) => is_array($menu)
                && in_array('admin-sidebar', $menu['positions'] ?? [], true),
        );

        if ($menuIndex === false) {
            return;
        }

        $items = is_array($menus[$menuIndex]['items'] ?? null)
            ? array_values($menus[$menuIndex]['items'])
            : [];

        $existingIdIndex = collect($items)->search(
            fn ($item) => is_array($item)
                && ($item['id'] ?? null) === self::MENU_ITEM_ID,
        );
        $existingActionIndex = collect($items)->search(
            fn ($item) => is_array($item)
                && ($item['action'] ?? null) === self::MENU_ITEM_ACTION,
        );

        $paymentItem = [
            'type' => 'route',
            'label' => 'Pagamentos',
            'action' => self::MENU_ITEM_ACTION,
            'id' => self::MENU_ITEM_ID,
            'permissions' => ['settings.update'],
        ];

        if ($existingIdIndex !== false) {
            $items[$existingIdIndex] = $paymentItem;
        } elseif ($existingActionIndex === false) {
            $subscriptionIndex = collect($items)->search(
                fn ($item) => is_array($item)
                    && ($item['id'] ?? null) === 'hf-admin-subscriptions',
            );

            $insertAt = $subscriptionIndex === false
                ? count($items)
                : $subscriptionIndex + 1;

            array_splice($items, $insertAt, 0, [$paymentItem]);
        }

        $menus[$menuIndex]['items'] = array_values($items);

        DB::table('settings')
            ->where('name', 'menus')
            ->update([
                'value' => json_encode(array_values($menus), JSON_UNESCAPED_UNICODE),
                'updated_at' => now(),
            ]);

        Cache::forget('settings.public');
    }

    public function down(): void
    {
        $setting = DB::table('settings')->where('name', 'menus')->first();

        if (! $setting) {
            return;
        }

        $menus = json_decode($setting->value, true);

        if (! is_array($menus)) {
            return;
        }

        $menuIndex = collect($menus)->search(
            fn ($menu) => is_array($menu)
                && in_array('admin-sidebar', $menu['positions'] ?? [], true),
        );

        if ($menuIndex === false || ! is_array($menus[$menuIndex]['items'] ?? null)) {
            return;
        }

        $menus[$menuIndex]['items'] = array_values(array_filter(
            $menus[$menuIndex]['items'],
            fn ($item) => ! is_array($item)
                || ($item['id'] ?? null) !== self::MENU_ITEM_ID,
        ));

        DB::table('settings')
            ->where('name', 'menus')
            ->update([
                'value' => json_encode(array_values($menus), JSON_UNESCAPED_UNICODE),
                'updated_at' => now(),
            ]);

        Cache::forget('settings.public');
    }
};
