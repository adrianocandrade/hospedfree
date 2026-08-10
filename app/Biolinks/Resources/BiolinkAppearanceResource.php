<?php

namespace App\Biolinks\Resources;

use App\Biolinks\Models\BiolinkAppearance;
use App\Biolinks\Support\BiolinkBadgeService;
use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin BiolinkAppearance
 */
#[SchemaName('BiolinkAppearance')]
class BiolinkAppearanceResource extends JsonResource
{
    public function __construct(
        mixed $resource,
        protected int|null $ownerId = null,
    ) {
        parent::__construct($resource);
    }

    public function toArray($request): array
    {
        $config = app(BiolinkBadgeService::class)->filterAppearanceConfig(
            $this->config ?? [],
            $this->ownerId,
        );

        return [
            'id' => $this->id,
            /**
             * @var array{
             *   theme?: array{
             *     slug?: string,
             *     category?: 'customizable'|'curated',
             *     locked?: bool,
             *     modified?: bool
             *   },
             *   bgConfig?: array{
             *     activeType?: 'color'|'pattern'|'gradient'|'image',
             *     backgroundColor?: string,
             *     backgroundAttachment?: 'scroll'|'fixed'|'local'|'initial'|'inherit'|string,
             *     backgroundSize?: 'auto'|'cover'|'contain'|'initial'|'inherit'|string,
             *     backgroundRepeat?: 'repeat'|'no-repeat'|'repeat-x'|'repeat-y'|string,
             *     backgroundPosition?: string,
             *     backgroundImage?: string,
             *     color?: string,
             *     tint?: int,
             *     noise?: bool,
             *     imageEffect?: 'mono'|'blur'|'halftone',
             *     patternFrontColor?: string,
             *     patternSize?: int
             *   },
             *   btnConfig?: array{
             *     variant?: 'outline'|'solid'|'glass'|'outline-shadow'|'dashed'|'underline'|'top-bottom-line'|'cut-corner'|'pill',
             *     radius?: 'rounded-none'|'rounded-sm'|'rounded-lg'|'rounded-full',
             *     shadow?: 'none'|'soft'|'strong'|'hard'|'neon'|'inset'|'spread'|'double'|'glow',
             *     color?: string,
             *     textColor?: string,
             *     borderColor?: string,
             *     iconColor?: string,
             *     shadowColor?: string,
             *     actionBtnColor?: string,
             *     actionBtnTextColor?: string,
             *     borderWidth?: int,
             *     cornerWidth?: int,
             *     bgTransparency?: int,
             *     borderImage?: string,
             *     backgroundImage?: string,
             *     blockStyle?: string
             *   },
             *   boxConfig?: array{
             *     variant?: 'outline'|'solid'|'glass'|'outline-shadow'|'dashed'|'underline'|'top-bottom-line'|'cut-corner'|'pill',
             *     radius?: 'rounded-none'|'rounded-sm'|'rounded-lg'|'rounded-full',
             *     shadow?: 'none'|'soft'|'strong'|'hard'|'neon'|'inset'|'spread'|'double'|'glow',
             *     color?: string,
             *     textColor?: string,
             *     borderColor?: string,
             *     iconColor?: string,
             *     shadowColor?: string,
             *     borderWidth?: int,
             *     cornerWidth?: int,
             *     bgTransparency?: int,
             *     borderImage?: string,
             *     backgroundImage?: string,
             *     blockStyle?: string
             *   },
             *   cardConfig?: array{
             *     backgroundColor?: string,
             *     textColor?: string,
             *     borderColor?: string,
             *     transparency?: int,
             *     borderWidth?: int,
             *     shadow?: 'none'|'soft'|'strong'|'hard',
             *     shadowColor?: string,
             *     radius?: int,
             *     fontConfig?: array{family: string, google?: bool},
             *     imagePosition?: 'left'|'top',
             *     imageSize?: 'small'|'medium'|'large',
             *     imageRadius?: int,
             *     showImages?: bool,
             *     showImageFallback?: bool,
             *     pricePosition?: 'inline'|'right'|'below',
             *     actionStyle?: 'button'|'icon'|'text',
             *     cardVariant?: 'standard'|'media'|'compact'|'poster'|'minimal'
             *   },
             *   fontConfig?: array{
             *     family: string,
             *     google?: bool
             *   },
             *   headerConfig?: array{
             *     layout?: 'classic'|'hero'|'banner'|'cutout'|'shape',
             *     alignment?: 'center'|'left'|'left-inline'|'right-inline',
             *     avatarSize?: int,
             *     avatarRadius?: int,
             *     avatarBorderWidth?: int,
             *     avatarBorderColor?: string,
             *     title?: string,
             *     bio?: string,
             *     bannerBackgroundType?: 'gradient'|'image',
             *     bannerGradientFrom?: string,
             *     bannerGradientTo?: string,
             *     bannerImage?: string,
             *     image?: string,
             *     logo?: string,
             *     shapeVariant?: 'loop'|'flower'|'oval'|'rounded'|'burst'|'capsule'|'clover'|'arch'|'diamond'|'splash'|'shield'|'ticket',
             *     shapeColor?: string,
             *     titleStyle?: 'text'|'logo',
             *     alternativeFont?: bool,
             *     titleFontConfig?: array{family: string, google?: bool},
             *     titleColor?: string,
             *     showShareButton?: bool,
             *     showNavigation?: bool,
             *     navigationWidgetIds?: array<int, int>,
             *     locationText?: string,
             *     statusText?: string,
             *     viewerCount?: array{enabled?: bool, color?: string, fontConfig?: array{family: string, google?: bool}}
             *   },
             *   desktopConfig?: array{
             *     enabled?: bool,
             *     layoutMode?: 'full'|'split',
             *     contentMode?: 'stack'|'spotlight'|'columns',
             *     gridMode?: 'auto'|'1'|'2'|'3',
             *     profilePlacement?: 'center'|'left'|'right',
             *     surfaceMode?: 'open'|'tinted',
             *     profileOpacity?: float,
             *     profileBlur?: int,
             *     panelBackgroundColor?: string,
             *     panelTextColor?: string,
             *     decorativeAsset?: string,
             *     decorativePlacement?: 'left'|'right'|'background'
             *   },
             *   mediaConfig?: array{
             *     backgroundMedia?: string,
             *     backgroundMediaType?: 'image'|'video',
             *     avatarOverride?: string,
             *     audio?: string,
             *     audioPrompt?: array{
             *       enabled?: bool,
             *       text?: string,
             *       textColor?: string,
             *       fontConfig?: array{family: string, google?: bool}
             *     },
             *     cursor?: string
             *   },
             *   effectsConfig?: array{
             *     backgroundEffect?: 'none'|'stars'|'aurora'|'particles'|'spotlight'|'snow'|'rain'|'tv'|'blur'|'night'|'ambient'|'big-circles'|'bubbles'|'confetti'|'confetti-cannon'|'confetti-explosions'|'confetti-falling'|'confetti-parade'|'party'|'fire'|'firefly'|'fireworks'|'fountain'|'hyperspace'|'links'|'matrix'|'meteors'|'ribbons'|'sea-anemone'|'squares'|'triangles',
             *     mediaEffect?: 'none'|'aurora'|'tv'|'blur'|'night'|'spotlight',
             *     particlePreset?: 'none'|'stars'|'particles'|'snow'|'rain'|'ambient'|'big-circles'|'bubbles'|'confetti'|'confetti-cannon'|'confetti-explosions'|'confetti-falling'|'confetti-parade'|'party'|'fire'|'firefly'|'fireworks'|'fountain'|'hyperspace'|'links'|'matrix'|'meteors'|'ribbons'|'sea-anemone'|'squares'|'triangles',
             *     particleDensity?: int,
             *     particleSpeed?: float,
             *     respectReducedMotion?: bool,
             *     usernameEffect?: 'none'|'glow'|'pulse'|'scanline'|'rainbow'|'sparkle'|'glitch'|'shimmer',
             *     effectColor?: string,
             *     effectSecondaryColor?: string,
             *     effectTertiaryColor?: string,
             *     glow?: array{
             *       enabled?: bool,
             *       preset?: 'none'|'soft'|'medium'|'strong'|'custom',
             *       source?: 'primary'|'secondary'|'tertiary'|'block'|'custom',
             *       customColor?: string,
             *       opacity?: float,
             *       blur?: int,
             *       spread?: int,
             *       username?: bool,
             *       avatar?: bool,
             *       widgets?: bool,
             *       products?: bool,
             *       buttons?: bool,
             *       badges?: bool,
             *       socialIcons?: bool,
             *       inputs?: bool,
             *       hoverOnly?: bool,
             *       reduceOnMobile?: bool
             *     },
             *     glowUsername?: bool,
             *     glowSocials?: bool,
             *     glowBadges?: bool,
             *     monochromeSocialIcons?: bool,
             *     invertBoxes?: bool,
             *     animatedTitle?: bool,
             *     showVolumeControl?: bool,
             *     interactionStyle?: 'lift'|'press'|'quiet'
             *   },
             *   badgeConfig?: array{
             *     style?: 'inline'|'chips'|'cards'|'icon',
             *     items?: array<int, array{
             *       id: string,
             *       type: 'system'|'custom',
             *       label: string,
             *       description?: string,
             *       icon?: string,
             *       iconRef?: array{library: 'lucide'|'simple-icons', name: string},
             *       color?: string,
             *       iconSize?: 'small'|'medium'|'large',
             *       editionYear?: int,
             *       active?: bool,
             *       sort_order?: int
             *     }>
             *   },
             *   socialConfig?: array{
             *     enabled?: bool,
             *     mobilePlacement?: 'header'|'footer'|'hidden',
             *     desktopPlacement?: 'badge'|'footer'|'hidden',
             *     style?: 'icons'|'buttons'|'pills',
             *     colorMode?: 'theme'|'brand'|'monochrome',
             *     links?: array<string, string>
             *   },
             *   footerConfig?: array{
             *     version?: 1,
             *     enabled?: bool,
             *     preset?: 'compact'|'community'|'commercial',
             *     brandSource?: 'auto'|'logo'|'avatar',
             *     blocks?: array{
             *       brand?: bool,
             *       navigation?: bool,
             *       socials?: bool,
             *       cta?: bool,
             *       backToTop?: bool
             *     },
             *     showPlatformLinks?: bool,
             *     links?: array<int, array{
             *       id?: string,
             *       label?: string,
             *       source?: 'url'|'widget',
             *       url?: string,
             *       widgetId?: int,
             *       variant?: 'link'|'cta',
             *       active?: bool,
             *       position?: int
             *     }>
             *   },
             *   hideBranding?: bool,
             *   customCss?: string
             * }
             */
            'config' => $config,
        ];
    }
}
