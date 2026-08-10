import {
  formatEmbedURL,
  formatOpenURL,
  parse,
} from '@app/dashboard/biolink/biolink-editor/content/widgets/spotify-widget/spotify-uri';
import {getBiolinkButtonStyle} from '@app/dashboard/biolink/biolink-editor/appearance/biolink-button-style-utils';
import {BiolinkWidgetSurface} from '@app/dashboard/biolink/biolink-editor/content/widgets/biolink-widget-surface';
import {SpotifyWidget} from '@app/dashboard/biolink/biolink-editor/content/widgets/spotify-widget/spotify-widget-dialog';
import {WidgetRendererProps} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-renderer-props';
import {RemoteFavicon} from '@common/ui/other/remote-favicon';
import {Trans} from '@ui/i18n/trans';
import clsx from 'clsx';
import {ArrowRightIcon, Music2Icon} from 'lucide-react';

export function SpotifyWidgetRenderer({
  widget,
  variant,
  appearance,
}: WidgetRendererProps<SpotifyWidget>) {
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

  if (widget.config.spotifyPresentation === 'link') {
    return (
      <a
        href={formatOpenURL(widget.config.url)}
        target="_blank"
        rel="noreferrer"
        className="biolink-btn-custom biolink-public-action grid min-h-14 w-full grid-cols-[2.5rem_minmax(0,1fr)_1.25rem] items-center gap-3 px-4 py-3 text-inherit no-underline outline-none focus-visible:ring"
        style={getBiolinkButtonStyle({btnConfig: appearance?.btnConfig})}
      >
        <span className="grid size-10 place-items-center rounded-lg bg-current/10">
          <Music2Icon className="size-5" />
        </span>
        <span className="min-w-0 text-left">
          <span className="block truncate font-semibold">Spotify</span>
          <span className="mt-0.5 block truncate text-sm opacity-80">
            <Trans message="Open on Spotify" />
          </span>
        </span>
        <ArrowRightIcon className="size-4" />
      </a>
    );
  }

  return (
    <BiolinkWidgetSurface
      appearance={appearance}
      config={widget.config}
      className="p-0"
    >
      <SpotifyEmbed url={widget.config.url} type={widget.config.type} />
    </BiolinkWidgetSurface>
  );
}

export function SpotifyEmbed({
  url,
  type,
}: {
  url: string;
  type?: string;
}) {
  let embedURL: string;

  try {
    embedURL = formatEmbedURL(url);
  } catch {
    return null;
  }

  return (
    <div className={clsx("relative w-full overflow-hidden rounded-[inherit] bg-current/5", getEmbedHeight(type ?? resourceType(url)))}>
      <div className="absolute inset-0 animate-pulse bg-current/10" />
      <iframe
        title="Spotify"
        className="relative z-10 block h-full w-full border-0 bg-transparent"
        loading="lazy"
        src={embedURL}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

function resourceType(url: string): string | undefined {
  try {
    const spotify = parse(url);
    return 'type' in spotify ? spotify.type : undefined;
  } catch {
    return undefined;
  }
}

function getEmbedHeight(type?: string) {
  switch (type) {
    case 'track':
      return 'h-20';
    default:
      return 'h-38';
  }
}
