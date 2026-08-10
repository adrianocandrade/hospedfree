import {TiktokWidget} from '@app/dashboard/biolink/biolink-editor/content/widgets/tiktok-widget/tiktok-widget-dialog';
import {BiolinkWidgetSurface} from '@app/dashboard/biolink/biolink-editor/content/widgets/biolink-widget-surface';
import {WidgetRendererProps} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-renderer-props';
import {RemoteFavicon} from '@common/ui/other/remote-favicon';
import lazyLoader from '@ui/utils/loaders/lazy-loader';
import {useEffect} from 'react';
import tiktokImage from './tiktok.png';
import {VideoEmbedWidgetRenderer} from '@app/dashboard/biolink/biolink-editor/content/widgets/video-embed-widget-renderer';
import {getBiolinkButtonStyle} from '@app/dashboard/biolink/biolink-editor/appearance/biolink-button-style-utils';
import {ArrowRightIcon} from 'lucide-react';
import {Trans} from '@ui/i18n/trans';

export function TiktokWidgetRenderer({
  widget,
  variant,
  appearance,
}: WidgetRendererProps<TiktokWidget>) {
  useEffect(() => {
    lazyLoader.loadAsset('https://www.tiktok.com/embed.js', {type: 'js'});
  }, []);

  if (!widget.config.url) return null;

  if (variant === 'editor') {
    return (
      <div className="flex items-center gap-2">
        <RemoteFavicon url={widget.config.url} />
        <a
          href={widget.config.url}
          target="_blank"
          className="max-w-[80%] overflow-hidden text-sm text-ellipsis whitespace-nowrap text-muted-foreground hover:underline"
          rel="noreferrer"
        >
          {widget.config.url}
        </a>
      </div>
    );
  }

  const presentation = widget.config.presentation || 'video';
  const pathname = new URL(widget.config.url).pathname;
  const embedURL = pathname.split('/').filter(Boolean).pop()?.trim();

  if (presentation === 'video') {
    return (
      <VideoEmbedWidgetRenderer
        variant={variant}
        embedUrl={`https://www.tiktok.com/embed/v2/${embedURL}`}
        appearance={appearance}
        config={widget.config}
      />
    );
  }

  if (presentation === 'link') {
    return (
      <a
        href={widget.config.url}
        target="_blank"
        rel="noreferrer"
        className="biolink-public-action biolink-surface-item flex w-full min-h-12 items-center gap-3 rounded-lg border px-4 py-3 text-inherit no-underline outline-none focus-visible:ring"
        style={getBiolinkButtonStyle({
          btnConfig: widget.config as any,
          override: undefined,
        })}
      >
        <img src={tiktokImage} alt="" className="size-5 shrink-0 object-contain" />
        <span className="min-w-0 flex-1 text-center font-semibold">
          <Trans message="Watch on TikTok" />
        </span>
        <ArrowRightIcon className="size-4 opacity-80 shrink-0" />
      </a>
    );
  }

  return (
    <BiolinkWidgetSurface
      appearance={appearance}
      config={widget.config}
      className="biolink-tiktok-widget p-0 overflow-hidden rounded-[inherit] [&_.tiktok-embed]:!m-0 [&_.tiktok-embed]:!max-w-none [&_iframe]:!block [&_iframe]:!w-full [&_iframe]:!border-0"
    >
      <blockquote data-video-id={embedURL} className="tiktok-embed">
        <img src={tiktokImage} alt="" className="hidden" />
      </blockquote>
    </BiolinkWidgetSurface>
  );
}

