<?php

use App\Biolinks\Models\BiolinkTheme;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    public function up(): void
    {
        foreach ($this->themes() as $theme) {
            BiolinkTheme::query()->updateOrCreate(
                ['slug' => $theme['slug']],
                [
                    'name' => $theme['name'],
                    'category' => 'curated',
                    'config' => $theme['config'],
                    'sort_order' => $theme['sort_order'],
                    'is_published' => true,
                    'is_system' => true,
                    'created_by' => null,
                ],
            );
        }
    }

    public function down(): void
    {
        BiolinkTheme::query()
            ->whereIn('slug', ['soft-profile', 'cartoon-gold', 'dark-food'])
            ->delete();
    }

    private function themes(): array
    {
        return [
            [
                'name' => 'Soft Profile',
                'slug' => 'soft-profile',
                'sort_order' => 420,
                'config' => [
                    'theme' => [
                        'slug' => 'soft-profile',
                        'category' => 'curated',
                        'locked' => true,
                        'modified' => false,
                    ],
                    'bgConfig' => [
                        'activeType' => 'image',
                        'backgroundColor' => '#EFF8F2',
                        'backgroundImage' => 'url(/images/pattern/pattern-7.svg)',
                        'backgroundRepeat' => 'repeat',
                        'backgroundSize' => '220px',
                        'backgroundPosition' => 'center',
                        'color' => '#24352A',
                    ],
                    'btnConfig' => [
                        'variant' => 'solid',
                        'radius' => 'rounded-full',
                        'shadow' => 'soft',
                        'color' => '#5F9C74',
                        'textColor' => '#FFFFFF',
                        'borderColor' => '#4B825F',
                        'iconColor' => '#FFFFFF',
                    ],
                    'fontConfig' => [
                        'family' => 'IBM Plex Mono',
                        'google' => true,
                    ],
                    'headerConfig' => [
                        'layout' => 'classic',
                        'titleStyle' => 'text',
                        'alternativeFont' => false,
                        'titleColor' => '#24352A',
                        'image' => '/images/emoji/Yellow-1/Happy.png',
                        'bannerBackgroundType' => 'gradient',
                    ],
                    'customCss' => '
.linkbio-theme-soft-profile .biolink-layout-container::before {
    content: ""; position: fixed; top: 12%; left: max(18px, calc(50% - 420px)); width: 86px; height: 86px; background: url(/images/scribbbles/14.png) center / contain no-repeat; opacity: .16; z-index: 1; pointer-events: none;
}
.linkbio-theme-soft-profile .biolink-layout-container::after {
    content: ""; position: fixed; right: max(18px, calc(50% - 420px)); bottom: 10%; width: 96px; height: 96px; background: url(/images/scribbbles/21.png) center / contain no-repeat; opacity: .14; z-index: 1; pointer-events: none;
}
',
                ],
            ],
            [
                'name' => 'Cartoon Gold',
                'slug' => 'cartoon-gold',
                'sort_order' => 430,
                'config' => [
                    'theme' => [
                        'slug' => 'cartoon-gold',
                        'category' => 'curated',
                        'locked' => true,
                        'modified' => false,
                    ],
                    'bgConfig' => [
                        'activeType' => 'color',
                        'backgroundColor' => '#FFF7DF',
                        'color' => '#1F2937',
                    ],
                    'btnConfig' => [
                        'variant' => 'solid',
                        'radius' => 'rounded-lg',
                        'shadow' => 'hard',
                        'color' => '#E5C14A',
                        'textColor' => '#FFFFFF',
                        'borderColor' => '#C6941B',
                        'iconColor' => '#FFFFFF',
                        'blockStyle' => '/images/block-styles/border-double.png',
                    ],
                    'fontConfig' => [
                        'family' => 'Playfair Display',
                        'google' => true,
                    ],
                    'headerConfig' => [
                        'layout' => 'classic',
                        'titleStyle' => 'text',
                        'alternativeFont' => false,
                        'titleColor' => '#1F2937',
                        'image' => '/images/emoji/Yellow-1/StarEyes.png',
                        'bannerBackgroundType' => 'gradient',
                    ],
                    'customCss' => '
.linkbio-theme-cartoon-gold .biolink-panel-group {
    background: #FFF2CF; border-radius: 28px; padding: 22px; margin-top: 26px;
}
.linkbio-theme-cartoon-gold .biolink-btn-custom:active {
    transform: translate(3px, 3px); box-shadow: none !important;
}
',
                ],
            ],
            [
                'name' => 'Dark Food',
                'slug' => 'dark-food',
                'sort_order' => 440,
                'config' => [
                    'theme' => [
                        'slug' => 'dark-food',
                        'category' => 'curated',
                        'locked' => true,
                        'modified' => false,
                    ],
                    'bgConfig' => [
                        'activeType' => 'image',
                        'backgroundColor' => '#050505',
                        'backgroundImage' => 'url(/images/pattern/pattern-26.svg)',
                        'backgroundRepeat' => 'repeat',
                        'backgroundSize' => '260px',
                        'backgroundPosition' => 'center',
                        'color' => '#F9FAFB',
                        'tint' => 32,
                    ],
                    'btnConfig' => [
                        'variant' => 'solid',
                        'radius' => 'rounded-sm',
                        'shadow' => 'hard',
                        'color' => '#FBBF24',
                        'textColor' => '#111111',
                        'borderColor' => '#F97316',
                        'iconColor' => '#111111',
                    ],
                    'fontConfig' => [
                        'family' => 'Inter',
                        'google' => true,
                    ],
                    'headerConfig' => [
                        'layout' => 'banner',
                        'titleStyle' => 'text',
                        'alternativeFont' => false,
                        'titleColor' => '#F9FAFB',
                        'bannerBackgroundType' => 'gradient',
                        'bannerGradientFrom' => '#1F1F1F',
                        'bannerGradientTo' => '#F97316',
                    ],
                    'customCss' => '
.linkbio-theme-dark-food .biolink-panel-group {
    background: rgb(255 255 255 / .04); border: 1px solid rgb(255 255 255 / .08); border-radius: 18px; padding: 18px;
}
.linkbio-theme-dark-food .biolink-btn-custom:hover {
    filter: brightness(1.05);
}
',
                ],
            ],
        ];
    }
};
