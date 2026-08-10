import {TextWidget} from '@app/dashboard/biolink/biolink-editor/content/widgets/text-widget/text-widget-dialog';
import {WidgetRendererProps} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-renderer-props';
import {BiolinkWidgetSurface} from '@app/dashboard/biolink/biolink-editor/content/widgets/biolink-widget-surface';
import {cn} from '@ui/utils/cn';

export function TextWidgetRenderer({
  widget,
  variant,
  appearance,
}: WidgetRendererProps<TextWidget>) {
  const body = widget.config.body;
  const description = widget.config.description;
  const preview = description || textPreview(body);
  const textVariant = widget.config.variant ?? 'text';

  if (
    textVariant !== 'divider' &&
    !widget.config.title &&
    !description &&
    !body
  ) {
    return null;
  }

  if (variant === 'editor') {
    return (
      <div className="overflow-hidden text-sm whitespace-nowrap text-muted-foreground">
        <div>{widget.config.title || 'Divider'}</div>
        {textVariant !== 'divider' ? (
          <div className="overflow-hidden text-ellipsis">{preview}</div>
        ) : null}
      </div>
    );
  }

  if (textVariant === 'divider') {
    return (
      <div className="my-5 flex items-center gap-3 px-4" role="separator">
        <span className="h-px flex-1 bg-current opacity-20" />
        {widget.config.title ? (
          <span className="text-xs font-semibold tracking-wide uppercase opacity-70">
            {widget.config.title}
          </span>
        ) : null}
        <span className="h-px flex-1 bg-current opacity-20" />
      </div>
    );
  }

  const content = (
    <div
      className={cn(
        'px-4 text-center @2xl:px-5',
        textVariant === 'heading' ? 'my-8' : 'mb-7.5',
      )}
      role={textVariant === 'notice' ? 'note' : undefined}
    >
      {widget.config.title ? (
        textVariant === 'heading' ? (
          <h2 className="text-xl leading-tight font-semibold">
            {widget.config.title}
          </h2>
        ) : (
          <div className="text-base font-medium">{widget.config.title}</div>
        )
      ) : null}
      {body ? (
        <div
          className="mt-2 text-sm leading-6 [&_p:not(:last-child)]:mb-2 [&_strong]:font-semibold [&_u]:underline"
          dangerouslySetInnerHTML={{__html: body}}
        />
      ) : (
        <div className="mt-2 text-sm">{description}</div>
      )}
    </div>
  );

  if (widget.config.showBackground || textVariant === 'notice') {
    return (
      <BiolinkWidgetSurface
        appearance={appearance}
        config={widget.config}
        className={cn(
          'py-5',
          textVariant === 'notice' && noticeToneClass(widget.config.noticeTone),
        )}
      >
        {content}
      </BiolinkWidgetSurface>
    );
  }

  return content;
}

function noticeToneClass(tone?: TextWidget['config']['noticeTone']): string {
  return {
    neutral: 'bg-current/5',
    info: 'bg-primary/10',
    success: 'bg-positive/10',
    warning: 'bg-warning/10',
  }[tone ?? 'neutral'];
}

function textPreview(value?: string): string {
  return (
    value
      ?.replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() ?? ''
  );
}
