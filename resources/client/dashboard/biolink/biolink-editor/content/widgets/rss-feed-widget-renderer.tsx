import {BiolinkWidgetSurface} from '@app/dashboard/biolink/biolink-editor/content/widgets/biolink-widget-surface';
import type {WidgetRendererProps} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-renderer-props';
import type {BiolinkWidget} from '@app/gen/schemas/biolink-widget';
import {getPublicBiolinkFeed} from '@app/gen/public-biolink-feed';
import {Skeleton} from '@shadcn/skeleton/skeleton';
import {useQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {message} from '@ui/i18n/message';
import {useTrans} from '@ui/i18n/use-trans';
import {ArrowUpRightIcon, RssIcon} from 'lucide-react';

type FeedWidget = Omit<BiolinkWidget, 'type' | 'config'> & {
  type: 'rssFeed';
  config: {
    title?: string;
    description?: string;
    url?: string;
    buttonLabel?: string;
  };
};

export function RssFeedWidgetRenderer({
  widget: rawWidget,
  variant,
  appearance,
}: WidgetRendererProps) {
  const widget = rawWidget as FeedWidget;
  const {trans} = useTrans();
  const feed = useQuery({
    queryKey: ['public-biolink-feed', widget.biolink_id, widget.id],
    queryFn: () =>
      getPublicBiolinkFeed(Number(widget.biolink_id), Number(widget.id)).then(
        response => response.data,
      ),
    enabled: variant !== 'editor' && !!widget.config.url,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  if (variant === 'editor') {
    return (
      <div className="min-w-0 text-sm text-muted-foreground">
        <div className="truncate">
          {widget.config.title || <Trans message="Latest posts" />}
        </div>
        <div className="truncate">{widget.config.url || '-'}</div>
      </div>
    );
  }

  if (!widget.config.url) return null;

  return (
    <BiolinkWidgetSurface
      appearance={appearance}
      config={widget.config}
      className="p-4 @2xl:p-5"
    >
      <div className="mb-4 flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-current/10">
          <RssIcon className="size-5" />
        </span>
        <div className="min-w-0">
          <h3 className="font-semibold">
            {widget.config.title || feed.data?.title || (
              <Trans message="Latest posts" />
            )}
          </h3>
          {widget.config.description ? (
            <p className="mt-1 text-sm opacity-75">
              {widget.config.description}
            </p>
          ) : null}
        </div>
      </div>

      {feed.isPending ? (
        <div className="space-y-2" aria-label={trans(message('Loading feed'))}>
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : feed.data?.items.length ? (
        <div className="divide-y divide-current/10">
          {feed.data.items.map(item => (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="group flex min-h-16 items-center gap-3 py-3 text-inherit no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
              key={item.url}
            >
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 text-sm font-semibold">
                  {item.title}
                </span>
                {item.summary ? (
                  <span className="mt-1 line-clamp-1 block text-xs opacity-70">
                    {item.summary}
                  </span>
                ) : null}
                {item.published_at ? (
                  <time
                    dateTime={item.published_at}
                    className="mt-1 block text-xs opacity-60"
                  >
                    {new Intl.DateTimeFormat(undefined, {
                      dateStyle: 'medium',
                    }).format(new Date(item.published_at))}
                  </time>
                ) : null}
              </span>
              <ArrowUpRightIcon className="size-4 shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          ))}
        </div>
      ) : (
        <a
          href={widget.config.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-button border border-current/20 px-4 font-semibold text-inherit no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        >
          {widget.config.buttonLabel || <Trans message="Open feed" />}
          <ArrowUpRightIcon className="size-4" />
        </a>
      )}
    </BiolinkWidgetSurface>
  );
}
