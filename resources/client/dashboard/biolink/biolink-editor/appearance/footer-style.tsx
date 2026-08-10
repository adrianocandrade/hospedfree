import {appearanceHeaderClassnames} from '@app/dashboard/biolink/biolink-editor/appearance/header-classnames';
import {useBiolinkEditorStore} from '@app/dashboard/biolink/biolink-editor/biolink-editor-store';
import type {BiolinkWidget} from '@app/gen/schemas/biolink-widget';
import {Button} from '@shadcn/button/button';
import {Checkbox} from '@shadcn/forms/checkbox/checkbox';
import {Input} from '@shadcn/forms/input/input';
import {Switch} from '@shadcn/forms/switch/switch';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {cn} from '@ui/utils/cn';
import {
  ArrowUpIcon,
  Building2Icon,
  LinkIcon,
  PlusIcon,
  Share2Icon,
  Trash2Icon,
  UserRoundIcon,
} from 'lucide-react';
import {nanoid} from 'nanoid';
import type {ReactNode} from 'react';

type FooterPreset = 'compact' | 'community' | 'commercial';
type BrandSource = 'auto' | 'logo' | 'avatar';
type FooterBlock = 'brand' | 'navigation' | 'socials' | 'cta' | 'backToTop';

type FooterLink = {
  id?: string;
  label?: string;
  source?: 'url' | 'widget';
  url?: string;
  widgetId?: number;
  variant?: 'link' | 'cta';
  active?: boolean;
  position?: number;
};

type FooterConfig = {
  version?: number;
  enabled?: boolean;
  preset?: FooterPreset;
  brandSource?: BrandSource;
  blocks?: Partial<Record<FooterBlock, boolean>>;
  showPlatformLinks?: boolean;
  links?: FooterLink[];
};

const presetOptions: Array<{
  value: FooterPreset;
  label: ReactNode;
  description: ReactNode;
  icon: typeof UserRoundIcon;
}> = [
  {
    value: 'compact',
    label: <Trans message="Compact" />,
    description: <Trans message="Creator footer with two desktop zones." />,
    icon: UserRoundIcon,
  },
  {
    value: 'community',
    label: <Trans message="Community" />,
    description: (
      <Trans message="Brand, navigation and social call to action." />
    ),
    icon: Share2Icon,
  },
  {
    value: 'commercial',
    label: <Trans message="Commercial" />,
    description: <Trans message="Three columns for local businesses." />,
    icon: Building2Icon,
  },
];

export function FooterStyle() {
  const {trans} = useTrans();
  const appearance = useBiolinkEditorStore(s => s.appearance);
  const content = useBiolinkEditorStore(s => s.content);
  const updateAppearance = useBiolinkEditorStore(s => s.updateAppearance);
  const current = (appearance?.footerConfig ?? {}) as FooterConfig;
  const footer: FooterConfig = {
    version: 1,
    enabled: false,
    preset: 'compact',
    brandSource: 'auto',
    showPlatformLinks: true,
    ...current,
    blocks: {
      brand: true,
      navigation: true,
      socials: true,
      cta: true,
      backToTop: true,
      ...current.blocks,
    },
  };

  const update = (partial: Partial<FooterConfig>) => {
    updateAppearance(
      {
        footerConfig: {
          ...footer,
          ...partial,
          version: 1,
        },
      } as never,
      {markThemeModified: true},
    );
  };

  const setBlock = (block: FooterBlock, checked: boolean) => {
    update({blocks: {...footer.blocks, [block]: checked}});
  };

  const links = footer.links ?? [];
  const eligibleWidgets = content.filter(
    (
      item,
    ): item is BiolinkWidget & {
      config: BiolinkWidget['config'] & {title: string};
    } =>
      item.model_type === 'biolinkWidget' &&
      typeof item.config?.title === 'string' &&
      item.config.title.trim() !== '',
  );

  const toggleWidgetLink = (widgetId: number, checked: boolean) => {
    const currentLink = links.find(
      link => link.source === 'widget' && link.widgetId === widgetId,
    );
    if (checked && !currentLink) {
      update({
        links: [
          ...links,
          {
            id: nanoid(8),
            source: 'widget',
            widgetId,
            variant: 'link',
            active: true,
            position: links.length,
          },
        ],
      });
    } else if (!checked && currentLink) {
      update({links: links.filter(link => link !== currentLink)});
    }
  };

  const updateLink = (id: string | undefined, partial: Partial<FooterLink>) => {
    update({
      links: links.map(link => (link.id === id ? {...link, ...partial} : link)),
    });
  };

  return (
    <section className="flex flex-col gap-8">
      <div>
        <h2 className={appearanceHeaderClassnames.h2}>
          <Trans message="Footer" />
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          <Trans message="Add your brand, page sections and social links above the platform footer." />
        </p>
      </div>

      <SettingSwitch
        checked={footer.enabled !== false}
        label={<Trans message="Show owner footer" />}
        description={
          <Trans message="Turning this off keeps only the platform branding and legal links." />
        }
        onChange={enabled => update({enabled})}
      />

      {footer.enabled !== false ? (
        <>
          <SettingGroup
            title={<Trans message="Footer preset" />}
            description={
              <Trans message="The preset controls columns and responsive structure." />
            }
          >
            <div className="grid gap-2 sm:grid-cols-3">
              {presetOptions.map(option => {
                const Icon = option.icon;
                const selected = footer.preset === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => update({preset: option.value})}
                    className={cn(
                      'min-h-28 rounded-xl border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                      selected
                        ? 'border-primary bg-primary/8'
                        : 'bg-card hover:bg-hover',
                    )}
                  >
                    <Icon className="mb-3 size-5" />
                    <span className="block text-sm font-semibold">
                      {option.label}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </SettingGroup>

          <SettingGroup
            title={<Trans message="Brand source" />}
            description={
              <Trans message="Reuse the logo or avatar already configured in the header." />
            }
          >
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ['auto', <Trans message="Automatic" />],
                  ['logo', <Trans message="Logo" />],
                  ['avatar', <Trans message="Avatar" />],
                ] as Array<[BrandSource, ReactNode]>
              ).map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  variant={footer.brandSource === value ? 'default' : 'outline'}
                  color={footer.brandSource === value ? 'primary' : 'default'}
                  onClick={() => update({brandSource: value})}
                >
                  {label}
                </Button>
              ))}
            </div>
          </SettingGroup>

          <SettingGroup
            title={<Trans message="Footer blocks" />}
            description={
              <Trans message="Choose which content the preset should display." />
            }
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <SettingSwitch
                compact
                checked={footer.blocks?.brand !== false}
                label={<Trans message="Owner brand" />}
                onChange={checked => setBlock('brand', checked)}
              />
              <SettingSwitch
                compact
                checked={footer.blocks?.navigation !== false}
                label={<Trans message="Page navigation" />}
                onChange={checked => setBlock('navigation', checked)}
              />
              <SettingSwitch
                compact
                checked={footer.blocks?.socials !== false}
                label={<Trans message="Social networks" />}
                onChange={checked => setBlock('socials', checked)}
              />
              <SettingSwitch
                compact
                checked={footer.blocks?.cta !== false}
                label={<Trans message="Call to action" />}
                onChange={checked => setBlock('cta', checked)}
              />
              <SettingSwitch
                compact
                checked={footer.blocks?.backToTop !== false}
                label={
                  <span className="inline-flex items-center gap-2">
                    <ArrowUpIcon className="size-4" />
                    <Trans message="Back to top" />
                  </span>
                }
                onChange={checked => setBlock('backToTop', checked)}
              />
            </div>
          </SettingGroup>

          <SettingGroup
            title={<Trans message="Widget links" />}
            description={
              <Trans message="Selected widgets become navigation links using their section title." />
            }
          >
            {eligibleWidgets.length ? (
              <div className="divide-y rounded-xl border bg-card">
                {eligibleWidgets.map(widget => {
                  const checked = links.some(
                    link =>
                      link.source === 'widget' && link.widgetId === widget.id,
                  );
                  return (
                    <label
                      key={widget.id}
                      className="flex min-h-11 items-center gap-3 px-3 py-2 text-sm"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={value =>
                          toggleWidgetLink(widget.id, value === true)
                        }
                      />
                      <LinkIcon className="size-4 text-muted-foreground" />
                      <span className="min-w-0 truncate">
                        {widget.config.title}
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                <Trans message="Add titled widgets to make them available as footer links." />
              </p>
            )}
          </SettingGroup>

          <SettingGroup
            title={<Trans message="Custom links and CTA" />}
            description={
              <Trans message="Add external links or promote one link as the footer call to action." />
            }
          >
            <div className="flex flex-col gap-3">
              {links
                .filter(link => (link.source ?? 'url') === 'url')
                .map(link => (
                  <div
                    key={link.id}
                    className="grid gap-2 rounded-xl border bg-card p-3 sm:grid-cols-[1fr_1.4fr_auto]"
                  >
                    <Input
                      aria-label={trans(message('Link label'))}
                      placeholder={trans(message('Link label'))}
                      value={link.label ?? ''}
                      onChange={event =>
                        updateLink(link.id, {label: event.target.value})
                      }
                    />
                    <Input
                      aria-label={trans(message('Link URL'))}
                      type="url"
                      placeholder="https://"
                      value={link.url ?? ''}
                      onChange={event =>
                        updateLink(link.id, {url: event.target.value})
                      }
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={link.variant === 'cta' ? 'default' : 'outline'}
                        color={link.variant === 'cta' ? 'primary' : 'default'}
                        onClick={() =>
                          updateLink(link.id, {
                            variant: link.variant === 'cta' ? 'link' : 'cta',
                          })
                        }
                      >
                        <Trans message="CTA" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        color="danger"
                        aria-label={trans(message('Remove footer link'))}
                        onClick={() =>
                          update({
                            links: links.filter(item => item.id !== link.id),
                          })
                        }
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  update({
                    links: [
                      ...links,
                      {
                        id: nanoid(8),
                        label: '',
                        url: '',
                        source: 'url',
                        variant: 'link',
                        active: true,
                        position: links.length,
                      },
                    ],
                  })
                }
              >
                <PlusIcon data-icon="inline-start" />
                <Trans message="Add footer link" />
              </Button>
            </div>
          </SettingGroup>
        </>
      ) : null}

      <SettingSwitch
        checked={footer.showPlatformLinks !== false}
        label={<Trans message="Show platform legal links" />}
        description={
          <Trans message="FAQ, cookies, privacy, terms and contact remain in the platform footer." />
        }
        onChange={showPlatformLinks => update({showPlatformLinks})}
      />
    </section>
  );
}

function SettingGroup({
  title,
  description,
  children,
}: {
  title: ReactNode;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-t pt-6">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

function SettingSwitch({
  checked,
  compact,
  label,
  description,
  onChange,
}: {
  checked: boolean;
  compact?: boolean;
  label: ReactNode;
  description?: ReactNode;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={cn(
        'flex min-h-11 items-center justify-between gap-4 rounded-xl border bg-card px-3 py-2',
        !compact && 'p-4',
      )}
    >
      <span className="min-w-0 text-sm">
        <span className="block font-medium">{label}</span>
        {description ? (
          <span className="mt-1 block text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
