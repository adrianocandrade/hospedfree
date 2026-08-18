<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        $setting = DB::table('settings')->where('name', 'menus')->first();

        if (!$setting) {
            return;
        }

        $menus = json_decode($setting->value, true);

        if (!is_array($menus)) {
            return;
        }

        $changed = false;

        foreach ($menus as $menuKey => $menu) {
            foreach (($menu['items'] ?? []) as $itemKey => $item) {
                if (($item['action'] ?? null) !== '/dashboard/knowledge') {
                    continue;
                }

                $menus[$menuKey]['items'][$itemKey]['action'] = '/faq';
                $changed = true;
            }
        }

        if (!$changed) {
            return;
        }

        DB::table('settings')
            ->where('name', 'menus')
            ->update([
                'value' => json_encode(array_values($menus), JSON_UNESCAPED_UNICODE),
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        // Keep the public FAQ route as the canonical target.
    }
};
