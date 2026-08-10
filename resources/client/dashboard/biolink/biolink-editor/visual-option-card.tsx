import {cn} from '@ui/utils/cn';
import {CheckIcon, LockIcon} from 'lucide-react';
import {ReactNode, useRef} from 'react';

export type VisualOptionKind =
  | 'icon'
  | 'thumbnail'
  | 'wireframe'
  | 'swatch'
  | 'effect';

export type VisualOption<T extends string = string> = {
  value: T;
  label: ReactNode;
  description?: ReactNode;
  preview?: ReactNode;
  kind?: VisualOptionKind;
  disabled?: boolean;
  locked?: boolean;
  ariaLabel?: string;
};

type VisualOptionCardProps = {
  active?: boolean;
  children?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  kind?: VisualOptionKind;
  label?: ReactNode;
  ariaLabel?: string;
  locked?: boolean;
  onClick?: () => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
  preview?: ReactNode;
  value?: string;
};

export function VisualOptionCard({
  active = false,
  children,
  description,
  disabled,
  kind = 'icon',
  label,
  ariaLabel,
  locked,
  onClick,
  onKeyDown,
  preview,
  value,
}: VisualOptionCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      aria-label={ariaLabel}
      aria-disabled={disabled || locked || undefined}
      data-value={value}
      data-active={active}
      data-kind={kind}
      disabled={disabled || locked}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={cn(
        'group relative isolate flex min-h-24 min-w-0 flex-col items-center justify-center gap-2 rounded-card border bg-card px-3 pt-6 pb-3 text-center text-sm outline-offset-3 outline-primary transition',
        'hover:border-foreground/40 hover:bg-accent/60 focus-visible:outline-2',
        'data-active:border-primary data-active:ring-2 data-active:ring-primary/35',
        'disabled:pointer-events-none disabled:opacity-50',
        kind === 'thumbnail' && 'min-h-32',
        kind === 'wireframe' && 'min-h-32',
        kind === 'effect' && 'min-h-28',
      )}
    >
      {locked ? (
        <span className="pointer-events-none absolute top-2 right-2 z-30 rounded-full bg-muted p-1 text-muted-foreground ring-2 ring-card">
          <LockIcon aria-hidden className="size-3.5" />
        </span>
      ) : active ? (
        <span className="pointer-events-none absolute top-2 right-2 z-30 rounded-full bg-primary p-1 text-primary-foreground shadow-sm ring-2 ring-card">
          <CheckIcon aria-hidden className="size-3.5" />
        </span>
      ) : null}

      {preview ? (
        <span className="relative z-0 flex min-h-12 w-full items-center justify-center overflow-hidden">
          {preview}
        </span>
      ) : children ? (
        <span className="flex min-h-10 items-center justify-center text-primary">
          {children}
        </span>
      ) : null}

      {label ? (
        <span className="w-full leading-tight font-medium break-words whitespace-normal">
          {label}
        </span>
      ) : null}
      {description ? (
        <span className="w-full text-xs leading-tight break-words whitespace-normal text-muted-foreground">
          {description}
        </span>
      ) : null}
    </button>
  );
}

type VisualOptionGridProps<T extends string = string> = {
  ariaLabel?: string;
  className?: string;
  columns?: string;
  disabled?: boolean;
  items: VisualOption<T>[];
  onChange: (value: T) => void;
  value: T;
};

export function VisualOptionGrid<T extends string = string>({
  ariaLabel,
  className,
  columns = 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
  disabled,
  items,
  onChange,
  value,
}: VisualOptionGridProps<T>) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const moveFocus = (currentValue: T, direction: -1 | 1) => {
    const index = items.findIndex(item => item.value === currentValue);
    if (index < 0) return;

    const enabledItems = items.filter(item => !item.disabled && !item.locked);
    const currentIndex = enabledItems.findIndex(
      item => item.value === currentValue,
    );
    if (currentIndex < 0 || enabledItems.length < 2) return;

    const nextIndex =
      (currentIndex + direction + enabledItems.length) % enabledItems.length;
    const nextValue = enabledItems[nextIndex].value;
    refs.current[nextValue]?.focus();
    onChange(nextValue);
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentValue: T,
  ) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      moveFocus(currentValue, 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      moveFocus(currentValue, -1);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const enabledItems = items.filter(item => !item.disabled && !item.locked);
      const target =
        event.key === 'Home' ? enabledItems[0] : enabledItems.at(-1);
      if (target) {
        refs.current[target.value]?.focus();
        onChange(target.value);
      }
    }
  };

  return (
    <div
      aria-label={ariaLabel}
      role="radiogroup"
      className={cn('grid gap-3', columns, className)}
    >
      {items.map(item => (
        <VisualOptionCard
          key={item.value}
          active={item.value === value}
          description={item.description}
          disabled={disabled || item.disabled}
          kind={item.kind}
          label={item.label}
          ariaLabel={item.ariaLabel}
          locked={item.locked}
          onClick={() => onChange(item.value)}
          onKeyDown={event => handleKeyDown(event, item.value)}
          preview={item.preview}
          value={item.value}
        />
      ))}
    </div>
  );
}
