import {
  BiolinkButtonConfig,
  getBiolinkButtonStyle,
} from '@app/dashboard/biolink/biolink-editor/appearance/biolink-button-style-utils';
import {BiolinkAppearanceConfig} from '@app/gen/schemas/biolink-appearance-config';
import {cn} from '@ui/utils/cn';
import {ComponentProps, CSSProperties} from 'react';

type SurfaceOverride = {
  boxBackgroundColor?: string | null;
  boxTextColor?: string | null;
  section?: {
    presentation?: 'contained' | 'open';
  };
};

type Props = Omit<ComponentProps<'section'>, 'style'> & {
  appearance?: BiolinkAppearanceConfig | null;
  config?: object | null;
  style?: CSSProperties;
};

const outlineVariants = new Set([
  'outline',
  'outline-shadow',
  'dashed',
  'underline',
  'top-bottom-line',
]);

export function BiolinkWidgetSurface({
  appearance,
  config,
  className,
  style,
  ...props
}: Props) {
  const open =
    (config as SurfaceOverride | null | undefined)?.section?.presentation ===
    'open';
  const surfaceConfig = resolveSurfaceConfig(appearance, config);
  const variant = surfaceConfig?.variant ?? 'solid';
  const hasBackgroundColor = !!surfaceConfig?.color;
  const hasTextColor = !!surfaceConfig?.textColor;
  const isOutline = outlineVariants.has(String(variant));
  const surfaceColor = surfaceConfig?.color;
  const surfaceRadius = resolveSurfaceRadius(surfaceConfig);
  const surfaceItemStyle = {
    ...(open ? {} : getBiolinkButtonStyle({btnConfig: surfaceConfig})),
    ...style,
    '--biolink-widget-radius': surfaceRadius,
    '--biolink-surface-item-background': surfaceColor
      ? `color-mix(in srgb, ${surfaceColor} 78%, black)`
      : 'rgb(0 0 0 / 0.18)',
    '--biolink-surface-item-hover-background': surfaceColor
      ? `color-mix(in srgb, ${surfaceColor} 68%, black)`
      : 'rgb(0 0 0 / 0.26)',
    '--biolink-surface-item-border': surfaceColor
      ? `color-mix(in srgb, ${surfaceColor} 62%, black)`
      : 'rgb(0 0 0 / 0.28)',
  } as CSSProperties;

  return (
    <section
      className={cn(
        'biolink-widget-box biolink-widget-surface w-full min-w-0 overflow-hidden border p-4 text-inherit backdrop-blur-sm @2xl:p-5',
        normalizedRadius(surfaceConfig),
        !surfaceConfig && 'border-current/15 bg-current/[0.055]',
        surfaceConfig &&
          !hasBackgroundColor &&
          (isOutline
            ? 'border-primary bg-transparent'
            : 'border-primary bg-primary'),
        surfaceConfig &&
          !hasTextColor &&
          (isOutline ? 'text-primary' : 'text-primary-foreground'),
        open &&
          '!overflow-visible !border-0 !bg-transparent !px-0 !py-2.5 !text-inherit !shadow-none !backdrop-blur-none',
        className,
      )}
      style={surfaceItemStyle}
      {...props}
    />
  );
}

function resolveSurfaceConfig(
  appearance?: BiolinkAppearanceConfig | null,
  config?: object | null,
): BiolinkButtonConfig | undefined {
  const override = (config ?? {}) as SurfaceOverride;
  const explicitBoxConfig = appearance?.boxConfig as
    | BiolinkButtonConfig
    | undefined;
  const source = explicitBoxConfig
    ? explicitBoxConfig
    : adaptLegacyButtonConfigForSurface(
        appearance?.btnConfig as BiolinkButtonConfig | undefined,
      );

  if (!source && !override.boxBackgroundColor && !override.boxTextColor) {
    return undefined;
  }

  return {
    ...(source ?? {}),
    ...(override.boxBackgroundColor
      ? {color: override.boxBackgroundColor}
      : {}),
    ...(override.boxTextColor ? {textColor: override.boxTextColor} : {}),
  };
}

// Older themes only have button styling. Keep their palette, but use a readable
// solid card surface instead of stretching button-only outline, pill and
// decorative frame treatments around a multi-row widget section.
function adaptLegacyButtonConfigForSurface(
  config?: BiolinkButtonConfig,
): BiolinkButtonConfig | undefined {
  if (!config) return undefined;

  return {
    ...config,
    blockStyle: undefined,
    backgroundImage: undefined,
    borderImage: undefined,
    radius: config.radius === 'rounded-full' ? 'rounded-lg' : config.radius,
    variant: 'solid',
  };
}

function normalizedRadius(config?: BiolinkButtonConfig): string {
  if (config?.cornerWidth !== undefined) {
    return '';
  }

  switch (config?.radius) {
    case 'rounded-none':
      return 'rounded-none';
    case 'rounded-sm':
      return 'rounded-sm';
    case 'rounded-full':
      return 'rounded-full';
    case 'rounded-lg':
    default:
      return 'rounded-lg';
  }
}

function resolveSurfaceRadius(config?: BiolinkButtonConfig): string {
  if (
    config?.blockStyle ||
    config?.variant === 'underline' ||
    config?.variant === 'top-bottom-line' ||
    config?.variant === 'cut-corner'
  ) {
    return '0px';
  }

  if (typeof config?.cornerWidth === 'number') {
    return `${config.cornerWidth}px`;
  }

  if (config?.variant === 'pill' || config?.radius === 'rounded-full') {
    return '9999px';
  }

  switch (config?.radius) {
    case 'rounded-none':
      return '0px';
    case 'rounded-sm':
      return 'var(--radius-sm)';
    case 'rounded-lg':
    default:
      return 'var(--radius-lg)';
  }
}
