import {BackgroundStyle} from '@app/dashboard/biolink/biolink-editor/appearance/background-style';
import {BiolinkAssetPickerDialog} from '@app/dashboard/biolink/biolink-editor/assets/biolink-asset-picker-dialog';
import {Tooltip} from '@shadcn/tooltip/tooltip';
import {
  AdvancedAppearanceConfig,
  AudioPromptConfig,
  AppearanceConfig,
  BackgroundEffect,
  applyThemeToAppearance,
  bannerBackgroundStyle,
  bannerGradientFrom,
  bannerGradientTo,
  compactFontConfig,
  defaultBadgeConfig,
  defaultDesktopConfig,
  defaultEffectsConfig,
  defaultHeaderConfig,
  defaultHeaderShapeVariant,
  defaultMediaConfig,
  defaultButtonConfig,
  BadgeConfigItem,
  DesktopConfig,
  EffectsConfig,
  GlowConfig,
  headerShapePath,
  HeaderShapeVariant,
  headerShapeVariants,
  HeaderLayout,
  isBannerLayout,
  isShapeLayout,
  isThemeLocked,
  mergeHeaderConfig,
  normalizeHeaderShapeVariant,
  resolveImageUrl,
  resolvedMediaEffect,
  resolvedParticlePreset,
  ThemeCategory,
  themeCategory,
  unlockThemeForCustomization,
} from '@app/dashboard/biolink/biolink-editor/appearance/biolink-theme-utils';
import {
  BiolinkFileSelector,
  BiolinkFileSelectorIcons,
} from '@app/dashboard/biolink/biolink-editor/appearance/biolink-file-selector';
import {BoxStyle} from '@app/dashboard/biolink/biolink-editor/appearance/box-style';
import {FooterStyle} from '@app/dashboard/biolink/biolink-editor/appearance/footer-style';
import {
  VisualOptionCard,
  VisualOptionGrid,
} from '@app/dashboard/biolink/biolink-editor/visual-option-card';
import {
  ButtonStyle,
  SliderSelector,
} from '@app/dashboard/biolink/biolink-editor/appearance/button-style';
import {appearanceHeaderClassnames} from '@app/dashboard/biolink/biolink-editor/appearance/header-classnames';
import {
  CuratedLockTooltip,
  ThemeCardFromTheme,
  ThemePreviewCard,
} from '@app/dashboard/biolink/biolink-editor/appearance/theme-preview-card';
import {useBiolinkEditorStore} from '@app/dashboard/biolink/biolink-editor/biolink-editor-store';
import {useUsage} from '@app/dashboard/use-usage';
import {importBiolinkTheme} from '@app/gen/biolinks';
import {listBiolinkThemes} from '@app/gen/biolink-themes';
import {showHttpErrorToast} from '@common/http/errors/show-http-error-toast';
import {apiClient, queryClient} from '@common/http/query-client';
import type {BiolinkAppearanceConfigHeaderConfig} from '@app/gen/schemas/biolink-appearance-config-header-config';
import type {BiolinkTheme} from '@app/gen/schemas/biolink-theme';
import {BiolinkLayout} from '@app/short-links/renderers/biolink-renderer/biolink-layout';
import {UploadType} from '@app/site-config';
import {useAuth} from '@common/auth/use-auth';
import {NoFeaturePermissionPopover} from '@common/billing/upgrade/no-permission-button';
import {
  type BiolinkPlanFeature,
  useBiolinkFeatureStatus,
} from '@app/dashboard/upgrade/use-feature-status';
import {
  FontDisplayName,
  FontSelector as CommonFontSelector,
} from '@common/ui/font-selector/font-selector';
import {ImageSelector} from '@common/uploads/components/image-selector';
import {FileUploadProvider} from '@common/uploads/uploader/file-upload-provider';
import {Alert} from '@shadcn/alert/alert';
import {Button, buttonVariants} from '@shadcn/button/button';
import {Checkbox} from '@shadcn/forms/checkbox/checkbox';
import {Dialog} from '@shadcn/dialog/dialog';
import {Input} from '@shadcn/forms/input/input';
import {Slider} from '@shadcn/forms/slider/slider';
import {Switch} from '@shadcn/forms/switch/switch';
import {Skeleton} from '@shadcn/skeleton/skeleton';
import {Textarea} from '@shadcn/forms/textarea/textarea';
import {Tabs} from '@shadcn/tabs/tabs';
import {toast} from '@shadcn/toast/toast';
import {ColorField} from '@ui/color-picker/color-field';
import {BrowserSafeFonts} from '@ui/fonts/font-picker/browser-safe-fonts';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {useSettings} from '@ui/settings/use-settings';
import {cn} from '@ui/utils/cn';
import {FileInputType} from '@ui/utils/files/file-input-config';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  BadgeCheckIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  CrownIcon,
  ExternalLinkIcon,
  GiftIcon,
  ImageIcon,
  LockIcon,
  MonitorIcon,
  MousePointerClickIcon,
  PaintbrushIcon,
  SearchIcon,
  ShuffleIcon,
  SmartphoneIcon,
  SparklesIcon,
  TypeIcon,
  UserRoundIcon,
  XIcon,
  type LucideIcon,
  SquareIcon,
  RotateCcwIcon,
  PanelBottomIcon,
  PackagePlusIcon,
  StarIcon,
} from 'lucide-react';
import {
  ReactNode,
  type CSSProperties,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';

type AppearancePanel =
  | 'theme'
  | 'header'
  | 'wallpaper'
  | 'buttons'
  | 'boxes'
  | 'footer'
  | 'desktop'
  | 'effects'
  | 'badges';
type SetHeaderValue = (
  partial: Partial<BiolinkAppearanceConfigHeaderConfig>,
  markThemeModified?: boolean,
) => void;
type ThemePanelCategory = ThemeCategory;
type DevicePreview = 'mobile' | 'desktop';
type ModelMetadata = {
  previewImage?: string;
  isModel?: boolean;
  device?: 'mobile' | 'desktop' | 'both';
  tags?: string[];
  requiredFeatures?: BiolinkPlanFeature[];
  contentBlueprint?: {version?: number};
};
type ModelTheme = BiolinkTheme & {
  metadata?: ModelMetadata | null;
};
type BadgeCatalogItem = {
  key: string;
  kind: 'official' | 'event';
  category: string;
  access_type: 'free' | 'premium' | 'paid' | 'award' | 'automatic';
  reference?: string | null;
  label: string;
  description: string;
  label_text: string;
  description_text: string;
  icon?: string | null;
  color?: string | null;
  required_feature?: string | null;
  grant_mode: 'admin' | 'claim' | 'derived';
  repeat_yearly: boolean;
  show_year: boolean;
  action_url?: string | null;
  starts_at?: string | null;
  claim_until?: string | null;
  owned: boolean;
  can_claim: boolean;
  status:
    | 'owned'
    | 'claimable'
    | 'upcoming'
    | 'expired'
    | 'locked'
    | 'premium'
    | 'purchasable'
    | 'admin_only'
    | 'unavailable'
    | null;
  edition_year?: number | null;
  owned_years: number[];
  latest_edition_year?: number | null;
  times_claimed: number;
};

type BadgeCatalogFilter = 'all' | 'available' | 'owned' | 'premium' | 'events';

const featuredBackgroundEffects: {
  value: NonNullable<EffectsConfig['mediaEffect']>;
  label: ReactNode;
  preview?: ReactNode;
}[] = [
  {
    value: 'none',
    label: <Trans message="None" />,
    preview: <EffectPreview effect="none" />,
  },
  {
    value: 'aurora',
    label: <Trans message="Aurora boreal" />,
    preview: <EffectPreview effect="aurora" />,
  },
  {
    value: 'tv',
    label: <Trans message="Old TV" />,
    preview: <EffectPreview effect="tv" />,
  },
  {
    value: 'blur',
    label: <Trans message="Blurred background" />,
    preview: <EffectPreview effect="blur" />,
  },
  {
    value: 'night',
    label: <Trans message="Night" />,
    preview: <EffectPreview effect="night" />,
  },
  {
    value: 'spotlight',
    label: <Trans message="Spotlight" />,
    preview: <EffectPreview effect="spotlight" />,
  },
];

const particlePresetEffects: {
  value: BackgroundEffect;
  label: ReactNode;
  preview: ReactNode;
}[] = [
  {
    value: 'none',
    label: <Trans message="None" />,
    preview: <EffectPreview effect="none" />,
  },
  {
    value: 'stars',
    label: <Trans message="Stars" />,
    preview: <EffectPreview effect="stars" />,
  },
  {
    value: 'particles',
    label: <Trans message="Particles" />,
    preview: <EffectPreview effect="particles" />,
  },
  {
    value: 'snow',
    label: <Trans message="Snow" />,
    preview: <EffectPreview effect="snow" />,
  },
  {
    value: 'rain',
    label: <Trans message="Rain" />,
    preview: <EffectPreview effect="rain" />,
  },
  {
    value: 'ambient',
    label: <Trans message="Ambient" />,
    preview: <EffectPreview effect="ambient" />,
  },
  {
    value: 'big-circles',
    label: <Trans message="Big circles" />,
    preview: <EffectPreview effect="big-circles" />,
  },
  {
    value: 'bubbles',
    label: <Trans message="Bubbles" />,
    preview: <EffectPreview effect="bubbles" />,
  },
  {
    value: 'confetti',
    label: <Trans message="Confetti" />,
    preview: <EffectPreview effect="confetti" />,
  },
  {
    value: 'confetti-cannon',
    label: <Trans message="Confetti cannon" />,
    preview: <EffectPreview effect="confetti-cannon" />,
  },
  {
    value: 'confetti-explosions',
    label: <Trans message="Confetti explosions" />,
    preview: <EffectPreview effect="confetti-explosions" />,
  },
  {
    value: 'confetti-falling',
    label: <Trans message="Confetti falling" />,
    preview: <EffectPreview effect="confetti-falling" />,
  },
  {
    value: 'confetti-parade',
    label: <Trans message="Confetti parade" />,
    preview: <EffectPreview effect="confetti-parade" />,
  },
  {
    value: 'party',
    label: <Trans message="Party" />,
    preview: <EffectPreview effect="party" />,
  },
  {
    value: 'fire',
    label: <Trans message="Fire" />,
    preview: <EffectPreview effect="fire" />,
  },
  {
    value: 'firefly',
    label: <Trans message="Firefly" />,
    preview: <EffectPreview effect="firefly" />,
  },
  {
    value: 'fireworks',
    label: <Trans message="Fireworks" />,
    preview: <EffectPreview effect="fireworks" />,
  },
  {
    value: 'fountain',
    label: <Trans message="Fountain" />,
    preview: <EffectPreview effect="fountain" />,
  },
  {
    value: 'hyperspace',
    label: <Trans message="Hyperspace" />,
    preview: <EffectPreview effect="hyperspace" />,
  },
  {
    value: 'links',
    label: <Trans message="Links" />,
    preview: <EffectPreview effect="links" />,
  },
  {
    value: 'matrix',
    label: <Trans message="Matrix" />,
    preview: <EffectPreview effect="matrix" />,
  },
  {
    value: 'meteors',
    label: <Trans message="Meteors" />,
    preview: <EffectPreview effect="meteors" />,
  },
  {
    value: 'ribbons',
    label: <Trans message="Ribbons" />,
    preview: <EffectPreview effect="ribbons" />,
  },
  {
    value: 'sea-anemone',
    label: <Trans message="Sea anemone" />,
    preview: <EffectPreview effect="sea-anemone" />,
  },
  {
    value: 'squares',
    label: <Trans message="Squares" />,
    preview: <EffectPreview effect="squares" />,
  },
  {
    value: 'triangles',
    label: <Trans message="Triangles" />,
    preview: <EffectPreview effect="triangles" />,
  },
];

const usernameEffectOptions: {
  value: NonNullable<EffectsConfig['usernameEffect']>;
  label: ReactNode;
  preview?: ReactNode;
}[] = [
  {
    value: 'none',
    label: <Trans message="None" />,
    preview: <UsernameEffectPreview effect="none" />,
  },
  {
    value: 'glow',
    label: <Trans message="Glow" />,
    preview: <UsernameEffectPreview effect="glow" />,
  },
  {
    value: 'pulse',
    label: <Trans message="Pulse" />,
    preview: <UsernameEffectPreview effect="pulse" />,
  },
  {
    value: 'scanline',
    label: <Trans message="Scanline" />,
    preview: <UsernameEffectPreview effect="scanline" />,
  },
  {
    value: 'rainbow',
    label: <Trans message="Rainbow" />,
    preview: <UsernameEffectPreview effect="rainbow" />,
  },
  {
    value: 'sparkle',
    label: <Trans message="Sparkle" />,
    preview: <UsernameEffectPreview effect="sparkle" />,
  },
  {
    value: 'glitch',
    label: <Trans message="Glitch" />,
    preview: <UsernameEffectPreview effect="glitch" />,
  },
  {
    value: 'shimmer',
    label: <Trans message="Shimmer" />,
    preview: <UsernameEffectPreview effect="shimmer" />,
  },
];

export function Component() {
  const [panel, setPanel] = useState<AppearancePanel>('theme');
  const [resetOpen, setResetOpen] = useState(false);

  return (
    <FileUploadProvider>
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">
              <Trans message="Appearance" />
            </h1>
            <p className="text-sm text-muted-foreground">
              <Trans message="Customize the visual presentation of your page." />
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            color="default"
            onClick={() => setResetOpen(true)}
          >
            <RotateCcwIcon data-icon="inline-start" />
            <Trans message="Reset appearance" />
          </Button>
        </div>
        <PanelNav activePanel={panel} onChange={setPanel} />
        {panel === 'theme' && <ThemePanel />}
        {panel === 'header' && <HeaderPanel />}
        {panel === 'wallpaper' && <WallpaperPanel />}
        {panel === 'buttons' && <ButtonsPanel />}
        {panel === 'boxes' && <BoxStyle />}
        {panel === 'footer' && <FooterStyle />}
        {panel === 'desktop' && <DesktopPanel />}
        {panel === 'effects' && <EffectsPanel />}
        {panel === 'badges' && <BadgesPanel />}
      </div>
      <ResetAppearanceDialog open={resetOpen} onOpenChange={setResetOpen} />
    </FileUploadProvider>
  );
}

type AppearanceResetScope =
  | 'colorsFonts'
  | 'header'
  | 'buttons'
  | 'blocks'
  | 'effects'
  | 'desktop'
  | 'badges';

const appearanceResetScopes: AppearanceResetScope[] = [
  'colorsFonts',
  'header',
  'buttons',
  'blocks',
  'effects',
  'desktop',
  'badges',
];

function ResetAppearanceDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const appearance = useBiolinkEditorStore(s => s.appearance);
  const updateAppearance = useBiolinkEditorStore(s => s.updateAppearance);
  const [selected, setSelected] = useState<AppearanceResetScope[]>(
    appearanceResetScopes,
  );

  useEffect(() => {
    if (open) {
      setSelected(appearanceResetScopes);
    }
  }, [open]);

  const toggle = (scope: AppearanceResetScope) => {
    setSelected(current =>
      current.includes(scope)
        ? current.filter(item => item !== scope)
        : [...current, scope],
    );
  };

  const reset = () => {
    if (!selected.length) return;

    updateAppearance(resetAppearanceConfig(appearance, selected));
    onOpenChange(false);
    toast.success(<Trans message="Visual settings restored." />);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Content className="sm:max-w-xl">
          <Dialog.Header>
            <Dialog.Title>
              <RotateCcwIcon />
              <Trans message="Reset appearance" />
            </Dialog.Title>
            <Dialog.Description>
              <Trans message="Restore selected visual settings without deleting uploaded media, backgrounds or music." />
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.Body>
            <div className="grid gap-2 sm:grid-cols-2">
              <ResetScopeOption
                checked={selected.includes('colorsFonts')}
                label={<Trans message="Colors and fonts" />}
                description={
                  <Trans message="Page, header and visual palette." />
                }
                onChange={() => toggle('colorsFonts')}
              />
              <ResetScopeOption
                checked={selected.includes('header')}
                label={<Trans message="Header" />}
                description={
                  <Trans message="Layout and visual header options." />
                }
                onChange={() => toggle('header')}
              />
              <ResetScopeOption
                checked={selected.includes('buttons')}
                label={<Trans message="Buttons" />}
                description={
                  <Trans message="Global button style and colors." />
                }
                onChange={() => toggle('buttons')}
              />
              <ResetScopeOption
                checked={selected.includes('blocks')}
                label={<Trans message="Blocks" />}
                description={
                  <Trans message="Widget surfaces and block style." />
                }
                onChange={() => toggle('blocks')}
              />
              <ResetScopeOption
                checked={selected.includes('effects')}
                label={<Trans message="Effects" />}
                description={
                  <Trans message="Particles, glow and animations." />
                }
                onChange={() => toggle('effects')}
              />
              <ResetScopeOption
                checked={selected.includes('desktop')}
                label={<Trans message="Desktop" />}
                description={<Trans message="Desktop layout and surface." />}
                onChange={() => toggle('desktop')}
              />
              <ResetScopeOption
                checked={selected.includes('badges')}
                label={<Trans message="Badges" />}
                description={<Trans message="Badges selected for this page." />}
                onChange={() => toggle('badges')}
              />
            </div>
            <div className="mt-4 rounded-card-sm border border-dashed p-3 text-sm text-muted-foreground">
              <Trans message="Uploaded images, background settings, video, cursor and music are kept." />
            </div>
          </Dialog.Body>
          <Dialog.Footer>
            <Dialog.CloseButton>
              <Trans message="Cancel" />
            </Dialog.CloseButton>
            <Button type="button" onClick={reset} disabled={!selected.length}>
              <RotateCcwIcon data-icon="inline-start" />
              <Trans message="Restore selected" />
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ResetScopeOption({
  checked,
  description,
  label,
  onChange,
}: {
  checked: boolean;
  description: ReactNode;
  label: ReactNode;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-card-sm border p-3 has-data-checked:border-primary has-data-checked:bg-primary/5">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  );
}

function resetAppearanceConfig(
  appearance: AppearanceConfig,
  selected: AppearanceResetScope[],
): AppearanceConfig {
  const has = (scope: AppearanceResetScope) => selected.includes(scope);
  const currentHeader = appearance.headerConfig ?? {};
  const currentEffects = appearance.effectsConfig ?? {};
  const currentDesktop = appearance.desktopConfig ?? {};
  const currentBox = appearance.boxConfig ?? {};
  const currentButton = appearance.btnConfig ?? {};
  const currentCard = appearance.cardConfig ?? {};
  const preservedHeader = {
    title: currentHeader.title,
    bio: currentHeader.bio,
    image: currentHeader.image,
    logo: currentHeader.logo,
    bannerImage: currentHeader.bannerImage,
    bannerBackgroundType: currentHeader.bannerBackgroundType,
    bannerGradientFrom: currentHeader.bannerGradientFrom,
    bannerGradientTo: currentHeader.bannerGradientTo,
  };
  const next: AppearanceConfig = {...appearance};

  if (has('header')) {
    next.headerConfig = compactConfig({
      ...defaultHeaderConfig,
      ...preservedHeader,
    });
  } else if (has('colorsFonts')) {
    next.headerConfig = compactConfig({
      ...currentHeader,
      titleColor: defaultHeaderConfig.titleColor,
      alternativeFont: false,
      titleFontConfig: undefined,
    });
  }

  if (has('colorsFonts')) {
    next.fontConfig = undefined;
    next.btnConfig = compactConfig({
      ...currentButton,
      color: defaultButtonConfig.color,
      textColor: defaultButtonConfig.textColor,
      borderColor: undefined,
      iconColor: undefined,
      shadowColor: undefined,
    });
    next.boxConfig = compactConfig({
      ...currentBox,
      color: undefined,
      textColor: undefined,
      borderColor: undefined,
      shadowColor: undefined,
    });
    next.cardConfig = compactConfig({
      ...currentCard,
      backgroundColor: undefined,
      textColor: undefined,
      borderColor: undefined,
      shadowColor: undefined,
      fontConfig: undefined,
    });
    next.desktopConfig = compactConfig({
      ...currentDesktop,
      panelBackgroundColor: undefined,
      panelTextColor: undefined,
    });
    next.effectsConfig = compactConfig({
      ...currentEffects,
      effectColor: defaultEffectsConfig.effectColor,
      effectSecondaryColor: defaultEffectsConfig.effectSecondaryColor,
      effectTertiaryColor: defaultEffectsConfig.effectTertiaryColor,
      glow: currentEffects.glow
        ? compactConfig({...currentEffects.glow, customColor: undefined})
        : undefined,
    });
  }

  if (has('buttons')) {
    next.btnConfig = {...defaultButtonConfig};
  }
  if (has('blocks')) {
    next.boxConfig = undefined;
    next.cardConfig = undefined;
  }
  if (has('effects')) {
    next.effectsConfig = {...defaultEffectsConfig};
  }
  if (has('desktop')) {
    next.desktopConfig = {...defaultDesktopConfig};
  }
  if (has('badges')) {
    next.badgeConfig = {...defaultBadgeConfig};
  }

  return unlockThemeForCustomization(next);
}

function PanelNav({
  activePanel,
  onChange,
}: {
  activePanel: AppearancePanel;
  onChange: (panel: AppearancePanel) => void;
}) {
  const items: {
    id: AppearancePanel;
    label: ReactNode;
    icon: LucideIcon;
  }[] = [
    {id: 'theme', label: <Trans message="Theme" />, icon: SparklesIcon},
    {id: 'header', label: <Trans message="Header" />, icon: UserRoundIcon},
    {id: 'wallpaper', label: <Trans message="Wallpaper" />, icon: ImageIcon},
    {
      id: 'buttons',
      label: <Trans message="Buttons" />,
      icon: MousePointerClickIcon,
    },
    {id: 'boxes', label: <Trans message="Blocks" />, icon: SquareIcon},
    {id: 'footer', label: <Trans message="Footer" />, icon: PanelBottomIcon},
    {id: 'desktop', label: <Trans message="Desktop" />, icon: MonitorIcon},
    {id: 'effects', label: <Trans message="Effects" />, icon: SparklesIcon},
    {id: 'badges', label: <Trans message="Badges" />, icon: BadgeCheckIcon},
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map(item => {
        const Icon = item.icon;
        const active = activePanel === item.id;

        return (
          <Button
            key={item.id}
            type="button"
            variant={active ? 'default' : 'outline'}
            color={active ? 'primary' : 'default'}
            className="justify-start"
            onClick={() => onChange(item.id)}
          >
            <Icon data-icon="inline-start" />
            {item.label}
          </Button>
        );
      })}
    </div>
  );
}

function ThemePanel() {
  const [category, setCategory] = useState<ThemePanelCategory>('customizable');
  const [device, setDevice] = useState<DevicePreview>('mobile');
  const [previewTheme, setPreviewTheme] = useState<ModelTheme | null>(null);
  const appearance = useBiolinkEditorStore(s => s.appearance);
  const updateAppearance = useBiolinkEditorStore(s => s.updateAppearance);
  const themesQuery = useQuery({
    staleTime: Infinity,
    retry: 1,
    queryKey: ['biolink-themes', category],
    queryFn: () => {
      const params: any = {};
      if (category === 'starred') {
        params.starred = true;
      } else if (category === 'user') {
        params.mine = true;
      } else {
        params.category = category;
      }
      return listBiolinkThemes(params);
    },
  });
  const visibleThemes = useMemo(
    () => themesQuery.data?.data ?? [],
    [themesQuery.data?.data],
  );
  const activeSlug = appearance.theme?.slug;
  const customActive = !activeSlug || appearance.theme?.modified;

  const applyTheme = (theme: BiolinkTheme) => {
    updateAppearance(applyThemeToAppearance(theme, appearance));
  };

  const shuffleTheme = () => {
    if (!visibleThemes.length) return;
    const theme =
      visibleThemes[Math.floor(Math.random() * visibleThemes.length)];
    applyTheme(theme);
  };

  return (
    <section>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className={appearanceHeaderClassnames.h2}>
          <Trans message="Theme" />
        </h2>
        <div className="flex gap-2">
          <SaveThemeDialog appearance={appearance} />
          <Button
            type="button"
            variant="outline"
            color="default"
            onClick={shuffleTheme}
            disabled={!visibleThemes.length}
          >
            <ShuffleIcon data-icon="inline-start" />
            <Trans message="Shuffle" />
          </Button>
        </div>
      </div>

      <Tabs.Root
        value={category}
        onValueChange={value => setCategory(value as ThemePanelCategory)}
        className="gap-6"
      >
        <Tabs.List variant="line" className="overflow-x-auto whitespace-nowrap">
          <Tabs.Tab value="customizable">
            <Trans message="Customizable" />
          </Tabs.Tab>
          <Tabs.Tab value="curated">
            <Trans message="Curated" />
          </Tabs.Tab>
          <Tabs.Tab value="user">
            <Trans message="My Themes" />
          </Tabs.Tab>
          <Tabs.Tab value="community">
            <Trans message="Community" />
          </Tabs.Tab>
          <Tabs.Tab value="starred">
            <Trans message="Starred" />
          </Tabs.Tab>
        </Tabs.List>

        {themesQuery.isError ? (
          <Alert.Root className="mb-6" fillStyle="subtleFill">
            <Alert.Title>
              <Trans message="Could not load themes" />
            </Alert.Title>
            <Alert.Description>
              <Trans message="Run the biolink theme migration, then refresh this page." />
            </Alert.Description>
          </Alert.Root>
        ) : null}

        <Tabs.Panel value="customizable">
          <ThemeGrid isLoading={themesQuery.isLoading && !themesQuery.isError}>
            <ThemePreviewCard
              custom
              active={customActive}
              label={<Trans message="Custom" />}
              onClick={() =>
                updateAppearance(unlockThemeForCustomization(appearance))
              }
            />
            {visibleThemes.map(theme => (
              <ThemeCardFromTheme
                key={theme.slug}
                theme={theme}
                active={
                  activeSlug === theme.slug && !appearance.theme?.modified
                }
                onClick={() => setPreviewTheme(theme as ModelTheme)}
              />
            ))}
          </ThemeGrid>
        </Tabs.Panel>

        <Tabs.Panel value="curated">
          <Alert.Root className="mb-6" fillStyle="subtleFill">
            <LockIcon />
            <Alert.Description>
              <Trans message="Curated themes are locked for visual editing. Use Customize from this theme when you want a personal copy." />
            </Alert.Description>
          </Alert.Root>
          <ThemeGrid isLoading={themesQuery.isLoading && !themesQuery.isError}>
            {visibleThemes.map(theme => (
              <ThemeCardFromTheme
                key={theme.slug}
                theme={theme}
                active={
                  activeSlug === theme.slug && !appearance.theme?.modified
                }
                onClick={() => setPreviewTheme(theme as ModelTheme)}
              />
            ))}
          </ThemeGrid>
        </Tabs.Panel>

        <Tabs.Panel value="user">
          <ThemeGrid isLoading={themesQuery.isLoading && !themesQuery.isError}>
            {visibleThemes.map(theme => (
              <ThemeCardFromTheme
                key={theme.slug}
                theme={theme}
                active={
                  activeSlug === theme.slug && !appearance.theme?.modified
                }
                onClick={() => setPreviewTheme(theme as ModelTheme)}
              />
            ))}
            {!visibleThemes.length && (
              <div className="col-span-full py-8 text-center text-sm text-muted-foreground">
                <Trans message="You haven't saved any themes yet." />
              </div>
            )}
          </ThemeGrid>
        </Tabs.Panel>

        <Tabs.Panel value="community">
          <ThemeGrid isLoading={themesQuery.isLoading && !themesQuery.isError}>
            {visibleThemes.map(theme => (
              <ThemeCardFromTheme
                key={theme.slug}
                theme={theme}
                active={
                  activeSlug === theme.slug && !appearance.theme?.modified
                }
                onClick={() => setPreviewTheme(theme as ModelTheme)}
              />
            ))}
            {!visibleThemes.length && (
              <div className="col-span-full py-8 text-center text-sm text-muted-foreground">
                <Trans message="No community themes available yet." />
              </div>
            )}
          </ThemeGrid>
        </Tabs.Panel>

        <Tabs.Panel value="starred">
          <ThemeGrid isLoading={themesQuery.isLoading && !themesQuery.isError}>
            {visibleThemes.map(theme => (
              <ThemeCardFromTheme
                key={theme.slug}
                theme={theme}
                active={
                  activeSlug === theme.slug && !appearance.theme?.modified
                }
                onClick={() => setPreviewTheme(theme as ModelTheme)}
              />
            ))}
            {!visibleThemes.length && (
              <div className="col-span-full py-8 text-center text-sm text-muted-foreground">
                <Trans message="You haven't starred any themes yet." />
              </div>
            )}
          </ThemeGrid>
        </Tabs.Panel>
      </Tabs.Root>
      {previewTheme ? (
        <ModelPreviewDialog
          device={device}
          theme={previewTheme}
          open
          onDeviceChange={setDevice}
          onOpenChange={open => {
            if (!open) setPreviewTheme(null);
          }}
        />
      ) : null}
    </section>
  );
}

function ThemeGrid({
  children,
  isLoading,
}: {
  children: ReactNode;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="rounded-card border p-6 text-sm text-muted-foreground">
        <Trans message="Loading themes..." />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-5">
      {children}
    </div>
  );
}

function ModelPreviewDialog({
  device,
  onDeviceChange,
  onOpenChange,
  open,
  theme,
}: {
  device: DevicePreview;
  onDeviceChange: (device: DevicePreview) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  theme: ModelTheme;
}) {
  const biolink = useBiolinkEditorStore(s => s.biolink);
  const content = useBiolinkEditorStore(s => s.content);
  const appearance = useBiolinkEditorStore(
    s => s.appearance as AdvancedAppearanceConfig,
  );
  const updateAppearance = useBiolinkEditorStore(s => s.updateAppearance);
  const setAppearanceIsDirty = useBiolinkEditorStore(
    s => s.setAppearanceIsDirty,
  );
  const overrideContent = useBiolinkEditorStore(s => s.overrideContent);
  const {disabled: galleryDisabled} = useBiolinkFeatureStatus('model_gallery');
  const usageQuery = useUsage();
  const missingFeatures = missingModelFeatures(
    theme,
    usageQuery.data?.data.biolinks as Record<string, boolean> | undefined,
    galleryDisabled,
  );
  const nextAppearance = applyThemeToAppearance(theme, appearance);
  const hasContentBlueprint =
    theme.metadata?.isModel && theme.metadata.contentBlueprint?.version === 1;
  const importTheme = useMutation({
    mutationFn: () => importBiolinkTheme(biolink.id, theme.id),
    onSuccess: response => {
      if (response.data.appearance?.config) {
        updateAppearance(response.data.appearance.config);
        setAppearanceIsDirty(false);
      }
      overrideContent(response.data.content ?? []);
      void queryClient.invalidateQueries({
        queryKey: ['biolinks', `${biolink.id}`],
      });
      toast.success(
        <Trans
          message="Theme imported with :count new blocks. Review them before activating."
          values={{count: response.meta.imported_widgets_count}}
        />,
      );
      onOpenChange(false);
    },
    onError: err => showHttpErrorToast(err),
  });

  const applyModel = () => {
    updateAppearance(nextAppearance);
    toast.success(
      <Trans message="Theme appearance applied. Save changes to publish." />,
    );
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Content className="sm:max-w-6xl">
          <Dialog.Header>
            <Dialog.Title>
              <SparklesIcon />
              {theme.name}
            </Dialog.Title>
            <Dialog.Description>
              <Trans message="Preview the visual style, then apply only the appearance or import the complete theme with its blocks." />
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.Body>
            {hasContentBlueprint ? (
              <Alert.Root className="mb-4" fillStyle="subtleFill">
                <PackagePlusIcon />
                <Alert.Title>
                  <Trans message="Complete theme available" />
                </Alert.Title>
                <Alert.Description>
                  <Trans message="Importing keeps your existing content and restores only missing theme blocks. New blocks stay inactive until you review them." />
                </Alert.Description>
              </Alert.Root>
            ) : null}
            <div className="mb-4 flex justify-end">
              <DeviceTabs value={device} onChange={onDeviceChange} />
            </div>
            <div className="flex justify-center">
              <div
                className={cn(
                  'overflow-hidden rounded-card border bg-black',
                  device === 'mobile'
                    ? 'h-181 w-87.5 rounded-[48px] border-8 border-[#444546]'
                    : 'h-[70vh] w-full max-w-5xl',
                )}
              >
                <BiolinkLayout
                  biolink={biolink}
                  content={content}
                  appearance={nextAppearance}
                  isPreview
                  className="h-full"
                />
              </div>
            </div>
          </Dialog.Body>
          <Dialog.Footer>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              <Trans message="Cancel" />
            </Button>
            <Button
              type="button"
              variant={hasContentBlueprint ? 'outline' : 'default'}
              onClick={applyModel}
              disabled={missingFeatures.length > 0 || importTheme.isPending}
            >
              <Trans message="Apply appearance only" />
            </Button>
            {hasContentBlueprint ? (
              <Button
                type="button"
                onClick={() => importTheme.mutate()}
                disabled={missingFeatures.length > 0 || importTheme.isPending}
              >
                <PackagePlusIcon data-icon="inline-start" />
                <Trans message="Import complete theme" />
              </Button>
            ) : null}
            <StarThemeButton theme={theme} />
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function StarThemeButton({theme}: {theme: BiolinkTheme}) {
  const queryClient = useQueryClient();
  const [isStarred, setIsStarred] = useState(false);
  const starTheme = useMutation({
    mutationFn: (star: boolean) =>
      apiClient[star ? 'post' : 'delete'](`/biolink-themes/${theme.id}/star`).then(
        r => r.data,
      ),
    onSuccess: (data: any) => {
      setIsStarred(data.starred);
      queryClient.invalidateQueries({queryKey: ['biolink-themes']});
    },
  });

  const {Root: TooltipRoot, Trigger: TooltipTrigger, Content: TooltipContent} = Tooltip;
  return (
    <TooltipRoot>
      <TooltipTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            type="button"
            onClick={() => starTheme.mutate(!isStarred)}
            disabled={starTheme.isPending}
          />
        }
      >
        <StarIcon
          className={cn('icon-sm', isStarred && 'fill-primary text-primary')}
        />
      </TooltipTrigger>
      <TooltipContent>
        <Trans message="Favoritar" />
      </TooltipContent>
    </TooltipRoot>
  );
}

function SaveThemeDialog({appearance}: {appearance: AdvancedAppearanceConfig}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [shareAsPublic, setShareAsPublic] = useState(false);
  const queryClient = useQueryClient();
  const createTheme = useMutation({
    mutationFn: () =>
      apiClient.post('/biolink-themes', {
        name,
        category: shareAsPublic ? 'community' : 'user',
        config: appearance,
      }).then(r => r.data),
    onSuccess: () => {
      toast.success(<Trans message="Theme saved successfully" />);
      queryClient.invalidateQueries({queryKey: ['biolink-themes']});
      setOpen(false);
      setName('');
      setShareAsPublic(false);
    },
    onError: err => showHttpErrorToast(err),
  });

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        render={
          <Button variant="outline" color="default" type="button">
            <Trans message="Save Theme" />
          </Button>
        }
      />
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Content className="sm:max-w-md">
          <Dialog.Header>
            <Dialog.Title>
              <Trans message="Save Theme" />
            </Dialog.Title>
            <Dialog.Description>
              <Trans message="Save your current appearance settings as a reusable theme." />
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.Body>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium" htmlFor="theme-name">
                  <Trans message="Theme Name" />
                </label>
                <input
                  id="theme-name"
                  type="text"
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="My Awesome Theme"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="rounded border-input text-primary focus-visible:ring-primary"
                  checked={shareAsPublic}
                  onChange={e => setShareAsPublic(e.target.checked)}
                />
                <Trans message="Share this theme publicly with the community" />
              </label>
            </div>
          </Dialog.Body>
          <Dialog.Footer>
            <Dialog.CloseButton>
              <Trans message="Cancel" />
            </Dialog.CloseButton>
            <Button
              type="button"
              variant="default"
              color="primary"
              disabled={!name.trim() || createTheme.isPending}
              onClick={() => createTheme.mutate()}
            >
              <Trans message="Save Theme" />
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DeviceTabs({
  onChange,
  value,
}: {
  onChange: (value: DevicePreview) => void;
  value: DevicePreview;
}) {
  return (
    <Tabs.Root
      value={value}
      onValueChange={next => onChange(next as DevicePreview)}
    >
      <Tabs.List>
        <Tabs.Tab value="mobile">
          <SmartphoneIcon className="size-4" />
          <Trans message="Mobile" />
        </Tabs.Tab>
        <Tabs.Tab value="desktop">
          <MonitorIcon className="size-4" />
          <Trans message="Desktop" />
        </Tabs.Tab>
      </Tabs.List>
    </Tabs.Root>
  );
}

function missingModelFeatures(
  model: ModelTheme,
  biolinkUsage: Record<string, boolean> | undefined,
  galleryDisabled: boolean,
): string[] {
  if (galleryDisabled) {
    return ['model_gallery'];
  }

  return (model.metadata?.requiredFeatures ?? []).filter(
    feature => !biolinkUsage?.[feature],
  );
}

function HeaderPanel() {
  const appearance = useBiolinkEditorStore(s => s.appearance);
  const biolink = useBiolinkEditorStore(s => s.biolink);
  const updateAppearance = useBiolinkEditorStore(s => s.updateAppearance);
  const {trans} = useTrans();
  const locked = isThemeLocked(appearance);
  const header = {
    ...defaultHeaderConfig,
    ...appearance.headerConfig,
  };
  const media = {
    ...defaultMediaConfig,
    ...(appearance as AdvancedAppearanceConfig).mediaConfig,
  };
  const titleLength = header.bio?.length ?? 0;

  const setHeader = (
    partial: Partial<BiolinkAppearanceConfigHeaderConfig>,
    markThemeModified = false,
  ) => {
    updateAppearance(mergeHeaderConfig(appearance, partial), {
      markThemeModified,
    });
  };
  const setMedia = (partial: Partial<typeof media>) => {
    updateAppearance(
      {
        mediaConfig: compactConfig({...media, ...partial}),
      } as AppearanceConfig,
      {markThemeModified: true},
    );
  };

  return (
    <section>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className={appearanceHeaderClassnames.h2}>
          <Trans message="Header" />
        </h2>
        {locked ? <CuratedLockTooltip /> : null}
      </div>

      <div className="flex flex-col gap-7">
        <SettingRow label={<Trans message="Layout" />}>
          <HeaderLayoutSelector
            disabled={locked}
            value={header.layout}
            onChange={value =>
              setHeader(
                value === 'shape'
                  ? {
                      layout: value,
                      shapeVariant:
                        header.shapeVariant ?? defaultHeaderShapeVariant,
                      shapeColor:
                        header.shapeColor ??
                        header.titleColor ??
                        appearance.bgConfig?.color ??
                        '#111111',
                    }
                  : {layout: value},
                true,
              )
            }
          />
        </SettingRow>

        <SettingRow label={<Trans message="Alignment" />}>
          <HeaderAlignmentSelector
            disabled={locked}
            value={header.alignment}
            onChange={value => setHeader({alignment: value})}
          />
        </SettingRow>

        <SettingRow label={<Trans message="Size" />}>
          <SliderSelector
            label={null}
            value={header.avatarSize ?? 96}
            min={0}
            max={250}
            onChange={v => setHeader({avatarSize: v})}
          />
        </SettingRow>

        <SettingRow label={<Trans message="Corner" />}>
          <SliderSelector
            label={null}
            value={header.avatarRadius ?? 9999}
            min={0}
            max={100}
            onChange={v => setHeader({avatarRadius: v})}
          />
        </SettingRow>

        <SettingRow label={<Trans message="Outline" />}>
          <SliderSelector
            label={null}
            value={header.avatarBorderWidth ?? 0}
            min={0}
            max={20}
            onChange={v => setHeader({avatarBorderWidth: v})}
          />
        </SettingRow>

        <SettingRow label={<Trans message="Outline Color" />}>
          {locked ? (
            <ColorReadOnly value={header.avatarBorderColor ?? '#000000'} />
          ) : (
            <ColorField
              label={null}
              value={header.avatarBorderColor ?? '#000000'}
              onChange={v => setHeader({avatarBorderColor: v})}
            />
          )}
        </SettingRow>

        {isShapeLayout(header.layout) ? (
          <SettingRow label={<Trans message="Shape" />}>
            <ShapeVariantSelector
              disabled={locked}
              value={header.shapeVariant}
              shapeColor={
                header.shapeColor ??
                header.titleColor ??
                appearance.bgConfig?.color ??
                '#111111'
              }
              image={header.image}
              onChange={value => setHeader({shapeVariant: value}, true)}
            />
          </SettingRow>
        ) : null}

        <SettingRow label={<Trans message="Profile image" />}>
          <ImageSelector.Avatar
            cropDimensions={{width: 512, height: 512}}
            uploadType={UploadType.linkImages}
            value={header.image}
            onChange={value => setHeader({image: value})}
          />
        </SettingRow>

        <SettingRow label={<Trans message="Avatar side asset" />}>
          <div className="flex flex-wrap items-center gap-3">
            <ImageSelector.Square
              className="size-14"
              cropDimensions={{width: 256, height: 256}}
              placeholderVariant="icon"
              uploadType={UploadType.biolinkMedia}
              value={media.avatarOverride}
              onChange={value => setMedia({avatarOverride: value})}
            />
            <BiolinkAssetPickerDialog
              value={media.avatarOverride}
              categories={['emoji', 'threeD']}
              title={<Trans message="Select avatar side asset" />}
              onSelect={value => setMedia({avatarOverride: value ?? ''})}
            >
              <Dialog.Trigger
                render={<Button variant="outline" type="button" />}
              >
                <ImageIcon data-icon="inline-start" />
                <Trans message="Choose asset" />
              </Dialog.Trigger>
            </BiolinkAssetPickerDialog>
            {media.avatarOverride ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMedia({avatarOverride: ''})}
              >
                <XIcon data-icon="inline-start" />
                <Trans message="Remove" />
              </Button>
            ) : null}
          </div>
        </SettingRow>

        {isBannerLayout(header.layout) ? (
          <SettingRow label={<Trans message="Banner background" />}>
            <BannerBackgroundEditor
              appearance={appearance}
              disabled={locked}
              header={header}
              onChange={setHeader}
            />
          </SettingRow>
        ) : null}

        {isShapeLayout(header.layout) && !header.image ? (
          <SettingRow label={<Trans message="Shape color" />}>
            {locked ? (
              <ColorReadOnly
                value={
                  header.shapeColor ??
                  header.titleColor ??
                  appearance.bgConfig?.color ??
                  '#111111'
                }
              />
            ) : (
              <ColorField
                label={null}
                value={
                  header.shapeColor ??
                  header.titleColor ??
                  appearance.bgConfig?.color ??
                  '#111111'
                }
                onChange={value => setHeader({shapeColor: value}, true)}
              />
            )}
          </SettingRow>
        ) : null}

        <SettingRow label={<Trans message="Title" />}>
          <Input
            bindToHookForm={false}
            value={header.title ?? biolink.name ?? ''}
            maxLength={100}
            onChange={e => setHeader({title: e.target.value})}
          />
        </SettingRow>

        <SettingRow label={<Trans message="Bio" />}>
          <div>
            <Textarea
              bindToHookForm={false}
              rows={4}
              maxLength={160}
              value={header.bio ?? ''}
              placeholder={trans(message('Add a short bio'))}
              onChange={e => setHeader({bio: e.target.value})}
            />
            <div className="mt-1 text-right text-xs text-muted-foreground">
              {titleLength}/160
            </div>
          </div>
        </SettingRow>

        <SettingRow label={<Trans message="Location and status" />}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              bindToHookForm={false}
              value={header.locationText ?? ''}
              maxLength={120}
              placeholder={trans(message('São Paulo, SP'))}
              onChange={event =>
                setHeader({locationText: event.target.value} as never)
              }
            />
            <Input
              bindToHookForm={false}
              value={header.statusText ?? ''}
              maxLength={120}
              placeholder={trans(message('Open now'))}
              onChange={event =>
                setHeader({statusText: event.target.value} as never)
              }
            />
          </div>
        </SettingRow>

        <SettingRow label={<Trans message="Header actions" />}>
          <div className="flex flex-col gap-3">
            <SwitchRow
              checked={header.showShareButton ?? false}
              label={<Trans message="Show share menu" />}
              onChange={showShareButton =>
                setHeader({showShareButton} as never)
              }
            />
            <SwitchRow
              checked={header.showNavigation ?? false}
              label={<Trans message="Show account creation shortcut" />}
              onChange={showNavigation => setHeader({showNavigation} as never)}
            />
            {header.showNavigation ? (
              <p className="text-xs leading-5 text-muted-foreground">
                <Trans message="Displays the platform icon over the header and opens the account creation panel." />
              </p>
            ) : null}
          </div>
        </SettingRow>

        <SettingRow label={<Trans message="Live viewer count" />}>
          <div className="flex flex-col gap-3">
            <label className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">
                <Trans message="Show the number of people viewing this page below the header." />
              </span>
              <Switch
                checked={header.viewerCount?.enabled ?? false}
                disabled={locked}
                onCheckedChange={enabled =>
                  setHeader({
                    viewerCount: {
                      ...header.viewerCount,
                      enabled,
                    },
                  })
                }
              />
            </label>
            {header.viewerCount?.enabled ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <ColorField
                  label={<Trans message="Viewer count color" />}
                  value={header.viewerCount.color ?? '#ffffff'}
                  onChange={color =>
                    setHeader({
                      viewerCount: {...header.viewerCount, color},
                    })
                  }
                />
                <FontDialog
                  disabled={locked}
                  value={header.viewerCount.fontConfig ?? BrowserSafeFonts[0]}
                  onChange={font =>
                    setHeader({
                      viewerCount: {
                        ...header.viewerCount,
                        fontConfig: compactFontConfig({
                          ...header.viewerCount?.fontConfig,
                          ...font,
                        }),
                      },
                    })
                  }
                />
              </div>
            ) : null}
          </div>
        </SettingRow>

        <SettingRow label={<Trans message="Title style" />}>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <VisualOptionCard
                active={header.titleStyle !== 'logo'}
                onClick={() => setHeader({titleStyle: 'text'})}
                label={<Trans message="Text" />}
                preview={<TypeIcon aria-hidden />}
              />
              <VisualOptionCard
                active={header.titleStyle === 'logo'}
                onClick={() => setHeader({titleStyle: 'logo'})}
                label={<Trans message="Logo" />}
                preview={<ImageIcon aria-hidden />}
              />
            </div>
            {header.titleStyle === 'logo' ? (
              <ImageSelector.Input
                uploadType={UploadType.linkImages}
                value={header.logo}
                onChange={value => setHeader({logo: value})}
              />
            ) : null}
          </div>
        </SettingRow>

        {locked ? <LockedVisualNotice /> : null}

        <SettingRow label={<Trans message="Alternative title font" />}>
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              <Trans message="Matches page font by default" />
            </div>
            <Switch
              checked={!!header.alternativeFont}
              disabled={locked}
              onCheckedChange={checked =>
                setHeader({alternativeFont: checked}, true)
              }
            />
          </div>
        </SettingRow>

        {header.alternativeFont && (
          <SettingRow label={<Trans message="Title font" />}>
            <FontDialog
              disabled={locked}
              value={header.titleFontConfig ?? BrowserSafeFonts[0]}
              onChange={font =>
                setHeader(
                  {
                    titleFontConfig: compactFontConfig({
                      ...header.titleFontConfig,
                      ...font,
                    }),
                  },
                  true,
                )
              }
            />
          </SettingRow>
        )}

        <SettingRow label={<Trans message="Title color" />}>
          {locked ? (
            <ColorReadOnly value={header.titleColor ?? '#111111'} />
          ) : (
            <ColorField
              label={null}
              value={header.titleColor ?? '#111111'}
              onChange={value => setHeader({titleColor: value}, true)}
            />
          )}
        </SettingRow>

        <SettingRow label={<Trans message="Page font" />}>
          <PageFontSelector disabled={locked} />
        </SettingRow>
      </div>
    </section>
  );
}

function BannerBackgroundEditor({
  appearance,
  disabled,
  header,
  onChange,
}: {
  appearance: AppearanceConfig;
  disabled?: boolean;
  header: BiolinkAppearanceConfigHeaderConfig;
  onChange: SetHeaderValue;
}) {
  const activeType =
    header.bannerBackgroundType ?? (header.bannerImage ? 'image' : 'gradient');

  if (disabled) {
    return (
      <BannerBackgroundPreview
        appearance={appearance}
        header={header}
        className="max-w-80"
      />
    );
  }

  return (
    <div className="flex max-w-100 flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <VisualOptionCard
          active={activeType === 'gradient'}
          onClick={() => onChange({bannerBackgroundType: 'gradient'}, true)}
          label={<Trans message="Gradient" />}
          preview={<BackgroundTypePreview type="gradient" />}
        />
        <VisualOptionCard
          active={activeType === 'image'}
          onClick={() => onChange({bannerBackgroundType: 'image'}, true)}
          label={<Trans message="Image" />}
          preview={<BackgroundTypePreview type="image" />}
        />
      </div>

      {activeType === 'image' ? (
        <div>
          <div className="mb-2 text-sm font-medium">
            <Trans message="Banner image" />
          </div>
          <ImageSelector.Input
            cropDimensions={{width: 1200, height: 400}}
            uploadType={UploadType.linkImages}
            value={header.bannerImage}
            previewClassName="w-full object-cover"
            onChange={value =>
              onChange(
                {
                  bannerBackgroundType: 'image',
                  bannerImage: value,
                },
                true,
              )
            }
          />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <ColorField
            label={<Trans message="Start color" />}
            value={bannerGradientFrom(header, appearance.bgConfig)}
            onChange={value =>
              onChange(
                {
                  bannerBackgroundType: 'gradient',
                  bannerGradientFrom: value,
                },
                true,
              )
            }
          />
          <ColorField
            label={<Trans message="End color" />}
            value={bannerGradientTo(header, appearance.bgConfig)}
            onChange={value =>
              onChange(
                {
                  bannerBackgroundType: 'gradient',
                  bannerGradientTo: value,
                },
                true,
              )
            }
          />
        </div>
      )}

      <BannerBackgroundPreview appearance={appearance} header={header} />
    </div>
  );
}

function BannerBackgroundPreview({
  appearance,
  className,
  header,
}: {
  appearance: AppearanceConfig;
  className?: string;
  header: BiolinkAppearanceConfigHeaderConfig;
}) {
  return (
    <div
      className={cn(
        'h-20 rounded-card-sm border bg-muted shadow-sm',
        className,
      )}
      style={bannerBackgroundStyle(header, appearance.bgConfig)}
    />
  );
}

function WallpaperPanel() {
  const appearance = useBiolinkEditorStore(s => s.appearance);
  const locked = isThemeLocked(appearance);

  return (
    <section className="flex flex-col gap-8">
      {locked ? <LockedVisualNotice /> : null}
      {locked ? (
        <ThemePreviewCard
          config={appearance}
          label={<Trans message="Current wallpaper" />}
          locked
        />
      ) : (
        <BackgroundStyle />
      )}
      <WallpaperMediaControls />
    </section>
  );
}

function ButtonsPanel() {
  const appearance = useBiolinkEditorStore(s => s.appearance);
  const locked = isThemeLocked(appearance);

  return (
    <section className="flex flex-col gap-8">
      {locked ? <LockedVisualNotice /> : null}
      {locked ? (
        <ThemePreviewCard
          config={appearance}
          label={<Trans message="Current buttons" />}
          locked
        />
      ) : (
        <ButtonStyle />
      )}
      <BrandingStyle />
    </section>
  );
}

function WallpaperMediaControls() {
  const appearance = useBiolinkEditorStore(
    s => s.appearance as AdvancedAppearanceConfig,
  );
  const updateAppearance = useBiolinkEditorStore(s => s.updateAppearance);
  const media = {...defaultMediaConfig, ...appearance.mediaConfig};
  const {disabled: audioDisabled} = useBiolinkFeatureStatus('profile_audio');
  const {disabled: cursorDisabled} = useBiolinkFeatureStatus('custom_cursor');
  const {disabled: videoDisabled} = useBiolinkFeatureStatus('background_video');

  const setMedia = (partial: Partial<typeof media>) => {
    updateAppearance(
      {
        mediaConfig: compactConfig({...media, ...partial}),
      } as AppearanceConfig,
      {markThemeModified: true},
    );
  };

  const audioPrompt = {
    ...defaultMediaConfig.audioPrompt,
    ...media.audioPrompt,
  };
  const displayAudioPromptText = audioPrompt.text
    ?.split('')
    .some(char => char.charCodeAt(0) === 195)
    ? ''
    : (audioPrompt.text ?? '');

  const setAudioPrompt = (partial: Partial<AudioPromptConfig>) => {
    setMedia({
      audioPrompt: compactConfig({...audioPrompt, ...partial}),
    });
  };

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h3 className="text-base font-semibold">
          <Trans message="Wallpaper media" />
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          <Trans message="Use the wallpaper selector above for colors, images and patterns. Add video, audio and cursor here." />
        </p>
      </div>
      <div className="flex flex-col gap-7">
        <SettingRow label={<Trans message="Background video" />}>
          <div className="flex flex-col gap-3">
            {videoDisabled ? (
              <FeatureLockedNotice
                feature={<Trans message="Background video" />}
              />
            ) : null}
            <BiolinkFileSelector
              disabled={videoDisabled}
              accept={FileInputType.video}
              uploadType={UploadType.biolinkMedia}
              value={
                media.backgroundMediaType === 'video'
                  ? media.backgroundMedia
                  : ''
              }
              icon={BiolinkFileSelectorIcons.video}
              emptyLabel={<Trans message="Upload background video" />}
              onChange={value =>
                setMedia({
                  backgroundMedia: value,
                  backgroundMediaType: value ? 'video' : 'image',
                })
              }
            />
          </div>
        </SettingRow>

        <SettingRow label={<Trans message="Profile audio" />}>
          <div className="flex flex-col gap-3">
            {audioDisabled ? (
              <FeatureLockedNotice
                feature={<Trans message="Profile audio" />}
              />
            ) : null}
            <BiolinkFileSelector
              disabled={audioDisabled}
              accept={FileInputType.audio}
              uploadType={UploadType.biolinkAudio}
              value={media.audio}
              icon={BiolinkFileSelectorIcons.audio}
              emptyLabel={<Trans message="Upload audio" />}
              onChange={value => setMedia({audio: value})}
            />
            {media.audio ? (
              <div className="flex flex-col gap-4 rounded-card-sm border p-4">
                <div>
                  <h4 className="text-sm font-semibold">
                    <Trans message="Audio click notice" />
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <Trans message="Browsers require an interaction before background audio can start." />
                  </p>
                </div>
                <SettingRow label={<Trans message="Notice text" />}>
                  <Input
                    bindToHookForm={false}
                    value={displayAudioPromptText}
                    placeholder={message('Click to activate music').message}
                    maxLength={160}
                    disabled={audioDisabled}
                    onChange={event =>
                      setAudioPrompt({text: event.target.value})
                    }
                  />
                </SettingRow>
                <SettingRow label={<Trans message="Notice text color" />}>
                  {audioDisabled ? (
                    <ColorReadOnly value={audioPrompt.textColor ?? '#ffffff'} />
                  ) : (
                    <ColorField
                      label={null}
                      value={audioPrompt.textColor ?? '#ffffff'}
                      onChange={value => setAudioPrompt({textColor: value})}
                    />
                  )}
                </SettingRow>
                <SettingRow label={<Trans message="Notice font" />}>
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <FontDialog
                        disabled={audioDisabled}
                        value={audioPrompt.fontConfig ?? BrowserSafeFonts[0]}
                        onChange={font => setAudioPrompt({fontConfig: font})}
                      />
                    </div>
                    {audioPrompt.fontConfig ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        disabled={audioDisabled}
                        aria-label={message('Use page font').message}
                        onClick={() => setAudioPrompt({fontConfig: undefined})}
                      >
                        <XIcon />
                      </Button>
                    ) : null}
                  </div>
                </SettingRow>
              </div>
            ) : null}
          </div>
        </SettingRow>

        <SettingRow label={<Trans message="Custom cursor" />}>
          <div className="flex flex-col gap-3">
            {cursorDisabled ? (
              <FeatureLockedNotice
                feature={<Trans message="Custom cursor" />}
              />
            ) : null}
            <BiolinkFileSelector
              disabled={cursorDisabled}
              accept=".cur,image/png,image/webp,image/gif"
              uploadType={UploadType.biolinkCursors}
              value={media.cursor}
              icon={BiolinkFileSelectorIcons.cursor}
              emptyLabel={<Trans message="Upload cursor" />}
              onChange={value => setMedia({cursor: value})}
            />
          </div>
        </SettingRow>
      </div>
    </section>
  );
}

function DesktopPanel() {
  const appearance = useBiolinkEditorStore(
    s => s.appearance as AdvancedAppearanceConfig,
  );
  const updateAppearance = useBiolinkEditorStore(s => s.updateAppearance);
  const savedDesktop = appearance.desktopConfig ?? {};
  const desktop = {
    ...defaultDesktopConfig,
    ...savedDesktop,
  };
  const {disabled} = useBiolinkFeatureStatus('desktop_layout');

  const setDesktop = (partial: Partial<DesktopConfig>) => {
    updateAppearance(
      {
        desktopConfig: compactConfig({...desktop, ...partial}),
      } as AppearanceConfig,
      {markThemeModified: true},
    );
  };

  return (
    <section>
      <h2 className={appearanceHeaderClassnames.h2}>
        <Trans message="Desktop" />
      </h2>

      {disabled ? (
        <FeatureLockedNotice feature={<Trans message="Desktop layout" />} />
      ) : null}

      <div className="flex flex-col gap-7">
        <SettingRow label={<Trans message="Desktop mode" />}>
          <ChoiceGrid
            disabled={disabled}
            items={[
              {
                value: 'disabled',
                label: <Trans message="Disabled" />,
                preview: <DesktopPreview variant="disabled" />,
                kind: 'wireframe',
              },
              {
                value: 'full',
                label: <Trans message="Full screen" />,
                preview: <DesktopPreview variant="full" />,
                kind: 'wireframe',
              },
              {
                value: 'split',
                label: <Trans message="Profile left, content right" />,
                preview: <DesktopPreview variant="split" />,
                kind: 'wireframe',
              },
            ]}
            value={
              desktop.enabled ? (desktop.layoutMode ?? 'full') : 'disabled'
            }
            onChange={value =>
              setDesktop(
                value === 'disabled'
                  ? {enabled: false}
                  : {
                      enabled: true,
                      layoutMode: value as DesktopConfig['layoutMode'],
                    },
              )
            }
          />
        </SettingRow>

        <SettingRow label={<Trans message="Content mode" />}>
          <ChoiceGrid
            disabled={disabled}
            items={[
              {
                value: 'spotlight',
                label: <Trans message="Spotlight" />,
                preview: <ContentModePreview variant="spotlight" />,
                kind: 'wireframe',
              },
              {
                value: 'stack',
                label: <Trans message="Stack" />,
                preview: <ContentModePreview variant="stack" />,
                kind: 'wireframe',
              },
              {
                value: 'columns',
                label: <Trans message="Columns" />,
                preview: <ContentModePreview variant="columns" />,
                kind: 'wireframe',
              },
            ]}
            value={desktop.contentMode ?? 'spotlight'}
            onChange={value =>
              setDesktop({contentMode: value as DesktopConfig['contentMode']})
            }
          />
        </SettingRow>

        <SettingRow label={<Trans message="Desktop columns" />}>
          <ChoiceGrid
            disabled={disabled}
            items={[
              {
                value: 'auto',
                label: <Trans message="Automatic" />,
                preview: <GridPreview columns="auto" />,
                kind: 'wireframe',
              },
              {
                value: '1',
                label: <Trans message="1 column" />,
                preview: <GridPreview columns="1" />,
                kind: 'wireframe',
              },
              {
                value: '2',
                label: <Trans message="2 columns" />,
                preview: <GridPreview columns="2" />,
                kind: 'wireframe',
              },
              {
                value: '3',
                label: <Trans message="3 columns" />,
                preview: <GridPreview columns="3" />,
                kind: 'wireframe',
              },
            ]}
            value={desktop.gridMode ?? 'auto'}
            onChange={value =>
              setDesktop({gridMode: value as DesktopConfig['gridMode']})
            }
          />
        </SettingRow>

        <SettingRow label={<Trans message="Profile placement" />}>
          <ChoiceGrid
            disabled={disabled}
            items={[
              {
                value: 'center',
                label: <Trans message="Center" />,
                preview: <PlacementPreview placement="center" />,
                kind: 'wireframe',
              },
              {
                value: 'left',
                label: <Trans message="Left" />,
                preview: <PlacementPreview placement="left" />,
                kind: 'wireframe',
              },
              {
                value: 'right',
                label: <Trans message="Right" />,
                preview: <PlacementPreview placement="right" />,
                kind: 'wireframe',
              },
            ]}
            value={desktop.profilePlacement ?? 'center'}
            onChange={value =>
              setDesktop({
                profilePlacement: value as DesktopConfig['profilePlacement'],
              })
            }
          />
        </SettingRow>

        <SettingRow label={<Trans message="Desktop surface" />}>
          <ChoiceGrid
            disabled={disabled}
            items={[
              {
                value: 'open',
                label: <Trans message="Open layout" />,
                preview: <SurfacePreview tinted={false} />,
                kind: 'swatch',
              },
              {
                value: 'tinted',
                label: <Trans message="Tinted surface" />,
                preview: <SurfacePreview tinted />,
                kind: 'swatch',
              },
            ]}
            value={desktop.surfaceMode ?? 'open'}
            onChange={value =>
              setDesktop({surfaceMode: value as DesktopConfig['surfaceMode']})
            }
          />
        </SettingRow>

        <SettingRow label={<Trans message="Profile opacity" />}>
          <Slider
            min={0.2}
            max={1}
            step={0.01}
            value={desktop.profileOpacity ?? 0.9}
            onValueChange={value => setDesktop({profileOpacity: Number(value)})}
            disabled={disabled}
          >
            <Slider.Control>
              <Slider.Track>
                <Slider.Indicator />
              </Slider.Track>
              <Slider.Thumb />
            </Slider.Control>
          </Slider>
        </SettingRow>

        <SettingRow label={<Trans message="Profile blur" />}>
          <Slider
            min={0}
            max={80}
            step={1}
            value={desktop.profileBlur ?? 12}
            onValueChange={value => setDesktop({profileBlur: Number(value)})}
            disabled={disabled}
          >
            <Slider.Control>
              <Slider.Track>
                <Slider.Indicator />
              </Slider.Track>
              <Slider.Thumb />
            </Slider.Control>
          </Slider>
        </SettingRow>

        {desktop.surfaceMode === 'tinted' ? (
          <SettingRow label={<Trans message="Surface colors" />}>
            <div className="space-y-3">
              {disabled ? (
                <ColorReadOnly
                  value={desktop.panelBackgroundColor ?? '#111111cc'}
                />
              ) : (
                <ColorField
                  label={<Trans message="Background" />}
                  value={desktop.panelBackgroundColor ?? '#111111cc'}
                  onChange={value => setDesktop({panelBackgroundColor: value})}
                />
              )}
              {disabled ? (
                <ColorReadOnly value={desktop.panelTextColor ?? '#ffffff'} />
              ) : (
                <ColorField
                  label={<Trans message="Text" />}
                  value={desktop.panelTextColor ?? '#ffffff'}
                  onChange={value => setDesktop({panelTextColor: value})}
                />
              )}
            </div>
          </SettingRow>
        ) : null}

        <SettingRow label={<Trans message="Decorative asset" />}>
          <div className="flex flex-wrap items-center gap-3">
            {desktop.decorativeAsset ? (
              <span className="flex size-16 items-center justify-center rounded-card-sm border bg-card p-2">
                <img
                  src={desktop.decorativeAsset}
                  alt=""
                  className="max-h-full max-w-full object-contain"
                />
              </span>
            ) : null}
            <BiolinkAssetPickerDialog
              value={desktop.decorativeAsset}
              categories={['threeD', 'emoji', 'scribbles', 'icons']}
              title={<Trans message="Select decorative asset" />}
              onSelect={value => setDesktop({decorativeAsset: value ?? ''})}
            >
              <Dialog.Trigger
                render={
                  <Button variant="outline" type="button" disabled={disabled} />
                }
              >
                <ImageIcon data-icon="inline-start" />
                <Trans message="Choose asset" />
              </Dialog.Trigger>
            </BiolinkAssetPickerDialog>
          </div>
        </SettingRow>

        <SettingRow label={<Trans message="Asset position" />}>
          <ChoiceGrid
            disabled={disabled}
            items={[
              {
                value: 'left',
                label: <Trans message="Left" />,
                preview: <PlacementPreview placement="left" />,
                kind: 'wireframe',
              },
              {
                value: 'right',
                label: <Trans message="Right" />,
                preview: <PlacementPreview placement="right" />,
                kind: 'wireframe',
              },
              {
                value: 'background',
                label: <Trans message="Background" />,
                preview: <SurfacePreview tinted />,
                kind: 'swatch',
              },
            ]}
            value={desktop.decorativePlacement ?? 'right'}
            onChange={value =>
              setDesktop({
                decorativePlacement:
                  value as DesktopConfig['decorativePlacement'],
              })
            }
          />
        </SettingRow>
      </div>
    </section>
  );
}

function EffectsPanel() {
  const appearance = useBiolinkEditorStore(
    s => s.appearance as AdvancedAppearanceConfig,
  );
  const updateAppearance = useBiolinkEditorStore(s => s.updateAppearance);
  const configuredEffects = appearance.effectsConfig;
  const effects = {...defaultEffectsConfig, ...configuredEffects};
  const glow = {
    ...(defaultEffectsConfig.glow ?? {}),
    ...(configuredEffects?.glow ?? {}),
  };
  const {disabled} = useBiolinkFeatureStatus('visual_effects');
  const particlePreset = resolvedParticlePreset(configuredEffects);
  const selectedPreset = particlePresetEffects.some(
    item => item.value === particlePreset,
  )
    ? particlePreset
    : null;
  const mediaEffect = resolvedMediaEffect(configuredEffects);
  const usernameEffect = effects.usernameEffect ?? 'none';
  const [particleQuery, setParticleQuery] = useState('');
  const showEffectPalette =
    mediaEffect === 'aurora' || usernameEffect !== 'none';

  const setEffects = (partial: Partial<EffectsConfig>) => {
    updateAppearance(
      {
        effectsConfig: compactConfig({...configuredEffects, ...partial}),
      } as AppearanceConfig,
      {markThemeModified: true},
    );
  };

  const setGlow = (partial: Partial<GlowConfig>) => {
    setEffects({
      glow: compactConfig({
        ...(configuredEffects?.glow ?? {}),
        ...partial,
      }),
    });
  };

  return (
    <section>
      <h2 className={appearanceHeaderClassnames.h2}>
        <Trans message="Effects" />
      </h2>
      {disabled ? (
        <FeatureLockedNotice feature={<Trans message="Visual effects" />} />
      ) : null}

      <div className="flex flex-col gap-7">
        <SettingRow label={<Trans message="Background effect" />}>
          <ChoiceGrid
            disabled={disabled}
            value={mediaEffect}
            onChange={value =>
              setEffects({
                mediaEffect: value as EffectsConfig['mediaEffect'],
              })
            }
            items={featuredBackgroundEffects}
          />
        </SettingRow>

        <SettingRow label={<Trans message="Particle presets" />}>
          <div className="space-y-3">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                bindToHookForm={false}
                value={particleQuery}
                onChange={event => setParticleQuery(event.target.value)}
                className="pl-9"
                placeholder={message('Search presets').message}
                disabled={disabled}
              />
            </div>
            <VisualOptionGrid
              ariaLabel={message('Particle presets').message}
              columns="grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))]"
              disabled={disabled}
              value={selectedPreset ?? 'none'}
              onChange={value =>
                setEffects({
                  particlePreset: value as EffectsConfig['particlePreset'],
                })
              }
              items={particlePresetEffects
                .filter(item =>
                  particleQuery.trim()
                    ? item.value.includes(particleQuery.trim().toLowerCase())
                    : true,
                )
                .map(item => ({...item, kind: 'effect' as const}))}
            />
          </div>
        </SettingRow>

        <SettingRow label={<Trans message="Username effect" />}>
          <ChoiceGrid
            disabled={disabled}
            value={effects.usernameEffect ?? 'none'}
            onChange={value =>
              setEffects({
                usernameEffect: value as EffectsConfig['usernameEffect'],
              })
            }
            items={usernameEffectOptions}
          />
        </SettingRow>

        <SettingRow label={<Trans message="Interaction style" />}>
          <select
            className="h-10 w-full rounded-input border bg-transparent px-3 text-sm"
            disabled={disabled}
            value={effects.interactionStyle ?? 'lift'}
            onChange={event =>
              setEffects({
                interactionStyle: event.target
                  .value as EffectsConfig['interactionStyle'],
              })
            }
          >
            <option value="lift">
              <Trans message="Lift on hover" />
            </option>
            <option value="press">
              <Trans message="Press on interaction" />
            </option>
            <option value="quiet">
              <Trans message="Quiet" />
            </option>
          </select>
        </SettingRow>

        {!showEffectPalette && (
          <SettingRow label={<Trans message="Effect color" />}>
            {disabled ? (
              <ColorReadOnly value={effects.effectColor ?? '#ffffff'} />
            ) : (
              <ColorField
                label={null}
                value={effects.effectColor ?? '#ffffff'}
                onChange={value => setEffects({effectColor: value})}
              />
            )}
          </SettingRow>
        )}

        {showEffectPalette && (
          <SettingRow
            label={
              <Trans
                message={
                  mediaEffect === 'aurora' ? 'Aurora colors' : 'Effect colors'
                }
              />
            }
          >
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['effectColor', effects.effectColor ?? '#ffffff', 'Primary'],
                [
                  'effectSecondaryColor',
                  effects.effectSecondaryColor ?? '#6ee7b7',
                  'Secondary',
                ],
                [
                  'effectTertiaryColor',
                  effects.effectTertiaryColor ?? '#3b82f6',
                  'Tertiary',
                ],
              ].map(([key, value, label]) => (
                <div key={key} className="min-w-0">
                  {disabled ? (
                    <ColorReadOnly value={value} />
                  ) : (
                    <ColorField
                      label={<Trans message={label} />}
                      value={value}
                      onChange={nextValue =>
                        setEffects({[key]: nextValue} as Partial<EffectsConfig>)
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          </SettingRow>
        )}

        <SettingRow label={<Trans message="Additional visual effects" />}>
          <div className="grid gap-3 sm:grid-cols-2">
            <SwitchRow
              disabled={disabled}
              checked={!!effects.showVolumeControl}
              label={<Trans message="Volume control" />}
              onChange={checked => setEffects({showVolumeControl: checked})}
            />
            <SwitchRow
              disabled={disabled}
              checked={!!effects.monochromeSocialIcons}
              label={<Trans message="Monochrome social icons" />}
              onChange={checked => setEffects({monochromeSocialIcons: checked})}
            />
            <SwitchRow
              disabled={disabled}
              checked={!!effects.invertBoxes}
              label={<Trans message="Invert boxes" />}
              onChange={checked => setEffects({invertBoxes: checked})}
            />
            <SwitchRow
              disabled={disabled}
              checked={!!effects.animatedTitle}
              label={<Trans message="Animated title" />}
              onChange={checked => setEffects({animatedTitle: checked})}
            />
          </div>
        </SettingRow>

        <SettingRow label={<Trans message="Glow settings" />}>
          <div className="space-y-3">
            <SwitchRow
              disabled={disabled}
              checked={!!glow.enabled}
              label={<Trans message="Enable glow" />}
              onChange={checked => setGlow({enabled: checked})}
            />
            <div>
              <div className="mb-1 text-sm font-medium">
                <Trans message="Glow preset" />
              </div>
              <VisualOptionGrid
                ariaLabel={message('Glow preset').message}
                columns="grid-cols-[repeat(auto-fit,minmax(7.5rem,1fr))]"
                disabled={disabled}
                value={glow.preset ?? 'soft'}
                onChange={value =>
                  setGlow({preset: value as GlowConfig['preset']})
                }
                items={[
                  {
                    value: 'none',
                    label: <Trans message="None" />,
                    preview: <GlowPreview preset="none" />,
                  },
                  {
                    value: 'soft',
                    label: <Trans message="Soft" />,
                    preview: <GlowPreview preset="soft" />,
                  },
                  {
                    value: 'medium',
                    label: <Trans message="Medium" />,
                    preview: <GlowPreview preset="medium" />,
                  },
                  {
                    value: 'strong',
                    label: <Trans message="Strong" />,
                    preview: <GlowPreview preset="strong" />,
                  },
                  {
                    value: 'custom',
                    label: <Trans message="Custom" />,
                    preview: <GlowPreview preset="custom" />,
                  },
                ]}
              />
            </div>
            <div className="space-y-3">
              <div>
                <div className="mb-1 text-sm font-medium">
                  <Trans message="Glow color source" />
                </div>
                <VisualOptionGrid
                  ariaLabel={message('Glow color source').message}
                  columns="grid-cols-[repeat(auto-fit,minmax(7.5rem,1fr))]"
                  disabled={disabled}
                  value={glow.source ?? 'primary'}
                  onChange={value =>
                    setGlow({source: value as GlowConfig['source']})
                  }
                  items={[
                    {
                      value: 'primary',
                      label: <Trans message="Primary color" />,
                      preview: (
                        <ColorSwatch color={effects.effectColor ?? '#ffffff'} />
                      ),
                    },
                    {
                      value: 'secondary',
                      label: <Trans message="Secondary color" />,
                      preview: (
                        <ColorSwatch
                          color={effects.effectSecondaryColor ?? '#6ee7b7'}
                        />
                      ),
                    },
                    {
                      value: 'tertiary',
                      label: <Trans message="Tertiary color" />,
                      preview: (
                        <ColorSwatch
                          color={effects.effectTertiaryColor ?? '#3b82f6'}
                        />
                      ),
                    },
                    {
                      value: 'custom',
                      label: <Trans message="Custom color" />,
                      preview: (
                        <ColorSwatch color={glow.customColor ?? '#ffffff'} />
                      ),
                    },
                  ]}
                />
              </div>
              {glow.source === 'custom' ? (
                disabled ? (
                  <ColorReadOnly value={glow.customColor ?? '#ffffff'} />
                ) : (
                  <ColorField
                    label={<Trans message="Custom color" />}
                    value={glow.customColor ?? '#ffffff'}
                    onChange={value => setGlow({customColor: value})}
                  />
                )
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  ['opacity', glow.opacity ?? 0.24, 0, 1, 0.01],
                  ['blur', glow.blur ?? 18, 0, 80, 1],
                  ['spread', glow.spread ?? 1, 0, 32, 1],
                ] as const
              ).map(([key, value, min, max, step]) => (
                <label key={key} className="text-sm">
                  <span className="mb-1 block font-medium">
                    <Trans
                      message={
                        key === 'opacity'
                          ? 'Glow opacity'
                          : key === 'blur'
                            ? 'Glow blur'
                            : 'Glow spread'
                      }
                    />
                  </span>
                  <Input
                    type="number"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    disabled={disabled}
                    onChange={event =>
                      setGlow({
                        [key]: Number(event.target.value),
                      } as Partial<GlowConfig>)
                    }
                  />
                </label>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  ['username', 'Username'],
                  ['avatar', 'Avatar'],
                  ['widgets', 'Widgets'],
                  ['products', 'Products'],
                  ['buttons', 'Buttons'],
                  ['badges', 'Badges'],
                  ['socialIcons', 'Social icons'],
                ] as const
              ).map(([key, label]) => (
                <SwitchRow
                  key={key}
                  disabled={disabled}
                  checked={!!glow[key]}
                  label={<Trans message={label} />}
                  onChange={checked =>
                    setGlow({[key]: checked} as Partial<GlowConfig>)
                  }
                />
              ))}
            </div>
          </div>
        </SettingRow>
      </div>
    </section>
  );
}

function BadgesPanel() {
  const appearance = useBiolinkEditorStore(
    s => s.appearance as AdvancedAppearanceConfig,
  );
  const updateAppearance = useBiolinkEditorStore(s => s.updateAppearance);
  const badgeConfig = {...defaultBadgeConfig, ...appearance.badgeConfig};
  const items = badgeConfig.items ?? [];
  const {disabled: badgesDisabled} = useBiolinkFeatureStatus('badges');
  const {disabled: customBadgesDisabled} =
    useBiolinkFeatureStatus('custom_badges');
  const [catalogFilter, setCatalogFilter] = useState<BadgeCatalogFilter>('all');
  const catalogQuery = useQuery({
    queryKey: ['biolink-badge-catalog'],
    staleTime: 60_000,
    queryFn: async () => {
      const response = await apiClient.get<{data: BadgeCatalogItem[]}>(
        'badges/catalog',
      );
      return response.data.data;
    },
  });
  const claimBadge = useMutation({
    mutationFn: async (key: string) => {
      const response = await apiClient.post(
        `badges/${encodeURIComponent(key)}/claim`,
      );
      return response.data;
    },
    onSuccess: () => {
      void catalogQuery.refetch();
      toast.success(<Trans message="Badge claimed" />);
    },
    onError: () => toast.error(<Trans message="Could not claim badge" />),
  });

  const setBadgeConfig = (partial: Partial<typeof badgeConfig>) => {
    updateAppearance(
      {
        badgeConfig: compactConfig({...badgeConfig, ...partial}),
      } as AppearanceConfig,
      {markThemeModified: true},
    );
  };

  const setItems = (nextItems: BadgeConfigItem[]) => {
    setBadgeConfig({items: nextItems});
  };

  const updateItem = (id: string, partial: Partial<BadgeConfigItem>) => {
    setItems(
      items.map(item => (item.id === id ? {...item, ...partial} : item)),
    );
  };

  const addBadge = (type: BadgeConfigItem['type']) => {
    const nextIndex = items.length + 1;
    setItems([
      ...items,
      {
        id: `${type}-${Date.now()}`,
        type,
        label: type === 'custom' ? 'Custom badge' : 'Verified',
        icon:
          type === 'custom'
            ? '/images/svg/icons/New%20Badge.svg'
            : '/images/svg/icons/Checkmark.svg',
        color: type === 'custom' ? '#7c3aed' : '#2da8ff',
        active: true,
        sort_order: nextIndex * 10,
      },
    ]);
  };

  const addCatalogBadge = (badge: BadgeCatalogItem) => {
    const editionYear =
      badge.latest_edition_year ?? badge.edition_year ?? undefined;
    const configuredBadge: BadgeConfigItem = {
      id: badge.key,
      type: 'system',
      label: badge.label,
      description: badge.description,
      icon: badge.icon ?? undefined,
      color: badge.color ?? undefined,
      editionYear,
      active: true,
      sort_order: (items.length + 1) * 10,
    };
    const existing = items.find(item => item.id === badge.key);

    if (existing) {
      setItems(
        items.map(item =>
          item.id === badge.key
            ? {
                ...configuredBadge,
                sort_order: item.sort_order,
                iconSize: item.iconSize,
              }
            : item,
        ),
      );
      return;
    }

    setItems([...items, configuredBadge]);
  };

  const filteredCatalog = useMemo(() => {
    const badges = catalogQuery.data ?? [];

    return badges.filter(badge => {
      if (catalogFilter === 'available') {
        return (
          badge.can_claim ||
          badge.status === 'purchasable' ||
          badge.status === 'premium'
        );
      }
      if (catalogFilter === 'owned') {
        return badge.owned;
      }
      if (catalogFilter === 'premium') {
        return badge.access_type === 'premium' || badge.access_type === 'paid';
      }
      if (catalogFilter === 'events') {
        return badge.kind === 'event' || badge.repeat_yearly;
      }
      return true;
    });
  }, [catalogFilter, catalogQuery.data]);

  return (
    <section>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className={appearanceHeaderClassnames.h2}>
          <Trans message="Badges" />
        </h2>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={badgesDisabled || customBadgesDisabled}
            onClick={() => addBadge('custom')}
          >
            <SparklesIcon data-icon="inline-start" />
            <Trans message="Custom" />
          </Button>
        </div>
      </div>

      {badgesDisabled ? (
        <FeatureLockedNotice feature={<Trans message="Badges" />} />
      ) : customBadgesDisabled ? (
        <FeatureLockedNotice feature={<Trans message="Custom badges" />} />
      ) : null}

      <div className="flex flex-col gap-7">
        <SettingRow label={<Trans message="Style" />}>
          <ChoiceGrid
            disabled={badgesDisabled}
            value={badgeConfig.style ?? 'chips'}
            onChange={value =>
              setBadgeConfig({style: value as typeof badgeConfig.style})
            }
            items={[
              {
                value: 'inline',
                label: <Trans message="Inline" />,
                preview: <BadgeStylePreview style="inline" />,
              },
              {
                value: 'chips',
                label: <Trans message="Chips" />,
                preview: <BadgeStylePreview style="chips" />,
              },
              {
                value: 'cards',
                label: <Trans message="Cards" />,
                preview: <BadgeStylePreview style="cards" />,
              },
              {
                value: 'icon',
                label: <Trans message="Icon only" />,
                preview: <BadgeStylePreview style="icon" />,
              },
            ]}
          />
        </SettingRow>

        <BadgeEditorSection
          title={<Trans message="My badges" />}
          empty={<Trans message="No badges configured yet." />}
        >
          {items.map(item => {
            const catalogBadge = catalogQuery.data?.find(
              badge => badge.key === item.id,
            );
            const systemLocked = isSystemBadgeConfigItem(item);

            if (systemLocked) {
              return (
                <div
                  key={item.id}
                  className="flex min-w-0 items-center gap-3 rounded-card-sm border bg-card p-3"
                >
                  <BadgeVisual
                    icon={item.icon}
                    color={item.color}
                    editionYear={item.editionYear}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {catalogBadge?.label_text || (
                        <Trans message={item.label} />
                      )}
                    </div>
                    {catalogBadge?.description_text || item.description ? (
                      <div className="line-clamp-1 text-xs text-muted-foreground">
                        {catalogBadge?.description_text || (
                          <Trans message={item.description ?? ''} />
                        )}
                      </div>
                    ) : null}
                  </div>
                  <Switch
                    aria-label={message('Show badge on page').message}
                    checked={item.active !== false}
                    disabled={badgesDisabled}
                    onCheckedChange={checked =>
                      updateItem(item.id, {active: checked})
                    }
                  />
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label={message('Remove badge from page').message}
                    disabled={badgesDisabled}
                    onClick={() =>
                      setItems(
                        items.filter(existing => existing.id !== item.id),
                      )
                    }
                  >
                    <XIcon />
                  </Button>
                </div>
              );
            }

            return (
              <div key={item.id} className="rounded-card-sm border bg-card p-4">
                <div className="mb-4 flex items-center gap-3">
                  <Switch
                    checked={item.active !== false}
                    disabled={badgesDisabled}
                    onCheckedChange={checked =>
                      updateItem(item.id, {active: checked})
                    }
                  />
                  <Input
                    bindToHookForm={false}
                    value={item.label}
                    disabled={badgesDisabled || systemLocked}
                    onChange={event =>
                      updateItem(item.id, {label: event.target.value})
                    }
                  />
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    disabled={badgesDisabled}
                    onClick={() =>
                      setItems(
                        items.filter(existing => existing.id !== item.id),
                      )
                    }
                  >
                    <XIcon />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_120px_120px_auto] sm:items-end">
                  {badgesDisabled || systemLocked ? (
                    <ColorReadOnly value={item.color ?? '#2da8ff'} />
                  ) : (
                    <ColorField
                      label={<Trans message="Badge color" />}
                      value={item.color ?? '#2da8ff'}
                      onChange={value => updateItem(item.id, {color: value})}
                    />
                  )}
                  <Input
                    bindToHookForm={false}
                    type="number"
                    min={0}
                    max={1000}
                    value={item.sort_order ?? 0}
                    disabled={badgesDisabled || systemLocked}
                    onChange={event =>
                      updateItem(item.id, {
                        sort_order: Number(event.target.value),
                      })
                    }
                  />
                  <VisualOptionGrid
                    ariaLabel={message('Badge icon size').message}
                    columns="grid-cols-3"
                    disabled={badgesDisabled}
                    value={item.iconSize ?? 'medium'}
                    onChange={value =>
                      updateItem(item.id, {
                        iconSize: value as BadgeConfigItem['iconSize'],
                      })
                    }
                    items={[
                      {
                        value: 'small',
                        label: <Trans message="Small" />,
                        preview: (
                          <span className="size-3 rounded-full bg-primary" />
                        ),
                      },
                      {
                        value: 'medium',
                        label: <Trans message="Medium" />,
                        preview: (
                          <span className="size-5 rounded-full bg-primary" />
                        ),
                      },
                      {
                        value: 'large',
                        label: <Trans message="Large" />,
                        preview: (
                          <span className="size-7 rounded-full bg-primary" />
                        ),
                      },
                    ]}
                  />
                  <BiolinkAssetPickerDialog
                    value={
                      item.iconRef
                        ? `${item.iconRef.library}:${item.iconRef.name}`
                        : item.icon
                    }
                    categories={['icons', 'libraryIcons', 'emoji', 'threeD']}
                    title={<Trans message="Select badge icon" />}
                    onSelect={value => {
                      if (value?.startsWith('lucide:')) {
                        updateItem(item.id, {
                          icon: undefined,
                          iconRef: {
                            library: 'lucide',
                            name: value.slice('lucide:'.length),
                          },
                        });
                      } else if (value?.startsWith('simple-icons:')) {
                        updateItem(item.id, {
                          icon: undefined,
                          iconRef: {
                            library: 'simple-icons',
                            name: value.slice('simple-icons:'.length),
                          },
                        });
                      } else {
                        updateItem(item.id, {
                          icon: value ?? '',
                          iconRef: undefined,
                        });
                      }
                    }}
                  >
                    <Dialog.Trigger
                      render={
                        <Button
                          variant="outline"
                          type="button"
                          disabled={badgesDisabled || systemLocked}
                        />
                      }
                    >
                      <ImageIcon data-icon="inline-start" />
                      <Trans message="Icon" />
                    </Dialog.Trigger>
                  </BiolinkAssetPickerDialog>
                </div>
              </div>
            );
          })}
        </BadgeEditorSection>

        <BadgeEditorSection title={<Trans message="Badge catalog" />}>
          <div className="mb-4 flex flex-wrap gap-2" role="group">
            {(
              [
                ['all', 'All'],
                ['available', 'Available now'],
                ['owned', 'Collected'],
                ['premium', 'Premium and paid'],
                ['events', 'Annual events'],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={catalogFilter === value ? 'default' : 'outline'}
                color={catalogFilter === value ? 'primary' : 'default'}
                aria-pressed={catalogFilter === value}
                onClick={() => setCatalogFilter(value)}
              >
                <Trans message={label} />
              </Button>
            ))}
          </div>

          {catalogQuery.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2" aria-hidden>
              {Array.from({length: 4}).map((_, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-card-sm border bg-card p-4"
                >
                  <Skeleton className="size-11 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-8 w-28" />
                  </div>
                </div>
              ))}
            </div>
          ) : catalogQuery.isError ? (
            <div className="flex items-center justify-between gap-3 rounded-card-sm border border-dashed p-4">
              <div className="text-sm text-muted-foreground">
                <Trans message="Could not load badges." />
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void catalogQuery.refetch()}
              >
                <Trans message="Try again" />
              </Button>
            </div>
          ) : filteredCatalog.length === 0 ? (
            <div className="rounded-card-sm border border-dashed p-6 text-center text-sm text-muted-foreground">
              <Trans message="No badges match this filter." />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredCatalog.map(badge => {
                const selectedItem = items.find(item => item.id === badge.key);
                const displayEdition =
                  badge.status === 'claimable'
                    ? badge.edition_year
                    : (badge.latest_edition_year ?? badge.edition_year);
                const selectedIsCurrent =
                  !!selectedItem &&
                  selectedItem.type === 'system' &&
                  selectedItem.editionYear ===
                    (badge.latest_edition_year ??
                      badge.edition_year ??
                      undefined);
                const collectedEditions = badge.owned_years?.length ?? 0;

                return (
                  <div
                    key={badge.key}
                    className="flex min-w-0 flex-col rounded-card-sm border bg-card p-4"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <BadgeVisual
                        icon={badge.icon}
                        color={badge.color}
                        editionYear={displayEdition ?? undefined}
                        className="size-11"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">
                          {badge.label_text}
                        </div>
                        <div className="line-clamp-2 text-xs text-muted-foreground">
                          {badge.description_text}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          <BadgeCatalogAccess
                            accessType={badge.access_type}
                            recurring={badge.repeat_yearly}
                          />
                          <span aria-hidden>·</span>
                          <Trans message={badgeStatusLabel(badge.status)} />
                          {collectedEditions > 1 ? (
                            <>
                              <span aria-hidden>·</span>
                              <Trans
                                message=":count editions collected"
                                values={{count: collectedEditions}}
                              />
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto flex min-h-11 flex-wrap items-end gap-2 pt-3">
                      {badge.can_claim ? (
                        <Button
                          type="button"
                          size="sm"
                          disabled={claimBadge.isPending || badgesDisabled}
                          onClick={() => claimBadge.mutate(badge.key)}
                        >
                          <GiftIcon data-icon="inline-start" />
                          <Trans
                            message={
                              badge.repeat_yearly
                                ? 'Claim edition'
                                : 'Claim badge'
                            }
                          />
                        </Button>
                      ) : badge.owned && !selectedIsCurrent ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={badgesDisabled}
                          onClick={() => addCatalogBadge(badge)}
                        >
                          <Trans
                            message={
                              selectedItem ? 'Update edition' : 'Add to page'
                            }
                          />
                        </Button>
                      ) : selectedIsCurrent ? (
                        <span className="py-2 text-xs text-muted-foreground">
                          <Trans message="Active on this page" />
                        </span>
                      ) : (badge.status === 'premium' ||
                          badge.status === 'purchasable') &&
                        badge.action_url ? (
                        <a
                          href={badge.action_url}
                          target="_blank"
                          rel="noreferrer"
                          className={buttonVariants({
                            variant: 'outline',
                            color: 'default',
                            size: 'sm',
                          })}
                        >
                          {badge.status === 'premium' ? (
                            <CrownIcon data-icon="inline-start" />
                          ) : (
                            <ExternalLinkIcon data-icon="inline-start" />
                          )}
                          <Trans
                            message={
                              badge.status === 'premium'
                                ? 'View plans'
                                : 'Buy badge'
                            }
                          />
                        </a>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </BadgeEditorSection>
      </div>
    </section>
  );
}

function BadgeVisual({
  icon,
  color,
  editionYear,
  className,
}: {
  icon?: string | null;
  color?: string | null;
  editionYear?: number;
  className?: string;
}) {
  const [iconFailed, setIconFailed] = useState(false);
  const {trans} = useTrans();
  const resolvedIcon = resolveImageUrl(icon);
  const shortYear = editionYear
    ? String(editionYear).slice(-2).padStart(2, '0')
    : null;
  const editionLabel = editionYear
    ? trans({message: 'Edition :year', values: {year: editionYear}})
    : undefined;

  useEffect(() => {
    setIconFailed(false);
  }, [resolvedIcon]);

  return (
    <span
      className={cn(
        'relative flex size-10 shrink-0 items-center justify-center rounded-full',
        className,
      )}
      style={{
        color: color ?? 'currentColor',
        backgroundColor: color ? `${color}1f` : 'rgb(255 255 255 / 0.08)',
      }}
    >
      {resolvedIcon && !iconFailed ? (
        <img
          src={resolvedIcon}
          alt=""
          className="size-1/2 object-contain"
          onError={() => setIconFailed(true)}
        />
      ) : (
        <BadgeCheckIcon className="size-1/2" />
      )}
      {shortYear ? (
        <span
          className="absolute -end-1 -bottom-1 flex size-5 items-center justify-center rounded-full border bg-background text-[9px] leading-none font-bold text-foreground shadow-xs"
          title={editionLabel}
          aria-label={editionLabel}
        >
          {shortYear}
        </span>
      ) : null}
    </span>
  );
}

function isSystemBadgeConfigItem(item: BadgeConfigItem): boolean {
  return item.type === 'system' || item.label.startsWith('biolink.badges.');
}

function BadgeCatalogAccess({
  accessType,
  recurring,
}: {
  accessType: BadgeCatalogItem['access_type'];
  recurring: boolean;
}) {
  if (recurring) {
    return (
      <span className="inline-flex items-center gap-1">
        <CalendarDaysIcon className="size-3" />
        <Trans message="Annual collection" />
      </span>
    );
  }

  const labels: Record<BadgeCatalogItem['access_type'], string> = {
    free: 'Free',
    premium: 'Premium',
    paid: 'Paid',
    award: 'Award',
    automatic: 'Automatic',
  };

  return <Trans message={labels[accessType]} />;
}

function badgeStatusLabel(status: BadgeCatalogItem['status']): string {
  switch (status) {
    case 'claimable':
      return 'Available now';
    case 'owned':
      return 'Collected';
    case 'upcoming':
      return 'Next edition soon';
    case 'expired':
      return 'Edition closed';
    case 'locked':
      return 'Requires a plan feature';
    case 'premium':
      return 'Premium';
    case 'purchasable':
      return 'Available for purchase';
    case 'admin_only':
      return 'Award only';
    default:
      return 'Not available';
  }
}

function BadgeEditorSection({
  children,
  empty,
  title,
}: {
  children: ReactNode;
  empty?: ReactNode;
  title: ReactNode;
}) {
  const hasChildren = Array.isArray(children)
    ? children.length > 0
    : children !== null && children !== undefined;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {hasChildren ? (
        children
      ) : (
        <div className="rounded-card-sm border border-dashed p-6 text-center text-sm text-muted-foreground">
          {empty}
        </div>
      )}
    </div>
  );
}

function HeaderLayoutSelector({
  disabled,
  onChange,
  value,
}: {
  disabled?: boolean;
  onChange: (value: HeaderLayout) => void;
  value?: HeaderLayout;
}) {
  const layouts: {value: HeaderLayout; label: ReactNode}[] = [
    {value: 'classic', label: <Trans message="Classic" />},
    {value: 'hero', label: <Trans message="Hero" />},
    {value: 'banner', label: <Trans message="Banner" />},
    {value: 'cutout', label: <Trans message="Cutout" />},
    {value: 'shape', label: <Trans message="Shape" />},
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {layouts.map(layout => (
        <VisualOptionCard
          key={layout.value}
          disabled={disabled}
          active={(value ?? 'classic') === layout.value}
          onClick={() => onChange(layout.value)}
          label={layout.label}
          kind="wireframe"
          preview={<HeaderLayoutIcon layout={layout.value} />}
        />
      ))}
    </div>
  );
}

function HeaderLayoutIcon({layout}: {layout: HeaderLayout}) {
  return (
    <span className="relative flex h-12 w-14 items-center justify-center overflow-hidden rounded-card-sm bg-accent">
      <span
        className={cn(
          'absolute bg-primary/20',
          layout === 'hero' && 'inset-x-2 top-1 h-6 rounded-b-full',
          layout === 'banner' && 'inset-x-1 top-1 h-4 rounded-sm',
          layout === 'cutout' && 'inset-x-4 top-1 h-9 rounded-b-full',
          layout === 'shape' && 'top-1 h-8 w-10 rounded-[45%_55%_50%_35%]',
          layout === 'classic' && 'hidden',
        )}
      />
      <span className="relative z-2 size-8 rounded-full bg-primary" />
    </span>
  );
}

function ShapeVariantSelector({
  disabled,
  image,
  onChange,
  shapeColor,
  value,
}: {
  disabled?: boolean;
  image?: string | null;
  onChange: (value: HeaderShapeVariant) => void;
  shapeColor: string;
  value?: string | null;
}) {
  const activeVariant = normalizeHeaderShapeVariant(value);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {headerShapeVariants.map(variant => (
        <VisualOptionCard
          key={variant}
          disabled={disabled}
          active={activeVariant === variant}
          onClick={() => onChange(variant)}
          label={<ShapeVariantLabel variant={variant} />}
          kind="thumbnail"
          preview={
            <ShapeVariantIcon
              variant={variant}
              color={shapeColor}
              image={image}
            />
          }
        />
      ))}
    </div>
  );
}

function ShapeVariantIcon({
  color,
  image,
  variant,
}: {
  color: string;
  image?: string | null;
  variant: HeaderShapeVariant;
}) {
  const rawId = useId();
  const clipId = `header-shape-option-${variant}-${rawId.replace(/:/g, '')}`;
  const imageUrl = resolveImageUrl(image);
  const path = headerShapePath(variant);

  return (
    <svg aria-hidden className="h-10 w-12 drop-shadow-sm" viewBox="0 0 100 100">
      <defs>
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          <path d={path} />
        </clipPath>
      </defs>
      {imageUrl ? (
        <image
          clipPath={`url(#${clipId})`}
          height="100"
          href={imageUrl}
          preserveAspectRatio="xMidYMid slice"
          width="100"
        />
      ) : (
        <path d={path} fill={color} />
      )}
      <path
        d={path}
        fill="none"
        stroke="rgb(0 0 0 / 0.16)"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function ShapeVariantLabel({variant}: {variant: HeaderShapeVariant}) {
  switch (variant) {
    case 'flower':
      return <Trans message="Flower" />;
    case 'oval':
      return <Trans message="Oval" />;
    case 'rounded':
      return <Trans message="Rounded" />;
    case 'burst':
      return <Trans message="Burst" />;
    case 'capsule':
      return <Trans message="Capsule" />;
    case 'clover':
      return <Trans message="Clover" />;
    case 'arch':
      return <Trans message="Arch" />;
    case 'diamond':
      return <Trans message="Diamond" />;
    case 'splash':
      return <Trans message="Splash" />;
    case 'shield':
      return <Trans message="Shield" />;
    case 'ticket':
      return <Trans message="Ticket" />;
    case 'loop':
    default:
      return <Trans message="Loop" />;
  }
}

function HeaderAlignmentSelector({
  disabled,
  onChange,
  value,
}: {
  disabled?: boolean;
  onChange: (value: BiolinkAppearanceConfigHeaderConfig['alignment']) => void;
  value?: BiolinkAppearanceConfigHeaderConfig['alignment'];
}) {
  const alignments: {
    value: BiolinkAppearanceConfigHeaderConfig['alignment'];
    label: ReactNode;
  }[] = [
    {value: 'center', label: <Trans message="Center" />},
    {value: 'left', label: <Trans message="Left" />},
    {value: 'left-inline', label: <Trans message="Left Inline" />},
    {value: 'right-inline', label: <Trans message="Right Inline" />},
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {alignments.map(alignment => (
        <VisualOptionCard
          key={alignment.value}
          disabled={disabled}
          active={(value ?? 'center') === alignment.value}
          onClick={() => onChange(alignment.value)}
          label={alignment.label}
          kind="wireframe"
          preview={
            <HeaderAlignmentIcon alignment={alignment.value as string} />
          }
        />
      ))}
    </div>
  );
}

function HeaderAlignmentIcon({alignment}: {alignment: string}) {
  return (
    <span className="relative flex h-16 w-full items-center justify-center overflow-hidden rounded-card-sm bg-accent">
      <div
        className={cn(
          'flex w-full gap-2 px-4',
          alignment === 'center'
            ? 'flex-col items-center'
            : alignment === 'left'
              ? 'flex-col items-start'
              : alignment === 'left-inline'
                ? 'flex-row items-center'
                : 'flex-row-reverse items-center justify-end',
        )}
      >
        <span className="size-6 shrink-0 rounded-full bg-primary/40" />
        <div
          className="flex w-full flex-col gap-1.5"
          style={{alignItems: alignment === 'center' ? 'center' : 'flex-start'}}
        >
          <span
            className={cn(
              'h-1.5 rounded-sm bg-primary/20',
              alignment === 'center'
                ? 'w-10'
                : alignment === 'left'
                  ? 'w-10'
                  : 'w-12',
            )}
          />
          <span
            className={cn(
              'h-1.5 rounded-sm bg-primary/20',
              alignment === 'center'
                ? 'w-14'
                : alignment === 'left'
                  ? 'w-14'
                  : 'w-8',
            )}
          />
        </div>
      </div>
    </span>
  );
}

function DesktopPreview({variant}: {variant: 'disabled' | 'full' | 'split'}) {
  return (
    <span className="flex h-16 w-full max-w-44 items-center gap-1 rounded-card-sm bg-muted p-2">
      {variant === 'disabled' ? (
        <span className="mx-auto flex w-12 flex-col gap-1">
          <span className="h-2 rounded bg-muted-foreground/30" />
          <span className="h-2 rounded bg-muted-foreground/20" />
          <span className="h-2 rounded bg-muted-foreground/20" />
        </span>
      ) : variant === 'full' ? (
        <span className="mx-auto flex w-20 flex-col gap-1">
          <span className="mx-auto size-5 rounded-full bg-primary/60" />
          <span className="h-2 rounded bg-primary/40" />
          <span className="h-2 rounded bg-primary/25" />
          <span className="h-2 rounded bg-primary/25" />
        </span>
      ) : (
        <>
          <span className="flex w-1/3 flex-col items-center gap-1">
            <span className="size-5 rounded-full bg-primary/60" />
            <span className="h-1.5 w-6 rounded bg-primary/30" />
          </span>
          <span className="flex flex-1 flex-col gap-1">
            <span className="h-3 rounded bg-primary/40" />
            <span className="h-3 rounded bg-primary/25" />
            <span className="h-3 rounded bg-primary/25" />
          </span>
        </>
      )}
    </span>
  );
}

function ContentModePreview({
  variant,
}: {
  variant: 'spotlight' | 'stack' | 'columns';
}) {
  return (
    <span className="flex h-16 w-full max-w-44 items-center justify-center gap-1 rounded-card-sm bg-muted p-2">
      {variant === 'spotlight' ? (
        <span className="flex w-20 flex-col gap-1">
          <span className="h-5 rounded bg-primary/45" />
          <span className="h-3 rounded bg-primary/25" />
        </span>
      ) : variant === 'columns' ? (
        <span className="grid w-32 grid-cols-2 gap-1">
          <span className="h-8 rounded bg-primary/35" />
          <span className="h-8 rounded bg-primary/25" />
          <span className="h-8 rounded bg-primary/25" />
          <span className="h-8 rounded bg-primary/20" />
        </span>
      ) : (
        <span className="flex w-28 flex-col gap-1">
          <span className="h-3 rounded bg-primary/35" />
          <span className="h-3 rounded bg-primary/25" />
          <span className="h-3 rounded bg-primary/20" />
          <span className="h-3 rounded bg-primary/20" />
        </span>
      )}
    </span>
  );
}

function GridPreview({columns}: {columns: 'auto' | '1' | '2' | '3'}) {
  const count = columns === 'auto' ? 3 : Number(columns);

  return (
    <span
      className={cn(
        'grid h-16 w-full max-w-44 gap-1 rounded-card-sm bg-muted p-2',
        count === 1 && 'grid-cols-1',
        count === 2 && 'grid-cols-2',
        count === 3 && 'grid-cols-3',
      )}
    >
      {Array.from({length: count * 2}).map((_, index) => (
        <span key={index} className="rounded bg-primary/30" />
      ))}
    </span>
  );
}

function PlacementPreview({
  placement,
}: {
  placement: 'center' | 'left' | 'right';
}) {
  return (
    <span className="flex h-16 w-full max-w-44 items-center gap-1 rounded-card-sm bg-muted p-2">
      <span
        className={cn(
          'flex w-1/3 flex-col items-center gap-1',
          placement === 'center' && 'order-2 mx-auto',
          placement === 'right' && 'order-2 ml-auto',
        )}
      >
        <span className="size-5 rounded-full bg-primary/55" />
        <span className="h-1.5 w-6 rounded bg-primary/25" />
      </span>
      <span
        className={cn(
          'flex flex-1 flex-col gap-1',
          placement === 'center' && 'order-1 opacity-40',
          placement === 'right' && 'order-1',
        )}
      >
        <span className="h-3 rounded bg-primary/30" />
        <span className="h-3 rounded bg-primary/20" />
      </span>
    </span>
  );
}

function SurfacePreview({tinted}: {tinted: boolean}) {
  return (
    <span
      className={cn(
        'block h-12 w-full max-w-36 rounded-card-sm border border-primary/30',
        tinted
          ? 'bg-primary/15 shadow-[inset_0_0_0_999px_rgb(255_255_255_/_0.04)]'
          : 'bg-transparent',
      )}
    />
  );
}

function BackgroundTypePreview({type}: {type: 'gradient' | 'image'}) {
  return (
    <span
      className={cn(
        'block h-12 w-full max-w-36 rounded-card-sm border border-primary/20',
        type === 'gradient'
          ? 'bg-gradient-to-r from-fuchsia-500 via-primary to-sky-500'
          : 'bg-muted-foreground/50 bg-[linear-gradient(135deg,rgb(255_255_255_/_0.25)_25%,transparent_25%,transparent_50%,rgb(255_255_255_/_0.25)_50%,rgb(255_255_255_/_0.25)_75%,transparent_75%)] bg-[length:18px_18px]',
      )}
    />
  );
}

function GlowPreview({preset}: {preset: string}) {
  return (
    <span
      className="block size-8 rounded-full bg-primary"
      style={{
        boxShadow:
          preset === 'none'
            ? 'none'
            : preset === 'soft'
              ? '0 0 8px rgb(99 102 241 / 0.4)'
              : preset === 'medium'
                ? '0 0 14px rgb(99 102 241 / 0.55)'
                : preset === 'strong'
                  ? '0 0 22px rgb(99 102 241 / 0.8)'
                  : '0 0 14px rgb(236 72 153 / 0.7), 0 0 28px rgb(59 130 246 / 0.45)',
      }}
    />
  );
}

function ColorSwatch({color}: {color: string}) {
  return (
    <span
      className="size-8 rounded-full border border-white/30"
      style={{backgroundColor: color}}
    />
  );
}

function BadgeStylePreview({
  style,
}: {
  style: 'inline' | 'chips' | 'cards' | 'icon';
}) {
  if (style === 'icon') {
    return <BadgeCheckIcon aria-hidden className="size-7 text-primary" />;
  }

  if (style === 'cards') {
    return (
      <span className="flex w-full max-w-32 flex-col gap-1">
        <span className="h-4 rounded border border-primary/40 bg-primary/10" />
        <span className="h-4 rounded border border-primary/30 bg-primary/5" />
      </span>
    );
  }

  return (
    <span
      className={cn(
        'flex items-center gap-1 text-xs text-primary',
        style === 'chips' &&
          'rounded-full border border-primary/40 bg-primary/10 px-3 py-1',
      )}
    >
      <BadgeCheckIcon aria-hidden className="size-4" />
      <span>Badge</span>
    </span>
  );
}

function UsernameEffectPreview({
  effect,
}: {
  effect: NonNullable<EffectsConfig['usernameEffect']>;
}) {
  return (
    <span className="relative flex h-12 w-full items-center justify-center overflow-hidden rounded-card-sm bg-accent">
      <span className="relative inline-flex items-center justify-center">
        {effect === 'sparkle' ? (
          <SparklesIcon
            aria-hidden
            className="absolute -inset-2 size-12 text-amber-400/70"
          />
        ) : null}
        <span
          aria-hidden
          className={cn(
            'relative z-1 text-xl leading-none font-semibold',
            effect === 'none' && 'text-muted-foreground',
            effect === 'glow' &&
              'text-primary drop-shadow-[0_0_7px_currentColor]',
            effect === 'pulse' && 'animate-pulse text-primary',
            effect === 'scanline' && 'border-b-2 border-primary text-primary',
            effect === 'rainbow' &&
              'bg-linear-to-r from-fuchsia-500 via-amber-400 to-sky-500 bg-clip-text text-transparent',
            effect === 'sparkle' &&
              'text-primary drop-shadow-[0_0_7px_currentColor]',
            effect === 'glitch' &&
              'text-primary [text-shadow:2px_0_#f43f5e,-2px_0_#22d3ee]',
            effect === 'shimmer' &&
              'bg-linear-to-r from-primary via-white to-primary bg-[length:200%_100%] bg-clip-text text-transparent',
          )}
        >
          Aa
        </span>
      </span>
    </span>
  );
}

type EffectPreviewMark = {
  className?: string;
  style: CSSProperties;
};

const previewMark = (
  style: CSSProperties,
  className = 'rounded-full',
): EffectPreviewMark => ({className, style});

const effectPreviewMarks: Record<string, EffectPreviewMark[]> = {
  stars: [
    previewMark({
      top: '18%',
      left: '16%',
      width: 2,
      height: 2,
      background: '#fff',
      boxShadow: '0 0 5px #fff',
    }),
    previewMark({
      top: '62%',
      left: '29%',
      width: 3,
      height: 3,
      background: '#c4b5fd',
      boxShadow: '0 0 6px #a78bfa',
    }),
    previewMark({
      top: '28%',
      left: '53%',
      width: 2,
      height: 2,
      background: '#fff',
    }),
    previewMark({
      top: '70%',
      left: '73%',
      width: 3,
      height: 3,
      background: '#93c5fd',
      boxShadow: '0 0 6px #60a5fa',
    }),
    previewMark({
      top: '38%',
      left: '88%',
      width: 2,
      height: 2,
      background: '#fff',
    }),
  ],
  particles: [
    previewMark({
      top: '18%',
      left: '14%',
      width: 4,
      height: 4,
      background: '#6ee7b7',
    }),
    previewMark({
      top: '66%',
      left: '24%',
      width: 2,
      height: 2,
      background: '#fbbf24',
    }),
    previewMark({
      top: '36%',
      left: '43%',
      width: 5,
      height: 5,
      background: '#60a5fa',
    }),
    previewMark({
      top: '76%',
      left: '61%',
      width: 3,
      height: 3,
      background: '#f472b6',
    }),
    previewMark({
      top: '24%',
      left: '79%',
      width: 2,
      height: 2,
      background: '#c4b5fd',
    }),
  ],
  snow: [
    previewMark({
      top: '14%',
      left: '18%',
      width: 6,
      height: 6,
      border: '1px solid #e0f2fe',
      transform: 'rotate(45deg)',
    }),
    previewMark({
      top: '52%',
      left: '37%',
      width: 4,
      height: 4,
      border: '1px solid #fff',
      transform: 'rotate(45deg)',
    }),
    previewMark({
      top: '26%',
      left: '66%',
      width: 7,
      height: 7,
      border: '1px solid #bae6fd',
      transform: 'rotate(45deg)',
    }),
    previewMark({
      top: '72%',
      left: '84%',
      width: 4,
      height: 4,
      border: '1px solid #fff',
      transform: 'rotate(45deg)',
    }),
  ],
  rain: [
    previewMark(
      {
        top: '-5%',
        left: '18%',
        width: 1,
        height: '45%',
        background: '#60a5fa',
        transform: 'rotate(18deg)',
      },
      'rounded-none',
    ),
    previewMark(
      {
        top: '34%',
        left: '38%',
        width: 1,
        height: '45%',
        background: '#93c5fd',
        transform: 'rotate(18deg)',
      },
      'rounded-none',
    ),
    previewMark(
      {
        top: '-12%',
        left: '63%',
        width: 1,
        height: '48%',
        background: '#60a5fa',
        transform: 'rotate(18deg)',
      },
      'rounded-none',
    ),
    previewMark(
      {
        top: '42%',
        left: '82%',
        width: 1,
        height: '45%',
        background: '#bfdbfe',
        transform: 'rotate(18deg)',
      },
      'rounded-none',
    ),
  ],
  'big-circles': [
    previewMark({
      top: '12%',
      left: '8%',
      width: 30,
      height: 30,
      border: '2px solid #6ee7b7',
      opacity: 0.7,
    }),
    previewMark({
      top: '45%',
      left: '64%',
      width: 48,
      height: 48,
      border: '2px solid #3b82f6',
      opacity: 0.65,
    }),
    previewMark({
      top: '-10%',
      left: '47%',
      width: 18,
      height: 18,
      border: '2px solid #f472b6',
      opacity: 0.7,
    }),
  ],
  bubbles: [
    previewMark({
      top: '54%',
      left: '14%',
      width: 9,
      height: 9,
      border: '2px solid #7dd3fc',
    }),
    previewMark({
      top: '18%',
      left: '35%',
      width: 16,
      height: 16,
      border: '2px solid #a78bfa',
    }),
    previewMark({
      top: '62%',
      left: '61%',
      width: 22,
      height: 22,
      border: '2px solid #6ee7b7',
    }),
    previewMark({
      top: '10%',
      left: '82%',
      width: 8,
      height: 8,
      border: '2px solid #f9a8d4',
    }),
  ],
  confetti: [
    previewMark(
      {
        top: '22%',
        left: '15%',
        width: 5,
        height: 10,
        background: '#f472b6',
        transform: 'rotate(28deg)',
      },
      'rounded-none',
    ),
    previewMark(
      {
        top: '54%',
        left: '31%',
        width: 5,
        height: 10,
        background: '#fbbf24',
        transform: 'rotate(-18deg)',
      },
      'rounded-none',
    ),
    previewMark(
      {
        top: '15%',
        left: '55%',
        width: 5,
        height: 10,
        background: '#60a5fa',
        transform: 'rotate(12deg)',
      },
      'rounded-none',
    ),
    previewMark(
      {
        top: '66%',
        left: '78%',
        width: 5,
        height: 10,
        background: '#6ee7b7',
        transform: 'rotate(42deg)',
      },
      'rounded-none',
    ),
  ],
  'confetti-cannon': [
    previewMark(
      {
        bottom: '7%',
        left: '7%',
        width: 6,
        height: 16,
        background: '#f472b6',
        transform: 'rotate(55deg)',
      },
      'rounded-none',
    ),
    previewMark(
      {
        bottom: '9%',
        left: '15%',
        width: 6,
        height: 18,
        background: '#fbbf24',
        transform: 'rotate(40deg)',
      },
      'rounded-none',
    ),
    previewMark(
      {
        bottom: '13%',
        left: '24%',
        width: 6,
        height: 18,
        background: '#60a5fa',
        transform: 'rotate(25deg)',
      },
      'rounded-none',
    ),
    previewMark(
      {
        bottom: '18%',
        left: '33%',
        width: 6,
        height: 18,
        background: '#6ee7b7',
        transform: 'rotate(12deg)',
      },
      'rounded-none',
    ),
  ],
  'confetti-explosions': [
    previewMark({
      top: '48%',
      left: '45%',
      width: 8,
      height: 8,
      background: '#fbbf24',
      boxShadow:
        '0 0 0 8px rgb(244 114 182 / 0.35), 0 0 0 16px rgb(96 165 250 / 0.25)',
    }),
    previewMark({
      top: '24%',
      left: '73%',
      width: 6,
      height: 6,
      background: '#6ee7b7',
      boxShadow: '0 0 0 7px rgb(251 191 36 / 0.3)',
    }),
  ],
  'confetti-falling': [
    previewMark(
      {
        top: '8%',
        left: '20%',
        width: 5,
        height: 12,
        background: '#f472b6',
        transform: 'rotate(15deg)',
      },
      'rounded-none',
    ),
    previewMark(
      {
        top: '34%',
        left: '42%',
        width: 5,
        height: 12,
        background: '#fbbf24',
        transform: 'rotate(-12deg)',
      },
      'rounded-none',
    ),
    previewMark(
      {
        top: '62%',
        left: '69%',
        width: 5,
        height: 12,
        background: '#60a5fa',
        transform: 'rotate(18deg)',
      },
      'rounded-none',
    ),
    previewMark(
      {
        top: '20%',
        left: '86%',
        width: 5,
        height: 12,
        background: '#6ee7b7',
        transform: 'rotate(-24deg)',
      },
      'rounded-none',
    ),
  ],
  'confetti-parade': [
    previewMark(
      {
        top: '25%',
        left: '12%',
        width: '22%',
        height: 3,
        background: '#f472b6',
        transform: 'rotate(-10deg)',
      },
      'rounded-none',
    ),
    previewMark(
      {
        top: '47%',
        left: '38%',
        width: '24%',
        height: 3,
        background: '#fbbf24',
        transform: 'rotate(8deg)',
      },
      'rounded-none',
    ),
    previewMark(
      {
        top: '68%',
        left: '66%',
        width: '22%',
        height: 3,
        background: '#60a5fa',
        transform: 'rotate(-6deg)',
      },
      'rounded-none',
    ),
  ],
  party: [
    previewMark({
      top: '22%',
      left: '15%',
      width: 7,
      height: 7,
      background: '#f472b6',
      boxShadow: '0 0 7px #f472b6',
    }),
    previewMark({
      top: '58%',
      left: '27%',
      width: 5,
      height: 5,
      background: '#fbbf24',
      boxShadow: '0 0 7px #fbbf24',
    }),
    previewMark({
      top: '29%',
      left: '52%',
      width: 8,
      height: 8,
      background: '#60a5fa',
      boxShadow: '0 0 7px #60a5fa',
    }),
    previewMark({
      top: '68%',
      left: '78%',
      width: 6,
      height: 6,
      background: '#6ee7b7',
      boxShadow: '0 0 7px #6ee7b7',
    }),
  ],
  firefly: [
    previewMark({
      top: '18%',
      left: '20%',
      width: 3,
      height: 3,
      background: '#fef08a',
      boxShadow: '0 0 8px #fef08a',
    }),
    previewMark({
      top: '66%',
      left: '34%',
      width: 3,
      height: 3,
      background: '#fde68a',
      boxShadow: '0 0 8px #fde68a',
    }),
    previewMark({
      top: '34%',
      left: '64%',
      width: 3,
      height: 3,
      background: '#fef08a',
      boxShadow: '0 0 8px #fef08a',
    }),
    previewMark({
      top: '74%',
      left: '83%',
      width: 3,
      height: 3,
      background: '#fde68a',
      boxShadow: '0 0 8px #fde68a',
    }),
  ],
  fireworks: [
    previewMark({
      top: '34%',
      left: '28%',
      width: 6,
      height: 6,
      background: '#f472b6',
      boxShadow:
        '0 0 0 7px rgb(244 114 182 / 0.25), 0 0 0 14px rgb(244 114 182 / 0.12)',
    }),
    previewMark({
      top: '60%',
      left: '72%',
      width: 6,
      height: 6,
      background: '#60a5fa',
      boxShadow:
        '0 0 0 7px rgb(96 165 250 / 0.25), 0 0 0 14px rgb(96 165 250 / 0.12)',
    }),
  ],
  fountain: [
    previewMark(
      {
        bottom: '11%',
        left: '50%',
        width: 3,
        height: 26,
        background: '#60a5fa',
        transform: 'rotate(0deg)',
      },
      'rounded-none',
    ),
    previewMark(
      {
        bottom: '11%',
        left: '42%',
        width: 2,
        height: 20,
        background: '#6ee7b7',
        transform: 'rotate(24deg)',
      },
      'rounded-none',
    ),
    previewMark(
      {
        bottom: '11%',
        left: '58%',
        width: 2,
        height: 20,
        background: '#a78bfa',
        transform: 'rotate(-24deg)',
      },
      'rounded-none',
    ),
  ],
  hyperspace: [
    previewMark(
      {
        top: '50%',
        left: '50%',
        width: '47%',
        height: 1,
        background: '#60a5fa',
        transform: 'rotate(-18deg)',
        transformOrigin: 'left center',
      },
      'rounded-none',
    ),
    previewMark(
      {
        top: '50%',
        left: '50%',
        width: '47%',
        height: 1,
        background: '#f472b6',
        transform: 'rotate(18deg)',
        transformOrigin: 'left center',
      },
      'rounded-none',
    ),
    previewMark(
      {
        top: '50%',
        left: '50%',
        width: '47%',
        height: 1,
        background: '#6ee7b7',
        transform: 'rotate(-5deg)',
        transformOrigin: 'left center',
      },
      'rounded-none',
    ),
  ],
  links: [
    previewMark(
      {top: '28%', left: '18%', width: '56%', height: 1, background: '#60a5fa'},
      'rounded-none',
    ),
    previewMark(
      {
        top: '63%',
        left: '30%',
        width: '47%',
        height: 1,
        background: '#6ee7b7',
        transform: 'rotate(-12deg)',
      },
      'rounded-none',
    ),
    previewMark({
      top: '26%',
      left: '16%',
      width: 6,
      height: 6,
      background: '#60a5fa',
    }),
    previewMark({
      top: '24%',
      left: '70%',
      width: 6,
      height: 6,
      background: '#f472b6',
    }),
    previewMark({
      top: '60%',
      left: '28%',
      width: 6,
      height: 6,
      background: '#6ee7b7',
    }),
  ],
  matrix: [
    previewMark(
      {top: '12%', left: '12%', width: '20%', height: 2, background: '#4ade80'},
      'rounded-none',
    ),
    previewMark(
      {top: '30%', left: '42%', width: '34%', height: 2, background: '#22c55e'},
      'rounded-none',
    ),
    previewMark(
      {top: '50%', left: '21%', width: '28%', height: 2, background: '#4ade80'},
      'rounded-none',
    ),
    previewMark(
      {top: '70%', left: '60%', width: '24%', height: 2, background: '#22c55e'},
      'rounded-none',
    ),
  ],
  meteors: [
    previewMark(
      {
        top: '16%',
        left: '68%',
        width: 28,
        height: 2,
        background: 'linear-gradient(90deg, transparent, #fff)',
        transform: 'rotate(135deg)',
        transformOrigin: 'right center',
      },
      'rounded-none',
    ),
    previewMark(
      {
        top: '54%',
        left: '44%',
        width: 22,
        height: 2,
        background: 'linear-gradient(90deg, transparent, #60a5fa)',
        transform: 'rotate(135deg)',
        transformOrigin: 'right center',
      },
      'rounded-none',
    ),
    previewMark(
      {
        top: '76%',
        left: '18%',
        width: 18,
        height: 2,
        background: 'linear-gradient(90deg, transparent, #f472b6)',
        transform: 'rotate(135deg)',
        transformOrigin: 'right center',
      },
      'rounded-none',
    ),
  ],
  ribbons: [
    previewMark(
      {
        top: '24%',
        left: '8%',
        width: '84%',
        height: '55%',
        border: '2px solid #c084fc',
        transform: 'rotate(-8deg)',
      },
      'rounded-[50%]',
    ),
    previewMark(
      {
        top: '31%',
        left: '14%',
        width: '72%',
        height: '45%',
        border: '1px solid #60a5fa',
        transform: 'rotate(8deg)',
      },
      'rounded-[50%]',
    ),
  ],
  'sea-anemone': [
    previewMark(
      {
        bottom: '10%',
        left: '24%',
        width: 2,
        height: '60%',
        background: '#c084fc',
        transform: 'rotate(20deg)',
        transformOrigin: 'bottom center',
      },
      'rounded-none',
    ),
    previewMark(
      {
        bottom: '10%',
        left: '46%',
        width: 2,
        height: '72%',
        background: '#60a5fa',
        transform: 'rotate(0deg)',
        transformOrigin: 'bottom center',
      },
      'rounded-none',
    ),
    previewMark(
      {
        bottom: '10%',
        left: '68%',
        width: 2,
        height: '60%',
        background: '#6ee7b7',
        transform: 'rotate(-20deg)',
        transformOrigin: 'bottom center',
      },
      'rounded-none',
    ),
  ],
  squares: [
    previewMark(
      {
        top: '18%',
        left: '18%',
        width: 12,
        height: 12,
        border: '2px solid #60a5fa',
      },
      'rounded-sm',
    ),
    previewMark(
      {
        top: '58%',
        left: '60%',
        width: 16,
        height: 16,
        border: '2px solid #f472b6',
      },
      'rounded-sm',
    ),
    previewMark(
      {top: '32%', left: '78%', width: 8, height: 8, background: '#6ee7b7'},
      'rounded-sm',
    ),
  ],
  triangles: [
    previewMark(
      {
        top: '18%',
        left: '18%',
        width: 0,
        height: 0,
        borderLeft: '8px solid transparent',
        borderRight: '8px solid transparent',
        borderBottom: '14px solid #60a5fa',
      },
      'rounded-none',
    ),
    previewMark(
      {
        top: '56%',
        left: '57%',
        width: 0,
        height: 0,
        borderLeft: '11px solid transparent',
        borderRight: '11px solid transparent',
        borderBottom: '19px solid #f472b6',
      },
      'rounded-none',
    ),
    previewMark(
      {
        top: '32%',
        left: '80%',
        width: 0,
        height: 0,
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderBottom: '10px solid #6ee7b7',
      },
      'rounded-none',
    ),
  ],
};

function EffectPreview({effect}: {effect: BackgroundEffect | string}) {
  const marks = effectPreviewMarks[effect] ?? [];

  return (
    <span
      aria-hidden
      className={cn(
        'relative block h-12 w-full overflow-hidden rounded-card-sm border border-current/10 bg-slate-950/90',
        effect === 'aurora' &&
          'bg-[linear-gradient(120deg,#172554,#047857,#312e81)]',
        effect === 'blur' &&
          'bg-gradient-to-r from-slate-400/70 via-primary/50 to-slate-700/70 blur-[2px]',
        effect === 'night' && 'bg-slate-950',
        effect === 'spotlight' &&
          'bg-[radial-gradient(circle_at_center,#fef3c7_0%,#1e293b_35%,#020617_75%)]',
        effect === 'stars' &&
          'bg-[radial-gradient(circle_at_20%_25%,#fff_0_1px,transparent_2px),radial-gradient(circle_at_75%_65%,#93c5fd_0_1px,transparent_2px),#020617] bg-[length:18px_18px,27px_27px]',
        effect === 'particles' &&
          'bg-[radial-gradient(circle_at_18%_30%,#60a5fa_0_2px,transparent_3px),radial-gradient(circle_at_55%_70%,#6ee7b7_0_2px,transparent_3px),#0f172a] bg-[length:24px_24px,31px_31px]',
        effect === 'snow' &&
          'bg-[radial-gradient(circle,#fff_0_2px,transparent_3px),radial-gradient(circle,#bfdbfe_0_1px,transparent_2px),#172554] bg-[length:13px_13px,21px_21px]',
        effect === 'rain' &&
          'bg-[repeating-linear-gradient(105deg,transparent_0_8px,#60a5fa_9px_10px,transparent_11px_18px),#0f172a]',
        effect === 'big-circles' &&
          'bg-[radial-gradient(circle_at_22%_50%,#60a5fa_0_13px,transparent_14px),radial-gradient(circle_at_78%_35%,#c084fc_0_9px,transparent_10px),#111827]',
        effect === 'bubbles' &&
          'bg-[radial-gradient(circle_at_25%_65%,transparent_0_7px,#60a5fa_8px_9px,transparent_10px),radial-gradient(circle_at_75%_30%,transparent_0_5px,#c084fc_6px_7px,transparent_8px),#111827]',
        (effect === 'confetti' ||
          effect === 'confetti-cannon' ||
          effect === 'confetti-explosions' ||
          effect === 'confetti-falling' ||
          effect === 'confetti-parade' ||
          effect === 'party') &&
          'bg-[repeating-linear-gradient(120deg,#f472b6_0_3px,transparent_3px_12px),repeating-linear-gradient(60deg,#fbbf24_0_3px,transparent_3px_16px),#312e81]',
        (effect === 'firefly' || effect === 'fire') &&
          'bg-[radial-gradient(circle_at_25%_65%,#fef08a_0_2px,transparent_5px),radial-gradient(circle_at_75%_30%,#fb923c_0_3px,transparent_10px),#431407]',
        effect === 'fireworks' &&
          'bg-[radial-gradient(circle_at_30%_45%,#f472b6_0_2px,transparent_16px),radial-gradient(circle_at_70%_35%,#60a5fa_0_2px,transparent_18px),#111827]',
        effect === 'fountain' &&
          'bg-[linear-gradient(75deg,transparent_45%,#60a5fa_46%_49%,transparent_50%),linear-gradient(105deg,transparent_45%,#6ee7b7_46%_49%,transparent_50%),#172554]',
        (effect === 'fire' || effect === 'fireworks') &&
          'bg-[radial-gradient(circle_at_bottom,#fb923c,#7f1d1d_40%,#111827_75%)]',
        effect === 'ambient' &&
          'bg-[radial-gradient(circle_at_20%_30%,#60a5fa_0%,transparent_35%),radial-gradient(circle_at_75%_70%,#c084fc_0%,transparent_40%),#111827]',
        effect === 'matrix' && 'bg-emerald-950/90',
        effect === 'hyperspace' && 'bg-indigo-950/90',
      )}
    >
      {marks.map((mark, index) => (
        <span
          key={`${effect}-${index}`}
          className={cn('absolute', mark.className)}
          style={mark.style}
        />
      ))}
    </span>
  );
}

function ChoiceGrid({
  disabled,
  items,
  onChange,
  value,
}: {
  disabled?: boolean;
  items: {
    value: string;
    label: ReactNode;
    description?: ReactNode;
    preview?: ReactNode;
    kind?: 'icon' | 'thumbnail' | 'wireframe' | 'swatch' | 'effect';
  }[];
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <VisualOptionGrid
      disabled={disabled}
      items={items}
      onChange={onChange}
      value={value}
    />
  );
}

function SwitchRow({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: ReactNode;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-3 rounded-card-sm border bg-card px-3 py-2 text-sm">
      <span>{label}</span>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
      />
    </label>
  );
}

function FeatureLockedNotice({feature}: {feature: ReactNode}) {
  return (
    <Alert.Root className="mb-4" fillStyle="subtleFill">
      <LockIcon />
      <Alert.Title>{feature}</Alert.Title>
      <Alert.Description>
        <Trans message="This customization is not included in the current plan." />
      </Alert.Description>
    </Alert.Root>
  );
}

function compactConfig<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => {
      if (entry === undefined || entry === null || entry === '') {
        return false;
      }
      if (Array.isArray(entry)) {
        return entry.length > 0;
      }
      return true;
    }),
  ) as T;
}

function SettingRow({
  children,
  label,
}: {
  children: ReactNode;
  label: ReactNode;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-[180px_1fr] sm:items-center">
      <div className="text-sm font-semibold">{label}</div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function LockedVisualNotice() {
  const appearance = useBiolinkEditorStore(s => s.appearance);
  const updateAppearance = useBiolinkEditorStore(s => s.updateAppearance);

  return (
    <Alert.Root className="mb-6" fillStyle="subtleFill">
      <LockIcon />
      <Alert.Title>
        <Trans message="Curated theme is locked" />
      </Alert.Title>
      <Alert.Description>
        <Trans message="Header content can still be edited. To change visual settings, customize a copy of this theme." />
      </Alert.Description>
      <Alert.Action>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            updateAppearance(unlockThemeForCustomization(appearance))
          }
        >
          <PaintbrushIcon data-icon="inline-start" />
          <Trans message="Customize" />
        </Button>
      </Alert.Action>
    </Alert.Root>
  );
}

function ColorReadOnly({value}: {value: string}) {
  return (
    <div className="inline-flex h-9 items-center gap-2 rounded-input border px-3 text-sm">
      <span
        className="size-4 rounded-full border"
        style={{backgroundColor: value}}
      />
      {value}
    </div>
  );
}

function FontDialog({
  disabled,
  onChange,
  value,
}: {
  disabled?: boolean;
  onChange: (font: {family: string; google?: boolean}) => void;
  value: {family: string; google?: boolean};
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger
        render={
          <Button
            variant="outline"
            color="default"
            disabled={disabled}
            className="w-full justify-between rounded-input"
          />
        }
      >
        <FontDisplayName font={value} />
        <ChevronDownIcon data-icon="inline-end" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="supports-backdrop-filter:backdrop-blur-none" />
        <Dialog.Content className="sm:max-w-xl">
          <Dialog.Header>
            <Dialog.Title>
              <Trans message="Select a font" />
            </Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <CommonFontSelector value={value} onChange={onChange} />
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PageFontSelector({disabled}: {disabled?: boolean}) {
  const updateAppearance = useBiolinkEditorStore(s => s.updateAppearance);
  const currentValue =
    useBiolinkEditorStore(s => s.appearance?.fontConfig) ?? BrowserSafeFonts[0];

  return (
    <FontDialog
      disabled={disabled}
      value={currentValue}
      onChange={newValue => {
        updateAppearance(
          {
            fontConfig: compactFontConfig({
              ...currentValue,
              ...newValue,
            }),
          },
          {markThemeModified: true},
        );
      }}
    />
  );
}

function BrandingStyle() {
  const updateAppearance = useBiolinkEditorStore(s => s.updateAppearance);
  const {branding, biolink} = useSettings();
  const {isSubscribed} = useAuth();
  const {billing} = useSettings();
  const currentValue =
    useBiolinkEditorStore(s => s.appearance?.hideBranding) || false;

  if (!biolink?.show_branding) {
    return null;
  }

  return (
    <div>
      <h2 className={appearanceHeaderClassnames.h2}>
        <Trans message="Branding" />
      </h2>

      {billing?.enable && !isSubscribed && (
        <NoFeaturePermissionPopover.Root
          message={
            <Trans
              message="Upgrade to remove :site logo."
              values={{site: branding.site_name}}
            />
          }
        >
          <NoFeaturePermissionPopover.ButtonTrigger className="mb-3.5" />
        </NoFeaturePermissionPopover.Root>
      )}

      <label className="flex items-center gap-3 text-sm">
        <Switch
          disabled={!isSubscribed}
          checked={currentValue}
          onCheckedChange={checked => {
            updateAppearance({
              hideBranding: checked,
            });
          }}
        />
        <Trans message="Hide :site logo" values={{site: branding.site_name}} />
      </label>
    </div>
  );
}
