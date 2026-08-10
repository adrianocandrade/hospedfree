import {BiolinkWidgetSurface} from '@app/dashboard/biolink/biolink-editor/content/widgets/biolink-widget-surface';
import type {BiolinkAppearanceConfig} from '@app/gen/schemas/biolink-appearance-config';
import {Trans} from '@ui/i18n/trans';
import {cn} from '@ui/utils/cn';
import {ArrowRightIcon} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import {createElement, type ReactNode} from 'react';

export type BiolinkSectionConfig = {
  presentation?: 'contained' | 'open';
  showTitle?: boolean;
  icon?: string;
  anchorLabel?: string;
  actionLabel?: string;
  actionUrl?: string;
};

export function BiolinkSectionFrame({
  appearance,
  children,
  className,
  config,
  description,
  title,
}: {
  appearance?: BiolinkAppearanceConfig | null;
  children: ReactNode;
  className?: string;
  config?: BiolinkSectionConfig | null;
  description?: string | null;
  title?: string | null;
}) {
  const presentation = config?.presentation ?? 'contained';
  const showHeading = shouldShowBiolinkSectionHeading(config);
  const Icon = resolveLucideIcon(config?.icon);
  const content = (
    <>
      {(showHeading && (title || description)) || config?.actionUrl ? (
        <header className="mb-4 flex min-w-0 items-start justify-between gap-4">
          <div className="min-w-0">
            {showHeading && title ? (
              <h2 className="flex items-center gap-2 text-base font-semibold text-current">
                {Icon
                  ? createElement(Icon, {className: 'size-4 shrink-0'})
                  : null}
                <span className="wrap-break-word">{title}</span>
              </h2>
            ) : null}
            {showHeading && description ? (
              <p
                className={cn(
                  'max-w-prose text-sm leading-5 wrap-break-word text-current/70',
                  title && 'mt-1',
                )}
              >
                {description}
              </p>
            ) : null}
          </div>
          {config?.actionUrl ? (
            <a
              href={config.actionUrl}
              className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2 text-sm font-medium hover:bg-current/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
              target={
                config.actionUrl.startsWith('http') ? '_blank' : undefined
              }
              rel={
                config.actionUrl.startsWith('http') ? 'noreferrer' : undefined
              }
            >
              {config.actionLabel || <Trans message="View all" />}
              <ArrowRightIcon className="size-4" />
            </a>
          ) : null}
        </header>
      ) : null}
      {children}
    </>
  );

  if (presentation === 'open') {
    return (
      <section className={cn('w-full min-w-0 py-2.5', className)}>
        {content}
      </section>
    );
  }

  return (
    <BiolinkWidgetSurface appearance={appearance} className={className}>
      {content}
    </BiolinkWidgetSurface>
  );
}

export function shouldShowBiolinkSectionHeading(
  config?: Pick<BiolinkSectionConfig, 'showTitle'> | null,
): boolean {
  return config?.showTitle !== false;
}

function resolveLucideIcon(name?: string): LucideIcons.LucideIcon | undefined {
  if (!name) return undefined;
  const candidate = (LucideIcons as Record<string, unknown>)[name];
  return typeof candidate === 'object' || typeof candidate === 'function'
    ? (candidate as LucideIcons.LucideIcon)
    : undefined;
}
