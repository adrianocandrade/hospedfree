import {
  BiolinkButtonConfig,
  getBiolinkButtonIconColor,
  getBiolinkButtonStyle,
} from '@app/dashboard/biolink/biolink-editor/appearance/biolink-button-style-utils';
import {
  SocialsList,
  SocialsType,
} from '@app/dashboard/biolink/biolink-editor/content/widgets/socials-widget/socials-list';
import {SocialsWidget} from '@app/dashboard/biolink/biolink-editor/content/widgets/socials-widget/socials-widget-dialog';
import {WidgetRendererProps} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-renderer-props';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {cn} from '@ui/utils/cn';
import {isAbsoluteUrl} from '@ui/utils/urls/is-absolute-url';

export function SocialsWidgetRenderer({
  widget,
  variant,
  appearance,
}: WidgetRendererProps<SocialsWidget>) {
  return (
    <SocialLinksRenderer
      config={widget.config}
      variant={variant}
      appearance={appearance}
    />
  );
}

export type SocialLinksConfig = Partial<Record<SocialsType, string>> & {
  style?: 'icons' | 'buttons' | 'pills';
  colorMode?: 'theme' | 'brand' | 'monochrome';
};

export function SocialLinksRenderer({
  config,
  variant = 'biolinkPage',
  appearance,
  className,
}: {
  config: SocialLinksConfig;
  variant?: 'editor' | 'biolinkPage' | 'desktopHeader';
  appearance?: WidgetRendererProps['appearance'];
  className?: string;
}) {
  const {trans} = useTrans();
  const style = config.style ?? 'icons';
  const appearanceColorMode = (
    appearance as
      | {
          socialConfig?: {
            colorMode?: 'theme' | 'brand' | 'monochrome';
          };
        }
      | undefined
  )?.socialConfig?.colorMode;
  const colorMode = config.colorMode ?? appearanceColorMode ?? 'theme';
  const btnConfig = appearance?.btnConfig as BiolinkButtonConfig | undefined;
  const buttonStyle = getBiolinkButtonStyle({btnConfig});
  const hasBlockStyle = !!btnConfig?.blockStyle;
  const iconColor = getBiolinkButtonIconColor({btnConfig});
  const radius = btnConfig?.radius ?? 'rounded-sm';
  const entries = Object.entries(config).filter(
    ([type, uri]) =>
      type !== 'style' &&
      type !== 'colorMode' &&
      !!uri &&
      !!SocialsList[type as SocialsType],
  ) as [SocialsType, string][];

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-y-2',
        className,
        variant === 'editor'
          ? 'mt-1 gap-x-3.5 text-muted-foreground'
          : variant === 'desktopHeader'
            ? 'mt-4 mb-6.5 justify-center gap-2'
            : style === 'buttons'
              ? 'flex-col gap-2'
              : 'justify-center gap-2',
      )}
    >
      {entries.map(([type, uri]) => {
        const social = SocialsList[type];
        const icon = social.icon;
        if (!icon) return null;

        return (
          <div
            key={type}
            className={style === 'buttons' ? 'w-full' : undefined}
          >
            {variant === 'editor' ? (
              icon
            ) : (
              <a
                href={buildUrl(type, uri)}
                className={cn(
                  'relative text-inherit no-underline outline-none focus-visible:ring motion-reduce:transform-none motion-reduce:transition-none',
                  style === 'icons'
                    ? 'flex size-11 items-center justify-center transition-transform duration-300 hover:scale-110 active:scale-95'
                    : 'transition-transform duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.015] active:scale-[0.98]',
                  style === 'icons' && !hasBlockStyle && 'rounded-full',
                  style === 'buttons' &&
                    'flex h-12 w-full items-center justify-center gap-2 px-4 text-sm font-semibold',
                  style === 'pills' &&
                    'flex h-10 min-w-24 items-center justify-center gap-2 px-4 text-sm font-semibold',
                  style === 'pills' && !hasBlockStyle && 'rounded-full',
                  style === 'buttons' && !hasBlockStyle && radius,
                  hasBlockStyle && 'rounded-none',
                )}
                style={{
                  ...buttonStyle,
                  ...(colorMode === 'brand' ? social.brandStyle : null),
                  ...(colorMode === 'monochrome'
                    ? {
                        background: 'transparent',
                        borderColor: 'currentColor',
                        color: 'currentColor',
                      }
                    : null),
                  ...(colorMode === 'theme'
                    ? {color: iconColor ?? buttonStyle.color}
                    : null),
                }}
                aria-label={trans(social.name)}
                target="_blank"
                rel="noreferrer"
              >
                <span className="relative z-10 flex items-center justify-center gap-2 [&>svg]:size-[1.125rem] [&>svg]:shrink-0">
                  {icon}
                  {style !== 'icons' ? <Trans {...social.name} /> : null}
                </span>
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}

function buildUrl(socialsType: SocialsType, uri: string): string {
  if (!uri || isAbsoluteUrl(uri)) {
    return uri;
  }
  // only remove @ from the begging of string (Twitter and Instagram handle for example)
  if (socialsType === SocialsType.Twitter) {
    return `https://twitter.com/${uri.replace('@', '')}`;
  } else if (socialsType === SocialsType.Instagram) {
    return `https://instagram.com/${uri.replace('@', '')}`;
  } else if (socialsType === SocialsType.Tiktok) {
    return `https://tiktok.com/${uri}`;
  } else if (socialsType === SocialsType.Mail) {
    return `mailto:${uri}`;
  } else if (socialsType === SocialsType.Whatsapp) {
    return `https://api.whatsapp.com/send?phone=${uri}`;
  }
  return uri;
}
