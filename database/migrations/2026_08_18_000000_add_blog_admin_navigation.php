<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    private const ITEM_ID = 'hf-admin-blog';

    private const ITEM_ACTION = '/admin/blog';

    public function up(): void
    {
        $this->updateMenus(function (array $items): array {
            $item = [
                'type' => 'route',
                'label' => 'Blog',
                'action' => self::ITEM_ACTION,
                'id' => self::ITEM_ID,
                'permissions' => ['blog.update'],
            ];
            $existing = collect($items)->search(
                fn ($candidate) => is_array($candidate)
                    && (($candidate['id'] ?? null) === self::ITEM_ID
                        || ($candidate['action'] ?? null) === self::ITEM_ACTION),
            );

            if ($existing !== false) {
                $items[$existing] = $item;

                return array_values($items);
            }

            $knowledge = collect($items)->search(
                fn ($candidate) => is_array($candidate)
                    && ($candidate['id'] ?? null) === 'hf-admin-knowledge',
            );
            array_splice(
                $items,
                $knowledge === false ? count($items) : $knowledge + 1,
                0,
                [$item],
            );

            return array_values($items);
        });
    }

    public function down(): void
    {
        $this->updateMenus(
            fn (array $items) => array_values(array_filter(
                $items,
                fn ($item) => ! is_array($item)
                    || ($item['id'] ?? null) !== self::ITEM_ID,
            )),
        );
    }

    private function updateMenus(callable $callback): void
    {
        $setting = DB::table('settings')->where('name', 'menus')->first();
        if (! $setting) {
            return;
        }

        $menus = json_decode($setting->value, true);
        if (! is_array($menus)) {
            return;
        }

        $index = collect($menus)->search(
            fn ($menu) => is_array($menu)
                && in_array('admin-sidebar', $menu['positions'] ?? [], true),
        );
        if ($index === false) {
            return;
        }

        $items = is_array($menus[$index]['items'] ?? null)
            ? array_values($menus[$index]['items'])
            : [];
        $menus[$index]['items'] = $callback($items);

        DB::table('settings')
            ->where('name', 'menus')
            ->update([
                'value' => json_encode(
                    array_values($menus),
                    JSON_UNESCAPED_UNICODE,
                ),
                'updated_at' => now(),
            ]);
        Cache::forget('settings.public');
    }
};
