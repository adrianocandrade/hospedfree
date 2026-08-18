<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        $setting = DB::table('settings')->where('name', 'menus')->first();
        $menus = $setting ? json_decode($setting->value, true) : [];
        $menus = is_array($menus) ? $menus : [];

        $desired = [
            'dashboard-primary' => [
                'name' => 'HospedFree dashboard',
                'id' => 'hf-dashboard-primary',
                'positions' => ['dashboard-primary'],
                'items' => [
                    ['type' => 'route', 'label' => 'Minha hospedagem', 'action' => '/dashboard/hosting', 'id' => 'hf-hosting'],
                    ['type' => 'route', 'label' => 'Planos', 'action' => '/dashboard/hosting/plans', 'id' => 'hf-plans'],
                    ['type' => 'route', 'label' => 'Suporte', 'action' => '/dashboard/support', 'id' => 'hf-support'],
                    ['type' => 'route', 'label' => 'Central de ajuda', 'action' => '/faq', 'id' => 'hf-knowledge'],
                    ['type' => 'route', 'label' => 'Minha conta', 'action' => '/account-settings', 'id' => 'hf-account'],
                ],
            ],
            'dashboard-secondary' => [
                'name' => 'HospedFree dashboard secondary',
                'id' => 'hf-dashboard-secondary',
                'positions' => ['dashboard-secondary'],
                'items' => [],
            ],
            'dashboard-mobile' => [
                'name' => 'HospedFree mobile',
                'id' => 'hf-dashboard-mobile',
                'positions' => ['dashboard-mobile'],
                'items' => [
                    ['type' => 'route', 'label' => 'Hospedagem', 'action' => '/dashboard/hosting', 'id' => 'hf-mobile-hosting'],
                    ['type' => 'route', 'label' => 'Planos', 'action' => '/dashboard/hosting/plans', 'id' => 'hf-mobile-plans'],
                    ['type' => 'route', 'label' => 'Suporte', 'action' => '/dashboard/support', 'id' => 'hf-mobile-support'],
                    ['type' => 'route', 'label' => 'Ajuda', 'action' => '/faq', 'id' => 'hf-mobile-knowledge'],
                ],
            ],
            'admin-sidebar' => [
                'name' => 'HospedFree admin',
                'id' => 'hf-admin-sidebar',
                'positions' => ['admin-sidebar'],
                'items' => [
                    ['type' => 'route', 'label' => 'Hospedagens', 'action' => '/admin/hosting', 'id' => 'hf-admin-hosting', 'permissions' => ['hosting.operations']],
                    ['type' => 'route', 'label' => 'Planos e pacotes', 'action' => '/admin/hosting/plans', 'id' => 'hf-admin-hosting-plans', 'permissions' => ['hosting.settings']],
                    ['type' => 'route', 'label' => 'Chamados', 'action' => '/admin/support', 'id' => 'hf-admin-support', 'permissions' => ['support.manage']],
                    ['type' => 'route', 'label' => 'Base de conhecimento', 'action' => '/admin/knowledge', 'id' => 'hf-admin-knowledge', 'permissions' => ['knowledge.manage']],
                    ['type' => 'route', 'label' => 'Assinaturas', 'action' => '/admin/subscriptions', 'id' => 'hf-admin-subscriptions', 'permissions' => ['subscriptions.update']],
                    ['type' => 'route', 'label' => 'Usuários', 'action' => '/admin/users', 'id' => 'hf-admin-users', 'permissions' => ['users.update']],
                    ['type' => 'route', 'label' => 'Configurações', 'action' => '/admin/settings', 'id' => 'hf-admin-settings', 'permissions' => ['settings.update']],
                ],
            ],
        ];

        foreach ($desired as $position => $menu) {
            $index = collect($menus)->search(fn(array $candidate) => in_array($position, $candidate['positions'] ?? [], true));
            if ($index === false) {
                $menus[] = $menu;
            } else {
                $menus[$index] = $menu;
            }
        }

        DB::table('settings')->updateOrInsert(
            ['name' => 'menus'],
            ['value' => json_encode(array_values($menus), JSON_UNESCAPED_UNICODE), 'updated_at' => now()],
        );
        DB::table('settings')->updateOrInsert(
            ['name' => 'dashboard.homepage'],
            ['value' => 'hosting', 'updated_at' => now()],
        );
    }

    public function down(): void
    {
        // Navigation rollback is handled by the hospedfree.legacy_ui_enabled flag
        // and application reversal; inherited data remains untouched.
    }
};
