<?php

return [
    // logos
    [
        'name' => 'branding.logo_dark',
        'value' => 'images/logo-dark.svg',
    ],
    [
        'name' => 'branding.logo_light',
        'value' => 'images/logo-light.svg',
    ],
    [
        'name' => 'branding.logo_dark_mobile',
        'value' => 'images/mobile-logo-dark.svg',
    ],
    [
        'name' => 'branding.logo_light_mobile',
        'value' => 'images/mobile-logo-light.svg',
    ],

    // LINKS
    ['name' => 'links.default_type', 'value' => 'direct'],
    ['name' => 'links.enable_type', 'value' => true],
    ['name' => 'links.redirect_time', 'value' => 10],
    ['name' => 'links.retargeting', 'value' => true],
    ['name' => 'links.pixels', 'value' => true],
    ['name' => 'links.homepage_stats', 'value' => true],
    ['name' => 'links.back_half_min', 'value' => 5],
    ['name' => 'links.back_half_max', 'value' => 10],
    ['name' => 'links.min_len', 'value' => 3],
    ['name' => 'links.max_len', 'value' => 1000],
    ['name' => 'links.back_half_content', 'value' => 'alpha_dash'],
    ['name' => 'biolink.show_branding', 'value' => true],
    ['name' => 'pwa.install_prompt_enabled', 'value' => true],
    ['name' => 'pwa.theme_color', 'value' => '#2563eb'],
    ['name' => 'pwa.background_color', 'value' => '#ffffff'],

    // HOMEPAGE APPEARANCE
    [
        'name' => 'homepage.type',
        'value' => 'landingPage',
    ],
    [
        'name' => 'landingPage',
        'value' => json_encode([
            'sections' => [
                [
                    'name' => 'meulinkbio-hero',
                    'title' => 'Transform your links into opportunities',
                    'description' =>
                        'Create your link page, shorten URLs, generate QR Codes and track results from a single place.',
                ],
                [
                    'name' => 'meulinkbio-trust',
                    'title' => 'Built in Brazil for better sharing',
                    'description' =>
                        'Made in Brazil for creators, professionals and businesses.',
                ],
                [
                    'name' => 'meulinkbio-features',
                    'title' => 'Everything you need to take your links seriously',
                    'description' =>
                        'Create, publish and measure every public touchpoint without spreading your work across separate tools.',
                ],
                [
                    'name' => 'meulinkbio-analytics',
                    'title' => 'Better decisions with real data',
                    'description' =>
                        'Understand how your links perform and discover which channels really bring results.',
                ],
                [
                    'name' => 'meulinkbio-templates',
                    'title' => 'A page with your identity',
                    'description' =>
                        'Choose a template, customize colors, fonts, images and buttons, then publish your page in minutes.',
                ],
                [
                    'name' => 'meulinkbio-use-cases',
                    'title' => 'A MeuLinkBio for every goal',
                    'description' =>
                        'Different audiences need different outcomes, from creators launching content to local businesses turning traffic into contact.',
                ],
                [
                    'name' => 'meulinkbio-tools',
                    'title' => 'More than a link in bio',
                    'description' =>
                        'A complete toolkit to publish, connect, measure and grow every link your brand shares.',
                ],
                [
                    'name' => 'pricing',
                    'title' => 'Plans that grow with you',
                    'description' =>
                        'Start free and upgrade when you need more links, clicks, custom domains or team resources.',
                    'maxProducts' => 3,
                ],
                [
                    'name' => 'meulinkbio-faq',
                    'title' => 'Frequently asked questions',
                    'description' =>
                        'The essentials before creating your first page or upgrading your plan.',
                ],
                [
                    'name' => 'meulinkbio-final-cta',
                    'title' => 'Ready to transform your links?',
                    'description' =>
                        'Create your page for free and start sharing more professionally.',
                ],
                [
                    'name' => 'meulinkbio-footer',
                    'title' => 'Made with dedication in Brazil.',
                ],
            ],
        ]),
    ],

    // menus
    [
        'name' => 'menus',
        'value' => json_encode([
            [
                'name' => 'Dashboard primary',
                'id' => 'a01',
                'positions' => ['dashboard-primary'],
                'items' => [
                    [
                        'type' => 'route',
                        'label' => 'Short links',
                        'action' => '/dashboard/links',
                        'id' => 723,
                    ],
                    [
                        'type' => 'route',
                        'label' => 'QR codes',
                        'action' => '/dashboard/qr-codes',
                        'id' => 891,
                    ],
                    [
                        'type' => 'route',
                        'label' => 'Link in bio',
                        'action' => '/dashboard/biolinks',
                        'id' => 239,
                    ],
                    [
                        'type' => 'route',
                        'label' => 'Insights',
                        'action' => '/dashboard/insights',
                        'id' => 318,
                    ],
                ],
            ],
            [
                'name' => 'Dashboard secondary',
                'id' => 'a02',
                'positions' => ['dashboard-secondary'],
                'items' => [
                    [
                        'type' => 'route',
                        'label' => 'Folders',
                        'action' => '/dashboard/folders',
                        'id' => 586,
                    ],
                    [
                        'type' => 'route',
                        'label' => 'Custom domains',
                        'action' => '/dashboard/custom-domains',
                        'id' => 444,
                    ],
                    [
                        'type' => 'route',
                        'label' => 'CTA overlays',
                        'action' => '/dashboard/link-overlays',
                        'id' => 184,
                    ],
                    [
                        'type' => 'route',
                        'label' => 'Tracking pixels',
                        'action' => '/dashboard/pixels',
                        'id' => 303,
                    ],
                    [
                        'type' => 'route',
                        'label' => 'Link pages',
                        'action' => '/dashboard/link-pages',
                        'id' => 637,
                    ],
                ],
            ],
            [
                'name' => 'Dashboard mobile',
                'id' => 'a03',
                'positions' => ['dashboard-mobile'],
                'items' => [
                    [
                        'type' => 'route',
                        'label' => 'Links',
                        'action' => '/dashboard/links',
                        'id' => 723,
                    ],
                    [
                        'type' => 'route',
                        'label' => 'Link in bio',
                        'action' => '/dashboard/biolinks',
                        'id' => 239,
                    ],
                    [
                        'type' => 'route',
                        'label' => 'QR codes',
                        'action' => '/dashboard/qr-codes',
                        'id' => 721,
                    ],
                    [
                        'type' => 'route',
                        'label' => 'Insights',
                        'action' => '/dashboard/insights',
                        'id' => 318,
                    ],
                ],
            ],
            [
                'name' => 'Landing page navbar',
                'id' => 'mlb01',
                'positions' => ['landing-page-navbar'],
                'items' => [
                    [
                        'type' => 'link',
                        'id' => 'mlb-nav-features',
                        'position' => 1,
                        'order' => 1,
                        'label' => 'Features',
                        'action' => '#features',
                    ],
                    [
                        'type' => 'link',
                        'id' => 'mlb-nav-templates',
                        'position' => 2,
                        'order' => 2,
                        'label' => 'Templates',
                        'action' => '#templates',
                    ],
                    [
                        'type' => 'link',
                        'id' => 'mlb-nav-pricing',
                        'position' => 3,
                        'order' => 3,
                        'label' => 'Pricing',
                        'action' => '#pricing-section',
                    ],
                    [
                        'type' => 'link',
                        'id' => 'mlb-nav-business',
                        'position' => 4,
                        'order' => 4,
                        'label' => 'For businesses',
                        'action' => '#enterprise',
                    ],
                    [
                        'type' => 'route',
                        'id' => 'mlb-nav-blog',
                        'position' => 5,
                        'order' => 5,
                        'label' => 'Blog',
                        'action' => '/blog',
                    ],
                ],
            ],
            [
                'name' => 'Footer',
                'id' => 'a04',
                'positions' => ['footer'],
                'items' => [
                    [
                        'type' => 'url',
                        'id' => 'c1sf2g',
                        'position' => 1,
                        'label' => 'Developers',
                        'action' => env('APP_URL') . '/api-docs',
                        'condition' => 'auth',
                        'permissions' => ['api.access'],
                    ],
                    [
                        'type' => 'route',
                        'id' => 'rlz27v',
                        'position' => 2,
                        'label' => 'Privacy Policy',
                        'action' => '/pages/privacy-policy',
                    ],
                    [
                        'type' => 'route',
                        'id' => 'p80pvk',
                        'position' => 3,
                        'label' => 'Terms of Service',
                        'action' => '/pages/terms-of-service',
                    ],
                    [
                        'type' => 'route',
                        'id' => 'q8dtht',
                        'position' => 4,
                        'label' => 'Contact Us',
                        'action' => '/contact',
                    ],
                ],
            ],
            [
                'name' => 'Footer Social',
                'id' => 'a05',
                'positions' => ['footer-secondary'],
                'items' => [
                    [
                        'type' => 'link',
                        'id' => '6j747e',
                        'position' => 1,
                        'icon' => 'facebook',
                        'action' => 'https://facebook.com',
                    ],
                    [
                        'type' => 'link',
                        'id' => 'jo96zw',
                        'position' => 2,
                        'icon' => 'twitter',
                        'action' => 'https://twitter.com',
                    ],
                    [
                        'type' => 'link',
                        'id' => '57dsea',
                        'position' => 3,
                        'icon' => 'instagram',
                        'action' => 'https://instagram.com',
                    ],
                    [
                        'type' => 'link',
                        'id' => 'lzntr2',
                        'position' => 4,
                        'icon' => 'youtube',
                        'action' => 'https://youtube.com',
                    ],
                ],
            ],
            [
                'name' => 'Auth Dropdown',
                'id' => 'a06',
                'items' => [
                    [
                        'label' => 'Admin area',
                        'id' => 'upm1rv',
                        'action' => '/admin/insights',
                        'type' => 'route',
                        'permissions' => ['admin.access'],
                    ],
                    [
                        'label' => 'Dashboard',
                        'id' => 'ehj0uk',
                        'action' => '/dashboard',
                        'type' => 'route',
                    ],
                    [
                        'label' => 'Account settings',
                        'id' => '6a89z5',
                        'action' => '/account-settings',
                        'type' => 'route',
                    ],
                ],
                'positions' => ['auth-dropdown'],
            ],
            [
                'name' => 'Admin Sidebar',
                'id' => 'a07',
                'items' => [
                    [
                        'label' => 'Insights',
                        'id' => '886nz4',
                        'action' => '/admin/insights',
                        'type' => 'route',
                        'condition' => 'admin',
                        'role' => 1,
                        'permissions' => ['admin.access'],
                        'roles' => [],
                    ],
                    [
                        'label' => 'Settings',
                        'id' => 'x5k484',
                        'action' => '/admin/settings',
                        'type' => 'route',
                        'permissions' => ['settings.update'],
                    ],
                    [
                        'label' => 'Plans',
                        'id' => '7o42rt',
                        'action' => '/admin/plans',
                        'type' => 'route',
                        'permissions' => ['plans.update'],
                    ],
                    [
                        'label' => 'Subscriptions',
                        'action' => '/admin/subscriptions',
                        'type' => 'route',
                        'id' => 'sdcb5a',
                        'condition' => 'admin',
                        'permissions' => ['subscriptions.update'],
                    ],
                    [
                        'label' => 'Users',
                        'action' => '/admin/users',
                        'type' => 'route',
                        'id' => 'fzfb45',
                        'permissions' => ['users.update'],
                    ],
                    [
                        'label' => 'Roles',
                        'action' => '/admin/roles',
                        'type' => 'route',
                        'id' => 'mwdkf0',
                        'permissions' => ['roles.update'],
                    ],

                    [
                        'type' => 'route',
                        'label' => 'Links',
                        'action' => '/admin/links',
                        'id' => 7234,
                    ],
                    [
                        'type' => 'route',
                        'label' => 'Biolinks',
                        'action' => '/admin/biolinks',
                        'id' => 2394,
                    ],
                    [
                        'type' => 'route',
                        'label' => 'Folders',
                        'action' => '/admin/folders',
                        'id' => 5864,
                    ],
                    [
                        'type' => 'route',
                        'label' => 'Branded domains',
                        'action' => '/admin/custom-domains',
                        'id' => 4441,
                    ],
                    [
                        'type' => 'route',
                        'label' => 'CTA overlays',
                        'action' => '/admin/link-overlays',
                        'id' => 18411,
                    ],
                    [
                        'type' => 'route',
                        'label' => 'Link pages',
                        'action' => '/admin/link-pages',
                        'id' => 312113,
                    ],
                    [
                        'type' => 'route',
                        'label' => 'Tracking pixels',
                        'action' => '/admin/pixels',
                        'id' => 303113,
                    ],
                    [
                        'label' => 'Custom pages',
                        'action' => '/admin/custom-pages',
                        'type' => 'route',
                        'id' => '63bwv9',
                        'permissions' => ['custom_pages.update'],
                    ],
                    [
                        'label' => 'Blog',
                        'action' => '/admin/blog',
                        'type' => 'route',
                        'id' => 'mlb-admin-blog',
                        'permissions' => ['blog.update'],
                    ],
                    [
                        'label' => 'Files',
                        'action' => '/admin/files',
                        'type' => 'route',
                        'id' => 'vguvti',
                        'permissions' => ['files.update'],
                    ],

                    [
                        'label' => 'Translations',
                        'action' => '/admin/localizations',
                        'type' => 'route',
                        'id' => 'w91yql',
                        'permissions' => ['localizations.update'],
                    ],

                    [
                        'label' => 'Logs',
                        'action' => '/admin/logs',
                        'type' => 'route',
                        'id' => '8j435f',
                    ],
                ],
                'positions' => ['admin-sidebar'],
            ],
            [
                'name' => 'Homepage navbar',
                'id' => 'a08',
                'positions' => ['homepage-navbar'],
                'items' => [
                    [
                        'type' => 'link',
                        'label' => 'Features',
                        'action' => '#features',
                        'id' => 19041,
                    ],
                    [
                        'type' => 'link',
                        'label' => 'Pricing',
                        'action' => '#pricing',
                        'id' => 190456,
                    ],
                ],
            ],
        ]),
    ],

    // custom domains
    ['name' => 'custom_domains.allow_select', 'value' => true],
];
