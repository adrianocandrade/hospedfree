import type {BiolinkAppearanceConfigBtnConfig} from '@app/gen/schemas/biolink-appearance-config-btn-config';

import type {CSSProperties} from 'react';

export interface BiolinkButtonStyleOverride {
  backgroundColor?: string | null;
  textColor?: string | null;
  borderColor?: string | null;
  iconColor?: string | null;
}

export type BiolinkButtonConfig = Omit<
  BiolinkAppearanceConfigBtnConfig,
  'shadow' | 'variant'
> & {
  borderColor?: string | null;
  iconColor?: string | null;
  shadowColor?: string | null;
  backgroundImage?: string | null;
  borderImage?: string | null;
  blockStyle?: string | null;
  cornerWidth?: number | null;
  borderWidth?: number | null;
  bgTransparency?: number | null;
  shadow?:
    | BiolinkAppearanceConfigBtnConfig['shadow']
    | 'neon'
    | 'inset'
    | 'spread'
    | 'double'
    | 'glow';
  variant?: BiolinkAppearanceConfigBtnConfig['variant'];
};

export const availableBiolinkButtonShadows: Record<string, string> = {
  none: '',
  soft: 'rgb(0 0 0 / 20%) 0.2rem 0.2rem 0.4rem 0px',
  strong: 'rgb(0 0 0 / 30%) 0.3rem 0.3rem 0.4rem 0px',
  hard: 'rgb(0 0 0 / 75%) 0.3rem 0.4rem 0px',
  neon: '0 0 8px currentColor, 0 0 20px currentColor',
  inset: 'inset 3px 3px 6px rgba(0,0,0,0.25)',
  spread: '0 12px 35px rgba(0,0,0,0.15)',
  double: '4px 4px 0 currentColor, 8px 8px 0 currentColor',
  glow: '0 5px 30px currentColor',
} as const;

export function getBiolinkButtonStyle({
  btnConfig,
  override,
}: {
  btnConfig?: BiolinkButtonConfig | null;
  override?: BiolinkButtonStyleOverride | null;
}): CSSProperties {
  const variant = btnConfig?.variant ?? 'solid';
  const shadow = btnConfig?.shadow ?? undefined;

  // Base colors
  let buttonColor = override?.backgroundColor || btnConfig?.color || undefined;
  const textColor = override?.textColor || btnConfig?.textColor || undefined;
  let borderColor =
    override?.borderColor || btnConfig?.borderColor || undefined;
  const shadowColor = btnConfig?.shadowColor || undefined;

  // Layout values
  const cornerWidth =
    typeof btnConfig?.cornerWidth === 'number'
      ? btnConfig.cornerWidth
      : undefined;
  const borderWidth =
    typeof btnConfig?.borderWidth === 'number'
      ? btnConfig.borderWidth
      : undefined;
  const bgTransparency =
    typeof btnConfig?.bgTransparency === 'number'
      ? btnConfig.bgTransparency
      : undefined;

  const blockStyle = btnConfig?.blockStyle || undefined;
  const hasBlockStyle = !!blockStyle;

  // Apply transparency to background color if provided (0-100)
  if (buttonColor && bgTransparency !== undefined) {
    const rgb = parseHexColor(buttonColor);
    if (rgb) {
      const alpha = Math.max(0, Math.min(100, 100 - bgTransparency)) / 100;
      buttonColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    }
  }

  // Legacy BlockStyle Handling
  if (hasBlockStyle && blockStyle.includes('border-')) {
    return {
      ...getBlockStyleDecoration({
        blockStyle,
        buttonColor,
      }),
      color: textColor,
      background: buttonColor,
      backdropFilter: undefined,
      borderImage: undefined,
      borderStyle: 'solid',
    };
  }

  const css: CSSProperties = {
    color: textColor,
    background: buttonColor,
    borderColor: borderColor,
  };

  if (cornerWidth !== undefined) {
    css.borderRadius = `${cornerWidth}px`;
  } else if (variant === 'pill') {
    css.borderRadius = '9999px';
  } else {
    // Legacy mapping
    const legacyRadius = btnConfig?.radius ?? 'rounded-sm';
    if (legacyRadius === 'rounded-full') css.borderRadius = '9999px';
    if (legacyRadius === 'rounded-lg') css.borderRadius = '0.5rem';
    if (legacyRadius === 'rounded-none') css.borderRadius = '0px';
  }

  if (borderWidth !== undefined) {
    css.borderWidth = `${borderWidth}px`;
    css.borderStyle = 'solid';
  }

  if (shadowColor) {
    css.boxShadow = `4px 4px 0 ${shadowColor}`;
  } else if (shadow && shadow in availableBiolinkButtonShadows) {
    css.boxShadow = availableBiolinkButtonShadows[shadow];
  }

  // Advanced CSS layout styles based on new variants
  switch (variant) {
    case 'outline':
    case 'outline-shadow':
      css.background = 'transparent';
      css.borderColor = borderColor || buttonColor;
      if (borderWidth === undefined) {
        css.borderWidth = '2px';
        css.borderStyle = 'solid';
      }
      break;
    case 'dashed':
      css.background = 'transparent';
      css.borderColor = borderColor || buttonColor;
      css.borderStyle = 'dashed';
      if (borderWidth === undefined) css.borderWidth = '2px';
      break;
    case 'underline':
      css.background = 'transparent';
      css.borderColor = borderColor || buttonColor;
      css.borderStyle = 'solid';
      css.borderWidth = '0 0 2px 0';
      if (borderWidth !== undefined) css.borderWidth = `0 0 ${borderWidth}px 0`;
      css.borderRadius = '0';
      break;
    case 'top-bottom-line':
      css.background = 'transparent';
      css.borderColor = borderColor || buttonColor;
      css.borderStyle = 'solid';
      css.borderWidth = '2px 0';
      if (borderWidth !== undefined) css.borderWidth = `${borderWidth}px 0`;
      css.borderRadius = '0';
      break;
    case 'cut-corner':
      css.borderRadius = '0';
      css.clipPath = `polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)`;
      break;
    case 'glass':
      css.borderColor = !override?.borderColor ? 'transparent' : borderColor;
      css.backdropFilter = 'blur(20px) brightness(1.1) contrast(0.9)';
      css.background =
        btnConfig?.backgroundImage ??
        'linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%), rgba(255, 255, 255, 0.1)';
      break;
  }

  // Custom Background Image overriding
  if (btnConfig?.backgroundImage && variant !== 'glass') {
    css.background = btnConfig.backgroundImage;
  }

  return css;
}

export function getBiolinkButtonIconColor({
  btnConfig,
  override,
}: {
  btnConfig?: BiolinkButtonConfig | null;
  override?: BiolinkButtonStyleOverride | null;
}): string | undefined {
  return (
    override?.iconColor ||
    btnConfig?.iconColor ||
    override?.textColor ||
    btnConfig?.textColor ||
    undefined
  );
}

function getBlockStyleDecoration({
  blockStyle,
  buttonColor,
}: {
  blockStyle: string;
  buttonColor?: string;
}): CSSProperties {
  const frameColor = buttonColor
    ? readableTone(buttonColor, 0.36)
    : 'currentColor';
  const shadowColor = buttonColor
    ? darkenTone(buttonColor, 0.5)
    : 'rgb(0 0 0 / 70%)';
  const softShadowColor = buttonColor
    ? darkenTone(buttonColor, 0.28)
    : 'rgb(0 0 0 / 45%)';
  const highlightColor = buttonColor
    ? lightenTone(buttonColor, 0.22)
    : 'rgb(255 255 255 / 32%)';

  if (blockStyle.includes('border-double')) {
    return {
      borderColor: frameColor,
      borderWidth: 2,
      boxShadow: `inset 0 0 0 4px ${buttonColor ?? 'transparent'}, inset 0 0 0 6px ${frameColor}, 4px 4px 0 ${shadowColor}`,
    };
  }

  if (blockStyle.includes('border-pixel')) {
    return {
      borderColor: frameColor,
      borderWidth: 3,
      boxShadow: `4px 4px 0 ${shadowColor}`,
      clipPath:
        'polygon(8px 0, calc(100% - 8px) 0, calc(100% - 8px) 4px, 100% 4px, 100% calc(100% - 4px), calc(100% - 8px) calc(100% - 4px), calc(100% - 8px) 100%, 8px 100%, 8px calc(100% - 4px), 0 calc(100% - 4px), 0 4px, 8px 4px)',
    };
  }

  return {
    borderColor: frameColor,
    borderWidth: 2,
    boxShadow: `inset 3px 3px 0 ${highlightColor}, inset -4px -4px 0 ${softShadowColor}, 4px 4px 0 ${shadowColor}`,
  };
}

export function assetUsesMask(path?: string | null): boolean {
  return !!path && /\.svg(?:$|\?)/i.test(path);
}

type Rgb = {r: number; g: number; b: number};

function readableTone(color: string, amount: number): string {
  const rgb = parseHexColor(color);

  if (!rgb) {
    return color;
  }

  return rgbToCss(mixRgb(rgb, luminance(rgb) > 0.55 ? black : white, amount));
}

function lightenTone(color: string, amount: number): string {
  return mixTone(color, white, amount);
}

function darkenTone(color: string, amount: number): string {
  return mixTone(color, black, amount);
}

function mixTone(color: string, target: Rgb, amount: number): string {
  const rgb = parseHexColor(color);

  if (!rgb) {
    return color;
  }

  return rgbToCss(mixRgb(rgb, target, amount));
}

function parseHexColor(color: string): Rgb | null {
  const value = color.trim();
  const short = /^#([0-9a-f]{3})$/i.exec(value);
  const full = /^#([0-9a-f]{6})$/i.exec(value);

  if (short) {
    const [r, g, b] = short[1].split('').map(part => parseInt(part + part, 16));
    return {r, g, b};
  }

  if (full) {
    const hex = full[1];
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }

  if (color.startsWith('rgb')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
      };
    }
  }

  return null;
}

const white: Rgb = {r: 255, g: 255, b: 255};
const black: Rgb = {r: 0, g: 0, b: 0};

function mixRgb(from: Rgb, to: Rgb, amount: number): Rgb {
  return {
    r: Math.round(from.r + (to.r - from.r) * amount),
    g: Math.round(from.g + (to.g - from.g) * amount),
    b: Math.round(from.b + (to.b - from.b) * amount),
  };
}

function rgbToCss({r, g, b}: Rgb): string {
  return `rgb(${r} ${g} ${b})`;
}

function luminance({r, g, b}: Rgb): number {
  return [r, g, b]
    .map(channel => {
      const normalized = channel / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    })
    .reduce(
      (sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index],
      0,
    );
}
