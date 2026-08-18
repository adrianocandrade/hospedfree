<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        $setting = DB::table('settings')->where('name', 'menus')->first();
        $menus = $setting ? json_decode($setting->value, true) : [];

        if (!is_array($menus)) {
            return;
        }

        foreach ($menus as &$menu) {
            if (!in_array('dashboard-mobile', $menu['positions'] ?? [], true)) {
                continue;
            }

            foreach ($menu['items'] ?? [] as &$item) {
                if (($item['id'] ?? null) === 'hf-mobile-overview') {
                    $item['label'] = 'Início';
                }
            }
        }
        unset($menu, $item);

        DB::table('settings')->where('name', 'menus')->update([
            'value' => json_encode($menus, JSON_UNESCAPED_UNICODE),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        // Navigation labels are safely reversible through admin menu settings.
    }
};
