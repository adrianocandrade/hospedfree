import {
  BiolinkAssetCategoryId,
  BiolinkAssetItem,
  biolinkAssetCategories,
} from '@app/dashboard/biolink/biolink-editor/assets/biolink-asset-catalog';
import {Button} from '@shadcn/button/button';
import {Dialog} from '@shadcn/dialog/dialog';
import {Input} from '@shadcn/forms/input/input';
import {Tabs} from '@shadcn/tabs/tabs';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {cn} from '@ui/utils/cn';
import * as SimpleIcons from '@icons-pack/react-simple-icons';
import * as LucideIcons from 'lucide-react';
import {BoxIcon, SearchIcon, XIcon} from 'lucide-react';
import {
  ComponentType,
  createElement,
  ReactElement,
  ReactNode,
  useMemo,
  useState,
} from 'react';

interface Props {
  value?: string | null;
  onSelect: (path: string | null) => void;
  categories?: BiolinkAssetCategoryId[];
  children?: ReactElement;
  title?: ReactNode;
}

export function BiolinkAssetPickerDialog({
  value,
  onSelect,
  categories,
  children,
  title,
}: Props) {
  const [open, setOpen] = useState(false);
  const availableCategories = useMemo(() => {
    return categories?.length
      ? biolinkAssetCategories.filter(category =>
          categories.includes(category.id),
        )
      : biolinkAssetCategories;
  }, [categories]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {children}
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Content className="sm:max-w-3xl">
          <Dialog.Header>
            <Dialog.Title>
              <BoxIcon />
              {title ?? <Trans message="Asset picker" />}
            </Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <AssetPickerContent
              value={value}
              categories={availableCategories}
              onSelect={path => {
                onSelect(path);
                setOpen(false);
              }}
            />
          </Dialog.Body>
          <Dialog.Footer>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onSelect(null);
                setOpen(false);
              }}
            >
              <XIcon />
              <Trans message="Clear" />
            </Button>
            <Dialog.CloseButton>
              <Trans message="Close" />
            </Dialog.CloseButton>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface AssetPickerContentProps {
  value?: string | null;
  categories: typeof biolinkAssetCategories;
  onSelect: (path: string) => void;
}

function AssetPickerContent({
  value,
  categories,
  onSelect,
}: AssetPickerContentProps) {
  const [query, setQuery] = useState('');
  const {trans} = useTrans();
  const normalizedQuery = query.trim().toLowerCase();
  const defaultTab = categories[0]?.id;

  if (!defaultTab) {
    return null;
  }

  return (
    <Tabs.Root defaultValue={defaultTab}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs.List className="min-w-0 overflow-x-auto">
          {categories.map(category => (
            <Tabs.Tab key={category.id} value={category.id}>
              {category.id === 'threeD' ? (
                category.label
              ) : (
                <Trans message={category.label} />
              )}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        <div className="relative sm:w-56">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={event => setQuery(event.target.value)}
            className="pl-9"
            placeholder={trans(message('Search'))}
          />
        </div>
      </div>
      {categories.map(category => {
        const items = normalizedQuery
          ? category.items.filter(item => matchesQuery(item, normalizedQuery))
          : category.items;

        return (
          <Tabs.Panel key={category.id} value={category.id}>
            <div className="compact-scrollbar h-86 overflow-y-auto pr-1">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {items.map(item => (
                  <AssetButton
                    key={item.path}
                    item={item}
                    active={item.path === value}
                    onSelect={() => onSelect(item.path)}
                  />
                ))}
              </div>
              {!items.length ? (
                <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                  <Trans message="No assets found" />
                </div>
              ) : null}
            </div>
          </Tabs.Panel>
        );
      })}
    </Tabs.Root>
  );
}

function AssetButton({
  item,
  active,
  onSelect,
}: {
  item: BiolinkAssetItem;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        'group min-w-0 rounded-card-sm border bg-card p-2 text-left outline-offset-2 outline-primary transition focus-visible:outline-2',
        active ? 'border-primary ring-2 ring-primary/30' : 'border-border',
      )}
      onClick={onSelect}
    >
      <span className="flex aspect-square items-center justify-center rounded bg-accent/60 p-2">
        <AssetPreview item={item} />
      </span>
      <span className="mt-2 block truncate text-xs text-muted-foreground group-hover:text-foreground">
        {item.label}
      </span>
    </button>
  );
}

function AssetPreview({item}: {item: BiolinkAssetItem}) {
  const [library, name] = item.path.split(':', 2);
  if (library === 'lucide' && name) {
    const Icon = LucideIcons[name as keyof typeof LucideIcons];
    if (typeof Icon === 'function') {
      return createElement(Icon as ComponentType<{className?: string}>, {
        className: 'size-8 text-foreground',
      });
    }
  }

  if (library === 'simple-icons' && name) {
    const iconName = `Si${name.charAt(0).toUpperCase()}${name.slice(1)}`;
    const Icon = SimpleIcons[iconName as keyof typeof SimpleIcons];
    if (typeof Icon === 'function') {
      return createElement(Icon as ComponentType<{className?: string}>, {
        className: 'size-8 text-foreground',
      });
    }
  }

  return (
    <img
      src={item.path}
      alt=""
      className="max-h-full max-w-full object-contain"
      loading="lazy"
      draggable={false}
    />
  );
}

function matchesQuery(item: BiolinkAssetItem, query: string): boolean {
  return (
    item.label.toLowerCase().includes(query) ||
    item.path.toLowerCase().includes(query)
  );
}
