import {IconGridButton} from '@common/ui/icon-picker/icon-grid-button';
import {
  SiApple,
  SiBandcamp,
  SiFacebook,
  SiInstagram,
  SiPatreon,
  SiPinterest,
  SiSnapchat,
  SiSoundcloud,
  SiSpotify,
  SiTelegram,
  SiTiktok,
  SiTwitch,
  SiWhatsapp,
  SiYoutube,
} from '@icons-pack/react-simple-icons';
import {Tooltip} from '@shadcn/tooltip/tooltip';
import {useVirtualizer} from '@tanstack/react-virtual';
import {Trans} from '@ui/i18n/trans';
import {useFilter} from '@ui/i18n/use-filter';
import {elementToTree, IconTree} from '@ui/icons/create-svg-icon';
import * as LucideIcons from 'lucide-react-picker';
import {ComponentType, useEffect, useMemo, useRef, useState} from 'react';
import type {IconPickerLibrary} from './icon-picker';

type IconComponent = ComponentType<{className?: string}>;
type IconEntry = {
  label: string;
  name: string;
  library: IconPickerLibrary;
  Icon: IconComponent;
};
type ListItem = {type: 'none'} | ({type: 'icon'} & IconEntry);

const socialIconEntries: [string, IconComponent][] = [
  ['apple', SiApple],
  ['bandcamp', SiBandcamp],
  ['facebook', SiFacebook],
  ['instagram', SiInstagram],
  ['patreon', SiPatreon],
  ['pinterest', SiPinterest],
  ['snapchat', SiSnapchat],
  ['soundcloud', SiSoundcloud],
  ['spotify', SiSpotify],
  ['telegram', SiTelegram],
  ['tiktok', SiTiktok],
  ['twitch', SiTwitch],
  ['whatsapp', SiWhatsapp],
  ['youtube', SiYoutube],
];
const socialIcons: IconEntry[] = socialIconEntries.map(([name, Icon]) => ({
  label: name,
  name,
  library: 'simple-icons',
  Icon,
}));

const lucideIcons = LucideIcons.icons as Record<string, IconComponent>;
const lucideEntries: IconEntry[] = [];
for (const name in lucideIcons) {
  if (!Object.prototype.hasOwnProperty.call(lucideIcons, name)) continue;
  const prettyName = name
    .replace(/Icon$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase();
  if (socialIcons.find(icon => icon.label === prettyName)) continue;
  lucideEntries.push({
    label: prettyName,
    name,
    library: 'lucide',
    Icon: lucideIcons[name]!,
  });
}

const entries = [...socialIcons, ...lucideEntries];

const ICON_SIZE = 56;
const GAP = 10;
const ROW_HEIGHT = ICON_SIZE + GAP;

function getColumnCount(width: number) {
  return Math.max(1, Math.floor((width + GAP) / (ICON_SIZE + GAP)));
}

interface IconListProps {
  onIconSelected?: (icon: IconTree[] | null) => void;
  onIconNameSelected?: (name: string | null) => void;
  libraries?: IconPickerLibrary[];
  searchQuery: string;
}
export default function IconList({
  onIconSelected,
  onIconNameSelected,
  libraries,
  searchQuery,
}: IconListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(1);
  const {contains} = useFilter({
    sensitivity: 'base',
  });

  const items = useMemo<ListItem[]>(() => {
    const matchedEntries = entries.filter(
      entry =>
        (!libraries?.length || libraries.includes(entry.library)) &&
        contains(entry.label, searchQuery),
    );

    return [
      {type: 'none'},
      ...matchedEntries.map(entry => ({
        type: 'icon' as const,
        ...entry,
      })),
    ];
  }, [contains, libraries, searchQuery]);

  const rowCount = Math.ceil(items.length / columnCount);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const updateColumns = () => {
      setColumnCount(getColumnCount(el.clientWidth));
    };

    updateColumns();
    const observer = new ResizeObserver(updateColumns);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({top: 0});
  }, [searchQuery]);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 3,
  });

  return (
    <div ref={scrollRef} className="max-h-96 overflow-y-auto">
      <div
        className="relative w-full"
        style={{height: `${rowVirtualizer.getTotalSize()}px`}}
      >
        {rowVirtualizer.getVirtualItems().map(virtualRow => {
          const startIndex = virtualRow.index * columnCount;
          const rowItems = items.slice(startIndex, startIndex + columnCount);

          return (
            <div
              key={virtualRow.key}
              className="absolute top-0 left-0 grid w-full gap-2.5"
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                gridTemplateColumns: `repeat(${columnCount}, minmax(56px, 1fr))`,
              }}
            >
              {rowItems.map(item =>
                item.type === 'none' ? (
                  <IconGridButton
                    key="none"
                    type="button"
                    className="diagonal-lines"
                    onClick={() => {
                      onIconSelected?.(null);
                      onIconNameSelected?.(null);
                    }}
                  >
                    <Trans message="None" />
                  </IconGridButton>
                ) : (
                  <Tooltip.Root key={item.name}>
                    <Tooltip.Trigger
                      type="button"
                      onClick={e => {
                        if (onIconSelected) {
                          const svgTree = elementToTree(
                            e.currentTarget.querySelector('svg') as SVGElement,
                          );
                          // only emit svg children, and not svg tag itself
                          onIconSelected(svgTree.child as IconTree[]);
                        }
                        onIconNameSelected?.(
                          item.library === 'lucide' ? item.name : null,
                        );
                      }}
                      render={<IconGridButton />}
                    >
                      <item.Icon className="block size-6 text-muted-foreground" />
                    </Tooltip.Trigger>
                    <Tooltip.Content>{item.label}</Tooltip.Content>
                  </Tooltip.Root>
                ),
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
