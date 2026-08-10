import {TwitchWidget} from '@app/dashboard/biolink/biolink-editor/content/widgets/twitch-widget/twitch-widget-dialog';
import {VideoEmbedWidgetRenderer} from '@app/dashboard/biolink/biolink-editor/content/widgets/video-embed-widget-renderer';
import {WidgetRendererProps} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-renderer-props';
import {useSettings} from '@ui/settings/use-settings';

export function TwitchWidgetRenderer({
  widget,
  variant,
  appearance,
}: WidgetRendererProps<TwitchWidget>) {
  const {base_url} = useSettings();
  if (!widget.config.url) return null;

  const embedUrl = getTwitchEmbedUrl(widget.config.url, base_url);
  return (
    <VideoEmbedWidgetRenderer
      variant={variant}
      embedUrl={embedUrl}
      appearance={appearance}
      config={widget.config}
    />
  );
}

function getTwitchEmbedUrl(twitchUrl: string, siteUrl: string) {
  let embedUrl: string;
  const channelOrClipId = new URL(twitchUrl).pathname.split('/').pop()?.trim();
  if (twitchUrl.includes('clip')) {
    embedUrl = `https://clips.twitch.tv/embed?clip=${channelOrClipId}`;
  } else {
    embedUrl = `https://player.twitch.tv/?channel=${channelOrClipId}`;
  }
  return `${embedUrl}&parent=${getTwitchParent(siteUrl)}`;
}

function getTwitchParent(siteUrl: string): string {
  try {
    return new URL(siteUrl).hostname;
  } catch {
    return siteUrl
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/:\d+$/, '');
  }
}
