<?php

namespace App\Biolinks\Support;

use App\Biolinks\Models\BiolinkBadgeDefinition;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Schema;

class BiolinkAppearanceConfig
{
    private const TOP_LEVEL_KEYS = [
        'theme',
        'bgConfig',
        'btnConfig',
        'fontConfig',
        'headerConfig',
        'desktopConfig',
        'mediaConfig',
        'effectsConfig',
        'badgeConfig',
        'socialConfig',
        'hideBranding',
        'customCss',
        'boxConfig',
        'cardConfig',
        'footerConfig',
    ];

    private const BG_KEYS = [
        'activeType',
        'backgroundAttachment',
        'backgroundColor',
        'backgroundImage',
        'backgroundPosition',
        'backgroundRepeat',
        'backgroundSize',
        'color',
        'imageEffect',
        'noise',
        'patternFrontColor',
        'patternSize',
        'tint',
    ];

    private const BUTTON_KEYS = [
        'color',
        'radius',
        'shadow',
        'textColor',
        'borderColor',
        'iconColor',
        'variant',
        'borderImage',
        'backgroundImage',
        'blockStyle',
        'shadowColor',
        'actionBtnColor',
        'actionBtnTextColor',
        'borderWidth',
        'cornerWidth',
        'bgTransparency',
    ];

    private const FONT_KEYS = ['family', 'google'];

    private const FONT_INPUT_KEYS = ['family', 'google', 'category'];

    private const HEADER_KEYS = [
        'alignment',
        'avatarSize',
        'avatarRadius',
        'avatarBorderWidth',
        'avatarBorderColor',
        'alternativeFont',
        'bio',
        'bannerBackgroundType',
        'bannerGradientFrom',
        'bannerGradientTo',
        'bannerImage',
        'image',
        'layout',
        'logo',
        'shapeColor',
        'shapeVariant',
        'title',
        'titleColor',
        'titleFontConfig',
        'titleStyle',
        'viewerCount',
        'showShareButton',
        'showNavigation',
        'navigationWidgetIds',
        'locationText',
        'statusText',
    ];

    private const VIEWER_COUNT_KEYS = ['enabled', 'color', 'fontConfig'];

    private const CARD_KEYS = [
        'backgroundColor',
        'textColor',
        'borderColor',
        'transparency',
        'borderWidth',
        'shadow',
        'shadowColor',
        'radius',
        'fontConfig',
        'imagePosition',
        'imageSize',
        'imageRadius',
        'showImages',
        'showImageFallback',
        'pricePosition',
        'actionStyle',
        'cardVariant',
    ];

    private const FOOTER_KEYS = [
        'version',
        'enabled',
        'preset',
        'brandSource',
        'blocks',
        'showPlatformLinks',
        'links',
    ];
    private const FOOTER_BLOCK_KEYS = [
        'brand',
        'navigation',
        'socials',
        'cta',
        'backToTop',
    ];
    private const FOOTER_LINK_KEYS = [
        'id',
        'label',
        'source',
        'url',
        'widgetId',
        'variant',
        'active',
        'position',
    ];

    private const THEME_KEYS = ['category', 'locked', 'modified', 'slug'];

    private const DESKTOP_KEYS = [
        'enabled',
        'layoutMode',
        'contentMode',
        'gridMode',
        'profilePlacement',
        'surfaceMode',
        'profileOpacity',
        'profileBlur',
        'panelBackgroundColor',
        'panelTextColor',
        'decorativeAsset',
        'decorativePlacement',
    ];

    private const MEDIA_KEYS = [
        'backgroundMedia',
        'backgroundMediaType',
        'avatarOverride',
        'audio',
        'audioPrompt',
        'cursor',
    ];

    private const AUDIO_PROMPT_KEYS = [
        'enabled',
        'text',
        'textColor',
        'fontConfig',
    ];

    private const EFFECTS_KEYS = [
        'backgroundEffect',
        'mediaEffect',
        'particlePreset',
        'particleDensity',
        'particleSpeed',
        'respectReducedMotion',
        'usernameEffect',
        'effectColor',
        'effectSecondaryColor',
        'effectTertiaryColor',
        'glow',
        'glowUsername',
        'glowSocials',
        'glowBadges',
        'monochromeSocialIcons',
        'invertBoxes',
        'animatedTitle',
        'showVolumeControl',
        'interactionStyle',
    ];

    private const GLOW_KEYS = [
        'enabled',
        'preset',
        'source',
        'customColor',
        'opacity',
        'blur',
        'spread',
        'username',
        'avatar',
        'widgets',
        'products',
        'buttons',
        'badges',
        'socialIcons',
        'inputs',
        'hoverOnly',
        'reduceOnMobile',
    ];

    private const BADGE_KEYS = ['style', 'items'];

    private const BADGE_ITEM_KEYS = [
        'id',
        'type',
        'label',
        'description',
        'icon',
        'iconRef',
        'color',
        'iconSize',
        'editionYear',
        'active',
        'sort_order',
    ];

    private const SOCIAL_CONFIG_KEYS = [
        'enabled',
        'mobilePlacement',
        'desktopPlacement',
        'style',
        'colorMode',
        'links',
    ];

    private const SOCIAL_KEYS = [
        'mail',
        'facebook',
        'twitter',
        'instagram',
        'tiktok',
        'youtube',
        'soundcloud',
        'bandcamp',
        'linkedin',
        'whatsapp',
        'telegram',
        'twitch',
        'patreon',
        'pinterest',
        'spotify',
        'amazon',
        'snapchat',
        'apple',
    ];

    public function validate(array $config): array
    {
        $errors = [];
        $this->validateAllowedKeys(
            $errors,
            'config',
            $config,
            self::TOP_LEVEL_KEYS,
        );

        if (Arr::has($config, 'theme')) {
            $this->validateTheme($errors, Arr::get($config, 'theme'));
        }

        if (Arr::has($config, 'bgConfig')) {
            $this->validateBgConfig($errors, Arr::get($config, 'bgConfig'));
        }

        if (Arr::has($config, 'btnConfig')) {
            $this->validateButtonConfig(
                $errors,
                Arr::get($config, 'btnConfig'),
            );
        }

        if (Arr::has($config, 'boxConfig')) {
            $this->validateButtonConfig(
                $errors,
                Arr::get($config, 'boxConfig'),
                'config.boxConfig',
            );
        }

        if (Arr::has($config, 'cardConfig')) {
            $this->validateCardConfig($errors, Arr::get($config, 'cardConfig'));
        }

        if (Arr::has($config, 'footerConfig')) {
            $this->validateFooterConfig(
                $errors,
                Arr::get($config, 'footerConfig'),
            );
        }

        if (Arr::has($config, 'fontConfig')) {
            $this->validateFontConfig(
                $errors,
                'config.fontConfig',
                Arr::get($config, 'fontConfig'),
            );
        }

        if (Arr::has($config, 'headerConfig')) {
            $this->validateHeaderConfig(
                $errors,
                Arr::get($config, 'headerConfig'),
            );
        }

        if (Arr::has($config, 'desktopConfig')) {
            $this->validateDesktopConfig(
                $errors,
                Arr::get($config, 'desktopConfig'),
            );
        }

        if (Arr::has($config, 'mediaConfig')) {
            $this->validateMediaConfig(
                $errors,
                Arr::get($config, 'mediaConfig'),
            );
        }

        if (Arr::has($config, 'effectsConfig')) {
            $this->validateEffectsConfig(
                $errors,
                Arr::get($config, 'effectsConfig'),
            );
        }

        if (Arr::has($config, 'badgeConfig')) {
            $this->validateBadgeConfig(
                $errors,
                Arr::get($config, 'badgeConfig'),
            );
        }

        if (Arr::has($config, 'socialConfig')) {
            $this->validateSocialConfig(
                $errors,
                Arr::get($config, 'socialConfig'),
            );
        }

        if (
            Arr::has($config, 'hideBranding') &&
            !is_bool(Arr::get($config, 'hideBranding'))
        ) {
            $errors['config.hideBranding'] =
                'The hide branding value must be boolean.';
        }

        if (Arr::has($config, 'customCss')) {
            $this->string(
                $errors,
                'config.customCss',
                Arr::get($config, 'customCss'),
                15000,
                true,
            );
        }

        return $errors;
    }

    public function normalize(array $config): array
    {
        $config = Arr::only($config, self::TOP_LEVEL_KEYS);

        if (isset($config['theme']) && is_array($config['theme'])) {
            $config['theme'] = Arr::only($config['theme'], self::THEME_KEYS);
        }

        if (isset($config['bgConfig']) && is_array($config['bgConfig'])) {
            $config['bgConfig'] = Arr::only($config['bgConfig'], self::BG_KEYS);
        }

        if (isset($config['btnConfig']) && is_array($config['btnConfig'])) {
            $config['btnConfig'] = Arr::only(
                $config['btnConfig'],
                self::BUTTON_KEYS,
            );
        }

        if (isset($config['boxConfig']) && is_array($config['boxConfig'])) {
            $config['boxConfig'] = Arr::only(
                $config['boxConfig'],
                self::BUTTON_KEYS,
            );
        }

        if (isset($config['btnConfig']['blockStyle'])) {
            $config['btnConfig']['blockStyle'] = $this->normalizeCatalogPath(
                $config['btnConfig']['blockStyle'],
                ['images/block-styles'],
            );
        }

        if (isset($config['fontConfig']) && is_array($config['fontConfig'])) {
            $config['fontConfig'] = Arr::only(
                $config['fontConfig'],
                self::FONT_KEYS,
            );
        }

        if (
            isset($config['headerConfig']) &&
            is_array($config['headerConfig'])
        ) {
            $config['headerConfig'] = Arr::only(
                $config['headerConfig'],
                self::HEADER_KEYS,
            );
            if (
                isset($config['headerConfig']['titleFontConfig']) &&
                is_array($config['headerConfig']['titleFontConfig'])
            ) {
                $config['headerConfig']['titleFontConfig'] = Arr::only(
                    $config['headerConfig']['titleFontConfig'],
                    self::FONT_KEYS,
                );
            }
            if (
                isset($config['headerConfig']['viewerCount']) &&
                is_array($config['headerConfig']['viewerCount'])
            ) {
                $config['headerConfig']['viewerCount'] = Arr::only(
                    $config['headerConfig']['viewerCount'],
                    self::VIEWER_COUNT_KEYS,
                );
                if (
                    isset(
                        $config['headerConfig']['viewerCount']['fontConfig'],
                    ) &&
                    is_array(
                        $config['headerConfig']['viewerCount']['fontConfig'],
                    )
                ) {
                    $config['headerConfig']['viewerCount'][
                        'fontConfig'
                    ] = Arr::only(
                        $config['headerConfig']['viewerCount']['fontConfig'],
                        self::FONT_KEYS,
                    );
                }
            }
            if (
                isset($config['headerConfig']['navigationWidgetIds']) &&
                is_array($config['headerConfig']['navigationWidgetIds'])
            ) {
                $config['headerConfig']['navigationWidgetIds'] = collect(
                    $config['headerConfig']['navigationWidgetIds'],
                )
                    ->filter(fn(mixed $id) => is_int($id) && $id > 0)
                    ->unique()
                    ->take(20)
                    ->values()
                    ->all();
            }
        }

        if (isset($config['cardConfig']) && is_array($config['cardConfig'])) {
            $config['cardConfig'] = Arr::only(
                $config['cardConfig'],
                self::CARD_KEYS,
            );
            if (
                isset($config['cardConfig']['fontConfig']) &&
                is_array($config['cardConfig']['fontConfig'])
            ) {
                $config['cardConfig']['fontConfig'] = Arr::only(
                    $config['cardConfig']['fontConfig'],
                    self::FONT_KEYS,
                );
            }
        }

        if (
            isset($config['footerConfig']) &&
            is_array($config['footerConfig'])
        ) {
            $config['footerConfig'] = Arr::only(
                $config['footerConfig'],
                self::FOOTER_KEYS,
            );
            if (
                isset($config['footerConfig']['blocks']) &&
                is_array($config['footerConfig']['blocks'])
            ) {
                $config['footerConfig']['blocks'] = Arr::only(
                    $config['footerConfig']['blocks'],
                    self::FOOTER_BLOCK_KEYS,
                );
            }
            if (
                isset($config['footerConfig']['links']) &&
                is_array($config['footerConfig']['links'])
            ) {
                $config['footerConfig']['links'] = array_values(
                    array_map(
                        static fn(mixed $link): array => is_array($link)
                            ? Arr::only($link, self::FOOTER_LINK_KEYS)
                            : [],
                        array_filter(
                            $config['footerConfig']['links'],
                            'is_array',
                        ),
                    ),
                );
            }
        }

        if (
            isset($config['desktopConfig']) &&
            is_array($config['desktopConfig'])
        ) {
            $config['desktopConfig'] = Arr::only(
                $config['desktopConfig'],
                self::DESKTOP_KEYS,
            );
            if (isset($config['desktopConfig']['decorativeAsset'])) {
                $config['desktopConfig'][
                    'decorativeAsset'
                ] = $this->normalizeCatalogPath(
                    $config['desktopConfig']['decorativeAsset'],
                    [
                        'images/3d',
                        'images/emoji',
                        'images/scribbbles',
                        'images/svg',
                    ],
                );
            }
        }

        if (isset($config['mediaConfig']) && is_array($config['mediaConfig'])) {
            $config['mediaConfig'] = Arr::only(
                $config['mediaConfig'],
                self::MEDIA_KEYS,
            );
            if (
                isset($config['mediaConfig']['audioPrompt']) &&
                is_array($config['mediaConfig']['audioPrompt'])
            ) {
                $config['mediaConfig']['audioPrompt'] = Arr::only(
                    $config['mediaConfig']['audioPrompt'],
                    self::AUDIO_PROMPT_KEYS,
                );
                if (
                    isset(
                        $config['mediaConfig']['audioPrompt']['fontConfig'],
                    ) &&
                    is_array(
                        $config['mediaConfig']['audioPrompt']['fontConfig'],
                    )
                ) {
                    $config['mediaConfig']['audioPrompt'][
                        'fontConfig'
                    ] = Arr::only(
                        $config['mediaConfig']['audioPrompt']['fontConfig'],
                        self::FONT_KEYS,
                    );
                }
            }
        }

        if (
            isset($config['effectsConfig']) &&
            is_array($config['effectsConfig'])
        ) {
            $config['effectsConfig'] = Arr::only(
                $config['effectsConfig'],
                self::EFFECTS_KEYS,
            );
            if (
                isset($config['effectsConfig']['glow']) &&
                is_array($config['effectsConfig']['glow'])
            ) {
                $config['effectsConfig']['glow'] = Arr::only(
                    $config['effectsConfig']['glow'],
                    self::GLOW_KEYS,
                );
            }
        }

        if (isset($config['badgeConfig']) && is_array($config['badgeConfig'])) {
            $config['badgeConfig'] = Arr::only(
                $config['badgeConfig'],
                self::BADGE_KEYS,
            );
            if (
                isset($config['badgeConfig']['items']) &&
                is_array($config['badgeConfig']['items'])
            ) {
                $config['badgeConfig']['items'] = array_values(
                    array_map(function (array $item) {
                        $item = Arr::only($item, self::BADGE_ITEM_KEYS);
                        if (isset($item['icon'])) {
                            $item['icon'] = $this->normalizeCatalogPath(
                                $item['icon'],
                                ['images/svg', 'images/emoji', 'images/3d'],
                            );
                        }

                        if (
                            isset($item['iconRef']) &&
                            is_array($item['iconRef'])
                        ) {
                            $item['iconRef'] = Arr::only($item['iconRef'], [
                                'library',
                                'name',
                            ]);
                        }

                        $isLegacySystemBadge =
                            Arr::get($item, 'type') !== 'system' &&
                            str_starts_with(
                                (string) Arr::get($item, 'label', ''),
                                'biolink.badges.',
                            );

                        if (
                            Arr::get($item, 'type') === 'system' ||
                            $isLegacySystemBadge
                        ) {
                            $systemBadge = $this->databaseBadgeDefinition(
                                Arr::get($item, 'id'),
                            );

                            if ($systemBadge) {
                                $item['type'] = 'system';
                                $item['label'] = $systemBadge->label_key;
                                $item['description'] =
                                    $systemBadge->description_key;
                                $item['icon'] = $systemBadge->icon;
                                $item['color'] = $systemBadge->color;
                                unset($item['iconRef']);
                            } elseif (
                                $catalogBadge = BiolinkSystemBadgeCatalog::find(
                                    Arr::get($item, 'id'),
                                )
                            ) {
                                $item['type'] = 'system';
                                $item['label'] = $catalogBadge['label'];
                                $item['description'] =
                                    $catalogBadge['description'];
                                $item['icon'] = '/' . $catalogBadge['icon'];
                                $item['color'] = $catalogBadge['color'];
                                unset($item['iconRef']);
                            }
                        }

                        return $item;
                    }, array_filter(
                        $config['badgeConfig']['items'],
                        'is_array',
                    )),
                );
            }
        }

        if (
            isset($config['socialConfig']) &&
            is_array($config['socialConfig'])
        ) {
            $config['socialConfig'] = Arr::only(
                $config['socialConfig'],
                self::SOCIAL_CONFIG_KEYS,
            );
            if (
                isset($config['socialConfig']['links']) &&
                is_array($config['socialConfig']['links'])
            ) {
                $config['socialConfig']['links'] = Arr::only(
                    $config['socialConfig']['links'],
                    self::SOCIAL_KEYS,
                );
                $config['socialConfig']['links'] = array_filter(
                    array_map(
                        static fn(mixed $value): mixed => is_string($value)
                            ? trim($value)
                            : $value,
                        $config['socialConfig']['links'],
                    ),
                    static fn(mixed $value): bool => $value !== '',
                );
            }
        }

        return $config;
    }

    private function normalizeCatalogPath(
        mixed $value,
        array|null $roots = null,
    ): mixed {
        if (!is_string($value) || $value === '') {
            return $value;
        }

        return app(BiolinkAssetCatalog::class)->normalizePath($value, $roots) ??
            $value;
    }

    private function validateTheme(array &$errors, mixed $value): void
    {
        if (!is_array($value)) {
            $errors['config.theme'] = 'The theme value must be an object.';
            return;
        }

        $this->validateAllowedKeys(
            $errors,
            'config.theme',
            $value,
            self::THEME_KEYS,
        );
        $this->string(
            $errors,
            'config.theme.slug',
            Arr::get($value, 'slug'),
            80,
            true,
            '/^[a-z0-9-]+$/',
        );
        $this->enum(
            $errors,
            'config.theme.category',
            Arr::get($value, 'category'),
            ['customizable', 'curated'],
            true,
        );
        $this->boolean(
            $errors,
            'config.theme.locked',
            Arr::get($value, 'locked'),
            true,
        );
        $this->boolean(
            $errors,
            'config.theme.modified',
            Arr::get($value, 'modified'),
            true,
        );
    }

    private function validateBgConfig(array &$errors, mixed $value): void
    {
        if (!is_array($value)) {
            $errors['config.bgConfig'] =
                'The background config value must be an object.';
            return;
        }

        $this->validateAllowedKeys(
            $errors,
            'config.bgConfig',
            $value,
            self::BG_KEYS,
        );
        $this->enum(
            $errors,
            'config.bgConfig.activeType',
            Arr::get($value, 'activeType'),
            ['color', 'pattern', 'gradient', 'image'],
            true,
        );
        $this->color(
            $errors,
            'config.bgConfig.backgroundColor',
            Arr::get($value, 'backgroundColor'),
            true,
        );
        $this->color(
            $errors,
            'config.bgConfig.color',
            Arr::get($value, 'color'),
            true,
        );
        $this->color(
            $errors,
            'config.bgConfig.patternFrontColor',
            Arr::get($value, 'patternFrontColor'),
            true,
        );
        $this->safeCssImage(
            $errors,
            'config.bgConfig.backgroundImage',
            Arr::get($value, 'backgroundImage'),
        );
        app(BiolinkAssetCatalog::class)->validateCssImageReferences(
            $errors,
            'config.bgConfig.backgroundImage',
            Arr::get($value, 'backgroundImage'),
        );
        $this->string(
            $errors,
            'config.bgConfig.backgroundAttachment',
            Arr::get($value, 'backgroundAttachment'),
            40,
            true,
        );
        $this->string(
            $errors,
            'config.bgConfig.backgroundSize',
            Arr::get($value, 'backgroundSize'),
            500,
            true,
        );
        $this->string(
            $errors,
            'config.bgConfig.backgroundRepeat',
            Arr::get($value, 'backgroundRepeat'),
            40,
            true,
        );
        $this->string(
            $errors,
            'config.bgConfig.backgroundPosition',
            Arr::get($value, 'backgroundPosition'),
            500,
            true,
        );
        $this->integer(
            $errors,
            'config.bgConfig.tint',
            Arr::get($value, 'tint'),
            true,
            0,
            100,
        );
        $this->integer(
            $errors,
            'config.bgConfig.patternSize',
            Arr::get($value, 'patternSize'),
            true,
            4,
            160,
        );
        $this->boolean(
            $errors,
            'config.bgConfig.noise',
            Arr::get($value, 'noise'),
            true,
        );
        $this->enum(
            $errors,
            'config.bgConfig.imageEffect',
            Arr::get($value, 'imageEffect'),
            ['mono', 'blur', 'halftone'],
            true,
        );
    }

    private function validateButtonConfig(
        array &$errors,
        mixed $config,
        string $prefix = 'config.btnConfig',
    ): void {
        if (!is_array($config)) {
            $errors[$prefix] = 'The button config value must be an object.';
            return;
        }

        $this->validateAllowedKeys(
            $errors,
            $prefix,
            $config,
            self::BUTTON_KEYS,
        );

        $this->string(
            $errors,
            "$prefix.variant",
            Arr::get($config, 'variant'),
            50,
            true,
        );
        $this->string(
            $errors,
            "$prefix.radius",
            Arr::get($config, 'radius'),
            50,
            true,
        );
        $this->string(
            $errors,
            "$prefix.shadow",
            Arr::get($config, 'shadow'),
            50,
            true,
        );
        $this->color(
            $errors,
            "$prefix.color",
            Arr::get($config, 'color'),
            true,
        );
        $this->color(
            $errors,
            "$prefix.textColor",
            Arr::get($config, 'textColor'),
            true,
        );
        $this->color(
            $errors,
            "$prefix.borderColor",
            Arr::get($config, 'borderColor'),
            true,
        );
        $this->color(
            $errors,
            "$prefix.iconColor",
            Arr::get($config, 'iconColor'),
            true,
        );
        $this->color(
            $errors,
            "$prefix.shadowColor",
            Arr::get($config, 'shadowColor'),
            true,
        );
        $this->color(
            $errors,
            "$prefix.actionBtnColor",
            Arr::get($config, 'actionBtnColor'),
            true,
        );
        $this->color(
            $errors,
            "$prefix.actionBtnTextColor",
            Arr::get($config, 'actionBtnTextColor'),
            true,
        );
        $this->integer(
            $errors,
            "$prefix.borderWidth",
            Arr::get($config, 'borderWidth'),
            true,
            0,
            100,
        );
        $this->integer(
            $errors,
            "$prefix.cornerWidth",
            Arr::get($config, 'cornerWidth'),
            true,
            0,
            100,
        );
        $this->integer(
            $errors,
            "$prefix.bgTransparency",
            Arr::get($config, 'bgTransparency'),
            true,
            0,
            100,
        );
        $this->safeCssImage(
            $errors,
            "$prefix.borderImage",
            Arr::get($config, 'borderImage'),
        );
        $this->safeCssImage(
            $errors,
            "$prefix.backgroundImage",
            Arr::get($config, 'backgroundImage'),
        );
        app(BiolinkAssetCatalog::class)->validateCssImageReferences(
            $errors,
            "$prefix.backgroundImage",
            Arr::get($config, 'backgroundImage'),
        );
        app(BiolinkAssetCatalog::class)->validatePath(
            $errors,
            "$prefix.blockStyle",
            Arr::get($config, 'blockStyle'),
            true,
            ['images/block-styles'],
        );
    }

    private function validateCardConfig(array &$errors, mixed $config): void
    {
        $prefix = 'config.cardConfig';
        if (!is_array($config)) {
            $errors[$prefix] = 'The card config value must be an object.';
            return;
        }

        $this->validateAllowedKeys($errors, $prefix, $config, self::CARD_KEYS);
        foreach (
            ['backgroundColor', 'textColor', 'borderColor', 'shadowColor']
            as $key
        ) {
            $this->color(
                $errors,
                "$prefix.$key",
                Arr::get($config, $key),
                true,
            );
        }
        $this->integer(
            $errors,
            "$prefix.transparency",
            Arr::get($config, 'transparency'),
            true,
            0,
            100,
        );
        $this->integer(
            $errors,
            "$prefix.borderWidth",
            Arr::get($config, 'borderWidth'),
            true,
            0,
            8,
        );
        $this->integer(
            $errors,
            "$prefix.radius",
            Arr::get($config, 'radius'),
            true,
            0,
            32,
        );
        $this->enum(
            $errors,
            "$prefix.shadow",
            Arr::get($config, 'shadow'),
            ['none', 'soft', 'strong', 'hard'],
            true,
        );
        $this->enum(
            $errors,
            "$prefix.imagePosition",
            Arr::get($config, 'imagePosition'),
            ['left', 'top'],
            true,
        );
        $this->enum(
            $errors,
            "$prefix.imageSize",
            Arr::get($config, 'imageSize'),
            ['small', 'medium', 'large'],
            true,
        );
        $this->integer(
            $errors,
            "$prefix.imageRadius",
            Arr::get($config, 'imageRadius'),
            true,
            0,
            32,
        );
        $this->boolean(
            $errors,
            "$prefix.showImages",
            Arr::get($config, 'showImages'),
            true,
        );
        $this->boolean(
            $errors,
            "$prefix.showImageFallback",
            Arr::get($config, 'showImageFallback'),
            true,
        );
        $this->enum(
            $errors,
            "$prefix.pricePosition",
            Arr::get($config, 'pricePosition'),
            ['inline', 'right', 'below'],
            true,
        );
        $this->enum(
            $errors,
            "$prefix.actionStyle",
            Arr::get($config, 'actionStyle'),
            ['button', 'icon', 'text'],
            true,
        );
        $this->enum(
            $errors,
            "$prefix.cardVariant",
            Arr::get($config, 'cardVariant'),
            ['standard', 'media', 'compact', 'poster', 'minimal'],
            true,
        );
        if (Arr::has($config, 'fontConfig')) {
            $this->validateFontConfig(
                $errors,
                "$prefix.fontConfig",
                Arr::get($config, 'fontConfig'),
            );
        }
    }

    private function validateFooterConfig(array &$errors, mixed $config): void
    {
        $prefix = 'config.footerConfig';
        if (!is_array($config)) {
            $errors[$prefix] = 'The footer config value must be an object.';
            return;
        }

        $this->validateAllowedKeys(
            $errors,
            $prefix,
            $config,
            self::FOOTER_KEYS,
        );
        $this->integer(
            $errors,
            "$prefix.version",
            Arr::get($config, 'version'),
            true,
            1,
            1,
        );
        $this->boolean(
            $errors,
            "$prefix.enabled",
            Arr::get($config, 'enabled'),
            true,
        );
        $this->enum(
            $errors,
            "$prefix.preset",
            Arr::get($config, 'preset'),
            ['compact', 'community', 'commercial'],
            true,
        );
        $this->enum(
            $errors,
            "$prefix.brandSource",
            Arr::get($config, 'brandSource'),
            ['auto', 'logo', 'avatar'],
            true,
        );
        $this->boolean(
            $errors,
            "$prefix.showPlatformLinks",
            Arr::get($config, 'showPlatformLinks'),
            true,
        );

        $blocks = Arr::get($config, 'blocks');
        if ($blocks !== null) {
            if (!is_array($blocks)) {
                $errors["$prefix.blocks"] =
                    'The footer blocks value must be an object.';
            } else {
                $this->validateAllowedKeys(
                    $errors,
                    "$prefix.blocks",
                    $blocks,
                    self::FOOTER_BLOCK_KEYS,
                );
                foreach (self::FOOTER_BLOCK_KEYS as $block) {
                    $this->boolean(
                        $errors,
                        "$prefix.blocks.$block",
                        Arr::get($blocks, $block),
                        true,
                    );
                }
            }
        }

        $links = Arr::get($config, 'links');
        if ($links === null) {
            return;
        }
        if (!is_array($links)) {
            $errors["$prefix.links"] =
                'The footer links value must be an array.';
            return;
        }
        if (count($links) > 20) {
            $errors["$prefix.links"] = 'At most 20 footer links are allowed.';
        }
        foreach ($links as $index => $link) {
            $path = "$prefix.links.$index";
            if (!is_array($link)) {
                $errors[$path] = 'The footer link must be an object.';
                continue;
            }
            $this->validateAllowedKeys(
                $errors,
                $path,
                $link,
                self::FOOTER_LINK_KEYS,
            );
            $this->string(
                $errors,
                "$path.id",
                Arr::get($link, 'id'),
                60,
                true,
                '/^[a-z0-9_-]+$/i',
            );
            $this->string(
                $errors,
                "$path.label",
                Arr::get($link, 'label'),
                100,
                true,
            );
            $this->enum(
                $errors,
                "$path.source",
                Arr::get($link, 'source'),
                ['url', 'widget'],
                true,
            );
            $this->safeUrl($errors, "$path.url", Arr::get($link, 'url'), true);
            $this->integer(
                $errors,
                "$path.widgetId",
                Arr::get($link, 'widgetId'),
                true,
                1,
            );
            $this->enum(
                $errors,
                "$path.variant",
                Arr::get($link, 'variant'),
                ['link', 'cta'],
                true,
            );
            $this->boolean(
                $errors,
                "$path.active",
                Arr::get($link, 'active'),
                true,
            );
            $this->integer(
                $errors,
                "$path.position",
                Arr::get($link, 'position'),
                true,
                0,
                1000,
            );

            $source = Arr::get($link, 'source', 'url');
            if ($source === 'widget' && !is_int(Arr::get($link, 'widgetId'))) {
                $errors["$path.widgetId"] =
                    'Select a widget for this footer link.';
            }
            if ($source === 'url' && $this->isEmpty(Arr::get($link, 'url'))) {
                $errors["$path.url"] = 'Enter a URL for this footer link.';
            }
        }
    }

    private function validateFontConfig(
        array &$errors,
        string $path,
        mixed $value,
    ): void {
        if (!is_array($value)) {
            $errors[$path] = 'The font config value must be an object.';
            return;
        }

        $this->validateAllowedKeys(
            $errors,
            $path,
            $value,
            self::FONT_INPUT_KEYS,
        );
        $this->string(
            $errors,
            "$path.family",
            Arr::get($value, 'family'),
            255,
            false,
        );
        $family = Arr::get($value, 'family');
        if (
            is_string($family) &&
            preg_match(
                '/[{};<>]|(?:url|expression|javascript)\\s*\\(/i',
                $family,
            )
        ) {
            $errors["$path.family"] =
                'The font family contains unsupported CSS characters.';
        }
        $this->boolean(
            $errors,
            "$path.google",
            Arr::get($value, 'google'),
            true,
        );
    }

    private function validateHeaderConfig(array &$errors, mixed $value): void
    {
        if (!is_array($value)) {
            $errors['config.headerConfig'] =
                'The header config value must be an object.';
            return;
        }

        $this->validateAllowedKeys(
            $errors,
            'config.headerConfig',
            $value,
            self::HEADER_KEYS,
        );
        $this->enum(
            $errors,
            'config.headerConfig.layout',
            Arr::get($value, 'layout'),
            ['classic', 'hero', 'banner', 'cutout', 'shape'],
            true,
        );
        $this->enum(
            $errors,
            'config.headerConfig.alignment',
            Arr::get($value, 'alignment'),
            ['center', 'left', 'left-inline', 'right-inline'],
            true,
        );
        $this->integer(
            $errors,
            'config.headerConfig.avatarSize',
            Arr::get($value, 'avatarSize'),
            true,
            0,
            250,
        );
        $this->integer(
            $errors,
            'config.headerConfig.avatarRadius',
            Arr::get($value, 'avatarRadius'),
            true,
            0,
            100,
        );
        $this->integer(
            $errors,
            'config.headerConfig.avatarBorderWidth',
            Arr::get($value, 'avatarBorderWidth'),
            true,
            0,
            20,
        );
        $this->color(
            $errors,
            'config.headerConfig.avatarBorderColor',
            Arr::get($value, 'avatarBorderColor'),
            true,
        );
        $this->string(
            $errors,
            'config.headerConfig.title',
            Arr::get($value, 'title'),
            100,
            true,
        );
        $this->string(
            $errors,
            'config.headerConfig.bio',
            Arr::get($value, 'bio'),
            160,
            true,
        );
        $this->enum(
            $errors,
            'config.headerConfig.bannerBackgroundType',
            Arr::get($value, 'bannerBackgroundType'),
            ['gradient', 'image'],
            true,
        );
        $this->color(
            $errors,
            'config.headerConfig.bannerGradientFrom',
            Arr::get($value, 'bannerGradientFrom'),
            true,
        );
        $this->color(
            $errors,
            'config.headerConfig.bannerGradientTo',
            Arr::get($value, 'bannerGradientTo'),
            true,
        );
        $this->safeUrl(
            $errors,
            'config.headerConfig.bannerImage',
            Arr::get($value, 'bannerImage'),
        );
        $this->safeUrl(
            $errors,
            'config.headerConfig.image',
            Arr::get($value, 'image'),
        );
        $this->safeUrl(
            $errors,
            'config.headerConfig.logo',
            Arr::get($value, 'logo'),
        );
        $this->enum(
            $errors,
            'config.headerConfig.shapeVariant',
            Arr::get($value, 'shapeVariant'),
            [
                'loop',
                'flower',
                'oval',
                'rounded',
                'burst',
                'capsule',
                'clover',
                'arch',
                'diamond',
                'splash',
                'shield',
                'ticket',
            ],
            true,
        );
        $this->color(
            $errors,
            'config.headerConfig.shapeColor',
            Arr::get($value, 'shapeColor'),
            true,
        );
        $this->enum(
            $errors,
            'config.headerConfig.titleStyle',
            Arr::get($value, 'titleStyle'),
            ['text', 'logo'],
            true,
        );
        $this->boolean(
            $errors,
            'config.headerConfig.alternativeFont',
            Arr::get($value, 'alternativeFont'),
            true,
        );
        $this->color(
            $errors,
            'config.headerConfig.titleColor',
            Arr::get($value, 'titleColor'),
            true,
        );
        $this->boolean(
            $errors,
            'config.headerConfig.showShareButton',
            Arr::get($value, 'showShareButton'),
            true,
        );
        $this->boolean(
            $errors,
            'config.headerConfig.showNavigation',
            Arr::get($value, 'showNavigation'),
            true,
        );
        $this->string(
            $errors,
            'config.headerConfig.locationText',
            Arr::get($value, 'locationText'),
            120,
            true,
        );
        $this->string(
            $errors,
            'config.headerConfig.statusText',
            Arr::get($value, 'statusText'),
            120,
            true,
        );
        $this->validateIntegerList(
            $errors,
            'config.headerConfig.navigationWidgetIds',
            Arr::get($value, 'navigationWidgetIds'),
            20,
        );

        if (Arr::has($value, 'viewerCount')) {
            $viewer = Arr::get($value, 'viewerCount');
            if (!is_array($viewer)) {
                $errors['config.headerConfig.viewerCount'] =
                    'The viewer count config value must be an object.';
            } else {
                $this->validateAllowedKeys(
                    $errors,
                    'config.headerConfig.viewerCount',
                    $viewer,
                    self::VIEWER_COUNT_KEYS,
                );
                $this->boolean(
                    $errors,
                    'config.headerConfig.viewerCount.enabled',
                    Arr::get($viewer, 'enabled'),
                    true,
                );
                $this->color(
                    $errors,
                    'config.headerConfig.viewerCount.color',
                    Arr::get($viewer, 'color'),
                    true,
                );
                if (Arr::has($viewer, 'fontConfig')) {
                    $this->validateFontConfig(
                        $errors,
                        'config.headerConfig.viewerCount.fontConfig',
                        Arr::get($viewer, 'fontConfig'),
                    );
                }
            }
        }

        if (Arr::has($value, 'titleFontConfig')) {
            $this->validateFontConfig(
                $errors,
                'config.headerConfig.titleFontConfig',
                Arr::get($value, 'titleFontConfig'),
            );
        }
    }

    private function validateDesktopConfig(array &$errors, mixed $value): void
    {
        if (!is_array($value)) {
            $errors['config.desktopConfig'] =
                'The desktop config value must be an object.';
            return;
        }

        $this->validateAllowedKeys(
            $errors,
            'config.desktopConfig',
            $value,
            self::DESKTOP_KEYS,
        );
        $this->boolean(
            $errors,
            'config.desktopConfig.enabled',
            Arr::get($value, 'enabled'),
            true,
        );
        $this->enum(
            $errors,
            'config.desktopConfig.layoutMode',
            Arr::get($value, 'layoutMode'),
            ['full', 'split'],
            true,
        );
        $this->enum(
            $errors,
            'config.desktopConfig.contentMode',
            Arr::get($value, 'contentMode'),
            ['stack', 'spotlight', 'columns'],
            true,
        );
        $this->enum(
            $errors,
            'config.desktopConfig.gridMode',
            Arr::get($value, 'gridMode'),
            ['auto', '1', '2', '3'],
            true,
        );
        $this->enum(
            $errors,
            'config.desktopConfig.profilePlacement',
            Arr::get($value, 'profilePlacement'),
            ['center', 'left', 'right'],
            true,
        );
        $this->enum(
            $errors,
            'config.desktopConfig.surfaceMode',
            Arr::get($value, 'surfaceMode'),
            ['open', 'tinted'],
            true,
        );
        $this->decimal(
            $errors,
            'config.desktopConfig.profileOpacity',
            Arr::get($value, 'profileOpacity'),
            true,
            0,
            1,
        );
        $this->integer(
            $errors,
            'config.desktopConfig.profileBlur',
            Arr::get($value, 'profileBlur'),
            true,
            0,
            80,
        );
        $this->color(
            $errors,
            'config.desktopConfig.panelBackgroundColor',
            Arr::get($value, 'panelBackgroundColor'),
            true,
        );
        $this->color(
            $errors,
            'config.desktopConfig.panelTextColor',
            Arr::get($value, 'panelTextColor'),
            true,
        );
        app(BiolinkAssetCatalog::class)->validatePath(
            $errors,
            'config.desktopConfig.decorativeAsset',
            Arr::get($value, 'decorativeAsset'),
            true,
            ['images/3d', 'images/emoji', 'images/scribbbles', 'images/svg'],
        );
        $this->enum(
            $errors,
            'config.desktopConfig.decorativePlacement',
            Arr::get($value, 'decorativePlacement'),
            ['left', 'right', 'background'],
            true,
        );
    }

    private function validateMediaConfig(array &$errors, mixed $value): void
    {
        if (!is_array($value)) {
            $errors['config.mediaConfig'] =
                'The media config value must be an object.';
            return;
        }

        $this->validateAllowedKeys(
            $errors,
            'config.mediaConfig',
            $value,
            self::MEDIA_KEYS,
        );
        $this->enum(
            $errors,
            'config.mediaConfig.backgroundMediaType',
            Arr::get($value, 'backgroundMediaType'),
            ['image', 'video'],
            true,
        );
        $this->safeInternalMediaUrl(
            $errors,
            'config.mediaConfig.backgroundMedia',
            Arr::get($value, 'backgroundMedia'),
            true,
        );
        $this->safeInternalMediaUrl(
            $errors,
            'config.mediaConfig.avatarOverride',
            Arr::get($value, 'avatarOverride'),
            true,
        );
        $this->safeInternalMediaUrl(
            $errors,
            'config.mediaConfig.audio',
            Arr::get($value, 'audio'),
            false,
        );
        if (Arr::has($value, 'audioPrompt')) {
            $prompt = Arr::get($value, 'audioPrompt');
            if (!is_array($prompt)) {
                $errors['config.mediaConfig.audioPrompt'] =
                    'The audio prompt config value must be an object.';
            } else {
                $this->validateAllowedKeys(
                    $errors,
                    'config.mediaConfig.audioPrompt',
                    $prompt,
                    self::AUDIO_PROMPT_KEYS,
                );
                $this->boolean(
                    $errors,
                    'config.mediaConfig.audioPrompt.enabled',
                    Arr::get($prompt, 'enabled'),
                    true,
                );
                $this->string(
                    $errors,
                    'config.mediaConfig.audioPrompt.text',
                    Arr::get($prompt, 'text'),
                    160,
                    true,
                );
                $this->color(
                    $errors,
                    'config.mediaConfig.audioPrompt.textColor',
                    Arr::get($prompt, 'textColor'),
                    true,
                );
                if (Arr::has($prompt, 'fontConfig')) {
                    $this->validateFontConfig(
                        $errors,
                        'config.mediaConfig.audioPrompt.fontConfig',
                        Arr::get($prompt, 'fontConfig'),
                    );
                }
            }
        }
        $this->safeInternalMediaUrl(
            $errors,
            'config.mediaConfig.cursor',
            Arr::get($value, 'cursor'),
            false,
        );
    }

    private function validateEffectsConfig(array &$errors, mixed $value): void
    {
        if (!is_array($value)) {
            $errors['config.effectsConfig'] =
                'The effects config value must be an object.';
            return;
        }

        $this->validateAllowedKeys(
            $errors,
            'config.effectsConfig',
            $value,
            self::EFFECTS_KEYS,
        );
        $this->enum(
            $errors,
            'config.effectsConfig.backgroundEffect',
            Arr::get($value, 'backgroundEffect'),
            [
                'none',
                'stars',
                'aurora',
                'particles',
                'spotlight',
                'snow',
                'rain',
                'tv',
                'blur',
                'night',
                'ambient',
                'big-circles',
                'bubbles',
                'confetti',
                'confetti-cannon',
                'confetti-explosions',
                'confetti-falling',
                'confetti-parade',
                'party',
                'fire',
                'firefly',
                'fireworks',
                'fountain',
                'hyperspace',
                'links',
                'matrix',
                'meteors',
                'ribbons',
                'sea-anemone',
                'squares',
                'triangles',
            ],
            true,
        );
        $this->enum(
            $errors,
            'config.effectsConfig.mediaEffect',
            Arr::get($value, 'mediaEffect'),
            ['none', 'aurora', 'tv', 'blur', 'night', 'spotlight'],
            true,
        );
        $this->enum(
            $errors,
            'config.effectsConfig.particlePreset',
            Arr::get($value, 'particlePreset'),
            [
                'none',
                'stars',
                'particles',
                'snow',
                'rain',
                'ambient',
                'big-circles',
                'bubbles',
                'confetti',
                'confetti-cannon',
                'confetti-explosions',
                'confetti-falling',
                'confetti-parade',
                'party',
                'fire',
                'firefly',
                'fireworks',
                'fountain',
                'hyperspace',
                'links',
                'matrix',
                'meteors',
                'ribbons',
                'sea-anemone',
                'squares',
                'triangles',
            ],
            true,
        );
        $this->integer(
            $errors,
            'config.effectsConfig.particleDensity',
            Arr::get($value, 'particleDensity'),
            true,
            10,
            220,
        );
        $this->decimal(
            $errors,
            'config.effectsConfig.particleSpeed',
            Arr::get($value, 'particleSpeed'),
            true,
            0,
            10,
        );
        $this->boolean(
            $errors,
            'config.effectsConfig.respectReducedMotion',
            Arr::get($value, 'respectReducedMotion'),
            true,
        );
        $this->enum(
            $errors,
            'config.effectsConfig.usernameEffect',
            Arr::get($value, 'usernameEffect'),
            [
                'none',
                'glow',
                'pulse',
                'scanline',
                'rainbow',
                'sparkle',
                'glitch',
                'shimmer',
            ],
            true,
        );
        $this->color(
            $errors,
            'config.effectsConfig.effectColor',
            Arr::get($value, 'effectColor'),
            true,
        );
        $this->color(
            $errors,
            'config.effectsConfig.effectSecondaryColor',
            Arr::get($value, 'effectSecondaryColor'),
            true,
        );
        $this->color(
            $errors,
            'config.effectsConfig.effectTertiaryColor',
            Arr::get($value, 'effectTertiaryColor'),
            true,
        );
        if (Arr::has($value, 'glow')) {
            $glow = Arr::get($value, 'glow');
            if (!is_array($glow)) {
                $errors['config.effectsConfig.glow'] =
                    'The glow config value must be an object.';
            } else {
                $this->validateAllowedKeys(
                    $errors,
                    'config.effectsConfig.glow',
                    $glow,
                    self::GLOW_KEYS,
                );
                $this->boolean(
                    $errors,
                    'config.effectsConfig.glow.enabled',
                    Arr::get($glow, 'enabled'),
                    true,
                );
                $this->enum(
                    $errors,
                    'config.effectsConfig.glow.preset',
                    Arr::get($glow, 'preset'),
                    ['none', 'soft', 'medium', 'strong', 'custom'],
                    true,
                );
                $this->enum(
                    $errors,
                    'config.effectsConfig.glow.source',
                    Arr::get($glow, 'source'),
                    ['primary', 'secondary', 'tertiary', 'block', 'custom'],
                    true,
                );
                $this->color(
                    $errors,
                    'config.effectsConfig.glow.customColor',
                    Arr::get($glow, 'customColor'),
                    true,
                );
                $this->decimal(
                    $errors,
                    'config.effectsConfig.glow.opacity',
                    Arr::get($glow, 'opacity'),
                    true,
                    0,
                    1,
                );
                $this->integer(
                    $errors,
                    'config.effectsConfig.glow.blur',
                    Arr::get($glow, 'blur'),
                    true,
                    0,
                    80,
                );
                $this->integer(
                    $errors,
                    'config.effectsConfig.glow.spread',
                    Arr::get($glow, 'spread'),
                    true,
                    0,
                    32,
                );
                foreach (
                    [
                        'username',
                        'avatar',
                        'widgets',
                        'products',
                        'buttons',
                        'badges',
                        'socialIcons',
                        'inputs',
                        'hoverOnly',
                        'reduceOnMobile',
                    ]
                    as $key
                ) {
                    $this->boolean(
                        $errors,
                        "config.effectsConfig.glow.$key",
                        Arr::get($glow, $key),
                        true,
                    );
                }
            }
        }
        foreach (
            [
                'glowUsername',
                'glowSocials',
                'glowBadges',
                'monochromeSocialIcons',
                'invertBoxes',
                'animatedTitle',
                'showVolumeControl',
            ]
            as $key
        ) {
            $this->boolean(
                $errors,
                "config.effectsConfig.$key",
                Arr::get($value, $key),
                true,
            );
        }
        $this->enum(
            $errors,
            'config.effectsConfig.interactionStyle',
            Arr::get($value, 'interactionStyle'),
            ['lift', 'press', 'quiet'],
            true,
        );
    }

    private function validateBadgeConfig(array &$errors, mixed $value): void
    {
        if (!is_array($value)) {
            $errors['config.badgeConfig'] =
                'The badge config value must be an object.';
            return;
        }

        $this->validateAllowedKeys(
            $errors,
            'config.badgeConfig',
            $value,
            self::BADGE_KEYS,
        );
        $this->enum(
            $errors,
            'config.badgeConfig.style',
            Arr::get($value, 'style'),
            ['inline', 'chips', 'cards', 'icon'],
            true,
        );

        if (!Arr::has($value, 'items')) {
            return;
        }

        if (!is_array(Arr::get($value, 'items'))) {
            $errors['config.badgeConfig.items'] =
                'The badge items value must be an array.';
            return;
        }

        foreach (Arr::get($value, 'items', []) as $index => $item) {
            if (!is_array($item)) {
                $errors["config.badgeConfig.items.$index"] =
                    'The badge item value must be an object.';
                continue;
            }

            $path = "config.badgeConfig.items.$index";
            $this->validateAllowedKeys(
                $errors,
                $path,
                $item,
                self::BADGE_ITEM_KEYS,
            );
            $this->string(
                $errors,
                "$path.id",
                Arr::get($item, 'id'),
                80,
                false,
                '/^[a-z0-9:_-]+$/',
            );
            if (Arr::get($item, 'type') === 'system') {
                $systemBadge = BiolinkSystemBadgeCatalog::find(
                    Arr::get($item, 'id'),
                );
                if (
                    !$systemBadge &&
                    !$this->databaseBadgeDefinitionExists(Arr::get($item, 'id'))
                ) {
                    $errors["$path.id"] =
                        'The selected system badge is not allowed.';
                }
            }
            $this->enum(
                $errors,
                "$path.type",
                Arr::get($item, 'type'),
                ['system', 'custom'],
                false,
            );
            $this->string(
                $errors,
                "$path.label",
                Arr::get($item, 'label'),
                80,
                false,
            );
            $this->string(
                $errors,
                "$path.description",
                Arr::get($item, 'description'),
                180,
                true,
            );
            app(BiolinkAssetCatalog::class)->validatePath(
                $errors,
                "$path.icon",
                Arr::get($item, 'icon'),
                true,
                ['images/svg', 'images/emoji', 'images/3d'],
            );
            $this->validateIconReference(
                $errors,
                "$path.iconRef",
                Arr::get($item, 'iconRef'),
            );
            $this->color(
                $errors,
                "$path.color",
                Arr::get($item, 'color'),
                true,
            );
            $this->enum(
                $errors,
                "$path.iconSize",
                Arr::get($item, 'iconSize'),
                ['small', 'medium', 'large'],
                true,
            );
            $this->integer(
                $errors,
                "$path.editionYear",
                Arr::get($item, 'editionYear'),
                true,
                2000,
                2100,
            );
            $this->boolean(
                $errors,
                "$path.active",
                Arr::get($item, 'active'),
                true,
            );
            $this->integer(
                $errors,
                "$path.sort_order",
                Arr::get($item, 'sort_order'),
                true,
                0,
                1000,
            );
        }
    }

    private function validateSocialConfig(array &$errors, mixed $value): void
    {
        if (!is_array($value)) {
            $errors['config.socialConfig'] =
                'The social config value must be an object.';
            return;
        }

        $this->validateAllowedKeys(
            $errors,
            'config.socialConfig',
            $value,
            self::SOCIAL_CONFIG_KEYS,
        );
        $this->boolean(
            $errors,
            'config.socialConfig.enabled',
            Arr::get($value, 'enabled'),
            true,
        );
        $this->enum(
            $errors,
            'config.socialConfig.mobilePlacement',
            Arr::get($value, 'mobilePlacement'),
            ['header', 'footer', 'hidden'],
            true,
        );
        $this->enum(
            $errors,
            'config.socialConfig.desktopPlacement',
            Arr::get($value, 'desktopPlacement'),
            ['badge', 'footer', 'hidden'],
            true,
        );
        $this->enum(
            $errors,
            'config.socialConfig.style',
            Arr::get($value, 'style'),
            ['icons', 'buttons', 'pills'],
            true,
        );
        $this->enum(
            $errors,
            'config.socialConfig.colorMode',
            Arr::get($value, 'colorMode'),
            ['theme', 'brand', 'monochrome'],
            true,
        );

        if (!Arr::has($value, 'links')) {
            return;
        }

        $links = Arr::get($value, 'links');
        if (!is_array($links)) {
            $errors['config.socialConfig.links'] =
                'The social links value must be an object.';
            return;
        }

        $this->validateAllowedKeys(
            $errors,
            'config.socialConfig.links',
            $links,
            self::SOCIAL_KEYS,
        );

        foreach ($links as $key => $link) {
            if (!in_array($key, self::SOCIAL_KEYS, true)) {
                continue;
            }

            $this->safeSocialValue(
                $errors,
                "config.socialConfig.links.$key",
                $link,
            );
        }
    }

    private function safeSocialValue(
        array &$errors,
        string $path,
        mixed $value,
    ): void {
        if ($this->isEmpty($value)) {
            return;
        }

        if (!is_string($value) || Str::length($value) > 1000) {
            $errors[$path] = 'The social link value is invalid.';
            return;
        }

        $value = trim($value);
        $lower = Str::lower($value);
        if (
            str_starts_with($lower, 'javascript:') ||
            str_starts_with($lower, 'data:') ||
            str_starts_with($lower, '//') ||
            str_contains($lower, '<') ||
            str_contains($lower, '\\') ||
            preg_match('/[\\x00-\\x1F\\x7F]/', $value)
        ) {
            $errors[$path] = 'The social link value is not allowed.';
            return;
        }

        if (preg_match('/^[a-z][a-z0-9+.-]*:/i', $value)) {
            if (
                !filter_var($value, FILTER_VALIDATE_URL) ||
                (!str_starts_with($lower, 'http://') &&
                    !str_starts_with($lower, 'https://') &&
                    !str_starts_with($lower, 'mailto:'))
            ) {
                $errors[$path] = 'The social link URL is invalid.';
            }
            return;
        }

        if (!preg_match('/^[A-Za-z0-9._~%:@?&=+#,;()\-\s+]+$/', $value)) {
            $errors[$path] = 'The social link value is invalid.';
        }
    }

    private function validateAllowedKeys(
        array &$errors,
        string $path,
        array $value,
        array $allowed,
    ): void {
        $unknown = array_values(array_diff(array_keys($value), $allowed));
        if ($unknown) {
            $errors[$path] =
                'Unsupported config keys: ' . implode(', ', $unknown) . '.';
        }
    }

    private function validateIconReference(
        array &$errors,
        string $path,
        mixed $value,
    ): void {
        if ($value === null || $value === '') {
            return;
        }

        if (!is_array($value)) {
            $errors[$path] = 'The icon reference must be an object.';
            return;
        }

        $this->validateAllowedKeys($errors, $path, $value, ['library', 'name']);
        $this->enum($errors, "$path.library", Arr::get($value, 'library'), [
            'lucide',
            'simple-icons',
        ]);
        $this->string(
            $errors,
            "$path.name",
            Arr::get($value, 'name'),
            120,
            false,
            '/^[A-Za-z0-9][A-Za-z0-9 _-]*$/',
        );
    }

    private function databaseBadgeDefinition(
        string|null $key,
    ): BiolinkBadgeDefinition|null {
        if (!$key || !Schema::hasTable('biolink_badge_definitions')) {
            return null;
        }

        return BiolinkBadgeDefinition::query()->where('key', $key)->first();
    }

    private function databaseBadgeDefinitionExists(string|null $key): bool
    {
        return $this->databaseBadgeDefinition($key) !== null;
    }

    private function validateIntegerList(
        array &$errors,
        string $path,
        mixed $value,
        int $max,
    ): void {
        if ($value === null) {
            return;
        }
        if (!is_array($value)) {
            $errors[$path] = 'The value must be an array.';
            return;
        }
        if (count($value) > $max) {
            $errors[$path] = "The value can contain at most $max items.";
            return;
        }
        foreach ($value as $index => $item) {
            $this->integer($errors, "$path.$index", $item, false, 1);
        }
    }

    private function enum(
        array &$errors,
        string $path,
        mixed $value,
        array $allowed,
        bool $nullable = false,
    ): void {
        if ($this->isEmpty($value) && $nullable) {
            return;
        }

        if (!is_string($value) || !in_array($value, $allowed, true)) {
            $errors[$path] = 'The selected value is invalid.';
        }
    }

    private function boolean(
        array &$errors,
        string $path,
        mixed $value,
        bool $nullable = false,
    ): void {
        if ($this->isEmpty($value) && $nullable) {
            return;
        }

        if (!is_bool($value)) {
            $errors[$path] = 'The value must be boolean.';
        }
    }

    private function integer(
        array &$errors,
        string $path,
        mixed $value,
        bool $nullable = false,
        int|null $min = null,
        int|null $max = null,
    ): void {
        if ($this->isEmpty($value) && $nullable) {
            return;
        }

        if (!is_int($value)) {
            $errors[$path] = 'The value must be an integer.';
            return;
        }

        if ($min !== null && $value < $min) {
            $errors[$path] = "The value must be at least $min.";
        }

        if ($max !== null && $value > $max) {
            $errors[$path] = "The value must not be greater than $max.";
        }
    }

    private function decimal(
        array &$errors,
        string $path,
        mixed $value,
        bool $nullable = false,
        float|null $min = null,
        float|null $max = null,
    ): void {
        if ($this->isEmpty($value) && $nullable) {
            return;
        }

        if (!is_int($value) && !is_float($value)) {
            $errors[$path] = 'The value must be a number.';
            return;
        }

        if ($min !== null && $value < $min) {
            $errors[$path] = "The value must be at least $min.";
        }

        if ($max !== null && $value > $max) {
            $errors[$path] = "The value must not be greater than $max.";
        }
    }

    private function string(
        array &$errors,
        string $path,
        mixed $value,
        int $max,
        bool $nullable = false,
        string|null $pattern = null,
    ): void {
        if ($this->isEmpty($value) && $nullable) {
            return;
        }

        if (!is_string($value)) {
            $errors[$path] = 'The value must be a string.';
            return;
        }

        if (Str::length($value) > $max) {
            $errors[
                $path
            ] = "The value must not be greater than $max characters.";
        }

        if ($pattern && !preg_match($pattern, $value)) {
            $errors[$path] = 'The value format is invalid.';
        }
    }

    private function color(
        array &$errors,
        string $path,
        mixed $value,
        bool $nullable = false,
    ): void {
        if ($this->isEmpty($value) && $nullable) {
            return;
        }

        if (
            !is_string($value) ||
            !preg_match(
                '/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/',
                $value,
            )
        ) {
            $errors[$path] = 'The value must be a valid hex color.';
        }
    }

    private function safeCssImage(
        array &$errors,
        string $path,
        mixed $value,
    ): void {
        if ($this->isEmpty($value)) {
            return;
        }

        if (!is_string($value) || Str::length($value) > 1000) {
            $errors[$path] =
                'The value must be a valid background image string.';
            return;
        }

        $lower = Str::lower($value);
        if (
            str_contains($lower, 'javascript:') ||
            str_contains($lower, 'data:') ||
            str_contains($lower, '<')
        ) {
            $errors[$path] = 'The background image value is not allowed.';
            return;
        }

        if (
            str_contains($lower, 'url(') &&
            !preg_match('/url\((["\']?)(https?:\/\/|\/)[^)]+\1\)/i', $value)
        ) {
            $errors[$path] = 'The background image URL is invalid.';
        }
    }

    private function safeUrl(array &$errors, string $path, mixed $value): void
    {
        if ($this->isEmpty($value)) {
            return;
        }

        if (!is_string($value)) {
            $errors[$path] = 'The value must be a valid image URL.';
            return;
        }

        $value = trim($value);
        if ($value === '') {
            return;
        }

        if (Str::length($value) > 1000) {
            $errors[$path] = 'The value must be a valid image URL.';
            return;
        }

        $lower = Str::lower($value);
        if (
            str_starts_with($lower, 'javascript:') ||
            str_starts_with($lower, 'data:') ||
            str_starts_with($lower, '//') ||
            str_contains($lower, '<') ||
            str_contains($lower, '\\') ||
            preg_match('/[\x00-\x1F\x7F]/', $value)
        ) {
            $errors[$path] = 'The image URL is not allowed.';
            return;
        }

        if (preg_match('/^[a-z][a-z0-9+.-]*:/i', $value)) {
            if (
                !filter_var($value, FILTER_VALIDATE_URL) ||
                (!str_starts_with($lower, 'http://') &&
                    !str_starts_with($lower, 'https://'))
            ) {
                $errors[$path] = 'The image URL is invalid.';
            }

            return;
        }

        if (
            !str_starts_with($value, '/') &&
            !preg_match('/^[A-Za-z0-9._~\/%:@?&=+#,;-]+$/', $value)
        ) {
            $errors[$path] = 'The image URL is invalid.';
        }
    }

    private function safeInternalMediaUrl(
        array &$errors,
        string $path,
        mixed $value,
        bool $allowCatalogAsset,
    ): void {
        if ($this->isEmpty($value)) {
            return;
        }

        if (!is_string($value)) {
            $errors[$path] = 'The media URL is invalid.';
            return;
        }

        $value = trim($value);
        $lower = Str::lower(rawurldecode($value));

        if (
            Str::length($value) > 1000 ||
            str_starts_with($lower, 'javascript:') ||
            str_starts_with($lower, 'data:') ||
            str_starts_with($lower, 'http://') ||
            str_starts_with($lower, 'https://') ||
            str_starts_with($lower, '//') ||
            str_contains($lower, '<') ||
            str_contains($lower, '\\') ||
            preg_match('/[\x00-\x1F\x7F]/', $value)
        ) {
            $errors[$path] = 'The media URL is not allowed.';
            return;
        }

        if (str_starts_with($lower, '/images/')) {
            if (
                !$allowCatalogAsset ||
                !app(BiolinkAssetCatalog::class)->isAllowedPath($value)
            ) {
                $errors[$path] = 'The selected media asset is not allowed.';
            }
            return;
        }

        $extension = Str::lower(
            pathinfo(parse_url($value, PHP_URL_PATH) ?: '', PATHINFO_EXTENSION),
        );
        if ($extension === 'svg') {
            $errors[$path] =
                'Raw SVG uploads are not allowed for this media field.';
            return;
        }

        if (
            !str_starts_with($value, '/') &&
            !preg_match('/^[A-Za-z0-9._~\/%:@?&=+#,;-]+$/', $value)
        ) {
            $errors[$path] = 'The media URL is invalid.';
        }
    }

    private function isEmpty(mixed $value): bool
    {
        return $value === null || $value === '';
    }
}
