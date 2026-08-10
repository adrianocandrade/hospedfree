<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    private const FROM_VERSION = 'complete-models-v1';

    private const TO_VERSION = 'complete-models-v2';

    public function up(): void
    {
        if (
            !Schema::hasTable('biolink_themes') ||
            !Schema::hasColumn('biolink_themes', 'metadata')
        ) {
            return;
        }

        foreach ($this->models() as $model) {
            $theme = DB::table('biolink_themes')
                ->where('slug', $model['slug'])
                ->first(['id', 'metadata']);
            if (!$theme) {
                continue;
            }

            $metadata = json_decode($theme->metadata ?? '[]', true) ?: [];
            if (($metadata['seedVersion'] ?? null) !== self::FROM_VERSION) {
                continue;
            }

            $metadata['seedVersion'] = self::TO_VERSION;
            $metadata['previewImage'] = $model['previewImage'];
            $metadata['designRecipe'] = $model['designRecipe'];
            $metadata['contentBlueprint'] = $this->enhanceBlueprint(
                $metadata['contentBlueprint'] ?? [],
                $model['widgetEnhancements'],
            );

            DB::table('biolink_themes')
                ->where('id', $theme->id)
                ->update([
                    'config' => json_encode(
                        $this->v2Appearance($model),
                        JSON_THROW_ON_ERROR,
                    ),
                    'metadata' => json_encode($metadata, JSON_THROW_ON_ERROR),
                    'updated_at' => now(),
                ]);
        }
    }

    public function down(): void
    {
        if (
            !Schema::hasTable('biolink_themes') ||
            !Schema::hasColumn('biolink_themes', 'metadata')
        ) {
            return;
        }

        foreach ($this->models() as $model) {
            $theme = DB::table('biolink_themes')
                ->where('slug', $model['slug'])
                ->first(['id', 'metadata']);
            if (!$theme) {
                continue;
            }

            $metadata = json_decode($theme->metadata ?? '[]', true) ?: [];
            if (($metadata['seedVersion'] ?? null) !== self::TO_VERSION) {
                continue;
            }

            $metadata['seedVersion'] = self::FROM_VERSION;
            unset($metadata['previewImage'], $metadata['designRecipe']);
            $metadata['contentBlueprint'] = $this->restoreBlueprint(
                $metadata['contentBlueprint'] ?? [],
                array_keys($model['widgetEnhancements']),
            );

            DB::table('biolink_themes')
                ->where('id', $theme->id)
                ->update([
                    'config' => json_encode(
                        $this->v1Appearance($model),
                        JSON_THROW_ON_ERROR,
                    ),
                    'metadata' => json_encode($metadata, JSON_THROW_ON_ERROR),
                    'updated_at' => now(),
                ]);
        }
    }

    private function enhanceBlueprint(
        array $blueprint,
        array $enhancements,
    ): array {
        $blueprint['widgets'] = collect($blueprint['widgets'] ?? [])
            ->map(function (array $widget) use ($enhancements) {
                $key = $widget['key'] ?? null;
                if ($key && isset($enhancements[$key])) {
                    $widget['config'] = array_replace_recursive(
                        $widget['config'] ?? [],
                        $enhancements[$key],
                    );
                }

                return $widget;
            })
            ->all();

        return $blueprint;
    }

    private function restoreBlueprint(array $blueprint, array $keys): array
    {
        $blueprint['widgets'] = collect($blueprint['widgets'] ?? [])
            ->map(function (array $widget) use ($keys) {
                if (!in_array($widget['key'] ?? null, $keys, true)) {
                    return $widget;
                }

                unset(
                    $widget['config']['playBehavior'],
                    $widget['config']['playButtonMotion'],
                    $widget['config']['productStyle'],
                );

                return $widget;
            })
            ->all();

        return $blueprint;
    }

    private function v2Appearance(array $model): array
    {
        $palette = $model['palette'];
        $base = [
            'theme' => [
                'slug' => $model['slug'],
                'category' => 'curated',
                'locked' => false,
                'modified' => false,
            ],
            'bgConfig' => [
                'activeType' => 'gradient',
                'backgroundColor' => $palette['background'],
                'backgroundImage' => $palette['gradient'],
                'color' => $palette['text'],
            ],
            'btnConfig' => [
                'variant' => 'solid',
                'radius' => 'rounded-lg',
                'shadow' => 'soft',
                'color' => $palette['accent'],
                'textColor' => $palette['accentText'],
                'borderColor' => $palette['border'],
                'borderWidth' => 1,
                'cornerWidth' => 12,
            ],
            'boxConfig' => [
                'variant' => 'outline',
                'radius' => 'rounded-lg',
                'shadow' => 'none',
                'color' => $palette['surface'],
                'textColor' => $palette['text'],
                'borderColor' => $palette['border'],
                'borderWidth' => 1,
                'cornerWidth' => 14,
            ],
            'cardConfig' => [
                'backgroundColor' => $palette['surface'],
                'textColor' => $palette['text'],
                'borderColor' => $palette['border'],
                'borderWidth' => 1,
                'shadow' => 'soft',
                'shadowColor' => $palette['shadow'],
                'radius' => 14,
                'imageRadius' => 12,
                'imagePosition' => 'top',
                'imageSize' => 'large',
                'showImages' => true,
                'showImageFallback' => true,
                'pricePosition' => 'below',
                'actionStyle' => 'button',
                'cardVariant' => $model['cardVariant'],
            ],
            'fontConfig' => [
                'family' => $model['font'],
                'google' => true,
            ],
            'headerConfig' => [
                'layout' => $model['headerLayout'],
                'alignment' => $model['headerAlignment'],
                'avatarSize' => 104,
                'avatarRadius' => 50,
                'avatarBorderWidth' => 3,
                'avatarBorderColor' => $palette['accent'],
                'titleStyle' => 'text',
                'alternativeFont' => true,
                'titleFontConfig' => [
                    'family' => $model['titleFont'],
                    'google' => true,
                ],
                'titleColor' => $palette['text'],
                'bannerBackgroundType' => 'gradient',
                'bannerGradientFrom' => $palette['surface'],
                'bannerGradientTo' => $palette['background'],
                'showShareButton' => true,
                'showNavigation' => true,
            ],
            'desktopConfig' => $model['desktopConfig'],
            'effectsConfig' => [
                'respectReducedMotion' => true,
                'interactionStyle' => $model['interactionStyle'],
                'effectColor' => $palette['accent'],
                'effectSecondaryColor' => $palette['border'],
                'glow' => [
                    'enabled' => $model['glow'],
                    'preset' => $model['glow'] ? 'soft' : 'none',
                    'source' => 'primary',
                    'opacity' => 0.18,
                    'blur' => 14,
                    'spread' => 0,
                    'widgets' => $model['glow'],
                    'products' => $model['glow'],
                    'socialIcons' => false,
                    'reduceOnMobile' => true,
                ],
            ],
            'socialConfig' => [
                'enabled' => true,
                'mobilePlacement' => 'header',
                'desktopPlacement' => 'badge',
                'style' => 'icons',
                'colorMode' => $model['socialColorMode'],
                'links' => [],
            ],
            'footerConfig' => [
                'version' => 1,
                'enabled' => true,
                'preset' => $model['footerPreset'],
                'brandSource' => 'auto',
                'blocks' => [
                    'brand' => true,
                    'navigation' => true,
                    'socials' => true,
                    'cta' => true,
                    'backToTop' => true,
                ],
                'showPlatformLinks' => true,
                'links' => [],
            ],
        ];

        return array_replace_recursive($base, $model['overrides']);
    }

    private function v1Appearance(array $model): array
    {
        $palette = $model['v1Palette'];

        return [
            'theme' => [
                'slug' => $model['slug'],
                'category' => 'curated',
                'locked' => false,
                'modified' => false,
            ],
            'bgConfig' => [
                'activeType' => 'gradient',
                'backgroundColor' => $palette['background'],
                'backgroundImage' => $palette['gradient'],
                'color' => $palette['text'],
            ],
            'btnConfig' => [
                'variant' => 'solid',
                'radius' => 'rounded-lg',
                'shadow' => 'soft',
                'color' => $palette['accent'],
                'textColor' => $palette['accentText'],
            ],
            'boxConfig' => [
                'variant' => 'outline',
                'radius' => 'rounded-lg',
                'shadow' => 'none',
                'color' => $palette['surface'],
                'textColor' => $palette['text'],
                'borderColor' => $palette['border'],
                'borderWidth' => 1,
            ],
            'fontConfig' => [
                'family' => 'ui-sans-serif, system-ui, sans-serif',
            ],
            'headerConfig' => [
                'layout' => 'banner',
                'alignment' => 'center',
                'titleStyle' => 'text',
                'titleColor' => $palette['text'],
                'bannerBackgroundType' => 'gradient',
                'bannerGradientFrom' => $palette['surface'],
                'bannerGradientTo' => $palette['background'],
                'showShareButton' => true,
                'showNavigation' => true,
            ],
            'desktopConfig' => [
                'enabled' => true,
                'layoutMode' => 'full',
                'contentMode' => 'stack',
                'gridMode' => 'auto',
                'profilePlacement' => 'center',
                'surfaceMode' => 'open',
            ],
            'footerConfig' => [
                'version' => 1,
                'enabled' => true,
                'preset' => $model['footerPreset'],
                'brandSource' => 'auto',
                'blocks' => [
                    'brand' => true,
                    'navigation' => true,
                    'socials' => true,
                    'cta' => true,
                    'backToTop' => true,
                ],
                'showPlatformLinks' => true,
                'links' => [],
            ],
        ];
    }

    private function models(): array
    {
        return [
            $this->model(
                slug: 'model-aventura-conteudo',
                footerPreset: 'compact',
                previewImage: '/images/biolink-models/aventura-v2.svg',
                v1: [
                    '#07111f',
                    '#e9f3ff',
                    '#36a7ff',
                    '#061a2d',
                    '#284662',
                    '#04101d',
                ],
                v2: [
                    '#030914',
                    '#edf7ff',
                    '#18a8ff',
                    '#0a192c',
                    '#216ca2',
                    '#03111f',
                    '#006dcc',
                ],
                cardVariant: 'poster',
                font: 'Sora',
                titleFont: 'Barlow Condensed',
                headerLayout: 'hero',
                headerAlignment: 'center',
                socialColorMode: 'brand',
                interactionStyle: 'lift',
                glow: true,
                desktopConfig: [
                    'enabled' => true,
                    'layoutMode' => 'full',
                    'contentMode' => 'stack',
                    'gridMode' => '1',
                    'profilePlacement' => 'center',
                    'surfaceMode' => 'open',
                ],
                widgetEnhancements: [
                    'video' => [
                        'playBehavior' => 'inline',
                        'playButtonMotion' => 'pulse',
                    ],
                    'equipamentos' => [
                        'productStyle' => ['cardVariant' => 'poster'],
                    ],
                ],
                designRecipe: 'layered-navy-cyan',
                overrides: [
                    'footerConfig' => [
                        'blocks' => [
                            'socials' => false,
                            'cta' => false,
                        ],
                    ],
                ],
            ),
            $this->model(
                slug: 'model-criadora-comunidade',
                footerPreset: 'community',
                previewImage: '/images/biolink-models/criadora-v2.svg',
                v1: [
                    '#f7f5ff',
                    '#201a3d',
                    '#6d45e5',
                    '#ffffff',
                    '#ddd6f6',
                    '#ffffff',
                ],
                v2: [
                    '#fff9f7',
                    '#281c38',
                    '#7657e8',
                    '#ffffff',
                    '#e7d8ee',
                    '#ffffff',
                    '#db6d7c',
                ],
                cardVariant: 'minimal',
                font: 'Manrope',
                titleFont: 'Fraunces',
                headerLayout: 'shape',
                headerAlignment: 'center',
                socialColorMode: 'theme',
                interactionStyle: 'quiet',
                glow: false,
                desktopConfig: [
                    'enabled' => true,
                    'layoutMode' => 'full',
                    'contentMode' => 'columns',
                    'gridMode' => '2',
                    'profilePlacement' => 'center',
                    'surfaceMode' => 'open',
                ],
                widgetEnhancements: [
                    'recursos' => [
                        'productStyle' => ['cardVariant' => 'minimal'],
                    ],
                ],
                designRecipe: 'coral-lilac-community',
                overrides: [
                    'headerConfig' => [
                        'shapeVariant' => 'flower',
                        'shapeColor' => '#f2d8e5',
                    ],
                    'boxConfig' => ['bgTransparency' => 18],
                ],
            ),
            $this->model(
                slug: 'model-restaurante-delivery',
                footerPreset: 'commercial',
                previewImage: '/images/biolink-models/restaurante-v2.svg',
                v1: [
                    '#100b08',
                    '#fff5e7',
                    '#f5a524',
                    '#20140d',
                    '#654128',
                    '#080503',
                ],
                v2: [
                    '#090604',
                    '#fff4df',
                    '#f59e0b',
                    '#1d1009',
                    '#7b431c',
                    '#1a0b02',
                    '#c2410c',
                ],
                cardVariant: 'media',
                font: 'Inter',
                titleFont: 'Oswald',
                headerLayout: 'cutout',
                headerAlignment: 'left',
                socialColorMode: 'brand',
                interactionStyle: 'press',
                glow: false,
                desktopConfig: [
                    'enabled' => true,
                    'layoutMode' => 'split',
                    'contentMode' => 'columns',
                    'gridMode' => '2',
                    'profilePlacement' => 'left',
                    'surfaceMode' => 'tinted',
                    'panelBackgroundColor' => '#120a06',
                    'panelTextColor' => '#fff4df',
                ],
                widgetEnhancements: [
                    'produtos' => [
                        'productStyle' => ['cardVariant' => 'media'],
                    ],
                    'combos' => [
                        'productStyle' => ['cardVariant' => 'media'],
                    ],
                ],
                designRecipe: 'charcoal-ember-commerce',
                overrides: [
                    'btnConfig' => ['cornerWidth' => 8],
                    'boxConfig' => ['cornerWidth' => 10],
                ],
            ),
            $this->model(
                slug: 'model-barbearia-premium',
                footerPreset: 'commercial',
                previewImage: '/images/biolink-models/barbearia-v2.svg',
                v1: [
                    '#0b0b09',
                    '#fff8e8',
                    '#d5a64c',
                    '#181713',
                    '#5a4828',
                    '#050504',
                ],
                v2: [
                    '#070706',
                    '#fff7e5',
                    '#d6aa55',
                    '#14130f',
                    '#8c6a32',
                    '#090704',
                    '#a77b2f',
                ],
                cardVariant: 'compact',
                font: 'Barlow',
                titleFont: 'Bebas Neue',
                headerLayout: 'cutout',
                headerAlignment: 'left',
                socialColorMode: 'monochrome',
                interactionStyle: 'press',
                glow: false,
                desktopConfig: [
                    'enabled' => true,
                    'layoutMode' => 'split',
                    'contentMode' => 'columns',
                    'gridMode' => '2',
                    'profilePlacement' => 'left',
                    'surfaceMode' => 'tinted',
                    'panelBackgroundColor' => '#0d0c09',
                    'panelTextColor' => '#fff7e5',
                ],
                widgetEnhancements: [
                    'servicos' => [
                        'productStyle' => ['cardVariant' => 'compact'],
                    ],
                ],
                designRecipe: 'black-gold-offset',
                overrides: [
                    'btnConfig' => [
                        'variant' => 'outline-shadow',
                        'shadow' => 'hard',
                        'shadowColor' => '#7a5923',
                        'cornerWidth' => 6,
                    ],
                    'boxConfig' => [
                        'variant' => 'outline-shadow',
                        'shadow' => 'hard',
                        'shadowColor' => '#4b381d',
                        'cornerWidth' => 8,
                    ],
                    'cardConfig' => [
                        'shadow' => 'hard',
                        'radius' => 8,
                        'imageRadius' => 6,
                    ],
                ],
            ),
            $this->model(
                slug: 'model-salao-beleza',
                footerPreset: 'commercial',
                previewImage: '/images/biolink-models/salao-v2.svg',
                v1: [
                    '#fff7f8',
                    '#421d2a',
                    '#df4f7b',
                    '#ffffff',
                    '#f0ccd7',
                    '#fffafa',
                ],
                v2: [
                    '#fff8fa',
                    '#3e202d',
                    '#d84878',
                    '#fffdfd',
                    '#e9bdcd',
                    '#ffffff',
                    '#b83260',
                ],
                cardVariant: 'media',
                font: 'DM Sans',
                titleFont: 'Playfair Display',
                headerLayout: 'shape',
                headerAlignment: 'center',
                socialColorMode: 'brand',
                interactionStyle: 'quiet',
                glow: false,
                desktopConfig: [
                    'enabled' => true,
                    'layoutMode' => 'full',
                    'contentMode' => 'columns',
                    'gridMode' => '2',
                    'profilePlacement' => 'center',
                    'surfaceMode' => 'open',
                ],
                widgetEnhancements: [
                    'servicos' => [
                        'productStyle' => ['cardVariant' => 'media'],
                    ],
                ],
                designRecipe: 'blush-floral-open',
                overrides: [
                    'headerConfig' => [
                        'shapeVariant' => 'flower',
                        'shapeColor' => '#f3d2dd',
                    ],
                    'boxConfig' => ['bgTransparency' => 22],
                    'cardConfig' => ['shadow' => 'none'],
                ],
            ),
        ];
    }

    private function model(
        string $slug,
        string $footerPreset,
        string $previewImage,
        array $v1,
        array $v2,
        string $cardVariant,
        string $font,
        string $titleFont,
        string $headerLayout,
        string $headerAlignment,
        string $socialColorMode,
        string $interactionStyle,
        bool $glow,
        array $desktopConfig,
        array $widgetEnhancements,
        string $designRecipe,
        array $overrides,
    ): array {
        return [
            'slug' => $slug,
            'footerPreset' => $footerPreset,
            'previewImage' => $previewImage,
            'v1Palette' => $this->v1Palette(...$v1),
            'palette' => $this->palette(...$v2),
            'cardVariant' => $cardVariant,
            'font' => $font,
            'titleFont' => $titleFont,
            'headerLayout' => $headerLayout,
            'headerAlignment' => $headerAlignment,
            'socialColorMode' => $socialColorMode,
            'interactionStyle' => $interactionStyle,
            'glow' => $glow,
            'desktopConfig' => $desktopConfig,
            'widgetEnhancements' => $widgetEnhancements,
            'designRecipe' => $designRecipe,
            'overrides' => $overrides,
        ];
    }

    private function palette(
        string $background,
        string $text,
        string $accent,
        string $surface,
        string $border,
        string $accentText,
        string|null $shadow = null,
    ): array {
        return [
            'background' => $background,
            'gradient' => "linear-gradient(180deg, $surface 0%, $background 46%, $background 100%)",
            'text' => $text,
            'accent' => $accent,
            'accentText' => $accentText,
            'surface' => $surface,
            'border' => $border,
            'shadow' => $shadow ?? $border,
        ];
    }

    private function v1Palette(
        string $background,
        string $text,
        string $accent,
        string $surface,
        string $border,
        string $accentText,
    ): array {
        return [
            'background' => $background,
            'gradient' => "linear-gradient(180deg, $surface 0%, $background 42%, $background 100%)",
            'text' => $text,
            'accent' => $accent,
            'accentText' => $accentText,
            'surface' => $surface,
            'border' => $border,
            'shadow' => $border,
        ];
    }
};
