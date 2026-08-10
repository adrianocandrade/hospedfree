<?php

use Illuminate\Database\Migrations\Migration;
use App\Biolinks\Models\BiolinkTheme;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up()
    {
        $themes = [
            [
                'name' => 'Retro Feel',
                'slug' => Str::slug('Retro Feel'),
                'is_system' => 1,
                'is_published' => 1,
                'config' => [
                    'theme' => ['category' => 'curated'],
                    'bgConfig' => [
                        'activeType' => 'image',
                        'backgroundImage' => 'url(/images/theme/retro/BQgZ.jpg)',
                        'backgroundColor' => '#f2f2f2',
                        'backgroundSize' => 'cover',
                        'backgroundPosition' => 'center',
                    ],
                    'btnConfig' => [
                        'color' => '#FFFFFF',
                        'textColor' => '#888888',
                        'variant' => 'solid',
                        'radius' => 'rounded-full',
                    ],
                    'fontConfig' => [
                        'family' => 'Bungee',
                        'google' => true,
                    ],
                    'customCss' => '
.biolink-layout-container::before {
    content: ""; position: fixed; top: 20%; left: 10%; width: 60px; height: 60px; background-image: url(/images/scribbbles/10.png); background-size: contain; background-repeat: no-repeat; z-index: 10; pointer-events: none; transform: rotate(-15deg);
}
.biolink-layout-container::after {
    content: ""; position: fixed; bottom: 15%; right: 10%; width: 80px; height: 80px; background-image: url(/images/scribbbles/11.png); background-size: contain; background-repeat: no-repeat; z-index: 10; pointer-events: none; transform: rotate(20deg);
}
',
                ]
            ],
            [
                'name' => 'Magma 3D',
                'slug' => Str::slug('Magma 3D'),
                'is_system' => 1,
                'is_published' => 1,
                'config' => [
                    'theme' => ['category' => 'curated'],
                    'bgConfig' => [
                        'activeType' => 'color',
                        'backgroundColor' => '#FFFFFF',
                        'color' => '#000000',
                    ],
                    'btnConfig' => [
                        'color' => '#FFFFFF',
                        'textColor' => '#000000',
                        'variant' => 'solid',
                        'radius' => 'rounded-sm',
                    ],
                    'fontConfig' => [
                        'family' => 'IBM Plex Mono',
                        'google' => true,
                    ],
                    'customCss' => '
.biolink-btn-custom {
    border-image: url(/images/block-styles/border-3d.png) 10 10 stretch !important;
    border-width: 4px !important;
    border-style: solid !important;
    box-shadow: 4px 4px 0px 0px rgba(0,0,0,1);
    transform: translate(0, 0);
    transition: transform 0.1s, box-shadow 0.1s;
}
.biolink-btn-custom:active {
    transform: translate(4px, 4px);
    box-shadow: 0px 0px 0px 0px rgba(0,0,0,1);
}
',
                ]
            ],
            [
                'name' => 'Cyber Neon',
                'slug' => Str::slug('Cyber Neon'),
                'is_system' => 1,
                'is_published' => 1,
                'config' => [
                    'theme' => ['category' => 'curated'],
                    'bgConfig' => [
                        'activeType' => 'color',
                        'backgroundColor' => '#050510',
                        'color' => '#00ffcc',
                    ],
                    'btnConfig' => [
                        'color' => '#000000',
                        'textColor' => '#00ffcc',
                        'variant' => 'outline',
                        'radius' => 'rounded-none',
                    ],
                    'fontConfig' => [
                        'family' => 'Orbitron',
                        'google' => true,
                    ],
                    'customCss' => '
.biolink-layout-container {
    background-image: linear-gradient(#050510 2px, transparent 2px), linear-gradient(90deg, #050510 2px, transparent 2px);
    background-size: 30px 30px;
    background-color: #0a0a20;
}
.biolink-btn-custom {
    border: 2px solid #00ffcc !important;
    box-shadow: 0 0 10px #00ffcc, inset 0 0 10px #00ffcc !important;
    text-shadow: 0 0 5px #00ffcc;
    background: transparent !important;
    clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
}
.biolink-btn-custom:hover {
    background: rgba(0, 255, 204, 0.2) !important;
}
',
                ]
            ],
            [
                'name' => 'Astrid Dark',
                'slug' => Str::slug('Astrid Dark'),
                'is_system' => 1,
                'is_published' => 1,
                'config' => [
                    'theme' => ['category' => 'curated'],
                    'bgConfig' => [
                        'activeType' => 'color',
                        'backgroundColor' => '#18181b',
                        'color' => '#e4e4e7',
                    ],
                    'btnConfig' => [
                        'color' => '#27272a',
                        'textColor' => '#ffffff',
                        'variant' => 'solid',
                        'radius' => 'rounded-full',
                    ],
                    'fontConfig' => [
                        'family' => 'Inter',
                        'google' => true,
                    ],
                ]
            ],
            [
                'name' => 'Clouds Light',
                'slug' => Str::slug('Clouds Light'),
                'is_system' => 1,
                'is_published' => 1,
                'config' => [
                    'theme' => ['category' => 'curated'],
                    'bgConfig' => [
                        'activeType' => 'color',
                        'backgroundColor' => '#f0f9ff',
                        'color' => '#0284c7',
                    ],
                    'btnConfig' => [
                        'color' => '#ffffff',
                        'textColor' => '#0369a1',
                        'variant' => 'solid',
                        'radius' => 'rounded-lg',
                        'shadow' => 'soft',
                    ],
                    'fontConfig' => [
                        'family' => 'Quicksand',
                        'google' => true,
                    ],
                ]
            ],
            [
                'name' => 'Cozy Warm',
                'slug' => Str::slug('Cozy Warm'),
                'is_system' => 1,
                'is_published' => 1,
                'config' => [
                    'theme' => ['category' => 'curated'],
                    'bgConfig' => [
                        'activeType' => 'color',
                        'backgroundColor' => '#fffbeb',
                        'color' => '#92400e',
                    ],
                    'btnConfig' => [
                        'color' => '#fef3c7',
                        'textColor' => '#92400e',
                        'variant' => 'solid',
                        'radius' => 'rounded-lg',
                        'shadow' => 'none',
                    ],
                    'fontConfig' => [
                        'family' => 'Merriweather',
                        'google' => true,
                    ],
                    'customCss' => '
.biolink-btn-custom { border: 1px solid #fde68a !important; }
',
                ]
            ],
            [
                'name' => 'Duo Tone',
                'slug' => Str::slug('Duo Tone'),
                'is_system' => 1,
                'is_published' => 1,
                'config' => [
                    'theme' => ['category' => 'curated'],
                    'bgConfig' => [
                        'activeType' => 'gradient',
                        'backgroundImage' => 'linear-gradient(135deg, #f43f5e 0%, #3b82f6 100%)',
                        'color' => '#ffffff',
                    ],
                    'btnConfig' => [
                        'variant' => 'glass',
                        'radius' => 'rounded-full',
                        'textColor' => '#ffffff',
                    ],
                    'fontConfig' => [
                        'family' => 'Montserrat',
                        'google' => true,
                    ],
                ]
            ],
            [
                'name' => 'Mint Fresh',
                'slug' => Str::slug('Mint Fresh'),
                'is_system' => 1,
                'is_published' => 1,
                'config' => [
                    'theme' => ['category' => 'curated'],
                    'bgConfig' => [
                        'activeType' => 'color',
                        'backgroundColor' => '#ecfdf5',
                        'color' => '#065f46',
                    ],
                    'btnConfig' => [
                        'color' => '#d1fae5',
                        'textColor' => '#065f46',
                        'variant' => 'solid',
                        'radius' => 'rounded-full',
                    ],
                    'fontConfig' => [
                        'family' => 'Poppins',
                        'google' => true,
                    ],
                ]
            ],
            [
                'name' => 'Moon Night',
                'slug' => Str::slug('Moon Night'),
                'is_system' => 1,
                'is_published' => 1,
                'config' => [
                    'theme' => ['category' => 'curated'],
                    'bgConfig' => [
                        'activeType' => 'color',
                        'backgroundColor' => '#0f172a',
                        'color' => '#e2e8f0',
                    ],
                    'btnConfig' => [
                        'color' => '#1e293b',
                        'textColor' => '#f8fafc',
                        'variant' => 'solid',
                        'radius' => 'rounded-lg',
                        'shadow' => 'soft',
                    ],
                    'fontConfig' => [
                        'family' => 'Nunito',
                        'google' => true,
                    ],
                ]
            ],
            [
                'name' => 'Noir Minimal',
                'slug' => Str::slug('Noir Minimal'),
                'is_system' => 1,
                'is_published' => 1,
                'config' => [
                    'theme' => ['category' => 'curated'],
                    'bgConfig' => [
                        'activeType' => 'color',
                        'backgroundColor' => '#000000',
                        'color' => '#ffffff',
                    ],
                    'btnConfig' => [
                        'color' => '#ffffff',
                        'textColor' => '#000000',
                        'variant' => 'solid',
                        'radius' => 'rounded-none',
                    ],
                    'fontConfig' => [
                        'family' => 'Space Grotesk',
                        'google' => true,
                    ],
                    'customCss' => '
.biolink-btn-custom { text-transform: uppercase; letter-spacing: 2px; font-weight: 700; }
',
                ]
            ],
            [
                'name' => 'Paper Fold',
                'slug' => Str::slug('Paper Fold'),
                'is_system' => 1,
                'is_published' => 1,
                'config' => [
                    'theme' => ['category' => 'curated'],
                    'bgConfig' => [
                        'activeType' => 'color',
                        'backgroundColor' => '#f4f4f0',
                        'color' => '#2c2c2c',
                    ],
                    'btnConfig' => [
                        'color' => '#ffffff',
                        'textColor' => '#2c2c2c',
                        'variant' => 'solid',
                        'radius' => 'rounded-sm',
                    ],
                    'fontConfig' => [
                        'family' => 'Lora',
                        'google' => true,
                    ],
                    'customCss' => '
.biolink-btn-custom {
    box-shadow: 3px 3px 6px rgba(0,0,0,0.08) !important;
    transform: rotate(-1deg);
}
.biolink-btn-custom:nth-child(even) {
    transform: rotate(1deg);
}
',
                ]
            ],
            [
                'name' => 'Rain Drop',
                'slug' => Str::slug('Rain Drop'),
                'is_system' => 1,
                'is_published' => 1,
                'config' => [
                    'theme' => ['category' => 'curated'],
                    'bgConfig' => [
                        'activeType' => 'gradient',
                        'backgroundImage' => 'linear-gradient(to bottom, #8ba8c4, #4a6b8c)',
                        'color' => '#ffffff',
                    ],
                    'btnConfig' => [
                        'variant' => 'glass',
                        'radius' => 'rounded-lg',
                        'textColor' => '#ffffff',
                    ],
                    'fontConfig' => [
                        'family' => 'Ubuntu',
                        'google' => true,
                    ],
                ]
            ],
            [
                'name' => 'Spray Paint',
                'slug' => Str::slug('Spray Paint'),
                'is_system' => 1,
                'is_published' => 1,
                'config' => [
                    'theme' => ['category' => 'curated'],
                    'bgConfig' => [
                        'activeType' => 'color',
                        'backgroundColor' => '#222222',
                        'color' => '#facc15',
                    ],
                    'btnConfig' => [
                        'color' => '#000000',
                        'textColor' => '#facc15',
                        'variant' => 'solid',
                        'radius' => 'rounded-full',
                    ],
                    'fontConfig' => [
                        'family' => 'Permanent Marker',
                        'google' => true,
                    ],
                    'customCss' => '
.biolink-btn-custom {
    border: 3px dashed #facc15 !important;
    background-color: transparent !important;
}
',
                ]
            ],
        ];

        foreach ($themes as $themeData) {
            $config = $themeData['config'];
            $themeData['config'] = $config;
            $themeData['category'] = 'curated';
            BiolinkTheme::updateOrCreate(
                ['slug' => $themeData['slug']],
                $themeData
            );
        }
    }

    public function down()
    {
        $slugs = [
            Str::slug('Retro Feel'),
            Str::slug('Magma 3D'),
            Str::slug('Cyber Neon'),
            Str::slug('Astrid Dark'),
            Str::slug('Clouds Light'),
            Str::slug('Cozy Warm'),
            Str::slug('Duo Tone'),
            Str::slug('Mint Fresh'),
            Str::slug('Moon Night'),
            Str::slug('Noir Minimal'),
            Str::slug('Paper Fold'),
            Str::slug('Rain Drop'),
            Str::slug('Spray Paint'),
        ];
        BiolinkTheme::whereIn('slug', $slugs)->delete();
    }
};
