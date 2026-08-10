import {
  AppearanceConfig,
  backgroundTextColor,
  bannerBackgroundStyle,
  boolValue,
  defaultButtonConfig,
  isBannerLayout,
} from '@app/dashboard/biolink/biolink-editor/appearance/biolink-theme-utils';
import type {BiolinkTheme} from '@app/gen/schemas/biolink-theme';
import {cssPropsFromBgConfig} from '@common/background-selector/utils/css-props-from-bg-config';
import {Button} from '@shadcn/button/button';
import {Tooltip} from '@shadcn/tooltip/tooltip';
import {Trans} from '@ui/i18n/trans';
import {cn} from '@ui/utils/cn';
import {CheckIcon, LockIcon, PaintbrushIcon, SparklesIcon} from 'lucide-react';
import {CSSProperties, ReactNode} from 'react';

interface ThemePreviewCardProps {
  label: ReactNode;
  config?: AppearanceConfig;
  active?: boolean;
  locked?: boolean;
  onClick?: () => void;
  custom?: boolean;
  disabled?: boolean;
  className?: string;
  previewImage?: string;
  isPro?: boolean;
}

export function ThemePreviewCard({
  active,
  className,
  config,
  custom,
  disabled,
  label,
  locked,
  onClick,
  previewImage,
  isPro,
}: ThemePreviewCardProps) {
  const bgConfig = config?.bgConfig;
  const btnConfig = {
    ...defaultButtonConfig,
    ...config?.btnConfig,
  };
  const headerConfig = config?.headerConfig;
  const textColor = backgroundTextColor(bgConfig);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'group flex min-w-0 flex-col items-center gap-2 text-center text-xs outline-none disabled:pointer-events-none disabled:opacity-60',
        className,
      )}
    >
      <span
        className={cn(
          'relative isolate flex aspect-[0.78] w-full max-w-27 overflow-hidden rounded-card border bg-card text-start shadow-sm transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-primary',
          active && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        )}
        style={
          custom
            ? undefined
            : ({
                ...cssPropsFromBgConfig(bgConfig as never),
                color: textColor,
              } as CSSProperties)
        }
      >
        {custom ? (
          <span className="m-auto rounded-full border p-3 text-muted-foreground">
            <PaintbrushIcon className="size-5" />
          </span>
        ) : previewImage ? (
          <img
            src={previewImage}
            alt=""
            className="size-full object-cover"
            loading="lazy"
            draggable={false}
          />
        ) : (
          <span className="relative flex size-full flex-col justify-between p-3">
            {isBannerLayout(headerConfig?.layout) ? (
              <span
                className="absolute inset-x-2 top-2 h-8 rounded-card-sm"
                style={bannerBackgroundStyle(headerConfig, bgConfig)}
              />
            ) : null}
            <span
              className="relative font-serif text-2xl leading-none"
              style={{color: headerConfig?.titleColor || textColor}}
            >
              Aa
            </span>
            <span
              className={cn(
                'h-8 w-full border',
                btnConfig.radius,
                btnConfig.variant === 'glass' && 'backdrop-blur-md',
              )}
              style={{
                background:
                  btnConfig.variant === 'solid'
                    ? btnConfig.color
                    : btnConfig.variant === 'glass'
                      ? 'rgb(255 255 255 / 0.18)'
                      : 'transparent',
                borderColor:
                  btnConfig.variant === 'glass'
                    ? 'transparent'
                    : btnConfig.color,
              }}
            />
          </span>
        )}
        {locked ? (
          <span className="absolute top-2 right-2 rounded-full bg-black/45 p-1 text-white">
            <LockIcon className="size-3.5" />
          </span>
        ) : null}
        {active ? (
          <span className="absolute right-2 bottom-2 rounded-full bg-primary p-1 text-primary-foreground">
            <CheckIcon className="size-3.5" />
          </span>
        ) : null}
        {isPro ? (
          <span className="absolute top-2 left-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm uppercase tracking-wider">
            Pro
          </span>
        ) : null}
      </span>
      <span className="max-w-27 text-balance text-foreground">{label}</span>
    </button>
  );
}

export function ThemeCardFromTheme({
  active,
  className,
  onClick,
  theme,
}: {
  active?: boolean;
  className?: string;
  onClick?: () => void;
  theme: BiolinkTheme;
}) {
  const locked =
    theme.category === 'curated' || boolValue(theme.config?.theme?.locked);
  const isPro = theme.metadata?.requiredFeatures?.includes('premium_models') || false;

  return (
    <ThemePreviewCard
      active={active}
      className={className}
      config={theme.config as AppearanceConfig}
      label={theme.name}
      locked={locked}
      previewImage={theme.metadata?.previewImage}
      isPro={isPro}
      onClick={onClick}
    />
  );
}

export function CuratedLockTooltip() {
  const {Root: TooltipRoot, Trigger: TooltipTrigger, Content: TooltipContent} = Tooltip;
  return (
    <TooltipRoot>
      <TooltipTrigger
        render={
          <div className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 backdrop-blur-md text-white shadow-sm ring-1 ring-white/10">
            <LockIcon className="w-3.5 h-3.5" />
          </div>
        }
      />
      <TooltipContent>
        <Trans message="Este tema é curado pelo sistema e não pode ser editado. Duplique-o se quiser fazer alterações." />
      </TooltipContent>
    </TooltipRoot>
  );
}
