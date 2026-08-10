import {
  VisualOptionGrid,
  type VisualOption,
} from '@app/dashboard/biolink/biolink-editor/visual-option-card';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {cn} from '@ui/utils/cn';
import {ChevronLeftIcon, ChevronRightIcon} from 'lucide-react';
import {type ReactNode, useCallback, useEffect, useRef, useState} from 'react';
import type {BiolinkAppearanceConfigCardConfigShadow} from '@app/gen/schemas/biolink-appearance-config-card-config-shadow';

export type LegacyCollectionLayout =
  | 'classic'
  | 'featured'
  | 'grid'
  | 'list'
  | 'carousel'
  | 'timeline';

export type CollectionLayout = 'line' | 'grid' | 'card' | 'slide';

export type CollectionItemStyle = {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  transparency?: number;
  borderWidth?: number;
  shadow?: BiolinkAppearanceConfigCardConfigShadow;
  shadowColor?: string;
  radius?: number;
  fontFamily?: string;
};

type AppearanceWithCardConfig = {
  cardConfig?: CollectionItemStyle | null;
};

export function resolveCollectionItemStyle(
  appearance?: AppearanceWithCardConfig | null,
  legacy?: CollectionItemStyle | null,
): CollectionItemStyle | undefined {
  const global = appearance?.cardConfig;
  if (!global && !legacy) return undefined;
  return {...legacy, ...global};
}

export function normalizeCollectionLayout(
  value?: string | null,
): CollectionLayout {
  switch (value) {
    case 'grid':
      return 'grid';
    case 'card':
    case 'featured':
      return 'card';
    case 'slide':
    case 'carousel':
      return 'slide';
    case 'line':
    case 'timeline':
    case 'classic':
    case 'list':
    default:
      return 'line';
  }
}

export function toLegacyCollectionLayout(
  value: CollectionLayout,
): LegacyCollectionLayout {
  switch (value) {
    case 'grid':
      return 'grid';
    case 'card':
      return 'featured';
    case 'slide':
      return 'carousel';
    case 'line':
    default:
      return 'classic';
  }
}

export function CollectionLayoutOptions({
  value,
  onChange,
  ariaLabel,
  columns = 'grid-cols-2 sm:grid-cols-4',
  hiddenLayouts = [],
  gridDescription,
}: {
  value?: string | null;
  onChange: (value: LegacyCollectionLayout) => void;
  ariaLabel: string;
  columns?: string;
  hiddenLayouts?: CollectionLayout[];
  gridDescription?: ReactNode;
}) {
  const selected = normalizeCollectionLayout(value);
  const displayValue = hiddenLayouts.includes(selected) ? 'grid' : selected;
  const options: VisualOption<CollectionLayout>[] = [
    {
      value: 'line',
      label: <Trans message="Line" />,
      description: <Trans message="One item per row" />,
      preview: <CollectionLayoutPreview layout="line" />,
      kind: 'thumbnail',
    },
    {
      value: 'grid',
      label: <Trans message="Grid" />,
      description: gridDescription ?? <Trans message="Responsive columns" />,
      preview: <CollectionLayoutPreview layout="grid" />,
      kind: 'thumbnail',
    },
    {
      value: 'card',
      label: <Trans message="Card" />,
      description: <Trans message="Featured item" />,
      preview: <CollectionLayoutPreview layout="card" />,
      kind: 'thumbnail',
    },
    {
      value: 'slide',
      label: <Trans message="Slide" />,
      description: <Trans message="Horizontal carousel" />,
      preview: <CollectionLayoutPreview layout="slide" />,
      kind: 'thumbnail',
    },
  ];

  return (
    <VisualOptionGrid
      ariaLabel={ariaLabel}
      columns={columns}
      value={displayValue}
      onChange={next => onChange(toLegacyCollectionLayout(next))}
      items={options.filter(option => !hiddenLayouts.includes(option.value))}
    />
  );
}

export function CollectionLayoutPreview({layout}: {layout: CollectionLayout}) {
  if (layout === 'grid') {
    return (
      <svg
        viewBox="0 0 64 48"
        className="w-full max-w-28 fill-none stroke-current text-primary"
      >
        <rect
          x="4"
          y="4"
          width="25"
          height="18"
          rx="3"
          fill="currentColor"
          fillOpacity="0.15"
        />
        <rect
          x="33"
          y="4"
          width="25"
          height="18"
          rx="3"
          fill="currentColor"
          fillOpacity="0.15"
        />
        <rect
          x="4"
          y="26"
          width="25"
          height="18"
          rx="3"
          fill="currentColor"
          fillOpacity="0.15"
        />
        <rect
          x="33"
          y="26"
          width="25"
          height="18"
          rx="3"
          fill="currentColor"
          fillOpacity="0.15"
        />
      </svg>
    );
  }

  if (layout === 'card') {
    return (
      <svg
        viewBox="0 0 64 48"
        className="w-full max-w-28 fill-none stroke-current text-primary"
        strokeWidth="1.5"
      >
        <rect x="12" y="4" width="40" height="40" rx="4" />
        <rect
          x="12"
          y="4"
          width="40"
          height="24"
          rx="4"
          fill="currentColor"
          fillOpacity="0.15"
          stroke="none"
        />
        <line
          x1="18"
          y1="33"
          x2="36"
          y2="33"
          strokeLinecap="round"
          strokeWidth="2.5"
        />
        <line
          x1="18"
          y1="39"
          x2="28"
          y2="39"
          strokeLinecap="round"
          strokeWidth="2.5"
          strokeOpacity="0.5"
        />
      </svg>
    );
  }

  if (layout === 'slide') {
    return (
      <svg
        viewBox="0 0 64 48"
        className="w-full max-w-28 fill-none stroke-current text-primary"
        strokeWidth="1.5"
      >
        <rect
          x="8"
          y="8"
          width="30"
          height="32"
          rx="4"
          fill="currentColor"
          fillOpacity="0.15"
        />
        <rect
          x="44"
          y="8"
          width="30"
          height="32"
          rx="4"
          fill="currentColor"
          fillOpacity="0.1"
          strokeOpacity="0.5"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 64 48"
      className="w-full max-w-28 fill-none stroke-current text-primary"
    >
      <rect
        x="4"
        y="6"
        width="56"
        height="9"
        rx="3"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <rect
        x="4"
        y="19"
        width="56"
        height="9"
        rx="3"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <rect
        x="4"
        y="32"
        width="56"
        height="9"
        rx="3"
        fill="currentColor"
        fillOpacity="0.15"
      />
    </svg>
  );
}

export function collectionLayoutClasses(value?: string | null) {
  const layout = normalizeCollectionLayout(value);

  return {
    layout,
    list: {
      line: 'space-y-3.5',
      grid: 'biolink-collection-grid grid grid-cols-2 gap-4 @2xl:grid-cols-3',
      card: 'space-y-4',
      slide:
        'no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth scroll-px-2 px-2 py-2 motion-reduce:scroll-auto',
    }[layout],
    item: {
      line: 'w-full',
      grid: 'min-w-0',
      card: 'w-full',
      slide: 'w-64 shrink-0 snap-start',
    }[layout],
  };
}

export function CollectionItems({
  children,
  className,
  layout,
}: {
  children: ReactNode;
  className?: string;
  layout: CollectionLayout;
}) {
  if (layout === 'slide') {
    return (
      <CollectionCarousel className={className}>{children}</CollectionCarousel>
    );
  }

  return (
    <div className={cn(collectionLayoutClasses(layout).list, className)}>
      {children}
    </div>
  );
}

export function CollectionCarousel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const {trans} = useTrans();
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);

  const updateNavigation = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const maxScrollLeft = Math.max(0, track.scrollWidth - track.clientWidth);
    setCanScrollBack(track.scrollLeft > 2);
    setCanScrollForward(track.scrollLeft < maxScrollLeft - 2);
  }, []);

  useEffect(() => {
    updateNavigation();
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(updateNavigation);
    observer.observe(track);
    Array.from(track.children).forEach(child => observer.observe(child));
    return () => observer.disconnect();
  }, [children, updateNavigation]);

  const scroll = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    track.scrollBy({
      left: direction * Math.max(240, track.clientWidth * 0.78),
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <div className={cn('relative -mx-2 min-w-0', className)}>
      <div
        ref={trackRef}
        onScroll={updateNavigation}
        className={collectionLayoutClasses('slide').list}
      >
        {children}
      </div>
      <CarouselNavigationButton
        direction="back"
        disabled={!canScrollBack}
        label={trans({message: 'Previous items'})}
        onClick={() => scroll(-1)}
      />
      <CarouselNavigationButton
        direction="forward"
        disabled={!canScrollForward}
        label={trans({message: 'Next items'})}
        onClick={() => scroll(1)}
      />
    </div>
  );
}

function CarouselNavigationButton({
  direction,
  disabled,
  label,
  onClick,
}: {
  direction: 'back' | 'forward';
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  const Icon = direction === 'back' ? ChevronLeftIcon : ChevronRightIcon;

  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'biolink-carousel-control absolute top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-current/20 bg-[var(--biolink-surface-item-background)] text-inherit shadow-md backdrop-blur-sm transition-[opacity,transform,background-color] duration-200 outline-none hover:bg-[var(--biolink-surface-item-hover-background)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current disabled:pointer-events-none disabled:opacity-0 @2xl:grid',
        direction === 'back' ? 'left-1' : 'right-1',
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}

export function itemStyleCss(style?: CollectionItemStyle | null) {
  if (!style) {
    return undefined;
  }

  const transparency = Math.max(0, Math.min(100, style.transparency ?? 0));
  const background = style.backgroundColor
    ? `color-mix(in srgb, ${style.backgroundColor} ${100 - transparency}%, transparent)`
    : undefined;
  const shadowColor =
    style.shadowColor || style.borderColor || style.textColor || 'currentColor';

  return {
    backgroundColor: background,
    color: style.textColor || undefined,
    borderColor: style.borderColor || undefined,
    borderWidth:
      typeof style.borderWidth === 'number'
        ? `${Math.max(0, Math.min(8, style.borderWidth))}px`
        : undefined,
    boxShadow:
      style.shadow === 'soft'
        ? `0 4px 10px color-mix(in srgb, ${shadowColor} 22%, transparent)`
        : style.shadow === 'strong'
          ? `0 7px 16px color-mix(in srgb, ${shadowColor} 32%, transparent)`
          : style.shadow === 'hard'
            ? `4px 4px 0 color-mix(in srgb, ${shadowColor} 55%, transparent)`
            : undefined,
    borderRadius:
      typeof style.radius === 'number'
        ? `${Math.max(0, Math.min(32, style.radius))}px`
        : undefined,
    fontFamily: style.fontFamily || undefined,
  };
}
