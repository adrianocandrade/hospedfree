import {ImageWidget} from '@app/dashboard/biolink/biolink-editor/content/widgets/image-widget/image-widget-dialog';
import {BiolinkWidgetSurface} from '@app/dashboard/biolink/biolink-editor/content/widgets/biolink-widget-surface';
import {
  getBiolinkPlaceholderUrl,
  useResilientImageSources,
} from '@app/dashboard/biolink/biolink-editor/content/widgets/biolink-media-placeholder';
import {WidgetRendererProps} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-renderer-props';
import {ImageZoomDialog} from '@ui/overlays/dialog/image-zoom-dialog';
import {message} from '@ui/i18n/message';
import {useTrans} from '@ui/i18n/use-trans';
import {cn} from '@ui/utils/cn';
import {ZoomInIcon, UserIcon} from 'lucide-react';
import {useState} from 'react';

export function ImageWidgetRenderer({
  widget,
  variant,
  appearance,
  biolink,
}: WidgetRendererProps<ImageWidget>) {
  const {trans} = useTrans();
  const [zoomOpen, setZoomOpen] = useState(false);
  const placeholder = getBiolinkPlaceholderUrl(
    widget.config.type === 'avatar' ? 'avatar' : 'content',
    [biolink?.id, widget.id],
  );
  const imageState = useResilientImageSources([widget.config.url, placeholder]);
  const imageZoomEnabled = widget.config.imageZoom === true;
  const canZoom =
    imageZoomEnabled &&
    !!widget.config.url &&
    !widget.config.destinationUrl &&
    widget.config.type !== 'avatar';

  const img =
    !imageState.failed && imageState.src ? (
      <img
        className={cn('object-cover', getImageClassName({widget, variant}))}
        src={imageState.src}
        alt=""
        loading="lazy"
        onError={imageState.onError}
      />
    ) : (
      <div
        className={cn(
          getImageClassName({widget, variant}),
          'flex items-center justify-center bg-muted',
        )}
      >
        <UserIcon
          className={cn(
            variant === 'editor' ? 'size-3' : 'size-10',
            'text-muted-foreground',
          )}
        />
      </div>
    );

  if (variant === 'editor') {
    return widget.config.destinationUrl ? (
      <a href={widget.config.destinationUrl}>{img}</a>
    ) : (
      img
    );
  }

  // Surface without background/border/padding — only keeps radius + shadow from theme
  const surface = (
    <BiolinkWidgetSurface
      appearance={appearance}
      config={widget.config}
      className={cn(
        'biolink-image-widget overflow-hidden !border-0 !bg-transparent !p-0',
        widget.config.type === 'avatar' && 'mx-auto w-fit',
      )}
      style={{borderWidth: 0, background: 'transparent'}}
    >
      {widget.config.destinationUrl ? (
        <a href={widget.config.destinationUrl} className="block">
          {img}
        </a>
      ) : canZoom ? (
        <button
          type="button"
          className="group relative block w-full cursor-zoom-in text-left"
          onClick={() => setZoomOpen(true)}
          aria-label={trans(message('Open image'))}
        >
          {img}
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            <span className="flex items-center justify-center rounded-full bg-black/55 p-3 backdrop-blur-sm">
              <ZoomInIcon className="size-5 text-white" />
            </span>
          </span>
        </button>
      ) : (
        img
      )}
    </BiolinkWidgetSurface>
  );

  if (canZoom && widget.config.url) {
    return (
      <ImageZoomDialog
        images={[widget.config.url]}
        activeIndex={0}
        onActiveIndexChange={() => {}}
        open={zoomOpen}
        onOpenChange={setZoomOpen}
      >
        {surface}
      </ImageZoomDialog>
    );
  }

  return surface;
}

function getImageClassName({
  widget,
  variant,
}: WidgetRendererProps<ImageWidget>) {
  const type = widget.config.type;
  if (variant === 'editor') {
    return `size-5 ${type === 'avatar' ? 'rounded-full' : 'rounded-sm'}`;
  } else if (type === 'avatar') {
    return 'size-24 rounded-full mx-auto';
  }
  return 'block w-full rounded-[inherit]';
}
