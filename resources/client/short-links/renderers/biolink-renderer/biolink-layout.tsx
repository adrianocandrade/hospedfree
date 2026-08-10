import {WidgetRenderers} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-renderers';
import {WidgetEngagementTracker} from '@app/short-links/renderers/biolink-renderer/widget-engagement-tracker';
import {BiolinkPublicHeaderActions} from '@app/short-links/renderers/biolink-renderer/biolink-public-header-actions';
import {
  AdvancedAppearanceConfig,
  bannerBackgroundStyle,
  defaultDesktopConfig,
  defaultEffectsConfig,
  defaultMediaConfig,
  EffectsConfig,
  GlowConfig,
  headerShapePath,
  normalizeHeaderShapeVariant,
  resolveImageUrl,
  resolvedMediaEffect,
  resolvedParticlePreset,
} from '@app/dashboard/biolink/biolink-editor/appearance/biolink-theme-utils';
import {
  BiolinkButtonStyleOverride,
  assetUsesMask,
  getBiolinkButtonIconColor,
  getBiolinkButtonStyle,
} from '@app/dashboard/biolink/biolink-editor/appearance/biolink-button-style-utils';
import {SocialConfig} from '@app/dashboard/biolink/biolink-editor/content/widgets/socials-widget/socials-config';
import {SocialLinksRenderer} from '@app/dashboard/biolink/biolink-editor/content/widgets/socials-widget/socials-widget-renderer';
import {
  getBiolinkPlaceholderUrl,
  useResilientImageSources,
} from '@app/dashboard/biolink/biolink-editor/content/widgets/biolink-media-placeholder';
import {Biolink} from '@app/gen/schemas/biolink';
import {BiolinkAppearanceConfig} from '@app/gen/schemas/biolink-appearance-config';
import {BiolinkAppearanceConfigHeaderConfig} from '@app/gen/schemas/biolink-appearance-config-header-config';
import {BiolinkAppearanceConfigBtnConfig} from '@app/gen/schemas/biolink-appearance-config-btn-config';
import {BiolinkLink} from '@app/gen/schemas/biolink-link';
import {validateLinkPasswordOptions} from '@app/dashboard/links/links-queries';
import {AdHost} from '@common/admin/ads/ad-host';
import {onFormQueryError} from '@common/http/errors/on-form-query-error';
import {
  getImageBackgroundEffectStyle,
  ImageBackgroundEffectOverlay,
} from '@common/background-selector/image-background-effect';
import {NoiseFilter} from '@common/background-selector/images/noise-filter';
import {
  cssPropsFromBgConfig,
  getBgTintStyle,
} from '@common/background-selector/utils/css-props-from-bg-config';
import type {FontConfig} from '@ui/fonts/font-picker/font-config';
import {Button} from '@shadcn/button/button';
import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Input} from '@shadcn/forms/input/input';
import {loadFonts} from '@ui/fonts/font-picker/load-fonts';
import {Trans} from '@ui/i18n/trans';
import {message} from '@ui/i18n/message';
import {useTrans} from '@ui/i18n/use-trans';
import {useSettings} from '@ui/settings/use-settings';
import {cn} from '@ui/utils/cn';
import {useMutation} from '@tanstack/react-query';
import {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  ReactElement,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import {useForm} from 'react-hook-form';
import {Link} from 'react-router';
import {
  PauseIcon,
  PlayIcon,
  Volume2Icon,
  EyeIcon,
  LockIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  MapPinIcon,
} from 'lucide-react';
import * as SimpleIcons from '@icons-pack/react-simple-icons';
import * as LucideIcons from 'lucide-react';
import type {ISourceOptions} from '@tsparticles/engine';
import {ComponentType, createElement} from 'react';

interface BiolinkLayoutProps {
  biolink: Biolink;
  appearance?: BiolinkAppearanceConfig | null;
  content?: Biolink['content'];
  className?: string;
  enableLinkAnimations?: boolean;
  showAds?: boolean;
  isPreview?: boolean;
  renderMode?: 'mobile' | 'desktop';
}

type BiolinkContentItem = NonNullable<Biolink['content']>[number];

export function BiolinkLayout({
  biolink,
  className,
  appearance,
  content,
  enableLinkAnimations,
  showAds,
  isPreview = false,
  renderMode,
}: BiolinkLayoutProps) {
  if (!appearance) {
    appearance = biolink.appearance?.config ?? null;
  }
  if (!content) {
    content = biolink.content || [];
  }

  useEffect(() => {
    const id = isPreview ? 'biolink-preview-fonts' : 'biolink-fonts';
    const audioPromptFont = (appearance as AdvancedAppearanceConfig | null)
      ?.mediaConfig?.audioPrompt?.fontConfig;
    const fonts = [
      appearance?.fontConfig,
      appearance?.headerConfig?.alternativeFont
        ? appearance?.headerConfig?.titleFontConfig
        : null,
      audioPromptFont,
    ].filter((font): font is FontConfig => !!font);

    if (fonts.length) {
      void loadFonts(fonts, {
        id,
        forceAssetLoad: isPreview,
        weights: [400, 500, 600, 700],
      }).catch(() => {
        // Keep the system fallback when a remote font cannot be loaded.
      });
    }
  }, [
    appearance?.fontConfig,
    appearance?.headerConfig?.alternativeFont,
    appearance?.headerConfig?.titleFontConfig,
    (appearance as AdvancedAppearanceConfig | null)?.mediaConfig?.audioPrompt
      ?.fontConfig,
    isPreview,
  ]);

  useEffect(() => {
    const hasAnimations = content.some(
      item => item.model_type === 'link' && item.animation,
    );
    if (enableLinkAnimations && hasAnimations) {
      import('@app/dashboard/biolink/biolink-editor/content/link-content-item/animate.min.css');
    }
  }, [enableLinkAnimations, content]);

  const advancedAppearance = appearance as AdvancedAppearanceConfig | null;
  const forcedDesktop = renderMode === 'desktop';
  const forcedMobile = renderMode === 'mobile';
  const desktopEnabled =
    forcedDesktop ||
    (!forcedMobile && !!advancedAppearance?.desktopConfig?.enabled);
  const fixedSocialConfig = getFixedSocialConfig(advancedAppearance);
  const themedButtonStyle = getBiolinkButtonStyle({
    btnConfig: appearance?.btnConfig,
  });

  return (
    <div className="@container">
      <div
        className={cn(
          'biolink-layout-container isolate',
          appearance?.theme?.slug && `linkbio-theme-${appearance.theme.slug}`,
          effectClassNames(advancedAppearance),
          className,
        )}
        id="biolink-page-top"
        style={
          {
            fontFamily: appearance?.fontConfig?.family,
            ...effectVariables(advancedAppearance),
            ...cursorStyle(advancedAppearance),
            '--biolink-theme-button-background': themedButtonStyle.background,
            '--biolink-theme-button-color': themedButtonStyle.color,
            '--biolink-theme-button-border': themedButtonStyle.borderColor,
          } as CSSProperties
        }
      >
        {appearance?.customCss && (
          <style dangerouslySetInnerHTML={{__html: appearance.customCss}} />
        )}
        <EffectStyles appearance={advancedAppearance} />
        {desktopEnabled ? (
          <DesktopBiolinkLayout
            appearance={advancedAppearance}
            biolink={biolink}
            content={content}
            showAds={showAds}
            isPreview={isPreview}
            forceDesktop={forcedDesktop}
          />
        ) : null}
        {!forcedDesktop ? (
          <div
            className={cn(
              'fixed inset-0 z-1 hidden after:absolute after:inset-0 after:bg-black/20 after:backdrop-blur-sm @2xl:block',
              forcedMobile && '@2xl:hidden',
              !forcedMobile && desktopEnabled && '@2xl:hidden',
            )}
          >
            <Background appearance={appearance} />
          </div>
        ) : null}

        <div
          className={cn(
            'relative z-2 mx-auto min-h-screen max-w-2xl overflow-hidden @2xl:min-h-[calc(100vh-2.5rem)] @2xl:rounded-t-card @2xl:shadow-2xl',
            forcedDesktop && 'hidden',
            desktopEnabled && '@2xl:hidden',
          )}
          style={{
            color: appearance?.bgConfig?.color,
          }}
        >
          <Background className="z-3" appearance={appearance} />
          <VisualEffectsOverlay appearance={advancedAppearance} />
          <ParticleEffectLayer appearance={advancedAppearance} />
          <AudioControl appearance={advancedAppearance} isPreview={isPreview} />

          <div className="relative z-4 flex flex-col p-6">
            <div className="flex-auto">
              {showAds && <AdHost slot="biolink_top" className="mb-15" />}
              <BiolinkHeader
                biolink={biolink}
                appearance={appearance}
                isPreview={isPreview}
              />
              <HeaderViewerCount
                appearance={advancedAppearance}
                biolink={biolink}
                isPreview={isPreview}
              />
              {!richFooterOwnsSocials(appearance) ? (
                <FixedSocialLinks
                  appearance={advancedAppearance}
                  config={fixedSocialConfig}
                  device="mobile"
                  placement="header"
                />
              ) : null}
              <BiolinkBadges appearance={advancedAppearance} />
              <BiolinkContentList
                appearance={appearance}
                content={content}
                biolink={biolink}
                isPreview={isPreview}
              />
              {!richFooterOwnsSocials(appearance) ? (
                <FixedSocialLinks
                  appearance={advancedAppearance}
                  config={fixedSocialConfig}
                  device="mobile"
                  placement="footer"
                />
              ) : null}
            </div>
            <BiolinkFooter
              appearance={appearance}
              biolink={biolink}
              content={content}
              socialConfig={fixedSocialConfig}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function isBiolinkContentItemVisible(item: BiolinkContentItem): boolean {
  if (!item.active) {
    return false;
  }

  if (item.model_type !== 'biolinkWidget') {
    return true;
  }

  const widget = item as BiolinkContentItem & {
    activates_at?: string | null;
    expires_at?: string | null;
  };
  const now = Date.now();

  if (widget.activates_at && new Date(widget.activates_at).getTime() > now) {
    return false;
  }

  if (widget.expires_at && new Date(widget.expires_at).getTime() <= now) {
    return false;
  }

  return true;
}

function WidgetPasswordGate({
  widget,
  children,
}: {
  widget: BiolinkContentItem;
  children: ReactElement;
}) {
  const passwordProtectedWidget = widget as BiolinkContentItem & {
    password?: string | null;
  };
  const [unlocked, setUnlocked] = useState(!passwordProtectedWidget.password);
  const form = useForm<{password: string}>();
  const checkPassword = useMutation(validateLinkPasswordOptions());

  if (unlocked) {
    return children;
  }

  return (
    <HookForm.Root
      form={form}
      onSubmit={values => {
        checkPassword.mutate(
          {
            ...values,
            linkeableType: 'biolinkWidget',
            linkeableId: widget.id,
          },
          {
            onSuccess: () => setUnlocked(true),
            onError: err => onFormQueryError(err, form),
          },
        );
      }}
      className="biolink-password-widget rounded-2xl border border-current/15 bg-current/5 p-5 text-left shadow-sm backdrop-blur-sm"
    >
      <div className="mb-4 flex items-center gap-3 text-base font-semibold">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-current/15 bg-current/10">
          <LockIcon className="size-5" />
        </span>
        <Trans message="This widget is password protected." />
      </div>
      <HookForm.Field name="password">
        <Input
          type="password"
          required
          className="rounded-xl border-current/20 bg-transparent"
          placeholder="Password"
        />
        <Field.Error />
      </HookForm.Field>
      <Button
        type="submit"
        className="biolink-btn-custom mt-4 flex w-full items-center justify-center gap-2"
        disabled={checkPassword.isPending}
      >
        <Trans message="Unlock" />
        <ArrowRightIcon className="size-4" />
      </Button>
    </HookForm.Root>
  );
}

function BiolinkContentList({
  appearance,
  content,
  biolink,
  isPreview,
  excludeWidgetTypes = [],
  anchorSuffix = '',
  desktopLayout = false,
}: {
  appearance?: BiolinkAppearanceConfig | null;
  content: NonNullable<Biolink['content']>;
  biolink?: Biolink;
  isPreview?: boolean;
  excludeWidgetTypes?: string[];
  anchorSuffix?: string;
  desktopLayout?: boolean;
}) {
  const groups: {isPanel: boolean; items: BiolinkContentItem[]}[] = [];
  let currentGroup: {isPanel: boolean; items: BiolinkContentItem[]} | null =
    null;

  content.forEach(item => {
    if (!isBiolinkContentItemVisible(item)) return;

    const itemType = 'type' in item ? item.type : null;
    const headerViewerCountEnabled =
      (appearance as AdvancedAppearanceConfig | null)?.headerConfig?.viewerCount
        ?.enabled === true;
    if (
      item.model_type === 'biolinkWidget' &&
      excludeWidgetTypes.includes(itemType ?? '')
    ) {
      return;
    }
    // The header presence indicator and the standalone viewer widget use the
    // same source. Avoid rendering both when the header version is enabled.
    if (itemType === 'viewerCount' && headerViewerCountEnabled) {
      return;
    }
    const isPanel =
      item.model_type === 'link' ||
      ![
        'socials',
        'imageGallery',
        'linkCollection',
        'embedCollection',
      ].includes(itemType ?? '');

    if (!currentGroup || currentGroup.isPanel !== isPanel) {
      currentGroup = {isPanel, items: []};
      groups.push(currentGroup);
    }
    currentGroup.items.push(item);
  });

  return (
    <div className="biolink-content-list flex w-full flex-col gap-6">
      {groups.map((group, groupIdx) => (
        <div
          key={groupIdx}
          className={cn(
            'biolink-content-group flex w-full flex-col gap-4',
            group.isPanel ? 'biolink-panel-group' : 'biolink-top-group',
          )}
        >
          {group.items.map(item => {
            const key = `${item.model_type}-${item.id}`;
            let renderedItem: ReactElement;
            if (item.model_type === 'link') {
              renderedItem = (
                <BiolinkItemWrapper
                  appearance={appearance}
                  item={item}
                  isLink={true}
                />
              );
            } else {
              const Widget = WidgetRenderers[item.type];

              const hasTitle = !!(item as any).config?.title;
              // O block (caixa) só deve ser aplicado se o widget tiver um título.
              // Redes sociais e vídeos sem título renderizam livremente.
              const widgetOwnsSurface = new Set([
                'linkedProduct',
                'linkedCourse',
                'service',
                'booking',
                'faq',
                'linkCollection',
                'embedCollection',
                'imageGallery',
                'qrCode',
                'location',
                'contactCard',
                'discountCode',
                'document',
                'genericVideo',
                'podcastMusic',
                'mobileApp',
                'eventList',
                'externalForm',
                'rssFeed',
                'discordPresence',
                'gamingProfile',
                'reviews',
                'stats',
                'donation',
                'spotlight',
                'ctaBanner',
                'logoCloud',
                'socialFeed',
              ]).has(item.type ?? '');
              const actionWidget = new Set([
                'contactForm',
                'emailSignup',
                'eventRsvp',
                'smsSignup',
                'poll',
                'viewerCount',
              ]).has(item.type ?? '');
              const shouldWrapWidget =
                hasTitle && !widgetOwnsSurface && !actionWidget;

              const widgetContent = (
                <WidgetEngagementTracker
                  biolinkId={biolink?.id}
                  widgetId={item.id}
                  isPreview={isPreview}
                >
                  <WidgetPasswordGate widget={item}>
                    <Widget
                      widget={item}
                      variant="biolinkPage"
                      appearance={appearance}
                      biolink={biolink}
                      isPreview={isPreview}
                    />
                  </WidgetPasswordGate>
                </WidgetEngagementTracker>
              );

              if (shouldWrapWidget) {
                renderedItem = (
                  <BiolinkItemWrapper
                    appearance={appearance}
                    item={item}
                    isLink={false}
                  >
                    {widgetContent}
                  </BiolinkItemWrapper>
                );
              } else {
                // Widget não tem título e não é rede social, renderiza diretamente sem caixa
                renderedItem = widgetContent;
              }
            }

            return (
              <div
                id={
                  item.model_type === 'biolinkWidget'
                    ? `biolink-widget-${item.id}${anchorSuffix}`
                    : undefined
                }
                className={cn(
                  'w-full min-w-0 scroll-mt-6',
                  desktopLayout && '@container/biolink-widget',
                )}
                key={key}
              >
                {renderedItem}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function getFixedSocialConfig(
  appearance?: AdvancedAppearanceConfig | null,
): SocialConfig | null {
  const config = (
    appearance as
      | (AdvancedAppearanceConfig & {
          socialConfig?: SocialConfig;
        })
      | null
  )?.socialConfig;
  if (!config?.enabled) {
    return null;
  }

  const hasLinks = Object.values(config.links ?? {}).some(
    value => typeof value === 'string' && value.trim() !== '',
  );
  return hasLinks ? config : null;
}

function FixedSocialLinks({
  appearance,
  config,
  device,
  placement,
}: {
  appearance?: AdvancedAppearanceConfig | null;
  config?: SocialConfig | null;
  device: 'mobile' | 'desktop';
  placement: 'header' | 'badge' | 'footer';
}) {
  if (!config) {
    return null;
  }

  const selectedPlacement =
    device === 'mobile'
      ? (config.mobilePlacement ?? 'header')
      : (config.desktopPlacement ?? 'badge');

  if (
    selectedPlacement !== placement ||
    !Object.keys(config.links ?? {}).length
  ) {
    return null;
  }

  return (
    <SocialLinksRenderer
      config={{
        ...(config.links ?? {}),
        style: config.style,
        colorMode: config.colorMode,
      }}
      appearance={appearance}
      variant="desktopHeader"
      className={cn(
        'w-full',
        placement === 'footer' && 'mt-5',
        placement === 'badge' && 'mt-4',
      )}
    />
  );
}

function DesktopBiolinkLayout({
  appearance,
  biolink,
  content,
  showAds,
  isPreview,
  forceDesktop = false,
}: {
  appearance: AdvancedAppearanceConfig | null;
  biolink: Biolink;
  content: NonNullable<Biolink['content']>;
  showAds?: boolean;
  isPreview?: boolean;
  forceDesktop?: boolean;
}) {
  const desktop = {...defaultDesktopConfig, ...appearance?.desktopConfig};
  const savedDesktop = appearance?.desktopConfig ?? {};
  const surfaceMode = savedDesktop.surfaceMode ?? 'open';
  const panelTextColor =
    surfaceMode === 'tinted'
      ? (desktop.panelTextColor ??
        appearance?.bgConfig?.color ??
        'currentColor')
      : (appearance?.bgConfig?.color ?? 'currentColor');
  const placement = desktop.profilePlacement ?? 'center';
  const layoutMode = desktop.layoutMode ?? 'full';
  const contentMode = desktop.contentMode ?? 'spotlight';
  const gridMode = desktop.gridMode ?? 'auto';
  const fixedSocialConfig = getFixedSocialConfig(appearance);
  const gridColumnClassName =
    gridMode === '1'
      ? '[&_.biolink-panel-group]:grid-cols-1'
      : gridMode === '2'
        ? '[&_.biolink-panel-group]:grid-cols-[repeat(auto-fit,minmax(min(100%,24rem),1fr))]'
        : gridMode === '3'
          ? '[&_.biolink-panel-group]:grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))]'
          : '[&_.biolink-panel-group]:grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),1fr))]';
  const gridClassName =
    contentMode === 'columns'
      ? cn(
          '[&_.biolink-panel-group]:grid [&_.biolink-panel-group]:gap-4 [&_.biolink-panel-group>div]:mb-0 [&_.biolink-panel-group>div]:min-w-0',
          gridColumnClassName,
        )
      : '';
  const desktopCollectionGridClassName =
    '[&_.biolink-collection-grid]:grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))]';
  const panelStyle =
    surfaceMode === 'tinted'
      ? {
          backgroundColor: colorWithAlpha(
            desktop.panelBackgroundColor ?? '#111111',
            desktop.profileOpacity ?? 0.9,
          ),
          backdropFilter: `blur(${desktop.profileBlur ?? 12}px)`,
        }
      : undefined;

  return (
    <div
      className={cn(
        'biolink-desktop-layout overflow-x-clip',
        forceDesktop
          ? 'relative z-2 block min-h-[100dvh]'
          : 'relative z-2 hidden min-h-[100dvh] @2xl:block',
        gridClassName,
        desktopCollectionGridClassName,
      )}
      style={{color: panelTextColor}}
    >
      <Background appearance={appearance} />
      <VisualEffectsOverlay appearance={appearance} />
      <ParticleEffectLayer appearance={appearance} />
      <DecorativeAsset appearance={appearance} />
      <AudioControl appearance={appearance} isPreview={isPreview} />
      {layoutMode === 'split' ? (
        <div className="relative z-5 mx-auto grid min-h-[100dvh] w-full max-w-6xl min-w-0 grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)] gap-8 px-6 py-6 lg:px-8 xl:gap-12">
          <aside className="sticky top-6 flex min-h-[calc(100dvh-3rem)] items-center justify-center self-start">
            <div className="w-full max-w-sm">
              <BiolinkHeader
                biolink={biolink}
                appearance={appearance}
                isPreview={isPreview}
              />
              <HeaderViewerCount
                appearance={appearance}
                biolink={biolink}
                isPreview={isPreview}
              />
              <BiolinkBadges appearance={appearance} />
              {!richFooterOwnsSocials(appearance) ? (
                <FixedSocialLinks
                  appearance={appearance}
                  config={fixedSocialConfig}
                  device="desktop"
                  placement="badge"
                />
              ) : null}
            </div>
          </aside>

          <div className="min-w-0">
            <main className="min-w-0" style={panelStyle}>
              <div
                className={cn(
                  'mx-auto w-full px-2 pt-3 pb-6 sm:px-6 sm:pt-4',
                  contentMode === 'columns' && 'max-w-full',
                  contentMode === 'stack' && 'max-w-3xl',
                  contentMode === 'spotlight' && 'max-w-4xl',
                )}
              >
                {showAds && <AdHost slot="biolink_top" className="mb-10" />}
                <BiolinkContentList
                  appearance={appearance}
                  content={content}
                  biolink={biolink}
                  isPreview={isPreview}
                  anchorSuffix="-desktop"
                  desktopLayout
                />
                {!richFooterOwnsSocials(appearance) ? (
                  <FixedSocialLinks
                    appearance={appearance}
                    config={fixedSocialConfig}
                    device="desktop"
                    placement="footer"
                  />
                ) : null}
              </div>
            </main>
            <div
              className={cn(
                'mx-auto w-full px-2 pt-3 pb-0 sm:px-6',
                contentMode === 'columns' && 'max-w-full',
                contentMode === 'stack' && 'max-w-3xl',
                contentMode === 'spotlight' && 'max-w-4xl',
              )}
            >
              <BiolinkFooter
                appearance={appearance}
                biolink={biolink}
                content={content}
                socialConfig={fixedSocialConfig}
                className="mt-0 px-0 pb-0"
                anchorSuffix="-desktop"
              />
            </div>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'relative z-5 mx-auto flex min-h-[100dvh] w-full max-w-6xl px-6 py-12 lg:px-10 lg:pt-10 lg:pb-16',
            placement === 'left' && 'items-start justify-start',
            placement === 'right' && 'items-start justify-end',
            placement === 'center' && 'items-start justify-center',
          )}
        >
          <div
            className={cn(
              'mx-auto w-full p-2 sm:p-6',
              contentMode === 'columns' && 'max-w-6xl',
              contentMode === 'stack' && 'max-w-3xl',
              contentMode === 'spotlight' && 'max-w-2xl',
            )}
            style={panelStyle}
          >
            {showAds && <AdHost slot="biolink_top" className="mb-10" />}
            <BiolinkHeader
              biolink={biolink}
              appearance={appearance}
              isPreview={isPreview}
            />
            <HeaderViewerCount
              appearance={appearance}
              biolink={biolink}
              isPreview={isPreview}
            />
            <BiolinkBadges appearance={appearance} />
            {fixedSocialConfig ? (
              !richFooterOwnsSocials(appearance) ? (
                <FixedSocialLinks
                  appearance={appearance}
                  config={fixedSocialConfig}
                  device="desktop"
                  placement="badge"
                />
              ) : null
            ) : (
              <DesktopSocialsHeader
                appearance={appearance}
                biolink={biolink}
                content={content}
                isPreview={isPreview}
              />
            )}
            <BiolinkContentList
              appearance={appearance}
              content={content}
              biolink={biolink}
              isPreview={isPreview}
              excludeWidgetTypes={fixedSocialConfig ? [] : ['socials']}
              anchorSuffix="-desktop"
              desktopLayout
            />
            {!richFooterOwnsSocials(appearance) ? (
              <FixedSocialLinks
                appearance={appearance}
                config={fixedSocialConfig}
                device="desktop"
                placement="footer"
              />
            ) : null}
            <BiolinkFooter
              appearance={appearance}
              biolink={biolink}
              content={content}
              socialConfig={fixedSocialConfig}
              anchorSuffix="-desktop"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function DesktopSocialsHeader({
  appearance,
  biolink,
  content,
  isPreview,
}: {
  appearance: AdvancedAppearanceConfig | null;
  biolink: Biolink;
  content: NonNullable<Biolink['content']>;
  isPreview?: boolean;
}) {
  const socialWidgets = content.filter(
    item =>
      isBiolinkContentItemVisible(item) &&
      item.model_type === 'biolinkWidget' &&
      item.type === 'socials',
  ) as Array<
    BiolinkContentItem & {model_type: 'biolinkWidget'; type: 'socials'}
  >;

  if (!socialWidgets.length) {
    return null;
  }

  return (
    <div className="flex w-full flex-col items-center">
      {socialWidgets.map(item => {
        const Widget = WidgetRenderers[item.type];
        return (
          <WidgetPasswordGate
            widget={item}
            key={`${item.model_type}-${item.id}`}
          >
            <Widget
              widget={item}
              variant="desktopHeader"
              appearance={appearance}
              biolink={biolink}
              isPreview={isPreview}
            />
          </WidgetPasswordGate>
        );
      })}
    </div>
  );
}

function BiolinkHeader({
  appearance,
  biolink,
  isPreview,
}: {
  appearance?: BiolinkAppearanceConfig | null;
  biolink: Biolink;
  isPreview?: boolean;
}) {
  const actionsBoundaryRef = useRef<HTMLSpanElement>(null);
  const header = appearance?.headerConfig;

  if (!header) {
    return null;
  }

  const layout = header.layout ?? 'classic';
  const alignment = header.alignment ?? 'center';
  const title = header.title || biolink.name;
  const titleColor = header.titleColor || appearance?.bgConfig?.color;
  const titleFontFamily = header.alternativeFont
    ? header.titleFontConfig?.family
    : undefined;
  const logo = resolveImageUrl(header.logo);
  const media = appearance as AdvancedAppearanceConfig | null;
  const avatarSideAsset = resolveImageUrl(media?.mediaConfig?.avatarOverride);
  const headerImage =
    layout === 'hero' || layout === 'cutout'
      ? resolveImageUrl(header.image)
      : undefined;
  const hasHeroImageHeader = layout === 'hero' && !!headerImage;
  const hasCutoutImageHeader = layout === 'cutout' && !!headerImage;
  const hasImageHeader = !!headerImage;
  const showLogo = header.titleStyle === 'logo' && logo;
  const showHeaderActions =
    header.showShareButton === true || header.showNavigation === true;
  const avatarPlaceholder = getBiolinkPlaceholderUrl('avatar', [
    biolink.id,
    biolink.back_half,
    biolink.name,
  ]);

  return (
    <header
      className={cn(
        'relative mb-8 flex flex-col',
        alignment === 'center'
          ? 'items-center text-center'
          : alignment === 'left'
            ? 'items-start text-left'
            : alignment === 'left-inline'
              ? 'items-start text-left'
              : 'items-end text-right',
        layout === 'hero' && !headerImage && 'pt-4',
        hasHeroImageHeader &&
          'relative -mx-6 -mt-6 h-[420px] max-h-[58vh] min-h-80 rounded-t-card px-6 pt-4 pb-8',
        hasCutoutImageHeader &&
          'relative -mx-6 -mt-6 h-[360px] max-h-[52vh] min-h-72 justify-start rounded-t-card px-6 pt-4 pb-10',
        layout === 'banner' && '-mx-2',
      )}
    >
      {showHeaderActions ? (
        <BiolinkPublicHeaderActions
          boundaryRef={actionsBoundaryRef}
          pageTitle={title}
          pageDescription={header.bio}
          pageUrl={biolink.short_url}
          pageHandle={biolink.back_half}
          avatarUrl={resolveImageUrl(header.image) || logo || avatarPlaceholder}
          profileColor={appearance?.bgConfig?.backgroundColor}
          profileTextColor={titleColor}
          showCreateAccount={header.showNavigation === true}
          showShare={header.showShareButton === true}
          isPreview={isPreview}
        />
      ) : null}
      {headerImage && (
        <HeaderBackdropImage
          image={headerImage}
          variant={layout === 'cutout' ? 'cutout' : 'hero'}
        />
      )}
      {layout === 'banner' && (
        <div
          className="mb-[-38px] h-60 w-full shrink-0 rounded-card-sm"
          style={bannerBackgroundStyle(header, appearance?.bgConfig)}
        />
      )}
      <div
        className={cn(
          'relative z-2 flex w-full',
          alignment === 'center'
            ? 'flex-col items-center'
            : alignment === 'left'
              ? 'flex-col items-start'
              : alignment === 'left-inline'
                ? 'flex-row items-center gap-4'
                : alignment === 'right-inline'
                  ? 'flex-row-reverse items-center justify-end gap-4'
                  : 'flex-col items-center',
          hasHeroImageHeader && 'mt-auto',
        )}
      >
        {!hasImageHeader && (
          <HeaderAvatar
            accentImage={avatarSideAsset}
            header={header}
            appearance={appearance}
            title={title}
            placeholder={avatarPlaceholder}
          />
        )}
        <div
          className={cn(
            'flex flex-col',
            alignment === 'left-inline' || alignment === 'right-inline'
              ? 'flex-1'
              : 'w-full',
            alignment === 'center'
              ? 'items-center'
              : alignment === 'left'
                ? 'items-start'
                : alignment === 'left-inline'
                  ? 'items-start'
                  : 'items-end',
            hasImageHeader && 'drop-shadow-lg',
            hasCutoutImageHeader && 'pt-1',
          )}
        >
          {showLogo ? (
            <div
              className={cn(
                'flex min-h-18 w-full items-center',
                alignment === 'center'
                  ? 'justify-center'
                  : alignment === 'left' || alignment === 'left-inline'
                    ? 'justify-start'
                    : 'justify-end',
                hasImageHeader ||
                  alignment === 'left-inline' ||
                  alignment === 'right-inline'
                  ? 'mt-0'
                  : 'mt-4 px-4',
              )}
            >
              <span className="biolink-profile-title biolink-profile-title-logo relative inline-flex items-center justify-center">
                <img
                  src={logo}
                  alt=""
                  className={cn(
                    'block max-h-full max-w-full object-contain',
                    hasImageHeader
                      ? 'max-h-20 max-w-[min(18rem,100%)]'
                      : 'max-h-18 max-w-[min(17rem,100%)]',
                  )}
                />
                <span className="sr-only">{title}</span>
              </span>
            </div>
          ) : (
            <div
              className={cn(
                'flex max-w-full flex-wrap items-center gap-2',
                alignment === 'center'
                  ? 'justify-center'
                  : alignment === 'left' || alignment === 'left-inline'
                    ? 'justify-start'
                    : 'justify-end',
              )}
            >
              <h1
                className={cn(
                  'biolink-profile-title biolink-profile-title-text max-w-full font-bold wrap-break-word',
                  hasImageHeader
                    ? 'mt-0 text-3xl'
                    : alignment === 'left-inline' ||
                        alignment === 'right-inline'
                      ? 'mt-0 text-2xl'
                      : 'mt-4 text-2xl',
                )}
                style={{
                  color: titleColor,
                  fontFamily: titleFontFamily,
                }}
              >
                {title}
              </h1>
              <InlineHeaderBadge appearance={media} />
            </div>
          )}
          {header.bio ? (
            <p
              className={cn(
                'mt-2 max-w-md text-sm leading-6 wrap-break-word',
                hasImageHeader ? 'opacity-90' : 'opacity-85',
              )}
            >
              {header.bio}
            </p>
          ) : null}
          {header.locationText || header.statusText ? (
            <div className="mt-2 flex max-w-md flex-wrap items-center gap-x-3 gap-y-1 text-xs text-current/75">
              {header.locationText ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPinIcon className="size-3.5" />
                  {header.locationText}
                </span>
              ) : null}
              {header.statusText ? (
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="size-1.5 rounded-full bg-positive"
                    aria-hidden
                  />
                  {header.statusText}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      {showHeaderActions ? (
        <span
          ref={actionsBoundaryRef}
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 size-px"
        />
      ) : null}
    </header>
  );
}

function HeaderBackdropImage({
  image,
  variant,
}: {
  image: string;
  variant: 'hero' | 'cutout';
}) {
  const isCutout = variant === 'cutout';

  return (
    <div
      aria-hidden
      className="absolute inset-0 z-0 overflow-hidden rounded-t-card"
    >
      <div
        className="absolute inset-0"
        style={isCutout ? cutoutFooterMaskStyle : heroFooterMaskStyle}
      >
        <img
          src={image}
          alt=""
          className={cn(
            'size-full object-cover saturate-110',
            isCutout ? 'opacity-90' : 'opacity-[0.82]',
          )}
        />
        <div
          className={cn(
            'absolute inset-0',
            isCutout ? 'bg-black/10' : 'bg-black/15',
          )}
        />
      </div>
    </div>
  );
}

const heroFooterMask =
  'radial-gradient(125% 105% at 50% 0%, rgb(0 0 0) 0%, rgb(0 0 0) 42%, rgb(0 0 0 / 0.98) 50%, rgb(0 0 0 / 0.9) 58%, rgb(0 0 0 / 0.76) 66%, rgb(0 0 0 / 0.55) 74%, rgb(0 0 0 / 0.3) 82%, rgb(0 0 0 / 0.1) 90%, rgb(0 0 0 / 0) 96%, rgb(0 0 0 / 0) 100%)';

const cutoutFooterMask =
  'radial-gradient(115% 100% at 50% 0%, rgb(0 0 0) 0%, rgb(0 0 0) 52%, rgb(0 0 0 / 0.98) 59%, rgb(0 0 0 / 0.9) 65%, rgb(0 0 0 / 0.75) 71%, rgb(0 0 0 / 0.55) 77%, rgb(0 0 0 / 0.32) 83%, rgb(0 0 0 / 0.12) 89%, rgb(0 0 0 / 0) 94%, rgb(0 0 0 / 0) 100%)';

const heroFooterMaskStyle = {
  WebkitMaskImage: heroFooterMask,
  maskImage: heroFooterMask,
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskSize: '100% 100%',
  maskSize: '100% 100%',
};

const cutoutFooterMaskStyle = {
  WebkitMaskImage: cutoutFooterMask,
  maskImage: cutoutFooterMask,
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskSize: '100% 100%',
  maskSize: '100% 100%',
};

function HeaderAvatar({
  accentImage,
  header,
  appearance,
  title,
  placeholder,
}: {
  accentImage?: string;
  header: BiolinkAppearanceConfigHeaderConfig;
  appearance?: BiolinkAppearanceConfig | null;
  title: string;
  placeholder: string;
}) {
  const layout = header.layout ?? 'classic';
  const image = header.image;
  const shapeColor =
    header.shapeColor ??
    header.titleColor ??
    appearance?.bgConfig?.color ??
    '#111111';
  const shapeVariant = header.shapeVariant;
  const resolvedImage = resolveImageUrl(image);
  const imageState = useResilientImageSources([resolvedImage, placeholder]);

  if (layout === 'shape') {
    return (
      <HeaderShapeAvatar
        accentImage={accentImage}
        image={imageState.failed ? undefined : imageState.src}
        onImageError={imageState.onError}
        shapeColor={shapeColor}
        shapeVariant={shapeVariant}
        title={title}
        avatarSize={header.avatarSize}
      />
    );
  }

  const avatarSize = header.avatarSize;
  const avatarRadius = header.avatarRadius;
  const avatarBorderWidth = header.avatarBorderWidth;
  const avatarBorderColor = header.avatarBorderColor;

  const style: React.CSSProperties = {};
  if (avatarSize !== undefined) {
    style.width = `${avatarSize}px`;
    style.height = `${avatarSize}px`;
  }
  if (avatarRadius !== undefined) {
    style.borderRadius = `${avatarRadius}px`;
  }
  if (avatarBorderWidth !== undefined) {
    style.borderWidth = `${avatarBorderWidth}px`;
    style.borderStyle = 'solid';
    style.borderColor = avatarBorderColor ?? 'transparent';
  }

  const className = cn(
    'flex items-center justify-center overflow-hidden bg-white/20 text-xl font-semibold',
    !avatarBorderWidth && 'shadow-lg ring-1 ring-white/25',
    !avatarRadius && layout === 'hero' && 'rounded-t-card rounded-b-full',
    !avatarRadius && layout === 'banner' && 'rounded-full',
    !avatarRadius && layout === 'cutout' && 'rounded-t-card rounded-b-[40%]',
    !avatarRadius && layout === 'classic' && 'rounded-full',
    !avatarSize && layout === 'hero' && 'size-30',
    !avatarSize && layout === 'banner' && 'size-22',
    !avatarSize && layout === 'cutout' && 'size-24',
    !avatarSize && layout === 'classic' && 'size-24',
    !avatarBorderWidth && layout === 'banner' && 'border-4 border-white/40',
  );

  const avatar =
    !imageState.failed && imageState.src ? (
      <img
        src={imageState.src}
        alt=""
        style={style}
        className={cn(className, 'object-cover')}
        onError={imageState.onError}
      />
    ) : (
      <div style={style} className={className}>
        {title.slice(0, 1).toUpperCase()}
      </div>
    );

  return (
    <div className="biolink-profile-avatar relative z-2 inline-flex">
      {avatar}
      <HeaderAvatarSideAsset image={accentImage} />
    </div>
  );
}

function HeaderShapeAvatar({
  accentImage,
  image,
  onImageError,
  shapeColor = '#111111',
  shapeVariant,
  title,
  avatarSize = 96,
}: {
  accentImage?: string;
  image?: string;
  onImageError?: () => void;
  shapeColor?: string;
  shapeVariant?: string | null;
  title: string;
  avatarSize?: number;
}) {
  const variant = normalizeHeaderShapeVariant(shapeVariant);
  const rawId = useId();
  const clipId = `biolink-header-shape-${variant}-${rawId.replace(/:/g, '')}`;
  const path = headerShapePath(variant);

  return (
    <div
      className="biolink-profile-avatar relative z-2 flex items-center justify-center"
      style={{
        width: `${Math.round(avatarSize * 1.5)}px`,
        height: `${Math.round(avatarSize * 1.0625)}px`,
      }}
    >
      <svg
        aria-hidden
        className="size-full overflow-visible drop-shadow-lg"
        viewBox="0 0 100 100"
      >
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <path d={path} />
          </clipPath>
        </defs>
        {image ? (
          <image
            clipPath={`url(#${clipId})`}
            height="100"
            href={image}
            preserveAspectRatio="xMidYMid slice"
            width="100"
            onError={onImageError}
          />
        ) : (
          <path d={path} fill={shapeColor} />
        )}
      </svg>
      {!image ? (
        <span className="absolute flex size-16 items-center justify-center rounded-full bg-white/15 text-xl font-semibold text-white">
          {title.slice(0, 1).toUpperCase()}
        </span>
      ) : null}
      <HeaderAvatarSideAsset image={accentImage} className="right-7 bottom-5" />
    </div>
  );
}

function HeaderAvatarSideAsset({
  className,
  image,
}: {
  className?: string;
  image?: string;
}) {
  const src = resolveImageUrl(image);

  if (!src) {
    return null;
  }

  const placementClassName = className ?? '-right-1 -bottom-1';

  return (
    <img
      aria-hidden
      src={src}
      alt=""
      className={cn(
        'pointer-events-none absolute z-10 size-8 shrink-0 rounded-full bg-white/95 object-contain p-1 shadow-md ring-2 ring-white/85',
        placementClassName,
      )}
      loading="lazy"
      draggable={false}
    />
  );
}

function BiolinkItemWrapper({
  item,
  appearance,
  isLink,
  children,
}: {
  item:
    | BiolinkLink
    | (BiolinkContentItem & {style?: BiolinkButtonStyleOverride | null});
  appearance?: BiolinkAppearanceConfig | null;
  isLink?: boolean;
  children?: React.ReactNode;
}) {
  let configForBox = appearance?.boxConfig;
  if (!isLink && !configForBox && appearance?.btnConfig) {
    // Se for uma caixa (box) e não houver configuração específica (boxConfig),
    // herdamos a cor e o estilo de btnConfig, mas evitamos usar 'rounded-full'
    // (pílula) para não criar caixas ovais distorcidas, adotando um padrão básico.
    configForBox = {
      ...appearance.btnConfig,
      radius:
        appearance.btnConfig.radius === 'rounded-full'
          ? 'rounded-lg'
          : appearance.btnConfig.radius,
    } as any;
  }

  if (!isLink && 'config' in item) {
    const widgetConfig = item.config as {
      boxBackgroundColor?: string | null;
      boxTextColor?: string | null;
    };
    const hasSurfaceOverride =
      !!widgetConfig.boxBackgroundColor || !!widgetConfig.boxTextColor;

    if (hasSurfaceOverride) {
      configForBox = {
        ...(configForBox ?? appearance?.btnConfig ?? {}),
        ...(widgetConfig.boxBackgroundColor
          ? {color: widgetConfig.boxBackgroundColor}
          : {}),
        ...(widgetConfig.boxTextColor
          ? {textColor: widgetConfig.boxTextColor}
          : {}),
      } as any;
    }
  }
  const btnConfig = isLink
    ? appearance?.btnConfig
    : (configForBox ?? appearance?.btnConfig);
  const radius = btnConfig?.radius ?? 'rounded-sm';
  const variant = btnConfig?.variant ?? 'solid';
  const override = (
    item as BiolinkLink & {style?: BiolinkButtonStyleOverride | null}
  ).style;
  const buttonColor =
    override?.backgroundColor ?? btnConfig?.color ?? undefined;
  const buttonTextColor =
    override?.textColor ?? btnConfig?.textColor ?? undefined;
  const media = isLink ? linkButtonMedia(item as BiolinkLink) : null;
  const iconColor = getBiolinkButtonIconColor({btnConfig, override});
  const hasBlockStyle = !!btnConfig?.blockStyle;

  const Comp = isLink ? 'a' : 'div';
  const href = isLink ? (item as BiolinkLink).short_url : undefined;
  const target = isLink ? '_blank' : undefined;

  return (
    <Comp
      className={cn(
        'biolink-btn-custom relative flex w-full min-w-0 appearance-none items-center justify-center overflow-hidden py-4 align-middle text-sm font-semibold wrap-break-word hyphens-auto whitespace-normal no-underline transition-button duration-200 outline-none select-none focus-visible:ring',
        (item as any).animation &&
          `animate__animated animate__repeat-3 animate__${(item as any).animation}`,
        !hasBlockStyle && radius,
        hasBlockStyle && 'rounded-none',
        !isLink ? 'flex-col px-4' : media ? 'h-14 px-16.5' : 'h-14 px-4.5',
        !isLink && 'biolink-widget-surface',
        !buttonColor &&
          (variant === 'outline' ||
          variant === 'outline-shadow' ||
          variant === 'dashed' ||
          variant === 'underline' ||
          variant === 'top-bottom-line'
            ? 'border-primary'
            : 'border-primary bg-primary'),
        !buttonTextColor &&
          (variant === 'outline' ||
          variant === 'outline-shadow' ||
          variant === 'dashed' ||
          variant === 'underline' ||
          variant === 'top-bottom-line'
            ? 'text-primary'
            : 'text-primary-foreground'),
      )}
      style={getBiolinkButtonStyle({btnConfig, override})}
      target={target}
      href={href}
    >
      {isLink ? (
        <>
          {media ? (
            <LinkButtonMedia
              media={media}
              radius={radius}
              iconColor={iconColor}
            />
          ) : null}
          <span className="relative z-10">{(item as BiolinkLink).name}</span>
        </>
      ) : (
        children
      )}
    </Comp>
  );
}

type LinkMedia = {
  src: string;
  type: 'asset' | 'image';
};

function linkButtonMedia(link: BiolinkLink): LinkMedia | null {
  const designedLink = link as BiolinkLink & {
    thumbnail_type?: 'image' | 'asset' | 'none' | null;
    thumbnail_asset?: string | null;
  };

  if (designedLink.thumbnail_type === 'none') {
    return null;
  }

  if (designedLink.thumbnail_type !== 'image' && designedLink.thumbnail_asset) {
    return {src: designedLink.thumbnail_asset, type: 'asset'};
  }

  return link.image ? {src: link.image, type: 'image'} : null;
}

function LinkButtonMedia({
  media,
  radius,
  iconColor,
}: {
  media: LinkMedia;
  radius?: BiolinkAppearanceConfigBtnConfig['radius'];
  iconColor?: string;
}) {
  const className = cn(
    'absolute top-1/2 left-2.5 z-10 aspect-square h-[calc(100%-18px)] -translate-y-1/2',
    media.type === 'asset' ? 'object-contain p-1.5' : 'object-cover',
    media.type === 'image' && radius,
  );

  if (media.type === 'asset' && assetUsesMask(media.src)) {
    return (
      <span
        aria-hidden
        className="absolute top-1/2 left-4 size-6 -translate-y-1/2"
        style={{
          backgroundColor: iconColor ?? 'currentColor',
          WebkitMaskImage: `url("${media.src}")`,
          maskImage: `url("${media.src}")`,
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
        }}
      />
    );
  }

  return (
    <img
      className={className}
      src={media.src}
      alt=""
      loading="lazy"
      draggable={false}
    />
  );
}

function BiolinkBadges({
  appearance,
}: {
  appearance?: AdvancedAppearanceConfig | null;
}) {
  const {trans} = useTrans();
  const badgeConfig = appearance?.badgeConfig;
  const style = badgeConfig?.style ?? 'chips';
  const inlineStyle = style !== 'cards' && style !== 'icon';
  const items = (
    (badgeConfig?.items ?? []) as Array<{
      id: string;
      type?: 'system' | 'custom';
      label?: string;
      icon?: string | null;
      iconRef?: {library: 'lucide' | 'simple-icons'; name: string} | null;
      description?: string;
      color?: string;
      iconSize?: 'small' | 'medium' | 'large';
      editionYear?: number;
      active?: boolean;
      sort_order?: number;
    }>
  )
    .filter(
      item => item.active !== false && !(inlineStyle && item.id === 'verified'),
    )
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  if (!items.length) {
    return null;
  }

  return (
    <div
      className={cn(
        'mb-6 flex justify-center gap-2',
        style === 'cards' ? 'flex-col' : 'flex-wrap',
      )}
    >
      {items.map(item => {
        const label = trans({
          message: item.label?.startsWith('biolink.badges.')
            ? officialBadgeLabel(item.id)
            : (item.label ?? ''),
        });
        const description = item.description
          ? trans({message: item.description})
          : label;
        const tooltip =
          description && description !== label
            ? `${label}: ${description}`
            : label;
        const editionLabel = item.editionYear
          ? trans({
              message: 'Edition :year',
              values: {year: item.editionYear},
            })
          : null;
        const accessibleLabel = editionLabel
          ? `${tooltip} · ${editionLabel}`
          : tooltip;
        const iconOnly = style === 'icon';
        const iconSize =
          item.iconSize === 'large'
            ? 'size-7'
            : item.iconSize === 'small'
              ? iconOnly
                ? 'size-5'
                : 'size-4'
              : iconOnly
                ? 'size-6'
                : 'size-5';

        return (
          <span
            key={item.id}
            role={iconOnly ? 'img' : undefined}
            tabIndex={iconOnly ? 0 : undefined}
            title={iconOnly ? accessibleLabel : undefined}
            aria-label={iconOnly ? accessibleLabel : undefined}
            data-tooltip={iconOnly ? accessibleLabel : undefined}
            className={cn(
              'biolink-badge inline-flex items-center justify-center gap-1.5 text-xs font-semibold',
              iconOnly &&
                'biolink-badge-icon-only relative size-11 rounded-full',
              style === 'inline' && 'px-1 py-1',
              style === 'chips' && 'min-h-9 rounded-full border px-3 py-1.5',
              style === 'cards' &&
                'w-full justify-start rounded-card-sm border px-3 py-2.5 text-start',
            )}
            style={{
              color: item.color ?? 'currentColor',
              borderColor: item.color
                ? colorWithAlpha(item.color, 0.4)
                : 'currentColor',
              backgroundColor:
                style === 'inline'
                  ? 'transparent'
                  : item.color
                    ? colorWithAlpha(item.color, 0.12)
                    : 'rgb(255 255 255 / 0.08)',
            }}
          >
            <span
              className={cn(
                'relative shrink-0',
                style === 'cards' &&
                  'flex size-9 items-center justify-center rounded-full bg-background/20',
              )}
            >
              <BadgeIcon item={item} className={iconSize} />
              {iconOnly ? (
                <BadgeEditionMark
                  year={item.editionYear}
                  label={editionLabel}
                  variant="overlay"
                />
              ) : null}
            </span>
            {!iconOnly ? (
              style === 'cards' ? (
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate">{label}</span>
                  {style === 'cards' && description !== label ? (
                    <span className="line-clamp-2 text-[11px] leading-snug font-normal opacity-75">
                      {description}
                    </span>
                  ) : null}
                </span>
              ) : (
                <span>{label}</span>
              )
            ) : null}
            {!iconOnly ? (
              <BadgeEditionMark
                year={item.editionYear}
                label={editionLabel}
                variant={style === 'cards' ? 'card' : 'inline'}
              />
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

function InlineHeaderBadge({
  appearance,
}: {
  appearance?: AdvancedAppearanceConfig | null;
}) {
  const {trans} = useTrans();
  const badgeConfig = appearance?.badgeConfig;
  const style = badgeConfig?.style ?? 'chips';
  const item = (
    (badgeConfig?.items ?? []) as Array<{
      id: string;
      label?: string;
      icon?: string | null;
      iconRef?: {library: 'lucide' | 'simple-icons'; name: string} | null;
      color?: string;
      active?: boolean;
    }>
  ).find(badge => badge.id === 'verified' && badge.active !== false);

  if (!item || (style !== 'inline' && style !== 'chips')) {
    return null;
  }

  const color = item.color ?? 'currentColor';

  return (
    <span
      className={cn(
        'biolink-inline-profile-badge inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold',
        style === 'inline' && 'px-1',
        style === 'chips' && 'rounded-full border px-2.5 py-1',
      )}
      style={{
        color,
        borderColor: item.color
          ? colorWithAlpha(item.color, 0.5)
          : 'currentColor',
        backgroundColor:
          style === 'inline'
            ? 'transparent'
            : item.color
              ? colorWithAlpha(item.color, 0.12)
              : 'rgb(255 255 255 / 0.08)',
      }}
    >
      <BadgeIcon item={item} />
      <span>
        {trans({
          message: item.label?.startsWith('biolink.badges.')
            ? officialBadgeLabel(item.id)
            : (item.label ?? ''),
        })}
      </span>
    </span>
  );
}

function officialBadgeLabel(id: string): string {
  return `biolink.badges.${id}.label`;
}

function BadgeEditionMark({
  year,
  label,
  variant = 'overlay',
}: {
  year?: number;
  label?: string | null;
  variant?: 'overlay' | 'inline' | 'card';
}) {
  if (!year) {
    return null;
  }

  const shortYear = String(year).slice(-2).padStart(2, '0');

  return (
    <span
      aria-label={label ?? undefined}
      title={label ?? undefined}
      className={cn(
        'shrink-0 leading-none font-bold tabular-nums',
        variant === 'overlay' &&
          'absolute -end-1 -bottom-1 flex size-5 items-center justify-center rounded-full border border-current bg-background text-[9px] text-foreground shadow-xs',
        variant === 'inline' && 'text-[10px] opacity-75',
        variant === 'card' &&
          'ms-auto rounded-full border border-current px-2 py-1 text-[10px]',
      )}
    >
      {shortYear}
    </span>
  );
}

function BadgeIcon({
  item,
  className = 'size-4 shrink-0',
}: {
  item: {
    icon?: string | null;
    iconRef?: {library: 'lucide' | 'simple-icons'; name: string} | null;
  };
  className?: string;
}) {
  if (item.iconRef?.library === 'lucide') {
    const Icon = LucideIcons[item.iconRef.name as keyof typeof LucideIcons];
    if (typeof Icon === 'function') {
      return createElement(Icon as ComponentType<{className?: string}>, {
        className,
      });
    }
  }

  if (item.iconRef?.library === 'simple-icons') {
    const iconName = `Si${item.iconRef.name.charAt(0).toUpperCase()}${item.iconRef.name.slice(1)}`;
    const Icon = SimpleIcons[iconName as keyof typeof SimpleIcons];
    if (typeof Icon === 'function') {
      return createElement(Icon as ComponentType<{className?: string}>, {
        className,
      });
    }
  }

  const resolvedIcon = resolveImageUrl(item.icon);

  if (!resolvedIcon) {
    return <LucideIcons.BadgeCheck aria-hidden className={className} />;
  }

  if (assetUsesMask(resolvedIcon)) {
    return (
      <span
        aria-hidden
        className={cn(className, 'block bg-current')}
        style={{
          WebkitMaskImage: `url("${resolvedIcon}")`,
          maskImage: `url("${resolvedIcon}")`,
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
        }}
      />
    );
  }

  return (
    <img
      src={resolvedIcon}
      alt=""
      className={cn(className, 'object-contain')}
      loading="lazy"
      draggable={false}
    />
  );
}

function HeaderViewerCount({
  appearance,
  biolink,
  isPreview = false,
}: {
  appearance?: AdvancedAppearanceConfig | null;
  biolink: Biolink;
  isPreview?: boolean;
}) {
  const config = appearance?.headerConfig?.viewerCount;
  const enabled = config?.enabled === true;
  const [count, setCount] = useState<number | null>(isPreview ? 1 : null);

  useEffect(() => {
    if (!enabled || isPreview || !biolink.id) {
      return;
    }

    let cancelled = false;
    const token = getViewerToken();
    const update = async () => {
      try {
        const response = await fetch(
          `/api/v1/public/biolink/${biolink.id}/viewer-count?visitor_token=${encodeURIComponent(token)}`,
          {headers: {Accept: 'application/json'}, cache: 'no-store'},
        );
        if (!response.ok) return;
        const data = (await response.json()) as {count?: number};
        if (!cancelled && typeof data.count === 'number') {
          setCount(Math.max(0, Math.round(data.count)));
        }
      } catch {
        // Viewer presence is optional and must never break the page.
      }
    };

    void update();
    const interval = window.setInterval(update, 20_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [biolink.id, enabled, isPreview]);

  if (!enabled) {
    return null;
  }

  return (
    <div
      className="mb-4 flex justify-center"
      style={{
        color: config.color || 'currentColor',
        fontFamily: config.fontConfig?.family,
      }}
      aria-live="polite"
      aria-label={message('Current page viewers').message}
    >
      <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-current/15 bg-current/[0.075] px-2.5 py-1 text-xs font-medium shadow-[0_1px_2px_rgb(0_0_0_/_0.12)]">
        <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden />
        <EyeIcon className="size-3.5" aria-hidden />
        <span>{count ?? '...'}</span>
        <span className="opacity-80">
          <Trans message="viewing now" />
        </span>
      </span>
    </div>
  );
}

function getViewerToken(): string {
  const key = 'meulinkbio-viewer-token';
  try {
    const current = window.sessionStorage.getItem(key);
    if (current) return current;
    const token =
      typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(key, token);
    return token;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

type RichFooterLink = {
  id?: string;
  label?: string;
  source?: 'url' | 'widget';
  url?: string;
  widgetId?: number;
  variant?: 'link' | 'cta';
  active?: boolean;
  position?: number;
};

type RichFooterConfig = {
  version?: number;
  enabled?: boolean;
  preset?: 'compact' | 'community' | 'commercial';
  brandSource?: 'auto' | 'logo' | 'avatar';
  blocks?: {
    brand?: boolean;
    navigation?: boolean;
    socials?: boolean;
    cta?: boolean;
    backToTop?: boolean;
  };
  showPlatformLinks?: boolean;
  links?: RichFooterLink[];
};

function richFooterOwnsSocials(
  appearance?: BiolinkAppearanceConfig | null,
): boolean {
  const footer = appearance?.footerConfig as RichFooterConfig | undefined;
  return (
    footer?.version === 1 &&
    footer.enabled !== false &&
    footer.blocks?.socials !== false
  );
}

function BiolinkFooter({
  appearance,
  biolink,
  content,
  socialConfig,
  className,
  anchorSuffix = '',
}: {
  appearance?: BiolinkAppearanceConfig | null;
  biolink: Biolink;
  content: NonNullable<Biolink['content']>;
  socialConfig?: SocialConfig | null;
  className?: string;
  anchorSuffix?: string;
}) {
  const {trans} = useTrans();
  const footer = appearance?.footerConfig as RichFooterConfig | undefined;
  const legacy = footer?.version !== 1;
  const showBackToTop =
    !legacy && footer?.enabled !== false && footer?.blocks?.backToTop !== false;
  const footerRef = useRef<HTMLElement>(null);
  const [footerIsVisible, setFooterIsVisible] = useState(false);
  const resolvedLinks = resolveFooterLinks(
    footer?.links ?? [],
    content,
    anchorSuffix,
  );

  useEffect(() => {
    const footerElement = footerRef.current;
    if (
      !showBackToTop ||
      !footerElement ||
      typeof IntersectionObserver === 'undefined'
    ) {
      setFooterIsVisible(false);
      return;
    }

    const observer = new IntersectionObserver(
      entries => setFooterIsVisible(entries[0]?.isIntersecting ?? false),
      {threshold: 0.08},
    );
    observer.observe(footerElement);
    return () => observer.disconnect();
  }, [showBackToTop]);

  return (
    <footer
      ref={footerRef}
      className={cn(
        'biolink-public-footer mt-8 px-2 pb-2 text-current/85',
        className,
      )}
    >
      {legacy ? (
        <LegacyOwnerLinks links={resolvedLinks} />
      ) : footer?.enabled !== false ? (
        <OwnerFooter
          appearance={appearance}
          biolink={biolink}
          config={footer}
          links={resolvedLinks}
          socialConfig={socialConfig}
        />
      ) : null}
      <PlatformFooterBase
        appearance={appearance}
        showPlatformLinks={footer?.showPlatformLinks !== false}
        compact={!legacy}
      />
      {showBackToTop ? (
        <button
          type="button"
          aria-label={trans({message: 'Back to top'})}
          title={trans({message: 'Back to top'})}
          onClick={event => scrollToPageAnchor(event, '#biolink-page-top')}
          className={cn(
            'biolink-btn-custom fixed end-4 bottom-4 z-40 grid size-12 place-items-center rounded-full border shadow-lg transition-[opacity,transform,box-shadow] duration-200 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-current motion-reduce:transition-none',
            footerIsVisible
              ? 'pointer-events-auto translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-3 opacity-0',
          )}
          style={getBiolinkButtonStyle({btnConfig: appearance?.btnConfig})}
        >
          <ArrowUpIcon className="size-5" />
          <span className="sr-only">
            <Trans message="Back to top" />
          </span>
        </button>
      ) : null}
    </footer>
  );
}

function OwnerFooter({
  appearance,
  biolink,
  config,
  links,
  socialConfig,
}: {
  appearance?: BiolinkAppearanceConfig | null;
  biolink: Biolink;
  config: RichFooterConfig;
  links: Array<{
    id: string;
    label: string;
    url: string;
    variant: 'link' | 'cta';
  }>;
  socialConfig?: SocialConfig | null;
}) {
  const preset = config.preset ?? 'compact';
  const blocks = {
    brand: true,
    navigation: true,
    socials: true,
    cta: true,
    backToTop: true,
    ...config.blocks,
  };
  const navigationLinks = links.filter(link => link.variant !== 'cta');
  const cta = links.find(link => link.variant === 'cta');
  const header = appearance?.headerConfig;
  const title = header?.title || biolink.name;
  const brandSource = config.brandSource ?? 'auto';
  const logo = resolveImageUrl(header?.logo);
  const avatar = resolveImageUrl(header?.image);
  const avatarPlaceholder = getBiolinkPlaceholderUrl('avatar', [
    biolink.id,
    biolink.back_half,
    biolink.name,
  ]);
  const brandImage =
    brandSource === 'logo'
      ? logo
      : brandSource === 'avatar'
        ? avatar || avatarPlaceholder
        : logo || avatar || avatarPlaceholder;
  const brandIsLogo = brandImage === logo && !!logo;

  return (
    <div
      className={cn(
        'biolink-owner-footer border-t border-current/15 py-7 text-sm',
        preset === 'compact' &&
          'grid gap-7 text-center @2xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] @2xl:text-left',
        preset === 'community' &&
          'grid gap-8 text-left @2xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]',
        preset === 'commercial' &&
          'grid gap-8 text-left @2xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)_minmax(0,0.9fr)]',
      )}
    >
      {blocks.brand ? (
        <div
          className={cn(
            'flex min-w-0 flex-col gap-3',
            preset === 'compact' && 'items-center @2xl:items-start',
          )}
        >
          {brandImage ? (
            <img
              src={brandImage}
              alt=""
              className={cn(
                'object-contain',
                brandIsLogo
                  ? 'max-h-12 max-w-44'
                  : 'size-16 rounded-full object-cover',
              )}
            />
          ) : (
            <span className="flex size-14 items-center justify-center rounded-full border border-current/20 bg-current/5 text-lg font-semibold">
              {title.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="font-semibold wrap-break-word text-current">
              {title}
            </p>
            {header?.bio ? (
              <p className="mt-1 max-w-64 text-sm leading-5 text-current/70">
                {header.bio}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {blocks.navigation && navigationLinks.length ? (
        <nav aria-label={message('Page sections').message}>
          <p className="mb-3 font-semibold text-current">
            <Trans message="Explore" />
          </p>
          <ul
            className={cn(
              'grid gap-x-5 gap-y-1',
              preset === 'commercial' && '@2xl:grid-cols-1',
              preset !== 'commercial' && '@2xl:grid-cols-2',
            )}
          >
            {navigationLinks.map(link => (
              <li key={link.id}>
                <a
                  href={link.url}
                  onClick={event => scrollToPageAnchor(event, link.url)}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-lg px-2 transition-colors duration-200 hover:bg-current/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                >
                  <span>{link.label}</span>
                  <ArrowRightIcon className="size-4 shrink-0 opacity-60" />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {blocks.socials || (blocks.cta && cta) ? (
        <div
          className={cn(
            'flex min-w-0 flex-col gap-4',
            preset === 'compact' &&
              '@2xl:col-start-1 @2xl:row-start-2 @2xl:items-start',
          )}
        >
          {blocks.socials && socialConfig ? (
            <div>
              <p className="mb-3 font-semibold text-current">
                <Trans message="Social networks" />
              </p>
              <SocialLinksRenderer
                config={{
                  ...(socialConfig.links ?? {}),
                  style: socialConfig.style,
                  colorMode: socialConfig.colorMode,
                }}
                appearance={appearance}
                variant="desktopHeader"
                className="w-full"
              />
            </div>
          ) : null}
          {blocks.cta && cta ? (
            <a
              href={cta.url}
              onClick={event => scrollToPageAnchor(event, cta.url)}
              className="biolink-btn-custom inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 font-semibold focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-current"
              target={cta.url.startsWith('http') ? '_blank' : undefined}
              rel={cta.url.startsWith('http') ? 'noreferrer' : undefined}
            >
              {cta.label}
              <ArrowRightIcon className="size-4" />
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function LegacyOwnerLinks({
  links,
}: {
  links: Array<{
    id: string;
    label: string;
    url: string;
    variant: 'link' | 'cta';
  }>;
}) {
  if (!links.length) return null;
  return (
    <nav
      className="mb-3 flex max-w-lg flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-center text-xs leading-5"
      aria-label={message('Footer links').message}
    >
      {links.map(link => (
        <a
          key={link.id}
          href={link.url}
          onClick={event => scrollToPageAnchor(event, link.url)}
          className="rounded-sm transition-colors hover:text-current focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-current"
          target={link.url.startsWith('http') ? '_blank' : undefined}
          rel={link.url.startsWith('http') ? 'noreferrer' : undefined}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}

function PlatformFooterBase({
  appearance,
  showPlatformLinks,
  compact,
}: {
  appearance?: BiolinkAppearanceConfig | null;
  showPlatformLinks: boolean;
  compact: boolean;
}) {
  const {branding} = useSettings();
  const {trans} = useTrans();
  const [logoFailed, setLogoFailed] = useState(false);
  const platformLinks = showPlatformLinks
    ? [
        {label: 'FAQ', url: '/pages/faq'},
        {label: 'Cookies', url: '/pages/cookies'},
        {label: 'Privacy', url: '/pages/privacy-policy'},
        {label: 'Terms', url: '/pages/terms-of-service'},
        {label: 'Contact', url: '/contact'},
      ]
    : [];

  return (
    <div
      className={cn(
        'biolink-platform-footer flex flex-col items-center gap-3 text-center text-xs text-current/70',
        compact && 'border-t border-current/15 pt-5',
      )}
    >
      {!appearance?.hideBranding ? (
        <Link
          to="/"
          className="biolink-public-footer-brand inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 py-2 text-black shadow-[0_3px_6px_rgb(0_0_0_/_0.18)] transition-transform duration-200 ease-out hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-current"
        >
          {branding.logo_dark && !logoFailed ? (
            <img
              className="h-5 w-auto max-w-40 object-contain"
              src={branding.logo_dark}
              alt={trans(
                message(':site logo', {values: {site: branding.site_name}}),
              )}
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <span className="font-semibold">{branding.site_name}</span>
          )}
        </Link>
      ) : null}
      {platformLinks.length ? (
        <nav
          className="flex max-w-lg flex-wrap items-center justify-center gap-x-3 gap-y-1.5 leading-5"
          aria-label={message('Platform links').message}
        >
          {platformLinks.map(link => (
            <a
              key={link.url}
              href={link.url}
              className="rounded-sm transition-colors hover:text-current focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-current"
            >
              <Trans message={link.label} />
            </a>
          ))}
        </nav>
      ) : null}
    </div>
  );
}

function resolveFooterLinks(
  links: RichFooterLink[],
  content: NonNullable<Biolink['content']>,
  anchorSuffix = '',
): Array<{id: string; label: string; url: string; variant: 'link' | 'cta'}> {
  return links
    .filter(link => link.active !== false)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .flatMap((link, index) => {
      const source = link.source ?? 'url';
      if (source === 'widget') {
        const widget = content.find(
          item =>
            item.model_type === 'biolinkWidget' &&
            item.id === link.widgetId &&
            isBiolinkContentItemVisible(item),
        );
        const config =
          widget?.model_type === 'biolinkWidget' ? widget.config : null;
        const section = config?.section as
          | {anchorLabel?: unknown}
          | null
          | undefined;
        const label =
          link.label?.trim() ||
          (typeof section?.anchorLabel === 'string'
            ? section.anchorLabel.trim()
            : '') ||
          (typeof config?.title === 'string' ? config.title.trim() : '');
        if (!widget || !label) return [];
        return [
          {
            id: link.id ?? `widget-${widget.id}`,
            label,
            url: `#biolink-widget-${widget.id}${anchorSuffix}`,
            variant: link.variant ?? 'link',
          },
        ];
      }

      const label = link.label?.trim();
      const url = link.url?.trim();
      if (!label || !url) return [];
      return [
        {
          id: link.id ?? `url-${index}`,
          label,
          url,
          variant: link.variant ?? 'link',
        },
      ];
    });
}

function scrollToPageAnchor(
  event: ReactMouseEvent<HTMLElement>,
  url: string,
): void {
  if (!url.startsWith('#')) {
    return;
  }

  const targetId = decodeURIComponent(url.slice(1));
  const target = document.getElementById(targetId);
  if (!target) {
    return;
  }

  event.preventDefault();
  window.history.pushState(null, '', url);
  target.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth',
    block: 'start',
  });
}

function DecorativeAsset({
  appearance,
}: {
  appearance?: AdvancedAppearanceConfig | null;
}) {
  const desktop = appearance?.desktopConfig;
  const src = resolveImageUrl(desktop?.decorativeAsset);

  if (!src) {
    return null;
  }

  const placement = desktop?.decorativePlacement ?? 'right';

  return (
    <img
      aria-hidden
      src={src}
      className={cn(
        'pointer-events-none absolute z-4 hidden max-h-[74vh] max-w-[38vw] object-contain opacity-80 @2xl:block',
        placement === 'left' && 'top-1/2 left-10 -translate-y-1/2',
        placement === 'right' && 'top-1/2 right-10 -translate-y-1/2',
        placement === 'background' &&
          'right-1/2 bottom-6 translate-x-1/2 opacity-20',
      )}
      draggable={false}
    />
  );
}

function VisualEffectsOverlay({
  appearance,
}: {
  appearance?: AdvancedAppearanceConfig | null;
}) {
  const configuredEffects = appearance?.effectsConfig;
  const effects = {...defaultEffectsConfig, ...configuredEffects};
  const color = effects.effectColor ?? '#ffffff';
  const secondaryColor = effects.effectSecondaryColor ?? '#6ee7b7';
  const tertiaryColor = effects.effectTertiaryColor ?? '#3b82f6';
  const mediaEffect = resolvedMediaEffect(configuredEffects);
  const effectClass = mediaEffect ? `biolink-${mediaEffect}-effect` : undefined;

  if (!mediaEffect || mediaEffect === 'none') {
    return null;
  }

  return (
    <div
      aria-hidden
      className={cn(
        'biolink-effects-layer pointer-events-none absolute inset-0 z-4 overflow-hidden',
        effectClass,
      )}
      style={
        {
          '--biolink-effect-color': color,
          '--biolink-effect-secondary': secondaryColor,
          '--biolink-effect-tertiary': tertiaryColor,
        } as CSSProperties
      }
    />
  );
}

const particleEffects = [
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
] as const;
type ParticleEffect = (typeof particleEffects)[number];

function isParticleEffect(
  effect: string | undefined,
): effect is ParticleEffect {
  return !!effect && particleEffects.includes(effect as ParticleEffect);
}

function particleOptions(
  effect: ParticleEffect,
  appearance: AdvancedAppearanceConfig,
): ISourceOptions {
  const effects = {...defaultEffectsConfig, ...appearance.effectsConfig};
  const colors = [
    effects.effectColor ?? '#ffffff',
    effects.effectSecondaryColor ?? '#6ee7b7',
    effects.effectTertiaryColor ?? '#3b82f6',
  ];
  const isSnow = effect === 'snow';
  const isRain = effect === 'rain';
  const isFire = effect === 'fire';
  const isLinks = effect === 'links';
  const density = Math.max(10, Math.min(220, effects.particleDensity ?? 70));
  const speed = Math.max(0, Math.min(10, effects.particleSpeed ?? 1));

  return {
    fullScreen: {enable: false},
    detectRetina: true,
    fpsLimit: 60,
    particles: {
      number: {
        value: isSnow || isRain ? density : density,
        density: {enable: true, width: 1600, height: 900},
      },
      color: {value: colors},
      opacity: {
        value: isRain ? 0.5 : 0.7,
        random: {enable: true, minimumValue: 0.25},
      },
      size: {
        value: isRain ? {min: 1, max: 2} : {min: 1, max: isSnow ? 5 : 4},
        random: true,
      },
      shape: {
        type: isRain
          ? 'line'
          : effect === 'triangles'
            ? 'triangle'
            : effect === 'squares'
              ? 'square'
              : 'circle',
      },
      links: {
        enable: isLinks,
        distance: 150,
        opacity: 0.35,
        width: 1,
        color: colors[0],
      },
      move: {
        enable: true,
        direction: isSnow || isRain ? 'bottom' : isFire ? 'top' : 'none',
        speed: (isRain ? 12 : isSnow ? 1.5 : isFire ? 2.5 : 1.2) * speed,
        straight: isRain,
        outModes: {default: 'out'},
      },
    },
    interactivity: {
      detectsOn: 'window',
      events: {resize: true},
    },
  } as ISourceOptions;
}

function ParticleEffectLayer({
  appearance,
}: {
  appearance?: AdvancedAppearanceConfig | null;
}) {
  const effect = resolvedParticlePreset(appearance?.effectsConfig);
  const id = `biolink-particles-${useId().replace(/:/g, '')}`;
  const reducedMotion =
    appearance?.effectsConfig?.respectReducedMotion !== false &&
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (
      !effect ||
      effect === 'none' ||
      !isParticleEffect(effect) ||
      reducedMotion
    ) {
      return;
    }

    let cancelled = false;
    let container: {destroy: () => void} | undefined;

    void (async () => {
      try {
        const engineModule = await import('@tsparticles/engine');
        const tsParticles =
          engineModule.tsParticles || (engineModule as any).engine?.tsParticles;
        if (!tsParticles) return;

        let presetLoaded = false;
        try {
          switch (effect) {
            case 'ambient':
              presetLoaded = await (await import('@tsparticles/preset-ambient'))
                .loadAmbientPreset(tsParticles)
                .then(() => true);
              break;
            case 'big-circles':
              presetLoaded = await (
                await import('@tsparticles/preset-big-circles')
              )
                .loadBigCirclesPreset(tsParticles)
                .then(() => true);
              break;
            case 'bubbles':
              presetLoaded = await (await import('@tsparticles/preset-bubbles'))
                .loadBubblesPreset(tsParticles)
                .then(() => true);
              break;
            case 'confetti':
              presetLoaded = await (
                await import('@tsparticles/preset-confetti')
              )
                .loadConfettiPreset(tsParticles)
                .then(() => true);
              break;
            case 'confetti-cannon':
              presetLoaded = await (
                await import('@tsparticles/preset-confetti-cannon')
              )
                .loadConfettiCannonPreset(tsParticles)
                .then(() => true);
              break;
            case 'confetti-explosions':
              presetLoaded = await (
                await import('@tsparticles/preset-confetti-explosions')
              )
                .loadConfettiExplosionsPreset(tsParticles)
                .then(() => true);
              break;
            case 'confetti-falling':
              presetLoaded = await (
                await import('@tsparticles/preset-confetti-falling')
              )
                .loadConfettiFallingPreset(tsParticles)
                .then(() => true);
              break;
            case 'confetti-parade':
              presetLoaded = await (
                await import('@tsparticles/preset-confetti-parade')
              )
                .loadConfettiParadePreset(tsParticles)
                .then(() => true);
              break;
            case 'fire':
              presetLoaded = await (await import('@tsparticles/preset-fire'))
                .loadFirePreset(tsParticles)
                .then(() => true);
              break;
            case 'firefly':
              presetLoaded = await (await import('@tsparticles/preset-firefly'))
                .loadFireflyPreset(tsParticles)
                .then(() => true);
              break;
            case 'fireworks':
              presetLoaded = await (
                await import('@tsparticles/preset-fireworks')
              )
                .loadFireworksPreset(tsParticles)
                .then(() => true);
              break;
            case 'fountain':
              presetLoaded = await (
                await import('@tsparticles/preset-fountain')
              )
                .loadFountainPreset(tsParticles)
                .then(() => true);
              break;
            case 'hyperspace':
              presetLoaded = await (
                await import('@tsparticles/preset-hyperspace')
              )
                .loadHyperspacePreset(tsParticles)
                .then(() => true);
              break;
            case 'links':
              presetLoaded = await (await import('@tsparticles/preset-links'))
                .loadLinksPreset(tsParticles)
                .then(() => true);
              break;
            case 'matrix':
              presetLoaded = await (await import('@tsparticles/preset-matrix'))
                .loadMatrixPreset(tsParticles)
                .then(() => true);
              break;
            case 'meteors':
              presetLoaded = await (await import('@tsparticles/preset-meteors'))
                .loadMeteorsPreset(tsParticles)
                .then(() => true);
              break;
            case 'party':
              presetLoaded = await (await import('@tsparticles/preset-party'))
                .loadPartyPreset(tsParticles)
                .then(() => true);
              break;
            case 'sea-anemone':
              presetLoaded = await (
                await import('@tsparticles/preset-sea-anemone')
              )
                .loadSeaAnemonePreset(tsParticles)
                .then(() => true);
              break;
            case 'snow':
              presetLoaded = await (await import('@tsparticles/preset-snow'))
                .loadSnowPreset(tsParticles)
                .then(() => true);
              break;
            case 'squares':
              presetLoaded = await (await import('@tsparticles/preset-squares'))
                .loadSquaresPreset(tsParticles)
                .then(() => true);
              break;
            case 'stars':
              presetLoaded = await (await import('@tsparticles/preset-stars'))
                .loadStarsPreset(tsParticles)
                .then(() => true);
              break;
            case 'triangles':
              presetLoaded = await (
                await import('@tsparticles/preset-triangles')
              )
                .loadTrianglesPreset(tsParticles)
                .then(() => true);
              break;
          }
        } catch (e) {
          // Preset not installed or failed to load
          presetLoaded = false;
        }

        if (cancelled) return;

        let finalOptions: any;
        if (presetLoaded) {
          finalOptions = {
            preset: effect,
            fullScreen: {enable: false},
            background: {color: 'transparent'},
          };
        } else {
          // Fallback to slim and manual configuration
          const slim = await import('@tsparticles/slim');
          await slim.loadSlim(tsParticles);
          finalOptions = particleOptions(effect, appearance!);
        }

        if (cancelled) return;

        const loaded = await tsParticles.load({id, options: finalOptions});
        if (cancelled) {
          loaded?.destroy();
          return;
        }
        container = loaded;
      } catch (err) {
        // Effects are optional; ignore errors to not crash the UI
      }
    })();

    return () => {
      cancelled = true;
      container?.destroy();
    };
  }, [id, effect, appearance, reducedMotion]);

  if (!isParticleEffect(effect) || reducedMotion) {
    return null;
  }

  return (
    <div
      id={id}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-4"
    />
  );
}

function AudioControl({
  appearance,
  isPreview = false,
}: {
  appearance?: AdvancedAppearanceConfig | null;
  isPreview?: boolean;
}) {
  const media = {...defaultMediaConfig, ...appearance?.mediaConfig};
  const audioSrc = resolveImageUrl(media.audio);
  const prompt = {
    ...defaultMediaConfig.audioPrompt,
    ...media.audioPrompt,
  };
  if (
    typeof prompt.text === 'string' &&
    prompt.text.split('').some(char => char.charCodeAt(0) === 195)
  ) {
    prompt.text = undefined;
  }
  const showPrompt = prompt.enabled !== false;
  const showControl = appearance?.effectsConfig?.showVolumeControl !== false;
  const promptText =
    prompt.text?.trim() && !prompt.text.includes('mÃ')
      ? prompt.text
      : message('Click to activate music').message;
  const promptColor =
    prompt.textColor ?? appearance?.bgConfig?.color ?? 'currentColor';
  const promptFont =
    prompt.fontConfig?.family ?? appearance?.fontConfig?.family;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(isPreview);

  if (!audioSrc || (!showPrompt && !showControl)) {
    return null;
  }

  const toggleAudio = async () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }

    setAudioError(false);

    try {
      await audio.play();
      setPlaying(true);
      setHasInteracted(true);
    } catch {
      setPlaying(false);
      setAudioError(true);
    }
  };

  const showOverlay = showPrompt && !isPreview && !hasInteracted && !playing;
  const showLabel = !playing && (showPrompt || audioError);

  return (
    <>
      <audio
        ref={audioRef}
        src={audioSrc}
        loop
        preload="metadata"
        onError={() => {
          setPlaying(false);
          setAudioError(true);
        }}
      />
      {showOverlay ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="group flex min-h-full w-full cursor-pointer items-center justify-center gap-3 px-6 text-center text-base font-medium transition-opacity outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-inset"
            style={{color: promptColor, fontFamily: promptFont}}
            aria-label={
              audioError
                ? message('Audio could not be played').message
                : promptText
            }
            onClick={() => {
              void toggleAudio();
            }}
          >
            {audioError ? (
              <Volume2Icon className="size-5" />
            ) : (
              <PlayIcon className="size-5" />
            )}
            <span>
              {audioError ? (
                <Trans message="Audio could not be played" />
              ) : (
                promptText
              )}
            </span>
          </button>
        </div>
      ) : null}
      {showControl && !showOverlay ? (
        <div className="fixed top-4 left-1/2 z-40 -translate-x-1/2 @2xl:absolute @2xl:top-6">
          <button
            type="button"
            className={cn(
              'inline-flex max-w-[min(22rem,calc(100vw-2rem))] items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-sm backdrop-blur transition-colors',
              !showLabel ? 'size-9 px-0' : 'min-h-9',
            )}
            style={{
              color: promptColor,
              borderColor: colorWithAlpha(promptColor, 0.35),
              backgroundColor: colorWithAlpha(promptColor, 0.12),
              fontFamily: promptFont,
            }}
            aria-label={playing ? message('Pause audio').message : promptText}
            onClick={() => {
              void toggleAudio();
            }}
          >
            <span className="sr-only">
              {playing ? (
                <Trans message="Pause audio" />
              ) : (
                <Trans message="Play audio" />
              )}
            </span>
            {playing ? (
              <PauseIcon className="size-4" />
            ) : (
              <Volume2Icon className="size-4" />
            )}
            {showLabel ? (
              <span className="truncate">
                {audioError ? (
                  <Trans message="Audio could not be played" />
                ) : (
                  promptText
                )}
              </span>
            ) : null}
          </button>
        </div>
      ) : null}
    </>
  );
}

function Background({
  appearance,
  className,
}: {
  appearance: BiolinkAppearanceConfig | null;
  className?: string;
}) {
  const bgTintStyle = getBgTintStyle(appearance?.bgConfig?.tint);
  const bgEffectStyle = getImageBackgroundEffectStyle(
    appearance?.bgConfig?.imageEffect,
    appearance?.bgConfig?.noise,
  );

  return (
    <div
      className={cn(
        'biolink-background-layer pointer-events-none absolute inset-0 overflow-hidden',
        className,
      )}
    >
      <div
        className="absolute inset-0 mx-auto"
        style={{
          ...cssPropsFromBgConfig(appearance?.bgConfig),
          ...bgEffectStyle,
        }}
      />
      <MediaBackground
        appearance={appearance as AdvancedAppearanceConfig | null}
      />
      <ImageBackgroundEffectOverlay
        effect={appearance?.bgConfig?.imageEffect}
      />
      {bgTintStyle && (
        <div className="absolute inset-0 mx-auto" style={bgTintStyle} />
      )}
      {appearance?.bgConfig?.noise && <NoiseFilter />}
    </div>
  );
}

function MediaBackground({
  appearance,
}: {
  appearance?: AdvancedAppearanceConfig | null;
}) {
  const media = {...defaultMediaConfig, ...appearance?.mediaConfig};
  const src = resolveImageUrl(media.backgroundMedia);

  if (!src) {
    return null;
  }

  if (media.backgroundMediaType === 'image') {
    return (
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{backgroundImage: `url("${escapeCssUrl(src)}")`}}
      />
    );
  }

  return (
    <video
      className="absolute inset-0 size-full object-cover"
      src={src}
      muted
      loop
      playsInline
      autoPlay
    />
  );
}

function EffectStyles({
  appearance,
}: {
  appearance?: AdvancedAppearanceConfig | null;
}) {
  const cursor = resolveImageUrl(appearance?.mediaConfig?.cursor);

  return (
    <style>
      {`
        .biolink-widget-surface > .biolink-widget-box,
        .biolink-widget-surface .biolink-widget-box,
        .biolink-widget-surface > .biolink-password-widget,
        .biolink-widget-surface .biolink-password-widget {
          margin-bottom: 0 !important;
          padding: 0 !important;
          border: 0 !important;
          border-radius: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
          backdrop-filter: none !important;
        }
        .biolink-layout-container .biolink-content-group > div > .biolink-widget-box,
        .biolink-layout-container .biolink-content-group > div > .biolink-password-widget,
        .biolink-layout-container .biolink-content-group > div > .biolink-btn-custom {
          margin-bottom: 0 !important;
        }
        .biolink-layout-container .biolink-btn-custom,
        .biolink-layout-container .biolink-public-action,
        .biolink-layout-container .biolink-product-card,
        .biolink-layout-container .biolink-gallery-item,
        .biolink-layout-container .biolink-widget-box {
          transform-origin: center;
          transition-property: background-color, border-color, box-shadow, color, opacity, transform;
          transition-duration: 180ms;
          transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform;
        }
        .biolink-layout-container .biolink-btn-custom {
          background: var(--biolink-theme-button-background);
          border-color: var(--biolink-theme-button-border);
          color: var(--biolink-theme-button-color);
        }
        .biolink-layout-container .biolink-surface-item:not(.biolink-btn-custom):not(.biolink-public-action) {
          border-color: var(--biolink-surface-item-border) !important;
          background: var(--biolink-surface-item-background) !important;
          box-shadow: 0 2px 4px rgb(0 0 0 / 0.14);
          transition-property: background-color, border-color, box-shadow, color, opacity, transform;
          transition-duration: 180ms;
          transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
        }
        @media (hover: hover) and (pointer: fine) {
          .biolink-layout-container .biolink-btn-custom:hover,
          .biolink-layout-container .biolink-public-action:hover,
          .biolink-layout-container .biolink-product-card:hover,
          .biolink-layout-container .biolink-gallery-item:hover {
            transform: scale(1.015);
          }
          .biolink-layout-container .biolink-surface-item:not(.biolink-btn-custom):not(.biolink-public-action):hover {
            background: var(--biolink-surface-item-hover-background) !important;
          }
        }
        .biolink-layout-container .biolink-btn-custom:active,
        .biolink-layout-container .biolink-public-action:active,
        .biolink-layout-container .biolink-product-card:active,
        .biolink-layout-container .biolink-gallery-item:active {
          transform: scale(0.995);
        }
        .biolink-interaction-quiet .biolink-btn-custom:hover,
        .biolink-interaction-quiet .biolink-public-action:hover,
        .biolink-interaction-quiet .biolink-product-card:hover,
        .biolink-interaction-quiet .biolink-gallery-item:hover,
        .biolink-interaction-quiet .biolink-surface-item:hover {
          box-shadow: none !important;
          transform: none !important;
        }
        .biolink-interaction-press .biolink-btn-custom:hover,
        .biolink-interaction-press .biolink-public-action:hover,
        .biolink-interaction-press .biolink-product-card:hover,
        .biolink-interaction-press .biolink-gallery-item:hover,
        .biolink-interaction-press .biolink-surface-item:hover {
          transform: none !important;
        }
        .biolink-interaction-press .biolink-btn-custom:active,
        .biolink-interaction-press .biolink-public-action:active,
        .biolink-interaction-press .biolink-product-card:active,
        .biolink-interaction-press .biolink-gallery-item:active,
        .biolink-interaction-press .biolink-surface-item:active {
          transform: translateY(2px) scale(0.995) !important;
        }
        .biolink-profile-title {
          will-change: transform, filter;
        }
        .biolink-badge-icon-only::after {
          position: absolute;
          z-index: 20;
          top: calc(100% + 0.45rem);
          left: 50%;
          max-width: 16rem;
          padding: 0.35rem 0.55rem;
          border-radius: 0.4rem;
          background: rgb(0 0 0 / 0.88);
          color: #fff;
          content: attr(data-tooltip);
          font-size: 0.7rem;
          font-weight: 500;
          line-height: 1.3;
          opacity: 0;
          pointer-events: none;
          transform: translate(-50%, -0.25rem);
          transition: opacity 120ms ease, transform 120ms ease;
          white-space: normal;
          width: max-content;
        }
        .biolink-badge-icon-only:hover::after,
        .biolink-badge-icon-only:focus-visible::after {
          opacity: 1;
          transform: translate(-50%, 0);
        }
        .biolink-username-effect-glow .biolink-profile-title-text,
        .biolink-glow-username .biolink-profile-title-text {
          text-shadow: 0 0 12px var(--biolink-effect-color, currentColor), 0 0 28px var(--biolink-effect-color, currentColor);
          filter: drop-shadow(0 0 10px var(--biolink-effect-color, currentColor));
        }
        .biolink-username-effect-pulse .biolink-profile-title-text {
          animation: biolink-title-pulse 2.4s ease-in-out infinite;
        }
        .biolink-username-effect-scanline .biolink-profile-title-text {
          position: relative;
        }
        .biolink-username-effect-scanline .biolink-profile-title-text::after {
          content: '';
          position: absolute;
          right: 4%;
          bottom: -0.24rem;
          left: 4%;
          height: 2px;
          border-radius: 999px;
          background: linear-gradient(90deg, transparent, var(--biolink-effect-color, currentColor), transparent);
          box-shadow: 0 0 12px var(--biolink-effect-color, currentColor);
          opacity: 0.9;
        }
        .biolink-username-effect-rainbow .biolink-profile-title-text {
          color: transparent !important;
          background-image: linear-gradient(100deg, var(--biolink-effect-color), var(--biolink-effect-secondary), var(--biolink-effect-tertiary), var(--biolink-effect-color));
          background-size: 300% 100%;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: biolink-title-rainbow 5s linear infinite;
        }
        .biolink-username-effect-sparkle .biolink-profile-title-text {
          position: relative;
          isolation: isolate;
          text-shadow: 0 0 8px var(--biolink-effect-color), 0 0 18px var(--biolink-effect-secondary);
        }
        .biolink-username-effect-sparkle .biolink-profile-title-text::before,
        .biolink-username-effect-sparkle .biolink-profile-title-text::after {
          content: '';
          position: absolute;
          inset: -0.7rem -0.9rem;
          pointer-events: none;
          background-repeat: no-repeat;
          mix-blend-mode: screen;
          opacity: 0.2;
          animation: biolink-title-sparkle 2.8s ease-in-out infinite alternate;
        }
        .biolink-username-effect-sparkle .biolink-profile-title-text::before {
          background-image:
            radial-gradient(circle at 8% 35%, var(--biolink-effect-color) 0 1.5px, transparent 2.5px),
            radial-gradient(circle at 24% 82%, var(--biolink-effect-secondary) 0 1px, transparent 2px),
            radial-gradient(circle at 52% 12%, var(--biolink-effect-tertiary) 0 1.5px, transparent 2.5px),
            radial-gradient(circle at 76% 68%, var(--biolink-effect-color) 0 1px, transparent 2px),
            radial-gradient(circle at 94% 30%, var(--biolink-effect-secondary) 0 1.5px, transparent 2.5px);
        }
        .biolink-username-effect-sparkle .biolink-profile-title-text::after {
          background-image:
            radial-gradient(circle at 16% 70%, var(--biolink-effect-tertiary) 0 1px, transparent 2px),
            radial-gradient(circle at 38% 28%, var(--biolink-effect-color) 0 1.5px, transparent 2.5px),
            radial-gradient(circle at 68% 88%, var(--biolink-effect-secondary) 0 1px, transparent 2px),
            radial-gradient(circle at 86% 16%, var(--biolink-effect-tertiary) 0 1.5px, transparent 2.5px);
          animation-delay: -1.3s;
        }
        .biolink-username-effect-glitch .biolink-profile-title-text {
          text-shadow: 1px 0 var(--biolink-effect-secondary), -1px 0 var(--biolink-effect-tertiary);
          animation: biolink-title-glitch 3.8s steps(1, end) infinite;
        }
        .biolink-username-effect-shimmer .biolink-profile-title-text {
          color: transparent !important;
          background-image: linear-gradient(105deg, var(--biolink-effect-color) 0%, var(--biolink-effect-color) 38%, #ffffff 50%, var(--biolink-effect-color) 62%, var(--biolink-effect-color) 100%);
          background-size: 240% 100%;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: biolink-title-shimmer 3.2s ease-in-out infinite;
        }
        .biolink-animated-title .biolink-profile-title-text {
          animation: biolink-title-float 3.2s ease-in-out infinite;
        }
        .biolink-glow-socials .biolink-top-group a,
        .biolink-glow-socials .biolink-top-group button {
          filter: drop-shadow(0 0 var(--biolink-glow-blur, 10px) color-mix(in srgb, var(--biolink-glow-color, currentColor) calc(var(--biolink-glow-opacity, 0.24) * 100%), transparent));
        }
        .biolink-glow-badges .biolink-badge {
          filter: drop-shadow(0 0 var(--biolink-glow-blur, 10px) color-mix(in srgb, var(--biolink-glow-color, currentColor) calc(var(--biolink-glow-opacity, 0.24) * 100%), transparent));
        }
        .biolink-glow-avatar .biolink-profile-avatar {
          filter: drop-shadow(0 0 var(--biolink-glow-blur, 18px) color-mix(in srgb, var(--biolink-glow-color, currentColor) calc(var(--biolink-glow-opacity, 0.24) * 100%), transparent));
        }
        .biolink-glow-widgets .biolink-widget-surface,
        .biolink-glow-products .biolink-product-card,
        .biolink-product-card-glow {
          box-shadow:
            0 0 0 var(--biolink-glow-spread, 0px) color-mix(in srgb, var(--biolink-glow-color, currentColor) calc(var(--biolink-glow-opacity, 0.24) * 100%), transparent),
            0 0 var(--biolink-glow-blur, 18px) color-mix(in srgb, var(--biolink-glow-color, currentColor) calc(var(--biolink-glow-opacity, 0.24) * 100%), transparent);
        }
        .biolink-glow-buttons .biolink-btn-custom {
          box-shadow:
            0 0 0 var(--biolink-glow-spread, 0px) color-mix(in srgb, var(--biolink-glow-color, currentColor) calc(var(--biolink-glow-opacity, 0.24) * 100%), transparent),
            0 0 var(--biolink-glow-blur, 18px) color-mix(in srgb, var(--biolink-glow-color, currentColor) calc(var(--biolink-glow-opacity, 0.24) * 100%), transparent);
        }
        .biolink-glow-inputs input,
        .biolink-glow-inputs textarea,
        .biolink-glow-inputs select {
          box-shadow: 0 0 var(--biolink-glow-blur, 18px) color-mix(in srgb, var(--biolink-glow-color, currentColor) calc(var(--biolink-glow-opacity, 0.24) * 100%), transparent);
        }
        .biolink-glow-hover-only .biolink-profile-avatar,
        .biolink-glow-hover-only .biolink-widget-surface,
        .biolink-glow-hover-only .biolink-product-card,
        .biolink-glow-hover-only .biolink-btn-custom,
        .biolink-glow-hover-only .biolink-badge {
          filter: none;
          box-shadow: none;
        }
        .biolink-glow-hover-only .biolink-profile-avatar:hover,
        .biolink-glow-hover-only .biolink-widget-surface:hover,
        .biolink-glow-hover-only .biolink-product-card:hover,
        .biolink-glow-hover-only .biolink-btn-custom:hover,
        .biolink-glow-hover-only .biolink-badge:hover {
          filter: drop-shadow(0 0 var(--biolink-glow-blur, 18px) color-mix(in srgb, var(--biolink-glow-color, currentColor) calc(var(--biolink-glow-opacity, 0.24) * 100%), transparent));
          box-shadow: 0 0 0 var(--biolink-glow-spread, 0px) color-mix(in srgb, var(--biolink-glow-color, currentColor) calc(var(--biolink-glow-opacity, 0.24) * 100%), transparent), 0 0 var(--biolink-glow-blur, 18px) color-mix(in srgb, var(--biolink-glow-color, currentColor) calc(var(--biolink-glow-opacity, 0.24) * 100%), transparent);
        }
        .biolink-monochrome-social-icons .biolink-top-group a svg,
        .biolink-monochrome-social-icons .biolink-top-group button svg {
          color: currentColor !important;
          fill: currentColor !important;
          stroke: currentColor !important;
        }
        .biolink-invert-boxes .biolink-btn-custom {
          filter: invert(1);
        }
        .biolink-background-blur .biolink-background-layer > * {
          filter: blur(11px) saturate(112%);
          transform: scale(1.045);
        }
        .biolink-background-night .biolink-background-layer::after {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 2;
          background: rgb(0 0 0 / 0.58);
        }
        .biolink-effects-layer::before,
        .biolink-effects-layer::after {
          content: '';
          position: absolute;
          inset: -18%;
          pointer-events: none;
          will-change: transform, opacity, background-position;
        }
        .biolink-stars-effect::before {
          background-image:
            radial-gradient(circle, var(--biolink-effect-color, #fff) 0 1px, transparent 1.2px),
            radial-gradient(circle, rgb(255 255 255 / 0.58) 0 1.4px, transparent 1.6px);
          background-position: 0 0, 38px 64px;
          background-size: 92px 92px, 180px 180px;
          opacity: 0.6;
          animation: biolink-stars-drift 28s linear infinite;
        }
        .biolink-stars-effect::after {
          background-image:
            radial-gradient(circle, var(--biolink-effect-color, #fff) 0 1px, transparent 1.2px),
            radial-gradient(circle, rgb(255 255 255 / 0.42) 0 1px, transparent 1.2px);
          background-position: 16px 28px, 72px 4px;
          background-size: 140px 140px, 220px 220px;
          opacity: 0.36;
          animation: biolink-stars-twinkle 3.8s ease-in-out infinite alternate;
        }
        .biolink-particles-effect::before {
          background-image:
            radial-gradient(circle at 12% 24%, var(--biolink-effect-color, #fff) 0 3px, transparent 4px),
            radial-gradient(circle at 42% 72%, var(--biolink-effect-color, #fff) 0 2px, transparent 3px),
            radial-gradient(circle at 78% 38%, rgb(255 255 255 / 0.8) 0 3px, transparent 4px),
            radial-gradient(circle at 88% 82%, var(--biolink-effect-color, #fff) 0 2px, transparent 3px);
          background-size: 100% 100%;
          filter: drop-shadow(0 0 8px var(--biolink-effect-color, #fff));
          opacity: 0.58;
          animation: biolink-particles-float 18s ease-in-out infinite alternate;
        }
        .biolink-particles-effect::after {
          background-image:
            radial-gradient(circle at 24% 44%, var(--biolink-effect-color, #fff), transparent 16%),
            radial-gradient(circle at 76% 68%, rgb(255 255 255 / 0.56), transparent 14%);
          filter: blur(22px) saturate(120%);
          opacity: 0.3;
          animation: biolink-particles-glow 11s ease-in-out infinite alternate;
        }
        .biolink-aurora-effect::before {
          background:
            conic-gradient(
              from 150deg at 50% 50%,
              transparent 0deg,
              var(--biolink-effect-color, #fff) 70deg,
              var(--biolink-effect-secondary, #6ee7b7) 155deg,
              var(--biolink-effect-tertiary, #3b82f6) 240deg,
              transparent 320deg
            );
          filter: blur(42px) saturate(135%);
          opacity: 0.42;
          transform: scale(1.12) rotate(-8deg);
          animation: biolink-aurora-flow 15s ease-in-out infinite alternate;
        }
        .biolink-aurora-effect::after {
          background-image:
            radial-gradient(ellipse at 18% 20%, var(--biolink-effect-color, #fff), transparent 34%),
            radial-gradient(ellipse at 82% 28%, var(--biolink-effect-secondary, #6ee7b7), transparent 34%),
            radial-gradient(ellipse at 50% 92%, var(--biolink-effect-tertiary, #3b82f6), transparent 34%);
          filter: blur(30px);
          opacity: 0.4;
          animation: biolink-aurora-drift 18s ease-in-out infinite alternate;
        }
        .biolink-spotlight-effect::before {
          inset: 0;
          background:
            radial-gradient(circle at 50% 28%, var(--biolink-effect-color, #fff), transparent 28%),
            radial-gradient(circle at 50% 115%, rgb(0 0 0 / 0.22), transparent 48%);
          opacity: 0.48;
          animation: biolink-spotlight-sweep 10s ease-in-out infinite alternate;
        }
        .biolink-spotlight-effect::after {
          inset: 0;
          background: radial-gradient(circle at 50% 28%, rgb(255 255 255 / 0.5), transparent 24%);
          opacity: 0.42;
          animation: biolink-spotlight-pulse 5.6s ease-in-out infinite;
        }
        .biolink-snow-effect::before {
          background-image:
            radial-gradient(circle, var(--biolink-effect-color, #fff) 0 2px, transparent 2.8px),
            radial-gradient(circle, rgb(255 255 255 / 0.88) 0 1.4px, transparent 2px),
            radial-gradient(circle, rgb(255 255 255 / 0.7) 0 3px, transparent 4px);
          background-position: 0 -12px, 28px -36px, 70px -22px;
          background-size: 82px 92px, 124px 132px, 178px 190px;
          opacity: 0.82;
          animation: biolink-snow-fall 13s linear infinite;
        }
        .biolink-snow-effect::after {
          background-image:
            radial-gradient(circle, rgb(255 255 255 / 0.9) 0 4px, transparent 5px),
            radial-gradient(circle, var(--biolink-effect-color, #fff) 0 2px, transparent 3px);
          background-position: 18px -80px, 90px -40px;
          background-size: 240px 250px, 164px 180px;
          opacity: 0.5;
          animation: biolink-snow-fall 20s linear infinite reverse;
        }
        .biolink-rain-effect::before {
          background-image: linear-gradient(108deg, transparent 0 45%, var(--biolink-effect-color, #fff) 46% 48%, transparent 49%);
          background-size: 34px 74px;
          opacity: 0.44;
          transform: rotate(4deg) scale(1.2);
          animation: biolink-rain-fall 0.9s linear infinite;
        }
        .biolink-rain-effect::after {
          background-image: linear-gradient(108deg, transparent 0 47%, rgb(255 255 255 / 0.7) 48% 49%, transparent 50%);
          background-size: 68px 112px;
          opacity: 0.3;
          transform: rotate(4deg) scale(1.2);
          animation: biolink-rain-fall 1.4s linear infinite reverse;
        }
        .biolink-tv-effect::before {
          background-image:
            radial-gradient(circle at 20% 30%, var(--biolink-effect-color, #fff) 0 1px, transparent 1.5px),
            radial-gradient(circle at 74% 64%, rgb(255 255 255 / 0.7) 0 1px, transparent 1.5px),
            linear-gradient(90deg, transparent 0 48%, rgb(255 255 255 / 0.22) 50%, transparent 52%);
          background-size: 8px 8px, 11px 11px, 17px 100%;
          mix-blend-mode: screen;
          filter: contrast(180%);
          opacity: 0.22;
          animation: biolink-tv-noise 0.22s steps(5) infinite;
        }
        .biolink-tv-effect::after {
          background-image: linear-gradient(to bottom, transparent 0 3px, rgb(255 255 255 / 0.15) 4px, transparent 5px 7px);
          background-size: 100% 8px;
          mix-blend-mode: screen;
          opacity: 0.34;
          animation: biolink-tv-scan 4.5s linear infinite;
        }
        .biolink-blur-effect::before {
          inset: 0;
          background: rgb(255 255 255 / 0.04);
          backdrop-filter: blur(10px) saturate(115%);
          opacity: 0.72;
          animation: biolink-blur-breathe 8s ease-in-out infinite alternate;
        }
        .biolink-night-effect::before {
          inset: 0;
          background: radial-gradient(circle at 50% 30%, transparent 0 22%, rgb(0 0 0 / 0.18) 72%, rgb(0 0 0 / 0.58) 100%);
          opacity: 0.92;
          animation: biolink-night-breathe 7s ease-in-out infinite alternate;
        }
        .biolink-ambient-effect::before {
          background:
            radial-gradient(circle at 20% 20%, var(--biolink-effect-color, #fff), transparent 24%),
            radial-gradient(circle at 80% 75%, var(--biolink-effect-secondary, #6ee7b7), transparent 28%);
          filter: blur(26px);
          opacity: 0.28;
          animation: biolink-ambient-drift 16s ease-in-out infinite alternate;
        }
        .biolink-ambient-effect::after {
          background: radial-gradient(circle at 50% 50%, var(--biolink-effect-tertiary, #3b82f6), transparent 40%);
          filter: blur(34px);
          opacity: 0.2;
          animation: biolink-ambient-drift 22s ease-in-out infinite alternate-reverse;
        }
        .biolink-big-circles-effect::before,
        .biolink-bubbles-effect::before {
          background-image:
            radial-gradient(circle at 18% 22%, var(--biolink-effect-color, #fff) 0 34px, transparent 36px),
            radial-gradient(circle at 78% 72%, var(--biolink-effect-secondary, #6ee7b7) 0 58px, transparent 60px),
            radial-gradient(circle at 58% 12%, var(--biolink-effect-tertiary, #3b82f6) 0 24px, transparent 26px);
          filter: blur(2px);
          opacity: 0.28;
          animation: biolink-circles-drift 18s ease-in-out infinite alternate;
        }
        .biolink-bubbles-effect::after {
          background-image:
            radial-gradient(circle at 32% 80%, transparent 0 9px, var(--biolink-effect-color, #fff) 10px 11px, transparent 12px),
            radial-gradient(circle at 66% 92%, transparent 0 16px, var(--biolink-effect-secondary, #6ee7b7) 17px 18px, transparent 19px),
            radial-gradient(circle at 84% 66%, transparent 0 6px, var(--biolink-effect-tertiary, #3b82f6) 7px 8px, transparent 9px);
          opacity: 0.56;
          animation: biolink-bubbles-rise 12s ease-in-out infinite;
        }
        .biolink-confetti-effect::before,
        .biolink-confetti-falling-effect::before,
        .biolink-confetti-parade-effect::before {
          background-image:
            linear-gradient(35deg, var(--biolink-effect-color, #fff) 0 7px, transparent 7px 16px),
            linear-gradient(115deg, var(--biolink-effect-secondary, #6ee7b7) 0 6px, transparent 6px 15px),
            linear-gradient(175deg, var(--biolink-effect-tertiary, #3b82f6) 0 8px, transparent 8px 20px),
            linear-gradient(75deg, #fbbf24 0 7px, transparent 7px 18px);
          background-size: 78px 110px, 120px 160px, 95px 140px, 150px 180px;
          opacity: 0.7;
          animation: biolink-confetti-fall 8s linear infinite;
        }
        .biolink-confetti-cannon-effect::before,
        .biolink-confetti-explosions-effect::before,
        .biolink-party-effect::before {
          background-image:
            radial-gradient(circle at 20% 80%, var(--biolink-effect-color, #fff) 0 5px, transparent 6px),
            radial-gradient(circle at 50% 45%, var(--biolink-effect-secondary, #6ee7b7) 0 4px, transparent 5px),
            radial-gradient(circle at 82% 78%, var(--biolink-effect-tertiary, #3b82f6) 0 6px, transparent 7px),
            radial-gradient(circle at 56% 86%, #fbbf24 0 4px, transparent 5px);
          opacity: 0.72;
          animation: biolink-confetti-burst 3.6s ease-in-out infinite;
        }
        .biolink-fire-effect::before {
          background:
            radial-gradient(ellipse at 30% 92%, #ef4444, transparent 26%),
            radial-gradient(ellipse at 65% 90%, #f97316, transparent 28%),
            radial-gradient(ellipse at 52% 74%, #facc15, transparent 22%);
          filter: blur(18px) saturate(140%);
          opacity: 0.48;
          animation: biolink-fire-flicker 1.6s ease-in-out infinite alternate;
        }
        .biolink-firefly-effect::before {
          background-image:
            radial-gradient(circle at 18% 24%, #fef08a 0 3px, transparent 5px),
            radial-gradient(circle at 42% 68%, var(--biolink-effect-color, #fff) 0 2px, transparent 4px),
            radial-gradient(circle at 76% 32%, #fef08a 0 3px, transparent 5px),
            radial-gradient(circle at 84% 80%, var(--biolink-effect-secondary, #6ee7b7) 0 2px, transparent 4px);
          filter: drop-shadow(0 0 8px #fef08a);
          opacity: 0.76;
          animation: biolink-firefly-drift 9s ease-in-out infinite alternate;
        }
        .biolink-fireworks-effect::before,
        .biolink-fountain-effect::before {
          background-image:
            radial-gradient(circle at 24% 34%, var(--biolink-effect-color, #fff) 0 3px, transparent 5px),
            radial-gradient(circle at 72% 28%, var(--biolink-effect-secondary, #6ee7b7) 0 3px, transparent 5px),
            radial-gradient(circle at 48% 58%, var(--biolink-effect-tertiary, #3b82f6) 0 3px, transparent 5px);
          filter: drop-shadow(0 0 8px var(--biolink-effect-color, #fff));
          opacity: 0.72;
          animation: biolink-fireworks-bloom 4s ease-in-out infinite;
        }
        .biolink-hyperspace-effect::before,
        .biolink-meteors-effect::before {
          background-image: linear-gradient(115deg, transparent 0 46%, var(--biolink-effect-color, #fff) 48%, transparent 51%);
          background-size: 72px 72px;
          filter: blur(1px);
          opacity: 0.48;
          transform: scale(1.4) rotate(-7deg);
          animation: biolink-meteors-fly 2.5s linear infinite;
        }
        .biolink-links-effect::before {
          background-image:
            linear-gradient(28deg, transparent 0 48%, var(--biolink-effect-color, #fff) 49% 50%, transparent 51%),
            linear-gradient(142deg, transparent 0 48%, var(--biolink-effect-secondary, #6ee7b7) 49% 50%, transparent 51%);
          background-size: 140px 110px, 180px 150px;
          opacity: 0.34;
          animation: biolink-links-shift 10s linear infinite;
        }
        .biolink-matrix-effect::before {
          background-image: linear-gradient(to bottom, transparent 0 48%, var(--biolink-effect-color, #fff) 49% 50%, transparent 51%);
          background-size: 24px 42px;
          opacity: 0.44;
          mix-blend-mode: screen;
          animation: biolink-matrix-fall 2.4s linear infinite;
        }
        .biolink-ribbons-effect::before {
          background: conic-gradient(from 10deg at 40% 50%, transparent, var(--biolink-effect-color, #fff), transparent 28%, var(--biolink-effect-secondary, #6ee7b7), transparent 56%, var(--biolink-effect-tertiary, #3b82f6), transparent);
          filter: blur(12px);
          opacity: 0.4;
          animation: biolink-ribbons-flow 12s ease-in-out infinite alternate;
        }
        .biolink-sea-anemone-effect::before {
          background: radial-gradient(ellipse at 50% 100%, var(--biolink-effect-color, #fff), transparent 42%);
          filter: blur(14px);
          opacity: 0.36;
          animation: biolink-anemone-sway 5s ease-in-out infinite alternate;
        }
        .biolink-squares-effect::before {
          background-image: linear-gradient(45deg, var(--biolink-effect-color, #fff) 0 10px, transparent 10px 34px);
          background-size: 76px 76px;
          opacity: 0.34;
          animation: biolink-squares-drift 12s linear infinite;
        }
        .biolink-triangles-effect::before {
          background-image: linear-gradient(135deg, var(--biolink-effect-color, #fff) 0 12px, transparent 12px 32px);
          background-size: 80px 80px;
          opacity: 0.32;
          animation: biolink-triangles-drift 10s linear infinite reverse;
        }
        @keyframes biolink-title-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.68; }
        }
        @keyframes biolink-title-rainbow {
          from { background-position: 0% 50%; }
          to { background-position: 300% 50%; }
        }
        @keyframes biolink-title-sparkle {
          from { transform: scale(0.94) rotate(-2deg); opacity: 0.2; }
          to { transform: scale(1.06) rotate(2deg); opacity: 0.9; }
        }
        @keyframes biolink-title-glitch {
          0%, 88%, 100% { transform: translateX(0); }
          89% { transform: translateX(-1px); }
          90% { transform: translateX(1px); }
          91% { transform: translateX(0); }
          94% { transform: translateX(1px); }
          95% { transform: translateX(-1px); }
        }
        @keyframes biolink-title-shimmer {
          from { background-position: 140% 50%; }
          to { background-position: -80% 50%; }
        }
        @keyframes biolink-title-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes biolink-stars-drift {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-7%, 8%, 0); }
        }
        @keyframes biolink-stars-twinkle {
          from { transform: scale(0.98); opacity: 0.24; }
          to { transform: scale(1.04); opacity: 0.6; }
        }
        @keyframes biolink-particles-float {
          from { transform: translate3d(-3%, 2%, 0) scale(0.98); }
          to { transform: translate3d(4%, -5%, 0) scale(1.04); }
        }
        @keyframes biolink-particles-glow {
          from { transform: translate3d(-4%, 4%, 0) scale(0.92); opacity: 0.18; }
          to { transform: translate3d(5%, -5%, 0) scale(1.12); opacity: 0.42; }
        }
        @keyframes biolink-aurora-flow {
          from { transform: scale(1.12) rotate(-8deg) translate3d(-3%, 2%, 0); }
          to { transform: scale(1.24) rotate(9deg) translate3d(4%, -4%, 0); }
        }
        @keyframes biolink-aurora-drift {
          from { transform: translate3d(-4%, 3%, 0) scale(0.96); }
          to { transform: translate3d(5%, -3%, 0) scale(1.08); }
        }
        @keyframes biolink-spotlight-sweep {
          from { transform: translate3d(-4%, 0, 0) scale(0.98); }
          to { transform: translate3d(4%, 2%, 0) scale(1.04); }
        }
        @keyframes biolink-spotlight-pulse {
          0%, 100% { transform: scale(0.94); opacity: 0.24; }
          50% { transform: scale(1.08); opacity: 0.56; }
        }
        @keyframes biolink-snow-fall {
          from { background-position: 0 -18px, 28px -36px, 70px -22px; transform: translate3d(0, -2%, 0); }
          to { background-position: 54px 112px, -22px 156px, 92px 218px; transform: translate3d(3%, 8%, 0); }
        }
        @keyframes biolink-rain-fall {
          from { background-position: 0 -80px; }
          to { background-position: -20px 80px; }
        }
        @keyframes biolink-tv-noise {
          0% { background-position: 0 0, 0 0, 0 0; transform: translateX(0); }
          25% { background-position: 7px -4px, -4px 6px, 9px 0; transform: translateX(1%); }
          50% { background-position: -5px 8px, 6px -5px, -12px 0; transform: translateX(-1%); }
          75% { background-position: 4px 3px, -8px -7px, 5px 0; transform: translateX(0.5%); }
          100% { background-position: -8px -5px, 5px 8px, -8px 0; transform: translateX(0); }
        }
        @keyframes biolink-tv-scan {
          from { background-position: 0 -100%; }
          to { background-position: 0 100%; }
        }
        @keyframes biolink-blur-breathe {
          from { opacity: 0.52; }
          to { opacity: 0.82; }
        }
        @keyframes biolink-night-breathe {
          from { opacity: 0.78; }
          to { opacity: 1; }
        }
        @keyframes biolink-ambient-drift {
          from { transform: translate3d(-5%, 3%, 0) scale(0.96); }
          to { transform: translate3d(5%, -4%, 0) scale(1.08); }
        }
        @keyframes biolink-circles-drift {
          from { transform: translate3d(-4%, 3%, 0) scale(0.92); }
          to { transform: translate3d(4%, -5%, 0) scale(1.08); }
        }
        @keyframes biolink-bubbles-rise {
          from { transform: translate3d(-2%, 12%, 0) scale(0.94); }
          to { transform: translate3d(4%, -18%, 0) scale(1.06); }
        }
        @keyframes biolink-confetti-fall {
          from { background-position: 0 -120px, 40px -140px, -20px -180px, 60px -160px; transform: rotate(-2deg); }
          to { background-position: 60px 120px, -30px 160px, 40px 190px, -70px 180px; transform: rotate(3deg); }
        }
        @keyframes biolink-confetti-burst {
          0%, 100% { transform: scale(0.86) translate3d(-2%, 3%, 0); opacity: 0.28; }
          50% { transform: scale(1.18) translate3d(3%, -5%, 0); opacity: 0.76; }
        }
        @keyframes biolink-fire-flicker {
          from { transform: translate3d(-3%, 2%, 0) scale(0.92); opacity: 0.3; }
          to { transform: translate3d(4%, -5%, 0) scale(1.1); opacity: 0.62; }
        }
        @keyframes biolink-firefly-drift {
          from { transform: translate3d(-5%, 4%, 0); opacity: 0.3; }
          to { transform: translate3d(5%, -5%, 0); opacity: 0.82; }
        }
        @keyframes biolink-fireworks-bloom {
          0%, 100% { transform: scale(0.72); opacity: 0.2; }
          50% { transform: scale(1.2); opacity: 0.78; }
        }
        @keyframes biolink-meteors-fly {
          from { background-position: 40px -90px; transform: scale(1.4) rotate(-7deg); }
          to { background-position: -60px 160px; transform: scale(1.65) rotate(-7deg); }
        }
        @keyframes biolink-links-shift {
          from { background-position: 0 0, 40px 22px; }
          to { background-position: 140px 110px, -140px -110px; }
        }
        @keyframes biolink-matrix-fall {
          from { background-position: 0 -40px; }
          to { background-position: 0 80px; }
        }
        @keyframes biolink-ribbons-flow {
          from { transform: translate3d(-5%, 2%, 0) rotate(-8deg) scale(1); }
          to { transform: translate3d(6%, -4%, 0) rotate(10deg) scale(1.16); }
        }
        @keyframes biolink-anemone-sway {
          from { transform: skewX(-5deg) scaleY(0.94); }
          to { transform: skewX(6deg) scaleY(1.08); }
        }
        @keyframes biolink-squares-drift {
          from { background-position: 0 0; transform: rotate(-2deg); }
          to { background-position: 76px 76px; transform: rotate(4deg); }
        }
        @keyframes biolink-triangles-drift {
          from { background-position: 0 0; transform: translate3d(-3%, 2%, 0); }
          to { background-position: 80px -80px; transform: translate3d(4%, -3%, 0); }
        }
        @media (pointer: fine) {
          ${cursor ? `.biolink-layout-container { cursor: url("${escapeCssUrl(cursor)}"), auto; }` : ''}
          .biolink-layout-container a,
          .biolink-layout-container button {
            cursor: pointer;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .biolink-effects-layer::before,
          .biolink-effects-layer::after,
          .biolink-username-effect-pulse .biolink-profile-title-text,
          .biolink-animated-title .biolink-profile-title-text,
          .biolink-username-effect-rainbow .biolink-profile-title-text,
          .biolink-username-effect-sparkle .biolink-profile-title-text::before,
          .biolink-username-effect-sparkle .biolink-profile-title-text::after,
          .biolink-username-effect-glitch .biolink-profile-title-text,
          .biolink-username-effect-shimmer .biolink-profile-title-text {
            animation: none !important;
          }
          .biolink-layout-container .biolink-btn-custom,
          .biolink-layout-container .biolink-public-action,
          .biolink-layout-container .biolink-product-card,
          .biolink-layout-container .biolink-gallery-item,
          .biolink-layout-container .biolink-widget-box,
          .biolink-layout-container .biolink-public-footer-brand {
            transition-duration: 1ms !important;
            transform: none !important;
          }
          .biolink-username-effect-sparkle .biolink-profile-title-text::before,
          .biolink-username-effect-sparkle .biolink-profile-title-text::after {
            opacity: 0.65;
          }
        }
        @media (max-width: 767px) {
          .biolink-glow-reduce-mobile {
            --biolink-glow-opacity: min(var(--biolink-glow-opacity, 0.24), 0.18);
            --biolink-glow-blur: min(var(--biolink-glow-blur, 18px), 14px);
          }
        }
      `}
    </style>
  );
}

type ResolvedGlowConfig = {
  enabled: boolean;
  color: string;
  opacity: number;
  blur: number;
  spread: number;
  username: boolean;
  avatar: boolean;
  widgets: boolean;
  products: boolean;
  buttons: boolean;
  badges: boolean;
  socialIcons: boolean;
  inputs: boolean;
  hoverOnly: boolean;
  reduceOnMobile: boolean;
};

function resolveGlowConfig(effects?: EffectsConfig | null): ResolvedGlowConfig {
  const configured = effects?.glow;
  const legacyEnabled = !!(
    effects?.glowUsername ||
    effects?.glowSocials ||
    effects?.glowBadges
  );
  const preset = configured?.preset ?? 'soft';
  const presetValues: Record<
    NonNullable<GlowConfig['preset']>,
    {opacity: number; blur: number; spread: number}
  > = {
    none: {opacity: 0, blur: 0, spread: 0},
    soft: {opacity: 0.18, blur: 14, spread: 0},
    medium: {opacity: 0.32, blur: 24, spread: 1},
    strong: {opacity: 0.48, blur: 34, spread: 2},
    custom: {opacity: 0.24, blur: 18, spread: 1},
  };
  const fallback = presetValues[preset] ?? presetValues.soft;
  const source = configured?.source ?? 'primary';
  const colors = {
    primary: effects?.effectColor ?? '#ffffff',
    secondary: effects?.effectSecondaryColor ?? '#6ee7b7',
    tertiary: effects?.effectTertiaryColor ?? '#3b82f6',
    block: effects?.effectColor ?? '#ffffff',
    custom: configured?.customColor ?? effects?.effectColor ?? '#ffffff',
  };

  return {
    enabled: configured?.enabled ?? legacyEnabled,
    color: colors[source],
    opacity: configured?.opacity ?? fallback.opacity,
    blur: configured?.blur ?? fallback.blur,
    spread: configured?.spread ?? fallback.spread,
    username: configured?.username ?? effects?.glowUsername ?? true,
    avatar: configured?.avatar ?? true,
    widgets: configured?.widgets ?? false,
    products: configured?.products ?? false,
    buttons: configured?.buttons ?? false,
    badges: configured?.badges ?? effects?.glowBadges ?? true,
    socialIcons: configured?.socialIcons ?? effects?.glowSocials ?? true,
    inputs: configured?.inputs ?? false,
    hoverOnly: configured?.hoverOnly ?? false,
    reduceOnMobile: configured?.reduceOnMobile ?? true,
  };
}

function effectClassNames(
  appearance?: AdvancedAppearanceConfig | null,
): string {
  const effects = appearance?.effectsConfig;
  const classes = [];
  const mediaEffect = resolvedMediaEffect(effects);
  const glow = resolveGlowConfig(effects);

  if (mediaEffect === 'blur') {
    classes.push('biolink-background-blur');
  }
  if (mediaEffect === 'night') {
    classes.push('biolink-background-night');
  }

  if (effects?.usernameEffect && effects.usernameEffect !== 'none') {
    classes.push(`biolink-username-effect-${effects.usernameEffect}`);
  }
  if (effects?.glowUsername) {
    classes.push('biolink-glow-username');
  }
  if (effects?.glowSocials) {
    classes.push('biolink-glow-socials');
  }
  if (effects?.glowBadges) {
    classes.push('biolink-glow-badges');
  }
  if (glow.enabled) {
    if (glow.username) classes.push('biolink-glow-username');
    if (glow.avatar) classes.push('biolink-glow-avatar');
    if (glow.widgets) classes.push('biolink-glow-widgets');
    if (glow.products) classes.push('biolink-glow-products');
    if (glow.buttons) classes.push('biolink-glow-buttons');
    if (glow.badges) classes.push('biolink-glow-badges');
    if (glow.socialIcons) classes.push('biolink-glow-socials');
    if (glow.inputs) classes.push('biolink-glow-inputs');
    if (glow.hoverOnly) classes.push('biolink-glow-hover-only');
    if (glow.reduceOnMobile) classes.push('biolink-glow-reduce-mobile');
  }
  if (effects?.monochromeSocialIcons) {
    classes.push('biolink-monochrome-social-icons');
  }
  if (effects?.invertBoxes) {
    classes.push('biolink-invert-boxes');
  }
  if (effects?.animatedTitle) {
    classes.push('biolink-animated-title');
  }
  if (effects?.interactionStyle) {
    classes.push(`biolink-interaction-${effects.interactionStyle}`);
  }

  return classes.join(' ');
}

function effectVariables(
  appearance?: AdvancedAppearanceConfig | null,
): CSSProperties {
  const effects = {...defaultEffectsConfig, ...appearance?.effectsConfig};
  const glow = resolveGlowConfig(appearance?.effectsConfig);

  return {
    '--biolink-effect-color': effects.effectColor ?? '#ffffff',
    '--biolink-effect-secondary': effects.effectSecondaryColor ?? '#6ee7b7',
    '--biolink-effect-tertiary': effects.effectTertiaryColor ?? '#3b82f6',
    '--biolink-glow-color': glow.color,
    '--biolink-glow-opacity': glow.opacity,
    '--biolink-glow-blur': `${glow.blur}px`,
    '--biolink-glow-spread': `${glow.spread}px`,
  } as CSSProperties;
}

function cursorStyle(
  appearance?: AdvancedAppearanceConfig | null,
): CSSProperties | undefined {
  const color = appearance?.effectsConfig?.effectColor;
  return color
    ? ({'--biolink-effect-color': color} as CSSProperties)
    : undefined;
}

function colorWithAlpha(color: string, alpha: number): string {
  if (!color.startsWith('#')) {
    return color;
  }

  const hex = color.slice(1);
  const normalized =
    hex.length === 3
      ? hex
          .split('')
          .map(char => `${char}${char}`)
          .join('')
      : hex.slice(0, 6);

  if (normalized.length !== 6) {
    return color;
  }

  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);

  return `rgb(${red} ${green} ${blue} / ${alpha})`;
}

function escapeCssUrl(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
