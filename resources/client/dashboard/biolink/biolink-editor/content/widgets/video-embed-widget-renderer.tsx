import {BiolinkWidgetSurface} from '@app/dashboard/biolink/biolink-editor/content/widgets/biolink-widget-surface';
import {WidgetRendererProps} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-renderer-props';
import {BiolinkAppearanceConfig} from '@app/gen/schemas/biolink-appearance-config';
import {RemoteFavicon} from '@common/ui/other/remote-favicon';

interface VideoEmbedWidgetRenderer {
  variant: WidgetRendererProps['variant'];
  embedUrl: string;
  appearance?: BiolinkAppearanceConfig | null;
  config?: object | null;
}
export function VideoEmbedWidgetRenderer({
  variant,
  embedUrl,
  appearance,
  config,
}: VideoEmbedWidgetRenderer) {
  if (!embedUrl) return null;

  if (variant === 'editor') {
    return (
      <div className="flex max-w-[80%] min-w-0 items-center gap-2 truncate">
        <RemoteFavicon url={embedUrl} />
        <a
          href={embedUrl}
          target="_blank"
          className="truncate text-sm text-muted-foreground hover:underline"
          rel="noreferrer"
        >
          {embedUrl}
        </a>
      </div>
    );
  }
  return (
    <BiolinkWidgetSurface
      appearance={appearance}
      config={config}
      className="!p-0 !border-0"
      style={{ borderWidth: 0 }}
    >
        <div className="relative aspect-video w-full overflow-hidden rounded-[inherit] bg-current/5">
          <div className="absolute inset-0 animate-pulse bg-current/10" />
          <iframe
            className="relative z-10 block h-full w-full border-0 bg-transparent"
            loading="lazy"
            src={embedUrl}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
    </BiolinkWidgetSurface>
  );
}
