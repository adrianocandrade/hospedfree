<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('biolink_themes')) {
            return;
        }

        if (!Schema::hasColumn('biolink_themes', 'metadata')) {
            Schema::table('biolink_themes', function (Blueprint $table) {
                $table->json('metadata')->nullable()->after('config');
            });
        }

        $this->seedDesktopModels();
    }

    public function down(): void
    {
        if (Schema::hasTable('biolink_themes') && Schema::hasColumn('biolink_themes', 'metadata')) {
            Schema::table('biolink_themes', function (Blueprint $table) {
                $table->dropColumn('metadata');
            });
        }
    }

    private function seedDesktopModels(): void
    {
        $now = now();

        foreach ($this->models() as $model) {
            DB::table('biolink_themes')->updateOrInsert(
                ['slug' => $model['slug']],
                [
                    'name' => $model['name'],
                    'category' => 'curated',
                    'config' => json_encode($this->modelConfig($model)),
                    'metadata' => json_encode($model['metadata']),
                    'sort_order' => $model['sort_order'],
                    'is_published' => true,
                    'is_system' => true,
                    'created_by' => null,
                    'updated_at' => $now,
                    'created_at' => $now,
                ],
            );
        }
    }

    private function modelConfig(array $model): array
    {
        return [
            'theme' => [
                'slug' => $model['slug'],
                'category' => 'curated',
                'locked' => true,
                'modified' => false,
            ],
            ...$model['config'],
        ];
    }

    private function models(): array
    {
        return [
            [
                'name' => 'Desktop Noir',
                'slug' => 'desktop-noir',
                'sort_order' => 420,
                'metadata' => [
                    'isModel' => true,
                    'device' => 'desktop',
                    'tags' => ['desktop', 'dark', 'glow'],
                    'requiredFeatures' => ['desktop_layout', 'visual_effects'],
                ],
                'config' => [
                    'bgConfig' => [
                        'activeType' => 'gradient',
                        'backgroundColor' => '#090909',
                        'backgroundImage' => 'radial-gradient(circle at 72% 34%, #343434 0%, #121212 34%, #060606 100%)',
                        'color' => '#ffffff',
                        'noise' => true,
                    ],
                    'btnConfig' => [
                        'variant' => 'glass',
                        'radius' => 'rounded-full',
                        'shadow' => 'none',
                        'color' => '#ffffff',
                        'textColor' => '#ffffff',
                        'iconColor' => '#ffffff',
                    ],
                    'fontConfig' => [
                        'family' => 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                    ],
                    'headerConfig' => [
                        'layout' => 'classic',
                        'titleStyle' => 'text',
                        'alternativeFont' => false,
                        'titleColor' => '#ffffff',
                    ],
                    'desktopConfig' => [
                        'enabled' => true,
                        'contentMode' => 'spotlight',
                        'profilePlacement' => 'center',
                        'profileOpacity' => 0.84,
                        'profileBlur' => 18,
                        'panelBackgroundColor' => '#141414cc',
                        'panelTextColor' => '#ffffff',
                        'decorativeAsset' => '/images/scribbbles/60.png',
                        'decorativePlacement' => 'right',
                    ],
                    'effectsConfig' => [
                        'backgroundEffect' => 'stars',
                        'usernameEffect' => 'glow',
                        'effectColor' => '#ffffff',
                        'glowUsername' => true,
                        'glowSocials' => true,
                        'showVolumeControl' => true,
                    ],
                ],
            ],
            [
                'name' => 'Cartoon Gold Desktop',
                'slug' => 'cartoon-gold-desktop',
                'sort_order' => 430,
                'metadata' => [
                    'isModel' => true,
                    'device' => 'both',
                    'tags' => ['gold', 'avatar', 'fun'],
                    'requiredFeatures' => ['desktop_layout', 'badges'],
                ],
                'config' => [
                    'bgConfig' => [
                        'activeType' => 'color',
                        'backgroundColor' => '#fff8e8',
                        'color' => '#19130b',
                    ],
                    'btnConfig' => [
                        'variant' => 'solid',
                        'radius' => 'rounded-lg',
                        'shadow' => 'hard',
                        'color' => '#e2bd42',
                        'textColor' => '#19130b',
                        'iconColor' => '#19130b',
                    ],
                    'headerConfig' => [
                        'layout' => 'shape',
                        'titleStyle' => 'text',
                        'shapeVariant' => 'rounded',
                        'shapeColor' => '#f4d33f',
                        'alternativeFont' => false,
                        'titleColor' => '#19130b',
                    ],
                    'desktopConfig' => [
                        'enabled' => true,
                        'contentMode' => 'columns',
                        'profilePlacement' => 'left',
                        'profileOpacity' => 0.92,
                        'profileBlur' => 8,
                        'panelBackgroundColor' => '#fff0c9',
                        'panelTextColor' => '#19130b',
                        'decorativeAsset' => '/images/emoji/Yellow-1/Happy.png',
                        'decorativePlacement' => 'right',
                    ],
                    'badgeConfig' => [
                        'style' => 'chips',
                        'items' => [
                            [
                                'id' => 'verified',
                                'type' => 'system',
                                'label' => 'Verified',
                                'icon' => '/images/svg/icons/Checkmark.svg',
                                'color' => '#2da8ff',
                                'active' => true,
                                'sort_order' => 10,
                            ],
                        ],
                    ],
                ],
            ],
            [
                'name' => 'Soft Profile Desktop',
                'slug' => 'soft-profile-desktop',
                'sort_order' => 440,
                'metadata' => [
                    'isModel' => true,
                    'device' => 'both',
                    'tags' => ['soft', 'profile', 'pattern'],
                    'requiredFeatures' => ['desktop_layout'],
                ],
                'config' => [
                    'bgConfig' => [
                        'activeType' => 'pattern',
                        'backgroundColor' => '#e2efe8',
                        'backgroundImage' => 'url("/images/pattern/pattern-8.svg")',
                        'backgroundSize' => '140px 140px',
                        'backgroundRepeat' => 'repeat',
                        'color' => '#173028',
                    ],
                    'btnConfig' => [
                        'variant' => 'solid',
                        'radius' => 'rounded-full',
                        'shadow' => 'none',
                        'color' => '#5d9a72',
                        'textColor' => '#ffffff',
                        'iconColor' => '#ffffff',
                    ],
                    'headerConfig' => [
                        'layout' => 'classic',
                        'titleStyle' => 'text',
                        'alternativeFont' => false,
                        'titleColor' => '#173028',
                    ],
                    'desktopConfig' => [
                        'enabled' => true,
                        'contentMode' => 'stack',
                        'profilePlacement' => 'center',
                        'profileOpacity' => 0.95,
                        'profileBlur' => 4,
                        'panelBackgroundColor' => '#eef7f2',
                        'panelTextColor' => '#173028',
                        'decorativeAsset' => '/images/3d/Sphere-1.png',
                        'decorativePlacement' => 'background',
                    ],
                ],
            ],
        ];
    }
};
