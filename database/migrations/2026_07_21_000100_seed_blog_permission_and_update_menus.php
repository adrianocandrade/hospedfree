<?php

use Common\Database\Seeders\PermissionTableSeeder;
use Common\Settings\Models\Setting;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('permissions')) {
            app(PermissionTableSeeder::class)->run();
        }

        $setting = Setting::where('name', 'menus')->first();
        $menus = $setting?->value;

        if (!is_array($menus)) {
            return;
        }

        $changed = false;

        foreach ($menus as $menuKey => $menu) {
            foreach (($menu['items'] ?? []) as $itemKey => $item) {
                if (
                    ($item['id'] ?? null) === 'mlb-nav-blog' &&
                    ($item['action'] ?? null) === '/pages/blog'
                ) {
                    $menus[$menuKey]['items'][$itemKey]['action'] = '/blog';
                    $changed = true;
                }
            }

            if (
                ($menu['name'] ?? null) === 'Admin Sidebar' &&
                !collect($menu['items'] ?? [])->contains(
                    fn($item) => ($item['action'] ?? null) === '/admin/blog',
                )
            ) {
                $menus[$menuKey]['items'][] = [
                    'label' => 'Blog',
                    'action' => '/admin/blog',
                    'type' => 'route',
                    'id' => 'mlb-admin-blog',
                    'permissions' => ['blog.update'],
                ];
                $changed = true;
            }
        }

        if ($changed && $setting) {
            $setting->value = $menus;
            $setting->save();
            Cache::forget('settings.public');
        }
    }

    public function down(): void
    {
        // Leave user-edited menus and permissions intact.
    }
};
