<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::table('settings')->updateOrInsert(
            ['name' => 'dashboard.homepage'],
            ['value' => 'overview', 'updated_at' => now()],
        );

        $setting = DB::table('settings')->where('name', 'menus')->first();
        $menus = $setting ? json_decode($setting->value, true) : [];
        $menus = is_array($menus) ? $menus : [];

        foreach ($this->dashboardMenus() as $position => $menu) {
            $index = collect($menus)->search(
                fn(array $candidate) => in_array(
                    $position,
                    $candidate['positions'] ?? [],
                    true,
                ),
            );

            if ($index === false) {
                $menus[] = $menu;
            } else {
                $menus[$index] = $menu;
            }
        }

        DB::table('settings')->updateOrInsert(
            ['name' => 'menus'],
            [
                'value' => json_encode(
                    array_values($menus),
                    JSON_UNESCAPED_UNICODE,
                ),
                'updated_at' => now(),
            ],
        );
    }

    public function down(): void
    {
        // Reversal is handled by the application release rollback. Existing
        // administrator menu customizations and hosting data are preserved.
    }

    private function dashboardMenus(): array
    {
        return [
            'dashboard-primary' => [
                'name' => 'HospedFree dashboard',
                'id' => 'hf-dashboard-primary',
                'positions' => ['dashboard-primary'],
                'items' => [
                    ['type' => 'route', 'label' => 'Visão geral', 'action' => '/dashboard', 'id' => 'hf-overview'],
                    ['type' => 'route', 'label' => 'Minha hospedagem', 'action' => '/dashboard/hosting', 'id' => 'hf-hosting'],
                    ['type' => 'route', 'label' => 'Planos', 'action' => '/dashboard/hosting/plans', 'id' => 'hf-plans'],
                    ['type' => 'route', 'label' => 'Suporte', 'action' => '/dashboard/support', 'id' => 'hf-support'],
                    ['type' => 'route', 'label' => 'Central de ajuda', 'action' => '/faq', 'id' => 'hf-knowledge'],
                    ['type' => 'route', 'label' => 'Minha conta', 'action' => '/account-settings', 'id' => 'hf-account'],
                ],
            ],
            'dashboard-mobile' => [
                'name' => 'HospedFree mobile',
                'id' => 'hf-dashboard-mobile',
                'positions' => ['dashboard-mobile'],
                'items' => [
                    ['type' => 'route', 'label' => 'Visão geral', 'action' => '/dashboard', 'id' => 'hf-mobile-overview'],
                    ['type' => 'route', 'label' => 'Hospedagem', 'action' => '/dashboard/hosting', 'id' => 'hf-mobile-hosting'],
                    ['type' => 'route', 'label' => 'Planos', 'action' => '/dashboard/hosting/plans', 'id' => 'hf-mobile-plans'],
                    ['type' => 'route', 'label' => 'Suporte', 'action' => '/dashboard/support', 'id' => 'hf-mobile-support'],
                ],
            ],
        ];
    }
};
