import type {BiolinkAppearanceConfig} from '@app/gen/schemas/biolink-appearance-config';
import type {BiolinkAppearanceConfigBgConfig} from '@app/gen/schemas/biolink-appearance-config-bg-config';
import type {BiolinkAppearanceConfigBtnConfig} from '@app/gen/schemas/biolink-appearance-config-btn-config';
import type {BiolinkAppearanceConfigFontConfig} from '@app/gen/schemas/biolink-appearance-config-font-config';
import type {BiolinkAppearanceConfigHeaderConfig} from '@app/gen/schemas/biolink-appearance-config-header-config';
import type {BiolinkAppearanceConfigEffectsConfigGlowPreset} from '@app/gen/schemas/biolink-appearance-config-effects-config-glow-preset';
import type {BiolinkTheme} from '@app/gen/schemas/biolink-theme';
import type {CSSProperties} from 'react';

export type AppearanceConfig = BiolinkAppearanceConfig;
export type ThemeCategory =
  | 'customizable'
  | 'curated'
  | 'user'
  | 'community'
  | 'starred'
  | 'mine';
export type PersistedThemeCategory = Exclude<ThemeCategory, 'starred' | 'mine'>;
export type HeaderLayout = NonNullable<
  BiolinkAppearanceConfigHeaderConfig['layout']
>;
export type DesktopConfig = {
  enabled?: boolean;
  layoutMode?: 'full' | 'split';
  contentMode?: 'stack' | 'spotlight' | 'columns';
  gridMode?: 'auto' | '1' | '2' | '3';
  profilePlacement?: 'center' | 'left' | 'right';
  surfaceMode?: 'open' | 'tinted';
  profileOpacity?: number;
  profileBlur?: number;
  panelBackgroundColor?: string;
  panelTextColor?: string;
  decorativeAsset?: string;
  decorativePlacement?: 'left' | 'right' | 'background';
};
export type MediaConfig = {
  backgroundMedia?: string;
  backgroundMediaType?: 'image' | 'video';
  avatarOverride?: string;
  audio?: string;
  audioPrompt?: AudioPromptConfig;
  cursor?: string;
};
export type AudioPromptConfig = {
  enabled?: boolean;
  text?: string;
  textColor?: string;
  fontConfig?: {family: string; google?: boolean};
};
export type BackgroundEffect =
  | 'none'
  | 'stars'
  | 'aurora'
  | 'particles'
  | 'spotlight'
  | 'snow'
  | 'rain'
  | 'tv'
  | 'blur'
  | 'night'
  | 'ambient'
  | 'big-circles'
  | 'bubbles'
  | 'confetti'
  | 'confetti-cannon'
  | 'confetti-explosions'
  | 'confetti-falling'
  | 'confetti-parade'
  | 'party'
  | 'fire'
  | 'firefly'
  | 'fireworks'
  | 'fountain'
  | 'hyperspace'
  | 'links'
  | 'matrix'
  | 'meteors'
  | 'ribbons'
  | 'sea-anemone'
  | 'squares'
  | 'triangles';
export type MediaEffect =
  | 'none'
  | 'aurora'
  | 'tv'
  | 'blur'
  | 'night'
  | 'spotlight';
export type ParticlePreset = Exclude<
  BackgroundEffect,
  'none' | 'aurora' | 'spotlight' | 'tv' | 'blur' | 'night'
>;
export type EffectsConfig = {
  backgroundEffect?: BackgroundEffect;
  mediaEffect?: MediaEffect;
  particlePreset?: ParticlePreset | 'none';
  particleDensity?: number;
  particleSpeed?: number;
  respectReducedMotion?: boolean;
  usernameEffect?:
    | 'none'
    | 'glow'
    | 'pulse'
    | 'scanline'
    | 'rainbow'
    | 'sparkle'
    | 'glitch'
    | 'shimmer';
  effectColor?: string;
  effectSecondaryColor?: string;
  effectTertiaryColor?: string;
  glow?: GlowConfig;
  glowUsername?: boolean;
  glowSocials?: boolean;
  glowBadges?: boolean;
  monochromeSocialIcons?: boolean;
  invertBoxes?: boolean;
  animatedTitle?: boolean;
  showVolumeControl?: boolean;
  interactionStyle?: 'lift' | 'press' | 'quiet';
};
export type GlowConfig = {
  enabled?: boolean;
  preset?: BiolinkAppearanceConfigEffectsConfigGlowPreset;
  source?: 'primary' | 'secondary' | 'tertiary' | 'block' | 'custom';
  customColor?: string;
  opacity?: number;
  blur?: number;
  spread?: number;
  username?: boolean;
  avatar?: boolean;
  widgets?: boolean;
  products?: boolean;
  buttons?: boolean;
  badges?: boolean;
  socialIcons?: boolean;
  inputs?: boolean;
  hoverOnly?: boolean;
  reduceOnMobile?: boolean;
};
export type BadgeConfig = {
  style?: 'inline' | 'chips' | 'cards' | 'icon';
  items?: BadgeConfigItem[];
};
export type BadgeConfigItem = {
  id: string;
  type: 'system' | 'custom';
  label: string;
  description?: string;
  icon?: string;
  iconRef?: BiolinkIconRef;
  color?: string;
  iconSize?: 'small' | 'medium' | 'large';
  editionYear?: number;
  active?: boolean;
  sort_order?: number;
};
export type BiolinkIconRef = {
  library: 'lucide' | 'simple-icons';
  name: string;
};
export type AdvancedAppearanceConfig = Omit<
  AppearanceConfig,
  'desktopConfig' | 'mediaConfig' | 'effectsConfig' | 'badgeConfig'
> & {
  desktopConfig?: DesktopConfig;
  mediaConfig?: MediaConfig;
  effectsConfig?: EffectsConfig;
  badgeConfig?: BadgeConfig;
};
export type HeaderShapeVariant =
  | 'loop'
  | 'flower'
  | 'oval'
  | 'rounded'
  | 'burst'
  | 'capsule'
  | 'clover'
  | 'arch'
  | 'diamond'
  | 'splash'
  | 'shield'
  | 'ticket';

export const defaultHeaderShapeVariant: HeaderShapeVariant = 'loop';
export const headerShapeVariants: HeaderShapeVariant[] = [
  'loop',
  'flower',
  'oval',
  'rounded',
  'burst',
];

const headerShapePaths: Record<HeaderShapeVariant, string> = {
  loop: 'M0 49.4C0 18.6 20.5 0.6 43.6 8.3C64.1 14.7 84.6 7.1 92.3 30.1C100 53.2 82.1 81.4 56.4 90.4C32.1 99.4 0 80.1 0 49.4Z',
  flower:
    'M47.6 0C57.1 14.3 76.2 8.3 83.3 23.8C100 28.6 95.2 47.6 81 54.8C95.2 66.7 88.1 85.7 71.4 83.3C64.3 100 45.2 95.2 40.5 78.6C26.2 90.5 9.5 78.6 16.7 61.9C0 54.8 4.8 33.3 23.8 33.3C23.8 14.3 40.5 14.3 47.6 0Z',
  oval: 'M50 2.4C78.6 2.4 100 23.8 100 50C100 76.2 78.6 97.6 50 97.6C21.4 97.6 0 76.2 0 50C0 23.8 21.4 2.4 50 2.4Z',
  rounded:
    'M13.2 0H86.8C94.7 0 100 5.3 100 13.2V86.8C100 94.7 94.7 100 86.8 100H13.2C5.3 100 0 94.7 0 86.8V13.2C0 5.3 5.3 0 13.2 0Z',
  burst:
    'M50 0C57.1 15.3 70 5.9 73.5 23.5C90 15.3 87.6 32.9 99.4 36.5C82.9 45.9 99.4 57.6 82.9 64.7C90 81.2 72.4 77.6 66.5 95.3C55.9 83.5 44.1 100 37.1 82.4C20.6 90.6 24.1 71.8 6.5 68.2C20.6 57.6 0.6 47.1 18.2 40C11.2 22.4 31.2 27.1 35.9 7.1C41.8 21.2 47.6 14.1 50 0Z',
  capsule:
    'M28 18H72C86 18 96 32 96 50C96 68 86 82 72 82H28C14 82 4 68 4 50C4 32 14 18 28 18Z',
  clover:
    'M50 18C60 3 82 12 76 32C96 28 97 54 78 58C92 72 74 94 58 78C52 98 25 88 34 68C14 76 4 50 24 44C8 30 32 8 50 18Z',
  arch: 'M18 88V48C18 24 32 10 50 10C68 10 82 24 82 48V88H18Z',
  diamond:
    'M50 6C58 20 80 42 94 50C80 58 58 80 50 94C42 80 20 58 6 50C20 42 42 20 50 6Z',
  splash:
    'M48 6C58 12 64 4 70 18C82 16 82 30 92 36C82 44 96 55 82 62C88 76 72 74 66 88C56 78 44 96 38 80C24 88 28 70 14 66C24 56 6 46 22 40C16 24 34 30 38 12C42 22 45 10 48 6Z',
  shield:
    'M50 8C63 18 78 16 86 22V46C86 66 68 82 50 94C32 82 14 66 14 46V22C22 16 37 18 50 8Z',
  ticket:
    'M18 16H82C82 26 90 30 96 34V66C90 70 82 74 82 84H18C18 74 10 70 4 66V34C10 30 18 26 18 16Z',
};

export const defaultHeaderConfig: BiolinkAppearanceConfigHeaderConfig = {
  layout: 'classic',
  titleStyle: 'text',
  alternativeFont: false,
  titleColor: '#111111',
  bannerBackgroundType: 'gradient',
};

export const defaultButtonConfig: BiolinkAppearanceConfigBtnConfig = {
  variant: 'solid',
  radius: 'rounded-sm',
  shadow: 'none',
  color: '#111111',
  textColor: '#ffffff',
};

export const defaultDesktopConfig: DesktopConfig = {
  enabled: false,
  layoutMode: 'full',
  contentMode: 'spotlight',
  gridMode: 'auto',
  profilePlacement: 'center',
  surfaceMode: 'open',
  profileOpacity: 0.9,
  profileBlur: 12,
  panelBackgroundColor: undefined,
  panelTextColor: undefined,
  decorativePlacement: 'right',
};

export const defaultMediaConfig: MediaConfig = {
  backgroundMediaType: 'image',
  audioPrompt: {
    enabled: true,
    text: 'Clique para ativar a música',
  },
};

export const defaultEffectsConfig: EffectsConfig = {
  backgroundEffect: 'none',
  mediaEffect: 'none',
  particlePreset: 'none',
  particleDensity: 70,
  particleSpeed: 1,
  respectReducedMotion: true,
  usernameEffect: 'none',
  effectColor: '#ffffff',
  effectSecondaryColor: '#6ee7b7',
  effectTertiaryColor: '#3b82f6',
  glow: {
    enabled: false,
    preset: 'soft',
    source: 'primary',
    opacity: 0.24,
    blur: 18,
    spread: 1,
    avatar: true,
    widgets: false,
    products: false,
    buttons: false,
    badges: true,
    socialIcons: true,
    inputs: false,
    hoverOnly: false,
    reduceOnMobile: true,
  },
  glowUsername: false,
  glowSocials: false,
  glowBadges: false,
  monochromeSocialIcons: false,
  invertBoxes: false,
  animatedTitle: false,
  showVolumeControl: false,
};

export const defaultBadgeConfig: BadgeConfig = {
  style: 'chips',
  items: [],
};

export function boolValue(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true';
}

const legacyMediaEffects: MediaEffect[] = [
  'aurora',
  'tv',
  'blur',
  'night',
  'spotlight',
];

export function resolvedMediaEffect(
  effects?: EffectsConfig | null,
): MediaEffect {
  if (effects?.mediaEffect) {
    return effects.mediaEffect;
  }

  return legacyMediaEffects.includes(effects?.backgroundEffect as MediaEffect)
    ? (effects?.backgroundEffect as MediaEffect)
    : 'none';
}

export function resolvedParticlePreset(
  effects?: EffectsConfig | null,
): ParticlePreset | 'none' {
  if (effects?.particlePreset) {
    return effects.particlePreset;
  }

  const legacy = effects?.backgroundEffect;
  return legacy && !legacyMediaEffects.includes(legacy as MediaEffect)
    ? (legacy as ParticlePreset)
    : 'none';
}

export function themeCategory(theme: BiolinkTheme): PersistedThemeCategory {
  const category = theme.category as PersistedThemeCategory;
  return ['customizable', 'curated', 'user', 'community'].includes(category)
    ? category
    : 'customizable';
}

export function isThemeLocked(appearance?: AppearanceConfig | null): boolean {
  return boolValue(appearance?.theme?.locked);
}

export function themeConfig(theme: BiolinkTheme): AppearanceConfig {
  const category = themeCategory(theme);

  return {
    ...(theme.config as AppearanceConfig),
    theme: {
      slug: theme.slug,
      category: category === 'curated' ? 'curated' : 'customizable',
      locked: category === 'curated',
      modified: false,
    },
  };
}

export function applyThemeToAppearance(
  theme: BiolinkTheme,
  current: AppearanceConfig,
): AppearanceConfig {
  const next = themeConfig(theme);
  const currentHeader = current.headerConfig ?? {};
  const nextFooter = next.footerConfig;
  const currentFooter = current.footerConfig;
  const nextSocials = next.socialConfig;
  const currentSocials = current.socialConfig;

  return {
    ...current,
    ...next,
    headerConfig: compactHeaderConfig({
      ...next.headerConfig,
      title: currentHeader.title,
      bio: currentHeader.bio,
      image: currentHeader.image,
      logo: currentHeader.logo,
      titleStyle: currentHeader.titleStyle ?? next.headerConfig?.titleStyle,
      showNavigation:
        currentHeader.showNavigation ?? next.headerConfig?.showNavigation,
      navigationWidgetIds:
        currentHeader.navigationWidgetIds ??
        next.headerConfig?.navigationWidgetIds,
    }),
    footerConfig:
      nextFooter || currentFooter
        ? {
            ...currentFooter,
            ...nextFooter,
            links: currentFooter?.links ?? nextFooter?.links,
          }
        : undefined,
    socialConfig:
      nextSocials || currentSocials
        ? {
            ...currentSocials,
            ...nextSocials,
            links: currentSocials?.links ?? nextSocials?.links,
          }
        : undefined,
  };
}

export function unlockThemeForCustomization(
  current: AppearanceConfig,
): AppearanceConfig {
  return {
    ...current,
    theme: {
      slug: current.theme?.slug ?? 'custom',
      category: 'customizable',
      locked: false,
      modified: true,
    },
  };
}

export function compactFontConfig(
  value?: BiolinkAppearanceConfigFontConfig | null,
): BiolinkAppearanceConfigFontConfig | undefined {
  if (!value?.family) {
    return undefined;
  }

  return value.google === undefined
    ? {family: value.family}
    : {family: value.family, google: value.google};
}

export function mergeHeaderConfig(
  current: AppearanceConfig,
  partial: Partial<BiolinkAppearanceConfigHeaderConfig>,
): AppearanceConfig {
  return {
    headerConfig: compactHeaderConfig({
      ...defaultHeaderConfig,
      ...current.headerConfig,
      ...partial,
    }),
  };
}

export function backgroundTextColor(
  bgConfig?: BiolinkAppearanceConfigBgConfig,
): string {
  return bgConfig?.color || '#111111';
}

export function isBannerLayout(layout?: string): boolean {
  return layout === 'banner';
}

export function isShapeLayout(layout?: string): boolean {
  return layout === 'shape';
}

export function normalizeHeaderShapeVariant(
  value?: string | null,
): HeaderShapeVariant {
  return headerShapeVariants.includes(value as HeaderShapeVariant)
    ? (value as HeaderShapeVariant)
    : defaultHeaderShapeVariant;
}

export function headerShapePath(variant?: string | null): string {
  return headerShapePaths[normalizeHeaderShapeVariant(variant)];
}

export function bannerGradientFrom(
  header?: BiolinkAppearanceConfigHeaderConfig,
  bgConfig?: BiolinkAppearanceConfigBgConfig,
): string {
  return (
    header?.bannerGradientFrom ||
    header?.titleColor ||
    bgConfig?.color ||
    '#ffffff'
  );
}

export function bannerGradientTo(
  header?: BiolinkAppearanceConfigHeaderConfig,
  bgConfig?: BiolinkAppearanceConfigBgConfig,
): string {
  return (
    header?.bannerGradientTo ||
    bgConfig?.backgroundColor ||
    bgConfig?.color ||
    '#111111'
  );
}

export function bannerBackgroundStyle(
  header?: BiolinkAppearanceConfigHeaderConfig,
  bgConfig?: BiolinkAppearanceConfigBgConfig,
): CSSProperties {
  const bannerImage = resolveImageUrl(header?.bannerImage);

  if (header?.bannerBackgroundType === 'image' && bannerImage) {
    return {
      backgroundImage: `linear-gradient(180deg, rgb(0 0 0 / 0.18), rgb(0 0 0 / 0.04)), url("${escapeCssUrl(bannerImage)}")`,
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
    };
  }

  return {
    backgroundImage: `linear-gradient(135deg, ${bannerGradientFrom(header, bgConfig)} 0%, ${bannerGradientTo(header, bgConfig)} 100%)`,
  };
}

export function resolveImageUrl(value?: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  if (/^(https?:|blob:)/i.test(value) || value.startsWith('/')) {
    return value;
  }

  return `/${value.replace(/^\/+/, '')}`;
}

function escapeCssUrl(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function compactHeaderConfig(
  value: BiolinkAppearanceConfigHeaderConfig,
): BiolinkAppearanceConfigHeaderConfig {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as BiolinkAppearanceConfigHeaderConfig;
}
