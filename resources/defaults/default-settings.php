<?php

return [
    ['name' => 'branding.logo_dark', 'value' => 'images/logo-white.png'],
    ['name' => 'branding.logo_light', 'value' => 'images/logo-1.png'],
    ['name' => 'branding.logo_dark_mobile', 'value' => 'images/icon.png'],
    ['name' => 'branding.logo_light_mobile', 'value' => 'images/icon.png'],

    ['name' => 'links.default_type', 'value' => 'direct'],
    ['name' => 'links.enable_type', 'value' => false],
    ['name' => 'links.redirect_time', 'value' => 0],
    ['name' => 'links.retargeting', 'value' => false],
    ['name' => 'links.pixels', 'value' => false],
    ['name' => 'links.homepage_stats', 'value' => false],
    ['name' => 'links.back_half_min', 'value' => 5],
    ['name' => 'links.back_half_max', 'value' => 10],
    ['name' => 'links.min_len', 'value' => 3],
    ['name' => 'links.max_len', 'value' => 1000],
    ['name' => 'links.back_half_content', 'value' => 'alpha_dash'],
    ['name' => 'biolink.show_branding', 'value' => true],

    ['name' => 'pwa.install_prompt_enabled', 'value' => true],
    ['name' => 'pwa.theme_color', 'value' => '#2563eb'],
    ['name' => 'pwa.background_color', 'value' => '#ffffff'],

    ['name' => 'homepage.type', 'value' => 'landingPage'],
    [
        'name' => 'landingPage',
        'value' => json_encode([
            'sections' => [
                [
                    'name' => 'hospedfree-hero',
                    'title' => 'Hospedagem gratuita para comecar seu site',
                    'description' => 'Crie uma hospedagem em hsite.top e faca upgrade quando precisar de um plano pago.',
                ],
                [
                    'name' => 'pricing',
                    'title' => 'Planos de hospedagem',
                    'description' => 'O Free fica disponivel desde o inicio. Planos pagos aparecem somente quando preco, package e gateway estiverem configurados.',
                    'maxProducts' => 3,
                ],
                [
                    'name' => 'hospedfree-support',
                    'title' => 'Ajuda integrada',
                    'description' => 'Base de conhecimento e chamados simples para clientes de hospedagem.',
                ],
            ],
        ]),
    ],

    [
        'name' => 'menus',
        'value' => json_encode([
            [
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
            [
                'name' => 'HospedFree dashboard secondary',
                'id' => 'hf-dashboard-secondary',
                'positions' => ['dashboard-secondary'],
                'items' => [],
            ],
            [
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
            [
                'name' => 'HospedFree admin',
                'id' => 'hf-admin-sidebar',
                'positions' => ['admin-sidebar'],
                'items' => [
                    ['type' => 'route', 'label' => 'Hospedagens', 'action' => '/admin/hosting', 'id' => 'hf-admin-hosting', 'permissions' => ['hosting.operations']],
                    ['type' => 'route', 'label' => 'Planos e pacotes', 'action' => '/admin/hosting/plans', 'id' => 'hf-admin-hosting-plans', 'permissions' => ['hosting.settings']],
                    ['type' => 'route', 'label' => 'Nomes premium', 'action' => '/admin/hosting/premium-subdomains', 'id' => 'hf-admin-premium-subdomains', 'permissions' => ['hosting.settings']],
                    ['type' => 'route', 'label' => 'Chamados', 'action' => '/admin/support', 'id' => 'hf-admin-support', 'permissions' => ['support.manage']],
                    ['type' => 'route', 'label' => 'Base de conhecimento', 'action' => '/admin/knowledge', 'id' => 'hf-admin-knowledge', 'permissions' => ['knowledge.manage']],
                    ['type' => 'route', 'label' => 'Assinaturas', 'action' => '/admin/subscriptions', 'id' => 'hf-admin-subscriptions', 'permissions' => ['subscriptions.update']],
                    ['type' => 'route', 'label' => 'Pagamentos', 'action' => '/admin/settings/subscriptions', 'id' => 'hf-admin-payments', 'permissions' => ['settings.update']],
                    ['type' => 'route', 'label' => 'Usuários', 'action' => '/admin/users', 'id' => 'hf-admin-users', 'permissions' => ['users.update']],
                    ['type' => 'route', 'label' => 'Configurações', 'action' => '/admin/settings', 'id' => 'hf-admin-settings', 'permissions' => ['settings.update']],
                ],
            ],
            [
                'name' => 'Footer',
                'id' => 'hf-footer',
                'positions' => ['footer'],
                'items' => [
                    ['type' => 'route', 'id' => 'hf-footer-privacy', 'position' => 1, 'label' => 'Política de privacidade', 'action' => '/pages/privacy-policy'],
                    ['type' => 'route', 'id' => 'hf-footer-terms', 'position' => 2, 'label' => 'Termos de serviço', 'action' => '/pages/terms-of-service'],
                    ['type' => 'route', 'id' => 'hf-footer-help', 'position' => 3, 'label' => 'Central de ajuda', 'action' => '/faq'],
                ],
            ],
            [
                'name' => 'Auth Dropdown',
                'id' => 'hf-auth-dropdown',
                'positions' => ['auth-dropdown'],
                'items' => [
                    ['label' => 'Admin', 'id' => 'hf-auth-admin', 'action' => '/admin/hosting', 'type' => 'route', 'permissions' => ['admin.access']],
                    ['label' => 'Painel', 'id' => 'hf-auth-dashboard', 'action' => '/dashboard/hosting', 'type' => 'route'],
                    ['label' => 'Conta', 'id' => 'hf-auth-account', 'action' => '/account-settings', 'type' => 'route'],
                ],
            ],
            [
                'name' => 'Homepage navbar',
                'id' => 'hf-homepage-navbar',
                'positions' => ['homepage-navbar'],
                'items' => [
                    ['type' => 'link', 'label' => 'Como funciona', 'action' => '#como-funciona', 'id' => 'hf-home-how'],
                    ['type' => 'link', 'label' => 'Recursos', 'action' => '#recursos', 'id' => 'hf-home-features'],
                    ['type' => 'link', 'label' => 'Planos', 'action' => '#planos', 'id' => 'hf-home-plans'],
                    ['type' => 'link', 'label' => 'Ajuda', 'action' => '#ajuda', 'id' => 'hf-home-help'],
                ],
            ],
        ]),
    ],

    ['name' => 'custom_domains.allow_select', 'value' => false],
    ['name' => 'dashboard.homepage', 'value' => 'hosting'],
];
