<?php

namespace Tests\Unit;

use App\Biolinks\Support\BiolinkAppearanceConfig;
use Tests\TestCase;

class BiolinkAppearanceConfigTest extends TestCase
{
    public function test_versioned_footer_and_header_navigation_are_accepted(): void
    {
        $config = [
            'headerConfig' => [
                'showShareButton' => true,
                'showNavigation' => true,
                'navigationWidgetIds' => [12, 15],
                'locationText' => 'São Paulo, SP',
                'statusText' => 'Aberto agora',
            ],
            'footerConfig' => [
                'version' => 1,
                'enabled' => true,
                'preset' => 'commercial',
                'brandSource' => 'auto',
                'blocks' => [
                    'brand' => true,
                    'navigation' => true,
                    'socials' => true,
                    'cta' => true,
                    'backToTop' => true,
                ],
                'showPlatformLinks' => true,
                'links' => [
                    [
                        'id' => 'services',
                        'label' => 'Services',
                        'source' => 'widget',
                        'widgetId' => 12,
                        'variant' => 'link',
                        'active' => true,
                        'position' => 0,
                    ],
                    [
                        'id' => 'contact',
                        'label' => 'Contact',
                        'source' => 'url',
                        'url' => 'https://example.com/contact',
                        'variant' => 'cta',
                        'active' => true,
                        'position' => 1,
                    ],
                ],
            ],
        ];

        $support = app(BiolinkAppearanceConfig::class);
        $this->assertSame([], $support->validate($config));
        $this->assertSame($config, $support->normalize($config));
    }

    public function test_versioned_footer_rejects_unsafe_or_broken_links(): void
    {
        $errors = app(BiolinkAppearanceConfig::class)->validate([
            'footerConfig' => [
                'version' => 1,
                'enabled' => true,
                'preset' => 'unknown',
                'links' => [
                    [
                        'source' => 'url',
                        'url' => 'javascript:alert(1)',
                    ],
                    [
                        'source' => 'widget',
                    ],
                ],
            ],
        ]);

        $this->assertArrayHasKey('config.footerConfig.preset', $errors);
        $this->assertArrayHasKey('config.footerConfig.links.0.url', $errors);
        $this->assertArrayHasKey(
            'config.footerConfig.links.1.widgetId',
            $errors,
        );
    }

    public function test_valid_theme_config_is_accepted_and_normalized(): void
    {
        $support = app(BiolinkAppearanceConfig::class);
        $config = [
            'theme' => [
                'slug' => 'agate',
                'category' => 'customizable',
                'locked' => false,
                'modified' => false,
            ],
            'bgConfig' => [
                'activeType' => 'gradient',
                'backgroundColor' => '#102E71',
                'backgroundImage' =>
                    'linear-gradient(135deg, #102E71 0%, #5B8FF0 100%)',
                'backgroundSize' => 'cover',
                'color' => '#ffffff',
            ],
            'btnConfig' => [
                'variant' => 'solid',
                'radius' => 'rounded-lg',
                'shadow' => 'soft',
                'color' => '#5B8FF0',
                'textColor' => '#ffffff',
                'borderColor' => '#1D4ED8',
                'iconColor' => '#FEF3C7',
                'blockStyle' => '/images/block-styles/border-double.png',
            ],
            'fontConfig' => [
                'family' => 'Inter, sans-serif',
                'google' => false,
            ],
            'headerConfig' => [
                'layout' => 'banner',
                'title' => 'MeuLinkBio',
                'bio' => 'Uma bio curta',
                'bannerBackgroundType' => 'gradient',
                'bannerGradientFrom' => '#102E71',
                'bannerGradientTo' => '#5B8FF0',
                'image' => 'api/v1/file-entries/123',
                'logo' => 'uploads/logos/meulinkbio.png',
                'shapeVariant' => 'clover',
                'shapeColor' => '#EF4444',
                'titleStyle' => 'text',
                'alternativeFont' => false,
                'titleColor' => '#ffffff',
            ],
            'hideBranding' => false,
        ];

        $this->assertSame([], $support->validate($config));
        $this->assertSame($config, $support->normalize($config));
    }

    public function test_relative_upload_image_urls_are_accepted(): void
    {
        $errors = app(BiolinkAppearanceConfig::class)->validate([
            'headerConfig' => [
                'layout' => 'banner',
                'bannerBackgroundType' => 'image',
                'bannerImage' => 'storage/banners/banner.jpg',
                'image' => 'api/v1/file-entries/123',
                'logo' => 'uploads/logos/meulinkbio.png',
            ],
        ]);

        $this->assertSame([], $errors);
    }

    public function test_header_avatar_dimensions_accept_integer_values(): void
    {
        $errors = app(BiolinkAppearanceConfig::class)->validate([
            'headerConfig' => [
                'avatarSize' => 120,
                'avatarRadius' => 24,
                'avatarBorderWidth' => 2,
            ],
        ]);

        $this->assertSame([], $errors);
    }

    public function test_shape_header_config_is_validated(): void
    {
        $support = app(BiolinkAppearanceConfig::class);

        $this->assertSame(
            [],
            $support->validate([
                'headerConfig' => [
                    'layout' => 'shape',
                    'shapeVariant' => 'splash',
                    'shapeColor' => '#D14A52',
                ],
            ]),
        );

        $errors = $support->validate([
            'headerConfig' => [
                'layout' => 'shape',
                'shapeVariant' => 'script',
                'shapeColor' => 'red',
            ],
        ]);

        $this->assertArrayHasKey('config.headerConfig.shapeVariant', $errors);
        $this->assertArrayHasKey('config.headerConfig.shapeColor', $errors);
    }

    public function test_unknown_config_keys_are_rejected(): void
    {
        $errors = app(BiolinkAppearanceConfig::class)->validate([
            'theme' => [
                'slug' => 'agate',
                'category' => 'customizable',
                'locked' => false,
                'modified' => false,
                'unexpected' => true,
            ],
        ]);

        $this->assertArrayHasKey('config.theme', $errors);
    }

    public function test_font_catalog_category_metadata_is_accepted_and_not_persisted(): void
    {
        $support = app(BiolinkAppearanceConfig::class);
        $config = [
            'fontConfig' => [
                'family' => 'Inter',
                'google' => true,
                'category' => 'sans-serif',
            ],
            'headerConfig' => [
                'titleFontConfig' => [
                    'family' => 'Playfair Display',
                    'google' => true,
                    'category' => 'serif',
                ],
            ],
        ];

        $this->assertSame([], $support->validate($config));
        $this->assertSame(
            [
                'fontConfig' => [
                    'family' => 'Inter',
                    'google' => true,
                ],
                'headerConfig' => [
                    'titleFontConfig' => [
                        'family' => 'Playfair Display',
                        'google' => true,
                    ],
                ],
            ],
            $support->normalize($config),
        );
    }

    public function test_unknown_font_config_keys_are_rejected(): void
    {
        $errors = app(BiolinkAppearanceConfig::class)->validate([
            'fontConfig' => [
                'family' => 'Inter',
                'google' => true,
                'unexpected' => true,
            ],
        ]);

        $this->assertArrayHasKey('config.fontConfig', $errors);
    }

    public function test_unsafe_image_urls_are_rejected(): void
    {
        $errors = app(BiolinkAppearanceConfig::class)->validate([
            'headerConfig' => [
                'layout' => 'classic',
                'image' => 'javascript:alert(1)',
                'logo' => '//evil.test/logo.png',
                'bannerBackgroundType' => 'image',
                'bannerImage' => 'data:image/svg+xml,<svg onload=alert(1)>',
            ],
            'bgConfig' => [
                'activeType' => 'image',
                'backgroundImage' => 'url(javascript:alert(1))',
            ],
        ]);

        $this->assertArrayHasKey('config.headerConfig.image', $errors);
        $this->assertArrayHasKey('config.headerConfig.logo', $errors);
        $this->assertArrayHasKey('config.headerConfig.bannerImage', $errors);
        $this->assertArrayHasKey('config.bgConfig.backgroundImage', $errors);
    }

    public function test_button_asset_config_rejects_uncataloged_assets(): void
    {
        $errors = app(BiolinkAppearanceConfig::class)->validate([
            'btnConfig' => [
                'blockStyle' => '/images/theme/retro/BQgZ.jpg',
                'borderColor' => 'red',
                'iconColor' => '#fff',
            ],
        ]);

        $this->assertArrayHasKey('config.btnConfig.blockStyle', $errors);
        $this->assertArrayHasKey('config.btnConfig.borderColor', $errors);
        $this->assertArrayNotHasKey('config.btnConfig.iconColor', $errors);
    }

    public function test_advanced_desktop_media_effects_and_badge_config_is_accepted(): void
    {
        $support = app(BiolinkAppearanceConfig::class);
        $config = [
            'desktopConfig' => [
                'enabled' => true,
                'layoutMode' => 'split',
                'contentMode' => 'spotlight',
                'profilePlacement' => 'center',
                'surfaceMode' => 'open',
                'profileOpacity' => 0.85,
                'profileBlur' => 18,
                'panelBackgroundColor' => '#111111cc',
                'panelTextColor' => '#ffffff',
                'decorativeAsset' => '/images/3d/Sphere-1.png',
                'decorativePlacement' => 'right',
            ],
            'mediaConfig' => [
                'backgroundMedia' => 'storage/biolink-media/bg.mp4',
                'backgroundMediaType' => 'video',
                'avatarOverride' => '/images/emoji/Yellow-1/Happy.png',
                'audio' => 'storage/biolink-audio/theme.mp3',
                'audioPrompt' => [
                    'enabled' => true,
                    'text' => 'Clique para ativar a música',
                    'textColor' => '#ffffff',
                    'fontConfig' => ['family' => 'Inter', 'google' => false],
                ],
                'cursor' => 'storage/biolink-cursors/cursor.cur',
            ],
            'effectsConfig' => [
                'backgroundEffect' => 'stars',
                'usernameEffect' => 'glow',
                'effectColor' => '#ffffff',
                'glowUsername' => true,
                'glowSocials' => true,
                'glowBadges' => true,
                'monochromeSocialIcons' => false,
                'invertBoxes' => false,
                'animatedTitle' => true,
                'showVolumeControl' => true,
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
        ];

        $this->assertSame([], $support->validate($config));
        $normalized = $support->normalize($config);
        $this->assertSame(
            'biolink.badges.verified.label',
            $normalized['badgeConfig']['items'][0]['label'],
        );
        $this->assertSame(
            '/images/svg/icons/Checkmark.svg',
            $normalized['badgeConfig']['items'][0]['icon'],
        );
    }

    public function test_background_presets_and_aurora_colors_are_accepted(): void
    {
        $config = [
            'effectsConfig' => [
                'backgroundEffect' => 'snow',
                'effectColor' => '#ffffff',
                'effectSecondaryColor' => '#a7f3d0',
                'effectTertiaryColor' => '#93c5fd',
            ],
        ];

        $support = app(BiolinkAppearanceConfig::class);

        $this->assertSame([], $support->validate($config));
        $this->assertSame($config, $support->normalize($config));

        $this->assertSame(
            [],
            $support->validate([
                'effectsConfig' => [
                    'backgroundEffect' => 'aurora',
                    'effectColor' => '#ffffff',
                    'effectSecondaryColor' => '#6ee7b7',
                    'effectTertiaryColor' => '#3b82f6',
                ],
            ]),
        );
    }

    public function test_username_effect_presets_are_accepted(): void
    {
        $support = app(BiolinkAppearanceConfig::class);

        foreach (
            [
                'none',
                'glow',
                'pulse',
                'scanline',
                'rainbow',
                'sparkle',
                'glitch',
                'shimmer',
            ]
            as $effect
        ) {
            $config = ['effectsConfig' => ['usernameEffect' => $effect]];

            $this->assertSame([], $support->validate($config), $effect);
            $this->assertSame($config, $support->normalize($config), $effect);
        }

        $errors = $support->validate([
            'effectsConfig' => ['usernameEffect' => 'unsupported'],
        ]);

        $this->assertArrayHasKey(
            'config.effectsConfig.usernameEffect',
            $errors,
        );
    }

    public function test_central_glow_config_is_accepted_and_normalized(): void
    {
        $support = app(BiolinkAppearanceConfig::class);
        $config = [
            'effectsConfig' => [
                'effectColor' => '#7c3aed',
                'glow' => [
                    'enabled' => true,
                    'preset' => 'custom',
                    'source' => 'custom',
                    'customColor' => '#22d3ee',
                    'opacity' => 0.32,
                    'blur' => 24,
                    'spread' => 2,
                    'username' => true,
                    'avatar' => true,
                    'products' => true,
                    'buttons' => true,
                ],
            ],
        ];

        $this->assertSame([], $support->validate($config));
        $normalized = $support->normalize($config);

        $this->assertSame(
            '#22d3ee',
            $normalized['effectsConfig']['glow']['customColor'],
        );
    }

    public function test_central_glow_config_rejects_invalid_values(): void
    {
        $errors = app(BiolinkAppearanceConfig::class)->validate([
            'effectsConfig' => [
                'glow' => [
                    'preset' => 'neon',
                    'source' => 'unsafe',
                    'customColor' => 'purple',
                    'opacity' => 2,
                    'blur' => 100,
                    'spread' => -1,
                    'buttons' => 'yes',
                ],
            ],
        ]);

        $this->assertArrayHasKey('config.effectsConfig.glow.preset', $errors);
        $this->assertArrayHasKey('config.effectsConfig.glow.source', $errors);
        $this->assertArrayHasKey(
            'config.effectsConfig.glow.customColor',
            $errors,
        );
        $this->assertArrayHasKey('config.effectsConfig.glow.opacity', $errors);
        $this->assertArrayHasKey('config.effectsConfig.glow.blur', $errors);
        $this->assertArrayHasKey('config.effectsConfig.glow.spread', $errors);
        $this->assertArrayHasKey('config.effectsConfig.glow.buttons', $errors);
    }

    public function test_audio_prompt_rejects_invalid_values(): void
    {
        $errors = app(BiolinkAppearanceConfig::class)->validate([
            'mediaConfig' => [
                'audioPrompt' => [
                    'enabled' => 'yes',
                    'text' => str_repeat('x', 161),
                    'textColor' => 'not-a-color',
                    'fontConfig' => ['family' => 123, 'google' => 'yes'],
                ],
            ],
        ]);

        $this->assertArrayHasKey(
            'config.mediaConfig.audioPrompt.enabled',
            $errors,
        );
        $this->assertArrayHasKey(
            'config.mediaConfig.audioPrompt.text',
            $errors,
        );
        $this->assertArrayHasKey(
            'config.mediaConfig.audioPrompt.textColor',
            $errors,
        );
        $this->assertArrayHasKey(
            'config.mediaConfig.audioPrompt.fontConfig.family',
            $errors,
        );
        $this->assertArrayHasKey(
            'config.mediaConfig.audioPrompt.fontConfig.google',
            $errors,
        );
    }

    public function test_font_family_rejects_css_injection_values(): void
    {
        $errors = app(BiolinkAppearanceConfig::class)->validate([
            'fontConfig' => [
                'family' => 'Arial; color: red',
            ],
        ]);

        $this->assertArrayHasKey('config.fontConfig.family', $errors);
    }

    public function test_advanced_media_rejects_external_urls_data_urls_and_raw_svg(): void
    {
        $errors = app(BiolinkAppearanceConfig::class)->validate([
            'desktopConfig' => [
                'profileOpacity' => 2,
                'decorativeAsset' => '//evil.test/asset.png',
            ],
            'mediaConfig' => [
                'backgroundMedia' => 'https://evil.test/bg.mp4',
                'avatarOverride' => 'data:image/svg+xml,<svg></svg>',
                'audio' => 'javascript:alert(1)',
                'cursor' => 'storage/cursors/cursor.svg',
            ],
            'effectsConfig' => [
                'backgroundEffect' => 'unsafe',
                'effectColor' => 'white',
            ],
            'badgeConfig' => [
                'items' => [
                    [
                        'id' => 'bad badge',
                        'type' => 'custom',
                        'label' => 'Badge',
                        'icon' => '<svg></svg>',
                    ],
                ],
            ],
        ]);

        $this->assertArrayHasKey(
            'config.desktopConfig.profileOpacity',
            $errors,
        );
        $this->assertArrayHasKey(
            'config.desktopConfig.decorativeAsset',
            $errors,
        );
        $this->assertArrayHasKey('config.mediaConfig.backgroundMedia', $errors);
        $this->assertArrayHasKey('config.mediaConfig.avatarOverride', $errors);
        $this->assertArrayHasKey('config.mediaConfig.audio', $errors);
        $this->assertArrayHasKey('config.mediaConfig.cursor', $errors);
        $this->assertArrayHasKey(
            'config.effectsConfig.backgroundEffect',
            $errors,
        );
        $this->assertArrayHasKey('config.effectsConfig.effectColor', $errors);
        $this->assertArrayHasKey('config.badgeConfig.items.0.id', $errors);
        $this->assertArrayHasKey('config.badgeConfig.items.0.icon', $errors);
    }

    public function test_legacy_badge_star_icon_is_accepted_and_normalized(): void
    {
        $support = app(BiolinkAppearanceConfig::class);
        $config = [
            'badgeConfig' => [
                'style' => 'chips',
                'items' => [
                    [
                        'id' => 'custom-1',
                        'type' => 'custom',
                        'label' => 'Custom',
                        'icon' => '/images/svg/icons/Star.svg',
                        'color' => '#7c3aed',
                        'active' => true,
                        'sort_order' => 10,
                    ],
                ],
            ],
        ];

        $this->assertSame([], $support->validate($config));

        $normalized = $support->normalize($config);

        $this->assertSame(
            '/images/svg/icons/New%20Badge.svg',
            $normalized['badgeConfig']['items'][0]['icon'],
        );
    }

    public function test_library_badge_icon_and_particle_options_are_accepted(): void
    {
        $config = [
            'desktopConfig' => [
                'gridMode' => '3',
                'surfaceMode' => 'open',
            ],
            'effectsConfig' => [
                'mediaEffect' => 'aurora',
                'particlePreset' => 'snow',
                'particleDensity' => 120,
                'particleSpeed' => 1.4,
                'respectReducedMotion' => true,
            ],
            'badgeConfig' => [
                'items' => [
                    [
                        'id' => 'custom-verified',
                        'type' => 'custom',
                        'label' => 'Verified',
                        'iconRef' => [
                            'library' => 'lucide',
                            'name' => 'BadgeCheck',
                        ],
                    ],
                ],
            ],
        ];

        $support = app(BiolinkAppearanceConfig::class);

        $this->assertSame([], $support->validate($config));
        $this->assertSame(
            $config['badgeConfig']['items'][0]['iconRef'],
            $support->normalize($config)['badgeConfig']['items'][0]['iconRef'],
        );
    }

    public function test_unknown_system_badge_is_rejected(): void
    {
        $errors = app(BiolinkAppearanceConfig::class)->validate([
            'badgeConfig' => [
                'items' => [
                    [
                        'id' => 'official-fake',
                        'type' => 'system',
                        'label' => 'Verified',
                    ],
                ],
            ],
        ]);

        $this->assertArrayHasKey('config.badgeConfig.items.0.id', $errors);
    }

    public function test_icon_badge_style_and_sizes_are_supported(): void
    {
        $config = [
            'badgeConfig' => [
                'style' => 'icon',
                'items' => [
                    [
                        'id' => 'custom-icon',
                        'type' => 'custom',
                        'label' => 'Creator',
                        'description' => 'Creator badge',
                        'iconRef' => [
                            'library' => 'lucide',
                            'name' => 'Heart',
                        ],
                        'iconSize' => 'large',
                    ],
                ],
            ],
        ];

        $support = app(BiolinkAppearanceConfig::class);

        $this->assertSame([], $support->validate($config));
        $this->assertSame($config, $support->normalize($config));
    }

    public function test_unknown_badge_icon_size_is_rejected(): void
    {
        $errors = app(BiolinkAppearanceConfig::class)->validate([
            'badgeConfig' => [
                'style' => 'icon',
                'items' => [
                    [
                        'id' => 'custom-icon',
                        'type' => 'custom',
                        'label' => 'Creator',
                        'iconSize' => 'huge',
                    ],
                ],
            ],
        ]);

        $this->assertArrayHasKey(
            'config.badgeConfig.items.0.iconSize',
            $errors,
        );
    }

    public function test_recurring_badge_edition_year_is_preserved(): void
    {
        $config = [
            'badgeConfig' => [
                'style' => 'chips',
                'items' => [
                    [
                        'id' => 'summer',
                        'type' => 'system',
                        'label' => 'biolink.badges.summer.label',
                        'editionYear' => 2026,
                    ],
                ],
            ],
        ];
        $support = app(BiolinkAppearanceConfig::class);

        $this->assertSame([], $support->validate($config));
        $this->assertSame(
            2026,
            $support->normalize($config)['badgeConfig']['items'][0][
                'editionYear'
            ],
        );
    }

    public function test_legacy_official_badge_saved_as_custom_is_normalized(): void
    {
        $config = [
            'badgeConfig' => [
                'style' => 'chips',
                'items' => [
                    [
                        'id' => 'premium',
                        'type' => 'custom',
                        'label' => 'biolink.badges.premium.label',
                        'description' =>
                            'biolink.badges.premium.description',
                        'color' => '#a855f7',
                    ],
                ],
            ],
        ];

        $normalized = app(BiolinkAppearanceConfig::class)->normalize($config);
        $badge = $normalized['badgeConfig']['items'][0];

        $this->assertSame('system', $badge['type']);
        $this->assertSame('biolink.badges.premium.label', $badge['label']);
        $this->assertSame(
            '/images/svg/icons/New Badge.svg',
            $badge['icon'],
        );
    }

    public function test_badge_edition_year_outside_supported_range_is_rejected(): void
    {
        $errors = app(BiolinkAppearanceConfig::class)->validate([
            'badgeConfig' => [
                'items' => [
                    [
                        'id' => 'summer',
                        'type' => 'system',
                        'label' => 'biolink.badges.summer.label',
                        'editionYear' => 2200,
                    ],
                ],
            ],
        ]);

        $this->assertArrayHasKey(
            'config.badgeConfig.items.0.editionYear',
            $errors,
        );
    }

    public function test_fixed_social_config_is_accepted_and_normalized(): void
    {
        $config = [
            'socialConfig' => [
                'enabled' => true,
                'mobilePlacement' => 'header',
                'desktopPlacement' => 'badge',
                'style' => 'pills',
                'links' => [
                    'instagram' => '@meulinkbio',
                    'facebook' => 'https://facebook.com/meulinkbio',
                    'unknown' => 'https://example.com/ignored',
                ],
            ],
        ];

        $support = app(BiolinkAppearanceConfig::class);

        $this->assertArrayHasKey(
            'config.socialConfig.links',
            $support->validate($config),
        );
        unset($config['socialConfig']['links']['unknown']);
        $this->assertSame([], $support->validate($config));
        $this->assertSame($config, $support->normalize($config));
    }

    public function test_fixed_social_config_rejects_invalid_values(): void
    {
        $errors = app(BiolinkAppearanceConfig::class)->validate([
            'socialConfig' => [
                'mobilePlacement' => 'sidebar',
                'desktopPlacement' => 'header',
                'style' => 'cards',
                'links' => [
                    'instagram' => 'javascript:alert(1)',
                    'facebook' => 'https://',
                ],
            ],
        ]);

        $this->assertArrayHasKey(
            'config.socialConfig.mobilePlacement',
            $errors,
        );
        $this->assertArrayHasKey(
            'config.socialConfig.desktopPlacement',
            $errors,
        );
        $this->assertArrayHasKey('config.socialConfig.style', $errors);
        $this->assertArrayHasKey(
            'config.socialConfig.links.instagram',
            $errors,
        );
        $this->assertArrayHasKey('config.socialConfig.links.facebook', $errors);
    }

    public function test_v2_visual_modes_are_accepted_and_normalized(): void
    {
        $config = [
            'cardConfig' => [
                'cardVariant' => 'poster',
                'radius' => 12,
                'shadow' => 'hard',
            ],
            'effectsConfig' => [
                'interactionStyle' => 'press',
            ],
            'socialConfig' => [
                'colorMode' => 'brand',
                'style' => 'icons',
            ],
        ];

        $support = app(BiolinkAppearanceConfig::class);

        $this->assertSame([], $support->validate($config));
        $this->assertSame($config, $support->normalize($config));
    }

    public function test_v2_visual_modes_reject_unknown_values(): void
    {
        $errors = app(BiolinkAppearanceConfig::class)->validate([
            'cardConfig' => ['cardVariant' => 'magazine'],
            'effectsConfig' => ['interactionStyle' => 'bounce'],
            'socialConfig' => ['colorMode' => 'rainbow'],
        ]);

        $this->assertArrayHasKey('config.cardConfig.cardVariant', $errors);
        $this->assertArrayHasKey(
            'config.effectsConfig.interactionStyle',
            $errors,
        );
        $this->assertArrayHasKey('config.socialConfig.colorMode', $errors);
    }
}
