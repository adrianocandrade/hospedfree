import {VideoEmbedWidgetRenderer} from '@app/dashboard/biolink/biolink-editor/content/widgets/video-embed-widget-renderer';
import {VideoPosterGate} from '@app/dashboard/biolink/biolink-editor/content/widgets/video-poster-gate';
import {WidgetRendererProps} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-renderer-props';
import {YoutubeWidget} from '@app/dashboard/biolink/biolink-editor/content/widgets/youtube-widget/youtube-widget-dialog';
import {loadYoutubePoster} from '@common/player/providers/youtube/load-youtube-poster';
import {message} from '@ui/i18n/message';
import {useTrans} from '@ui/i18n/use-trans';
import getVideoId from 'get-video-id';

export function YoutubeWidgetRenderer({
  widget,
  variant,
  appearance,
}: WidgetRendererProps<YoutubeWidget>) {
  const {trans} = useTrans();
  if (!widget.config.url) return null;

  const {id} = getVideoId(widget.config.url);
  if (!id) return null;

  const embedUrl = `https://www.youtube.com/embed/${id}`;
  if (variant === 'editor') {
    return (
      <VideoEmbedWidgetRenderer
        variant={variant}
        embedUrl={embedUrl}
        appearance={appearance}
        config={widget.config}
      />
    );
  }

  if (widget.config.presentation === 'cover') {
    return (
      <VideoPosterGate
        appearance={appearance}
        config={widget.config}
        playLabel={trans(
          message('Play :title', {
            values: {
              title: trans(message('Youtube video')),
            },
          }),
        )}
        poster={widget.config.coverImage}
        posterKey={id}
        loadPoster={() => loadYoutubePoster(id)}
        motion={widget.config.playButtonMotion}
      >
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
          title={trans(message('Youtube video'))}
          className="size-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </VideoPosterGate>
    );
  }

  return (
    <VideoEmbedWidgetRenderer
      variant={variant}
      embedUrl={embedUrl}
      appearance={appearance}
      config={widget.config}
    />
  );
}
