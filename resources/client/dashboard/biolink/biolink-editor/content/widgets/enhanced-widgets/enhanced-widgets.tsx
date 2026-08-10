import {
  BiolinkFileSelector,
  BiolinkFileSelectorIcons,
} from '@app/dashboard/biolink/biolink-editor/appearance/biolink-file-selector';
import {BiolinkWidgetSurface} from '@app/dashboard/biolink/biolink-editor/content/widgets/biolink-widget-surface';
import {useCrupdateBiolinkWidget} from '@app/dashboard/biolink/biolink-editor/content/widgets/use-crupdate-biolink-widget';
import {WidgetFormActionButtons} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-form-action-buttons';
import type {WidgetEditorMode} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-editor-mode';
import type {WidgetRendererProps} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-renderer-props';
import type {BiolinkWidget} from '@app/gen/schemas/biolink-widget';
import {onFormQueryError} from '@common/http/errors/on-form-query-error';
import {FileUploadProvider} from '@common/uploads/uploader/file-upload-provider';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {useControlledState} from '@react-stately/utils';
import {Button} from '@shadcn/button/button';
import {Dialog} from '@shadcn/dialog/dialog';
import {Checkbox} from '@shadcn/forms/checkbox/checkbox';
import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Input} from '@shadcn/forms/input/input';
import {Select} from '@shadcn/forms/select/select';
import {Textarea} from '@shadcn/forms/textarea/textarea';
import {Trans} from '@ui/i18n/trans';
import {message} from '@ui/i18n/message';
import {useTrans} from '@ui/i18n/use-trans';
import {cn} from '@ui/utils/cn';
import {
  AudioLinesIcon,
  CalendarClockIcon,
  ImageIcon,
  ImagesIcon,
  MoveHorizontalIcon,
} from 'lucide-react';
import {
  type ReactElement,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {type UseFormReturn, useForm} from 'react-hook-form';

type CountdownConfig = {
  title?: string;
  description?: string;
  targetAt?: string;
  timezone?: string;
  completionBehavior?: 'stay' | 'hide' | 'message' | 'link';
  completionMessage?: string;
  completionUrl?: string;
  buttonLabel?: string;
  showSeconds?: boolean;
};

type AudioConfig = {
  title?: string;
  description?: string;
  url?: string;
  coverImage?: string;
  artist?: string;
  caption?: string;
};

type ImageComparisonConfig = {
  title?: string;
  description?: string;
  beforeImage?: string;
  afterImage?: string;
  beforeLabel?: string;
  afterLabel?: string;
  initialPosition?: number;
};

export type EnhancedWidget = Omit<BiolinkWidget, 'type' | 'config'> &
  (
    | {type: 'countdown'; config: CountdownConfig}
    | {type: 'audio'; config: AudioConfig}
    | {type: 'imageComparison'; config: ImageComparisonConfig}
  );

type EnhancedWidgetType = EnhancedWidget['type'];
type EnhancedConfig = CountdownConfig | AudioConfig | ImageComparisonConfig;

export type EnhancedWidgetDialogProps = {
  widget?: EnhancedWidget;
  children?: ReactElement<typeof Dialog.Trigger>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  mode?: WidgetEditorMode;
  initialConfig?: Record<string, unknown>;
};

export function CountdownWidgetDialog(props: EnhancedWidgetDialogProps) {
  return <EnhancedWidgetDialog {...props} type="countdown" />;
}

export function AudioWidgetDialog(props: EnhancedWidgetDialogProps) {
  return <EnhancedWidgetDialog {...props} type="audio" />;
}

export function ImageComparisonWidgetDialog(props: EnhancedWidgetDialogProps) {
  return <EnhancedWidgetDialog {...props} type="imageComparison" />;
}

function EnhancedWidgetDialog({
  children,
  open: propsOpen,
  onOpenChange: propsOnOpenChange,
  widget,
  type,
  initialConfig,
}: EnhancedWidgetDialogProps & {type: EnhancedWidgetType}) {
  const [open, setOpen] = useControlledState(
    propsOpen,
    false,
    propsOnOpenChange,
  );

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {children}
      <Dialog.Portal>
        <Dialog.Backdrop />
        <EnhancedWidgetDialogContent
          type={type}
          widget={widget}
          initialConfig={initialConfig}
          onClose={() => setOpen(false)}
        />
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function EnhancedWidgetDialogContent({
  type,
  widget,
  initialConfig,
  onClose,
}: {
  type: EnhancedWidgetType;
  widget?: EnhancedWidget;
  initialConfig?: Record<string, unknown>;
  onClose: () => void;
}) {
  const {biolinkId} = useRequiredParams(['biolinkId']);
  const initial = (initialConfig ?? {}) as EnhancedConfig;
  const existing = widget?.config as EnhancedConfig | undefined;
  const config = {...initial, ...existing};
  const form = useForm<Record<string, unknown>>({
    defaultValues: defaultConfig(type, config),
  });
  const crupdateWidget = useCrupdateBiolinkWidget(biolinkId, form, widget?.id);

  return (
    <FileUploadProvider>
      <HookForm.Root
        form={form}
        onSubmit={values => {
          crupdateWidget.mutate(
            {type, config: values},
            {
              onSuccess: onClose,
              onError: error => onFormQueryError(error, form),
            },
          );
        }}
      >
        <Dialog.Content className="sm:max-w-2xl">
          <Dialog.Header>
            <Dialog.Title>
              {enhancedWidgetCopy[type].icon}
              {enhancedWidgetCopy[type].title}
            </Dialog.Title>
            <Dialog.Description>
              {enhancedWidgetCopy[type].description}
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.Body>
            <Field.Group>
              <HookForm.Field name="title">
                <Field.Label>
                  <Trans message="Title" />
                </Field.Label>
                <Input autoFocus />
                <Field.Error />
              </HookForm.Field>
              <HookForm.Field name="description">
                <Field.Label>
                  <Trans message="Description (optional)" />
                </Field.Label>
                <Textarea rows={2} />
                <Field.Error />
              </HookForm.Field>
              {type === 'countdown' ? (
                <CountdownFields form={form} />
              ) : type === 'audio' ? (
                <AudioFields form={form} />
              ) : (
                <ImageComparisonFields form={form} />
              )}
            </Field.Group>
          </Dialog.Body>
          <Dialog.Footer variant="muted" className="py-4 sm:justify-between">
            <WidgetFormActionButtons form={form} widget={widget} />
            <Dialog.CloseButton>
              <Trans message="Cancel" />
            </Dialog.CloseButton>
            <Button
              type="submit"
              disabled={
                crupdateWidget.isPending ||
                (!!widget && !form.formState.isDirty)
              }
            >
              {widget ? <Trans message="Update" /> : <Trans message="Add" />}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </HookForm.Root>
    </FileUploadProvider>
  );
}

function CountdownFields({form}: {form: UseFormReturn<any>}) {
  const completionBehavior = form.watch('completionBehavior');
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <HookForm.Field name="targetAt">
          <Field.Label>
            <Trans message="Target date and time" />
          </Field.Label>
          <Input type="datetime-local" required />
          <Field.Error />
        </HookForm.Field>
        <HookForm.Field name="timezone">
          <Field.Label>
            <Trans message="Timezone" />
          </Field.Label>
          <Input required placeholder="America/Sao_Paulo" />
          <Field.Description>
            <Trans message="Use an IANA timezone, for example America/Sao_Paulo." />
          </Field.Description>
          <Field.Error />
        </HookForm.Field>
      </div>
      <HookForm.Field name="showSeconds">
        <label className="flex min-h-11 items-center justify-between gap-3 rounded-card-sm border bg-card px-3 py-2 text-sm">
          <span>
            <span className="block font-medium">
              <Trans message="Show seconds" />
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              <Trans message="Turn off for a calmer day, hour and minute countdown." />
            </span>
          </span>
          <Checkbox bindToHookForm />
        </label>
        <Field.Error />
      </HookForm.Field>
      <HookForm.Field name="completionBehavior">
        <Field.Label>
          <Trans message="When the countdown ends" />
        </Field.Label>
        <Select.Root
          items={[
            {value: 'stay', label: <Trans message="Keep at zero" />},
            {value: 'hide', label: <Trans message="Hide widget" />},
            {value: 'message', label: <Trans message="Show a message" />},
            {value: 'link', label: <Trans message="Show an action" />},
          ]}
        >
          <Select.Trigger className="w-full">
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="stay">
              <Trans message="Keep at zero" />
            </Select.Item>
            <Select.Item value="hide">
              <Trans message="Hide widget" />
            </Select.Item>
            <Select.Item value="message">
              <Trans message="Show a message" />
            </Select.Item>
            <Select.Item value="link">
              <Trans message="Show an action" />
            </Select.Item>
          </Select.Content>
        </Select.Root>
        <Field.Error />
      </HookForm.Field>
      {completionBehavior === 'message' || completionBehavior === 'link' ? (
        <HookForm.Field name="completionMessage">
          <Field.Label>
            <Trans message="Completion message" />
          </Field.Label>
          <Input />
          <Field.Error />
        </HookForm.Field>
      ) : null}
      {completionBehavior === 'link' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <HookForm.Field name="completionUrl">
            <Field.Label>
              <Trans message="Action URL" />
            </Field.Label>
            <Input type="url" required />
            <Field.Error />
          </HookForm.Field>
          <HookForm.Field name="buttonLabel">
            <Field.Label>
              <Trans message="Button label" />
            </Field.Label>
            <Input required />
            <Field.Error />
          </HookForm.Field>
        </div>
      ) : null}
    </>
  );
}

function AudioFields({form}: {form: UseFormReturn<any>}) {
  const url = (form.watch('url') as string | undefined) ?? '';
  const coverImage = (form.watch('coverImage') as string | undefined) ?? '';
  return (
    <>
      <HookForm.Field name="url">
        <Field.Label>
          <Trans message="Audio URL" />
        </Field.Label>
        <Input
          type="text"
          inputMode="url"
          required
          placeholder="https://example.com/audio.mp3"
        />
        <Field.Description>
          <Trans message="Paste an HTTPS URL or upload an audio file below." />
        </Field.Description>
        <Field.Error />
      </HookForm.Field>
      <Field.Root name="urlUpload">
        <BiolinkFileSelector
          accept="audio/*"
          uploadType="biolinkAudio"
          value={url}
          emptyLabel={<Trans message="Upload audio" />}
          icon={BiolinkFileSelectorIcons.audio}
          onChange={value =>
            form.setValue('url', value, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        />
      </Field.Root>
      <div className="grid gap-4 sm:grid-cols-2">
        <HookForm.Field name="artist">
          <Field.Label>
            <Trans message="Artist (optional)" />
          </Field.Label>
          <Input />
          <Field.Error />
        </HookForm.Field>
        <HookForm.Field name="caption">
          <Field.Label>
            <Trans message="Caption (optional)" />
          </Field.Label>
          <Input />
          <Field.Error />
        </HookForm.Field>
      </div>
      <Field.Root name="coverImage">
        <Field.Label>
          <Trans message="Cover image (optional)" />
        </Field.Label>
        <BiolinkFileSelector
          accept="image/jpeg,image/png,image/webp"
          uploadType="linkImages"
          value={coverImage}
          emptyLabel={<Trans message="Upload cover image" />}
          icon={<ImageIcon className="size-4" />}
          onChange={value =>
            form.setValue('coverImage', value, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        />
      </Field.Root>
    </>
  );
}

function ImageComparisonFields({form}: {form: UseFormReturn<any>}) {
  const beforeImage = (form.watch('beforeImage') as string | undefined) ?? '';
  const afterImage = (form.watch('afterImage') as string | undefined) ?? '';
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field.Root name="beforeImage">
          <Field.Label>
            <Trans message="Before image" />
          </Field.Label>
          <BiolinkFileSelector
            accept="image/jpeg,image/png,image/webp"
            uploadType="linkImages"
            value={beforeImage}
            emptyLabel={<Trans message="Upload before image" />}
            icon={<ImageIcon className="size-4" />}
            onChange={value =>
              form.setValue('beforeImage', value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
          <Field.Error />
        </Field.Root>
        <Field.Root name="afterImage">
          <Field.Label>
            <Trans message="After image" />
          </Field.Label>
          <BiolinkFileSelector
            accept="image/jpeg,image/png,image/webp"
            uploadType="linkImages"
            value={afterImage}
            emptyLabel={<Trans message="Upload after image" />}
            icon={<ImageIcon className="size-4" />}
            onChange={value =>
              form.setValue('afterImage', value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
          <Field.Error />
        </Field.Root>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <HookForm.Field name="beforeLabel">
          <Field.Label>
            <Trans message="Before label" />
          </Field.Label>
          <Input />
          <Field.Error />
        </HookForm.Field>
        <HookForm.Field name="afterLabel">
          <Field.Label>
            <Trans message="After label" />
          </Field.Label>
          <Input />
          <Field.Error />
        </HookForm.Field>
      </div>
      <HookForm.Field name="initialPosition">
        <Field.Label>
          <Trans message="Initial divider position" />
        </Field.Label>
        <Input type="range" min={10} max={90} step={1} />
        <Field.Error />
      </HookForm.Field>
    </>
  );
}

function defaultConfig(
  type: EnhancedWidgetType,
  config: EnhancedConfig,
): Record<string, unknown> {
  const common = {
    title: config.title ?? '',
    description: config.description ?? '',
  };
  if (type === 'countdown') {
    const value = config as CountdownConfig;
    return {
      ...common,
      targetAt: toDateTimeLocal(value.targetAt),
      timezone:
        value.timezone ??
        Intl.DateTimeFormat().resolvedOptions().timeZone ??
        'UTC',
      completionBehavior: value.completionBehavior ?? 'stay',
      completionMessage: value.completionMessage ?? '',
      completionUrl: value.completionUrl ?? '',
      buttonLabel: value.buttonLabel ?? '',
      showSeconds: value.showSeconds ?? true,
    };
  }
  if (type === 'audio') {
    const value = config as AudioConfig;
    return {
      ...common,
      url: value.url ?? '',
      coverImage: value.coverImage ?? '',
      artist: value.artist ?? '',
      caption: value.caption ?? '',
    };
  }
  const value = config as ImageComparisonConfig;
  return {
    ...common,
    beforeImage: value.beforeImage ?? '',
    afterImage: value.afterImage ?? '',
    beforeLabel: value.beforeLabel ?? '',
    afterLabel: value.afterLabel ?? '',
    initialPosition: value.initialPosition ?? 50,
  };
}

const enhancedWidgetCopy: Record<
  EnhancedWidgetType,
  {title: ReactNode; description: ReactNode; icon: ReactNode}
> = {
  countdown: {
    title: <Trans message="Countdown" />,
    description: (
      <Trans message="Count down to a launch, event or limited-time offer." />
    ),
    icon: <CalendarClockIcon />,
  },
  audio: {
    title: <Trans message="Audio player" />,
    description: (
      <Trans message="Publish one audio file with optional cover and credits." />
    ),
    icon: <AudioLinesIcon />,
  },
  imageComparison: {
    title: <Trans message="Image comparison" />,
    description: (
      <Trans message="Let visitors compare two images with an accessible slider." />
    ),
    icon: <ImagesIcon />,
  },
};

export function CountdownWidgetRenderer({
  widget: rawWidget,
  variant,
  appearance,
}: WidgetRendererProps) {
  const widget = rawWidget as EnhancedWidget & {type: 'countdown'};
  const target = useMemo(
    () => parseCountdownTarget(widget.config.targetAt, widget.config.timezone),
    [widget.config.targetAt, widget.config.timezone],
  );
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!target || target <= Date.now()) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [target]);

  const remaining = Math.max(0, (target ?? 0) - now);
  const finished = !!target && remaining === 0;

  if (variant === 'editor') {
    return (
      <WidgetEditorSummary
        title={widget.config.title || <Trans message="Countdown" />}
        detail={widget.config.targetAt || <Trans message="No target date" />}
      />
    );
  }
  if (!target || (finished && widget.config.completionBehavior === 'hide')) {
    return null;
  }

  return (
    <BiolinkWidgetSurface appearance={appearance} config={widget.config}>
      <WidgetHeading
        title={widget.config.title}
        description={widget.config.description}
      />
      {finished && widget.config.completionBehavior !== 'stay' ? (
        <div className="text-center" aria-live="polite">
          <p className="font-medium">
            {widget.config.completionMessage || (
              <Trans message="The countdown has ended." />
            )}
          </p>
          {widget.config.completionBehavior === 'link' &&
          widget.config.completionUrl ? (
            <a
              href={widget.config.completionUrl}
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-button bg-current px-5 font-semibold text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            >
              {widget.config.buttonLabel || <Trans message="Open" />}
            </a>
          ) : null}
        </div>
      ) : (
        <CountdownUnits
          milliseconds={remaining}
          showSeconds={widget.config.showSeconds !== false}
        />
      )}
    </BiolinkWidgetSurface>
  );
}

function CountdownUnits({
  milliseconds,
  showSeconds,
}: {
  milliseconds: number;
  showSeconds: boolean;
}) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const values = [
    {label: <Trans message="Days" />, value: Math.floor(totalSeconds / 86400)},
    {
      label: <Trans message="Hours" />,
      value: Math.floor((totalSeconds % 86400) / 3600),
    },
    {
      label: <Trans message="Minutes" />,
      value: Math.floor((totalSeconds % 3600) / 60),
    },
    ...(showSeconds
      ? [{label: <Trans message="Seconds" />, value: totalSeconds % 60}]
      : []),
  ];
  return (
    <div
      className={cn(
        'grid gap-2 text-center',
        showSeconds ? 'grid-cols-4' : 'grid-cols-3',
      )}
      role="timer"
      aria-atomic="true"
    >
      {values.map((item, index) => (
        <div className="rounded-lg bg-current/8 px-2 py-3" key={index}>
          <div className="text-xl font-semibold tabular-nums">
            {String(item.value).padStart(2, '0')}
          </div>
          <div className="mt-1 text-[11px] opacity-70">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

export function AudioWidgetRenderer({
  widget: rawWidget,
  variant,
  appearance,
}: WidgetRendererProps) {
  const widget = rawWidget as EnhancedWidget & {type: 'audio'};
  if (variant === 'editor') {
    return (
      <WidgetEditorSummary
        title={widget.config.title || <Trans message="Audio player" />}
        detail={widget.config.artist || widget.config.url || '-'}
      />
    );
  }
  if (!widget.config.url) return null;

  return (
    <BiolinkWidgetSurface
      appearance={appearance}
      config={widget.config}
      className="p-4 @2xl:p-5"
    >
      <div className="flex items-start gap-3">
        {widget.config.coverImage ? (
          <img
            src={widget.config.coverImage}
            alt=""
            className="size-16 shrink-0 rounded-lg object-cover"
            loading="lazy"
          />
        ) : (
          <span className="grid size-16 shrink-0 place-items-center rounded-lg bg-current/10">
            <AudioLinesIcon className="size-6" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <WidgetHeading
            title={widget.config.title}
            description={widget.config.artist || widget.config.description}
            compact
          />
          {widget.config.caption ? (
            <p className="mt-1 text-xs opacity-70">{widget.config.caption}</p>
          ) : null}
        </div>
      </div>
      <audio
        controls
        preload="metadata"
        src={widget.config.url}
        className="mt-4 h-11 w-full"
      >
        <Trans message="Your browser does not support audio playback." />
      </audio>
    </BiolinkWidgetSurface>
  );
}

export function ImageComparisonWidgetRenderer({
  widget: rawWidget,
  variant,
  appearance,
}: WidgetRendererProps) {
  const widget = rawWidget as EnhancedWidget & {type: 'imageComparison'};
  const {trans} = useTrans();
  const [position, setPosition] = useState(widget.config.initialPosition ?? 50);
  if (variant === 'editor') {
    return (
      <WidgetEditorSummary
        title={widget.config.title || <Trans message="Image comparison" />}
        detail={
          widget.config.beforeImage && widget.config.afterImage ? (
            <Trans message="Two images selected" />
          ) : (
            <Trans message="Choose two images" />
          )
        }
      />
    );
  }
  if (!widget.config.beforeImage || !widget.config.afterImage) return null;

  return (
    <BiolinkWidgetSurface
      appearance={appearance}
      config={widget.config}
      className="overflow-hidden p-0"
    >
      {widget.config.title || widget.config.description ? (
        <div className="p-4 pb-3 @2xl:px-5">
          <WidgetHeading
            title={widget.config.title}
            description={widget.config.description}
            compact
          />
        </div>
      ) : null}
      <div className="group relative aspect-[4/3] overflow-hidden bg-black focus-within:ring-2 focus-within:ring-current focus-within:ring-inset">
        <img
          src={widget.config.afterImage}
          alt={widget.config.afterLabel || trans(message('After'))}
          className="absolute inset-0 size-full object-cover"
        />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{clipPath: `inset(0 ${100 - position}% 0 0)`}}
        >
          <img
            src={widget.config.beforeImage}
            alt={widget.config.beforeLabel || trans(message('Before'))}
            className="absolute inset-0 size-full object-cover"
          />
        </div>
        <span className="absolute top-3 left-3 rounded bg-black/75 px-2 py-1 text-xs font-medium text-white">
          {widget.config.beforeLabel || <Trans message="Before" />}
        </span>
        <span className="absolute top-3 right-3 rounded bg-black/75 px-2 py-1 text-xs font-medium text-white">
          {widget.config.afterLabel || <Trans message="After" />}
        </span>
        <span
          className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-sm"
          style={{left: `${position}%`}}
        >
          <span className="absolute top-1/2 left-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-black shadow-lg">
            <MoveHorizontalIcon className="size-5" aria-hidden="true" />
          </span>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={position}
          onChange={event => setPosition(Number(event.target.value))}
          aria-label={trans(message('Image comparison position'))}
          className="absolute inset-0 size-full cursor-ew-resize opacity-0"
        />
      </div>
    </BiolinkWidgetSurface>
  );
}

function WidgetHeading({
  title,
  description,
  compact = false,
}: {
  title?: string;
  description?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn('text-center', compact && 'text-left')}>
      {title ? <h3 className="font-semibold">{title}</h3> : null}
      {description ? (
        <p className={cn('text-sm opacity-75', title && 'mt-1')}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

function WidgetEditorSummary({
  title,
  detail,
}: {
  title: ReactNode;
  detail: ReactNode;
}) {
  return (
    <div className="min-w-0 text-sm text-muted-foreground">
      <div className="truncate">{title}</div>
      <div className="truncate">{detail}</div>
    </div>
  );
}

function toDateTimeLocal(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function parseCountdownTarget(
  value?: string,
  timezone?: string,
): number | null {
  if (!value) return null;
  if (/Z$|[+-]\d{2}:?\d{2}$/.test(value)) {
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? null : timestamp;
  }

  try {
    const desired = value.slice(0, 16).replace('T', ' ');
    let guess = Date.parse(`${value}:00Z`);
    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: timezone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    for (let index = 0; index < 2; index++) {
      const rendered = formatter.format(new Date(guess));
      const renderedUtc = Date.parse(`${rendered.replace(' ', 'T')}:00Z`);
      const desiredUtc = Date.parse(`${desired.replace(' ', 'T')}:00Z`);
      guess += desiredUtc - renderedUtc;
    }
    return guess;
  } catch {
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? null : timestamp;
  }
}
