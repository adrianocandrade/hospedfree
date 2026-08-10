import {urlIsValid} from '@app/dashboard/links/utils/url-is-valid';
import {type AddContentCategory} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-list';
import {WidgetCatalogEntries} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-catalog-entries';
import {type BiolinkWidget} from '@app/gen/schemas/biolink-widget';
import {useControlledState} from '@react-stately/utils';
import {Dialog} from '@shadcn/dialog/dialog';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@shadcn/forms/input-group/input-group';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {cn} from '@ui/utils/cn';
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  HeartIcon,
  LayoutGridIcon,
  LayoutTemplateIcon,
  LinkIcon,
  MessagesSquareIcon,
  MousePointerClickIcon,
  PlayCircleIcon,
  SearchIcon,
  ShoppingBagIcon,
  SparklesIcon,
  type LucideIcon,
} from 'lucide-react';
import {type ReactElement, type ReactNode, useMemo, useState} from 'react';

type WidgetType = BiolinkWidget['type'];
type AddCategoryId = 'suggested' | AddContentCategory | 'all';

export type AddContentSelection =
  | {kind: 'link'; initialUrl?: string}
  | {
      kind: 'widget';
      catalogEntryId: string;
      widgetType: WidgetType;
      initialConfig: Record<string, unknown>;
      initialItems?: Array<Record<string, unknown>>;
    };

interface SelectWidgetDialogProps {
  children?: ReactElement<typeof Dialog.Trigger>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelect: (selection: AddContentSelection) => void;
}

interface AddContentItem {
  id: string;
  kind: 'link' | 'widget';
  widgetType?: WidgetType;
  label: ReactNode;
  searchLabel: string;
  description: ReactNode;
  searchDescription: string;
  category: AddCategoryId;
  keywords: string[];
  image: string;
  featured?: boolean;
  sortOrder: number;
  initialConfig?: Record<string, unknown>;
  initialItems?: Array<Record<string, unknown>>;
}

interface CategoryDefinition {
  id: AddCategoryId;
  label: ReactNode;
  icon: LucideIcon;
}

const quickActionIds = [
  'link',
  'widget:text',
  'widget:image',
  'widget:socials',
];

const categoryIconStyles: Record<AddCategoryId, string> = {
  suggested: 'bg-[#DAF3F9] text-[#207588]',
  social: 'bg-[#F2A6C2] text-[#231F20]',
  media: 'bg-[#BCADEF] text-[#231F20]',
  text: 'bg-[#A4D9EE] text-[#231F20]',
  commerce: 'bg-[#C0EC6A] text-[#231F20]',
  contact: 'bg-[#A9EAC7] text-[#231F20]',
  events: 'bg-[#E4CA68] text-[#231F20]',
  engagement: 'bg-[#F2B47E] text-[#231F20]',
  all: 'bg-muted text-foreground',
};

function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function isCatalogCategory(id: AddCategoryId): id is AddContentCategory {
  return id !== 'suggested' && id !== 'all';
}

export function SelectWidgetDialog({
  children,
  open: propsOpen,
  onOpenChange: propsOnOpenChange,
  onSelect,
}: SelectWidgetDialogProps) {
  const {trans} = useTrans();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState<AddCategoryId>('suggested');
  const [open, setOpen] = useControlledState(
    propsOpen,
    false,
    propsOnOpenChange,
  );

  const trimmedQuery = query.trim();
  const normalizedQuery = normalizeSearch(trimmedQuery);
  const queryIsUrl = urlIsValid(trimmedQuery, {checkForDomain: true});
  const searchPlaceholder = trans(message('Paste or search a link'));

  const categoryDefinitions: CategoryDefinition[] = useMemo(
    () => [
      {
        id: 'suggested',
        label: <Trans message="Suggested" />,
        icon: SparklesIcon,
      },
      {id: 'social', label: <Trans message="Social" />, icon: HeartIcon},
      {
        id: 'engagement',
        label: <Trans message="Engagement" />,
        icon: MousePointerClickIcon,
      },
      {id: 'media', label: <Trans message="Media" />, icon: PlayCircleIcon},
      {
        id: 'text',
        label: <Trans message="Content" />,
        icon: LayoutTemplateIcon,
      },
      {
        id: 'commerce',
        label: <Trans message="Commerce" />,
        icon: ShoppingBagIcon,
      },
      {
        id: 'contact',
        label: <Trans message="Contact" />,
        icon: MessagesSquareIcon,
      },
      {
        id: 'events',
        label: <Trans message="Events" />,
        icon: CalendarDaysIcon,
      },
      {id: 'all', label: <Trans message="View all" />, icon: LayoutGridIcon},
    ],
    [],
  );

  const items = useMemo<AddContentItem[]>(() => {
    const linkItem: AddContentItem = {
      id: 'link',
      kind: 'link',
      label: <Trans message="Link" />,
      searchLabel: 'Link',
      description: (
        <Trans message="Add a new destination link to your biolink." />
      ),
      searchDescription: 'Add a new destination link to your biolink.',
      category: 'suggested',
      keywords: ['link', 'url', 'website', 'site', 'button', 'botao'],
      image: '/images/icons/meulinkbio/v2/link.webp',
      featured: true,
      sortOrder: 10,
    };

    const widgetItems = WidgetCatalogEntries.filter(
      entry => entry.status === 'available',
    ).map(entry => ({
      id: entry.id,
      kind: 'widget' as const,
      widgetType: entry.type,
      label: entry.name,
      searchLabel: entry.searchName,
      description: entry.description,
      searchDescription: entry.searchDescription,
      category: entry.category,
      keywords: entry.keywords,
      image: entry.image,
      featured: entry.featured,
      sortOrder: entry.sortOrder,
      initialConfig: entry.initialConfig,
      initialItems: entry.initialItems,
    }));

    return [linkItem, ...widgetItems];
  }, []);

  const categoryCounts = useMemo(() => {
    return items.reduce(
      (counts, item) => {
        if (isCatalogCategory(item.category)) {
          counts[item.category] = (counts[item.category] ?? 0) + 1;
        }
        return counts;
      },
      {} as Partial<Record<AddContentCategory, number>>,
    );
  }, [items]);

  const visibleCategories = useMemo(() => {
    return categoryDefinitions.filter(category => {
      if (category.id === 'suggested' || category.id === 'all') {
        return true;
      }
      return isCatalogCategory(category.id) && !!categoryCounts[category.id];
    });
  }, [categoryCounts, categoryDefinitions]);

  const filteredItems = useMemo(() => {
    const matchesSearch = (item: AddContentItem) => {
      const haystack = normalizeSearch(
        [
          item.searchLabel,
          item.searchDescription,
          item.widgetType ?? '',
          ...item.keywords,
        ].join(' '),
      );
      return haystack.includes(normalizedQuery);
    };

    let candidates = items;

    if (normalizedQuery) {
      candidates = items.filter(matchesSearch);
    } else if (selectedCategory === 'suggested') {
      candidates = items.filter(item => item.featured);
    } else if (selectedCategory !== 'all') {
      candidates = items.filter(item => item.category === selectedCategory);
    }

    return [...candidates].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [items, normalizedQuery, selectedCategory]);

  const quickActions = useMemo(
    () =>
      quickActionIds
        .map(id => items.find(item => item.id === id))
        .filter((item): item is AddContentItem => !!item),
    [items],
  );
  const linkItem = items.find(item => item.id === 'link');

  const selectItem = (item: AddContentItem, initialUrl?: string) => {
    setOpen(false);
    setQuery('');
    setSelectedCategory('suggested');

    if (item.kind === 'link') {
      onSelect({kind: 'link', initialUrl});
    } else if (item.widgetType) {
      onSelect({
        kind: 'widget',
        catalogEntryId: item.id,
        widgetType: item.widgetType,
        initialConfig: item.initialConfig ?? {},
        initialItems: item.initialItems,
      });
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={isOpen => {
        setOpen(isOpen);
        if (!isOpen) {
          setQuery('');
          setSelectedCategory('suggested');
        }
      }}
    >
      {children}
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Content className="sm:max-w-4xl">
          <Dialog.Header>
            <Dialog.Title>
              <Trans message="Add" />
            </Dialog.Title>
          </Dialog.Header>
          <Dialog.Body className="max-h-[min(78vh,760px)] overflow-y-auto">
            <InputGroup className="mb-6 h-13 rounded-full border-transparent bg-muted/70 px-2 hover:border-transparent">
              <InputGroupAddon>
                <SearchIcon className="size-5" />
              </InputGroupAddon>
              <InputGroupInput
                bindToHookForm={false}
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="text-base"
              />
            </InputGroup>

            <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
              <nav className="flex gap-2 overflow-x-auto pb-1 md:block md:space-y-1 md:overflow-visible md:pb-0">
                {visibleCategories.map(category => (
                  <CategoryButton
                    key={category.id}
                    category={category}
                    selected={selectedCategory === category.id && !query}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setQuery('');
                    }}
                  />
                ))}
              </nav>

              <div className="min-w-0">
                {!trimmedQuery && selectedCategory === 'suggested' ? (
                  <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {quickActions.map(item => (
                      <QuickActionCard
                        key={item.id}
                        item={item}
                        onSelect={() => selectItem(item)}
                      />
                    ))}
                  </div>
                ) : null}

                {queryIsUrl ? (
                  <button
                    type="button"
                    className="mb-5 flex w-full items-center gap-3 rounded-card border border-primary/30 bg-primary/5 p-3.5 text-left transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-primary"
                    onClick={() =>
                      linkItem ? selectItem(linkItem, trimmedQuery) : undefined
                    }
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <LinkIcon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-auto">
                      <div className="font-semibold text-foreground">
                        <Trans message="Create link for this URL" />
                      </div>
                      <div className="truncate text-sm text-muted-foreground">
                        {trimmedQuery}
                      </div>
                    </div>
                    <ArrowRightIcon className="size-5 shrink-0 text-muted-foreground" />
                  </button>
                ) : null}

                <div className="mb-2 text-sm font-medium text-muted-foreground">
                  {trimmedQuery ? (
                    <Trans message="Search results" />
                  ) : (
                    <ActiveCategoryLabel
                      selectedCategory={selectedCategory}
                      categories={visibleCategories}
                    />
                  )}
                </div>

                {filteredItems.length ? (
                  <div className="space-y-1.5">
                    {filteredItems.map(item => (
                      <ContentListItem
                        key={item.id}
                        item={item}
                        onSelect={() =>
                          selectItem(
                            item,
                            item.kind === 'link' && queryIsUrl
                              ? trimmedQuery
                              : undefined,
                          )
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-card border border-dashed p-8 text-center">
                    <div className="font-semibold">
                      <Trans message="No add options found" />
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      <Trans message="Try another search or choose a category." />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface CategoryButtonProps {
  category: CategoryDefinition;
  selected: boolean;
  onClick: () => void;
}

function CategoryButton({category, selected, onClick}: CategoryButtonProps) {
  const Icon = category.icon;
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        'flex h-11 shrink-0 items-center gap-2.5 rounded-full px-2.5 text-sm font-medium transition-colors md:w-full md:justify-start md:rounded-card',
        selected
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
      )}
      onClick={onClick}
    >
      <span
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-black/5 dark:ring-white/10',
          categoryIconStyles[category.id],
        )}
      >
        <Icon className="size-4" />
      </span>
      {category.label}
    </button>
  );
}

interface ActiveCategoryLabelProps {
  selectedCategory: AddCategoryId;
  categories: CategoryDefinition[];
}

function ActiveCategoryLabel({
  selectedCategory,
  categories,
}: ActiveCategoryLabelProps) {
  return (
    categories.find(category => category.id === selectedCategory)?.label ?? (
      <Trans message="Suggested" />
    )
  );
}

interface QuickActionCardProps {
  item: AddContentItem;
  onSelect: () => void;
}

function QuickActionCard({item, onSelect}: QuickActionCardProps) {
  return (
    <button
      type="button"
      className="group min-h-24 rounded-card border bg-card p-3 text-left transition-colors hover:border-primary/30 hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary"
      onClick={onSelect}
    >
      <AddContentItemIcon item={item} compact />
      <div className="mt-2 truncate text-sm font-semibold">{item.label}</div>
    </button>
  );
}

interface ContentListItemProps {
  item: AddContentItem;
  onSelect: () => void;
}

function ContentListItem({item, onSelect}: ContentListItemProps) {
  return (
    <button
      type="button"
      className="group flex w-full items-center gap-3 rounded-card p-2 text-left transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary"
      onClick={onSelect}
    >
      <AddContentItemIcon item={item} />
      <div className="min-w-0 flex-auto">
        <div className="truncate font-semibold text-foreground">
          {item.label}
        </div>
        <div className="line-clamp-2 text-sm text-muted-foreground">
          {item.description}
        </div>
      </div>
      <ArrowRightIcon className="size-5 shrink-0 text-muted-foreground" />
    </button>
  );
}

interface AddContentItemIconProps {
  item: AddContentItem;
  compact?: boolean;
}

function AddContentItemIcon({item, compact}: AddContentItemIconProps) {
  const className = cn(
    'flex shrink-0 items-center justify-center overflow-hidden bg-muted/60 ring-1 ring-border/70 motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:scale-[1.04] motion-safe:group-focus-visible:scale-[1.04]',
    compact ? 'size-9 rounded-lg' : 'size-12 rounded-xl',
  );

  return (
    <div className={className}>
      <img
        src={item.image}
        alt=""
        className={cn('size-full object-contain', compact ? 'p-1' : 'p-1.5')}
      />
    </div>
  );
}
