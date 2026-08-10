import {
  BiolinkSectionFrame,
  shouldShowBiolinkSectionHeading,
  type BiolinkSectionConfig,
} from '@app/dashboard/biolink/biolink-editor/content/widgets/biolink-section-frame';
import {BiolinkSectionFields} from '@app/dashboard/biolink/biolink-editor/content/widgets/biolink-section-fields';
import {BiolinkWidgetSurface} from '@app/dashboard/biolink/biolink-editor/content/widgets/biolink-widget-surface';
import {useCrupdateBiolinkWidget} from '@app/dashboard/biolink/biolink-editor/content/widgets/use-crupdate-biolink-widget';
import {WidgetFormActionButtons} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-form-action-buttons';
import type {WidgetRendererProps} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-renderer-props';
import {
  getWidgetEditorModeIcon,
  type WidgetEditorMode,
} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-editor-mode';
import {VisualOptionGrid} from '@app/dashboard/biolink/biolink-editor/visual-option-card';
import type {BiolinkWidget} from '@app/gen/schemas/biolink-widget';
import type {BiolinkWidgetItem} from '@app/gen/schemas/biolink-widget-item';
import {UploadType} from '@app/site-config';
import {ImageSelector} from '@common/uploads/components/image-selector';
import {FileUploadProvider} from '@common/uploads/uploader/file-upload-provider';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {useControlledState} from '@react-stately/utils';
import {Button} from '@shadcn/button/button';
import {Dialog} from '@shadcn/dialog/dialog';
import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Input} from '@shadcn/forms/input/input';
import {Select} from '@shadcn/forms/select/select';
import {Textarea} from '@shadcn/forms/textarea/textarea';
import {ColorField} from '@ui/color-picker/color-field';
import {Trans} from '@ui/i18n/trans';
import {message} from '@ui/i18n/message';
import {useTrans} from '@ui/i18n/use-trans';
import {cn} from '@ui/utils/cn';
import {
  ArrowRightIcon,
  HeartIcon,
  ImageIcon,
  MegaphoneIcon,
  MessageCircleIcon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
  UsersRoundIcon,
} from 'lucide-react';
import type {ReactElement} from 'react';
import {useEffect, useState} from 'react';
import {useFieldArray, useForm, useWatch} from 'react-hook-form';

export type ShowcaseWidgetType =
  | 'spotlight'
  | 'ctaBanner'
  | 'logoCloud'
  | 'socialFeed';

type ShowcaseConfig = {
  title?: string;
  description?: string;
  body?: string;
  image?: string;
  imagePosition?: 'left' | 'right' | 'top' | 'background';
  buttonLabel?: string;
  url?: string;
  layout?: string;
  backgroundColor?: string;
  textColor?: string;
  section?: BiolinkSectionConfig;
  blueprintKey?: string;
};

const showcaseConfigKeys: Record<ShowcaseWidgetType, (keyof ShowcaseConfig)[]> =
  {
    spotlight: [
      'title',
      'description',
      'body',
      'image',
      'imagePosition',
      'buttonLabel',
      'url',
    ],
    ctaBanner: [
      'title',
      'description',
      'buttonLabel',
      'url',
      'image',
      'layout',
      'backgroundColor',
      'textColor',
    ],
    logoCloud: ['title', 'description', 'layout'],
    socialFeed: ['title', 'description', 'layout'],
  };

type ShowcaseWidget = Omit<BiolinkWidget, 'type' | 'config' | 'items'> & {
  type: ShowcaseWidgetType;
  config: ShowcaseConfig;
  items?: BiolinkWidgetItem[];
};

type DialogProps = {
  widget?: ShowcaseWidget;
  children?: ReactElement<typeof Dialog.Trigger>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  mode?: WidgetEditorMode;
  initialConfig?: Record<string, unknown>;
};

type FormValue = {
  config: ShowcaseConfig;
  items: Array<{
    title?: string;
    description?: string;
    url?: string;
    image?: string;
    active?: boolean;
    type?: string;
    payload?: {
      icon?: string;
      network?:
        | 'instagram'
        | 'tiktok'
        | 'youtube'
        | 'facebook'
        | 'linkedin'
        | 'x';
      likes?: number;
      comments?: number;
      publishedAt?: string;
    };
  }>;
};

type ShowcaseItem = FormValue['items'][number];

const widgetCopy = {
  spotlight: {
    title: <Trans message="Spotlight" />,
    description: (
      <Trans message="Present a story, profile or rich feature with benefits." />
    ),
    icon: SparklesIcon,
    defaultTitle: 'About',
  },
  ctaBanner: {
    title: <Trans message="CTA banner" />,
    description: (
      <Trans message="Promote one important action in a compact banner." />
    ),
    icon: MegaphoneIcon,
    defaultTitle: 'Ready for the next step?',
  },
  logoCloud: {
    title: <Trans message="Logo cloud" />,
    description: (
      <Trans message="Show partners, sponsors, certifications or payments." />
    ),
    icon: UsersRoundIcon,
    defaultTitle: 'Partners',
  },
  socialFeed: {
    title: <Trans message="Social feed" />,
    description: (
      <Trans message="Build a manual social wall without external scraping." />
    ),
    icon: MessageCircleIcon,
    defaultTitle: 'Social wall',
  },
} satisfies Record<
  ShowcaseWidgetType,
  {
    title: ReactElement;
    description: ReactElement;
    icon: typeof SparklesIcon;
    defaultTitle: string;
  }
>;

export function SpotlightWidgetDialog(props: DialogProps) {
  return <ShowcaseWidgetDialog {...props} type="spotlight" />;
}

export function CtaBannerWidgetDialog(props: DialogProps) {
  return <ShowcaseWidgetDialog {...props} type="ctaBanner" />;
}

export function LogoCloudWidgetDialog(props: DialogProps) {
  return <ShowcaseWidgetDialog {...props} type="logoCloud" />;
}

export function SocialFeedWidgetDialog(props: DialogProps) {
  return <ShowcaseWidgetDialog {...props} type="socialFeed" />;
}

function ShowcaseWidgetDialog({
  type,
  widget,
  children,
  open: propsOpen,
  onOpenChange: propsOnOpenChange,
  mode = 'content',
  initialConfig,
}: DialogProps & {type: ShowcaseWidgetType}) {
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
        <ShowcaseWidgetDialogContent
          type={type}
          widget={widget}
          mode={mode}
          initialConfig={initialConfig}
          onClose={() => setOpen(false)}
        />
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ShowcaseWidgetDialogContent({
  type,
  widget,
  mode,
  initialConfig,
  onClose,
}: {
  type: ShowcaseWidgetType;
  widget?: ShowcaseWidget;
  mode: WidgetEditorMode;
  initialConfig?: Record<string, unknown>;
  onClose: () => void;
}) {
  const {biolinkId} = useRequiredParams(['biolinkId']);
  const {trans} = useTrans();
  const copy = widgetCopy[type];
  const supportsItems = type !== 'ctaBanner';
  const form = useForm<FormValue>({
    defaultValues: {
      config: {
        ...(initialConfig as ShowcaseConfig | undefined),
        title:
          widget?.config.title ??
          (initialConfig?.title as string | undefined) ??
          copy.defaultTitle,
        description: widget?.config.description ?? '',
        body: widget?.config.body ?? '',
        image: widget?.config.image ?? '',
        imagePosition:
          widget?.config.imagePosition ??
          (initialConfig?.imagePosition as ShowcaseConfig['imagePosition']) ??
          'left',
        buttonLabel: widget?.config.buttonLabel ?? 'Learn more',
        url: widget?.config.url ?? '',
        layout:
          widget?.config.layout ??
          (initialConfig?.layout as ShowcaseConfig['layout']) ??
          (type === 'ctaBanner'
            ? 'compact'
            : type === 'logoCloud'
              ? 'strip'
              : 'grid'),
        backgroundColor: widget?.config.backgroundColor ?? '',
        textColor: widget?.config.textColor ?? '',
        section: {
          presentation: widget?.config.section?.presentation ?? 'open',
          icon: widget?.config.section?.icon ?? '',
          anchorLabel: widget?.config.section?.anchorLabel ?? '',
          actionLabel: widget?.config.section?.actionLabel ?? '',
          actionUrl: widget?.config.section?.actionUrl ?? '',
        },
        blueprintKey: widget?.config.blueprintKey,
      },
      items:
        widget?.items?.map(item => ({
          title: item.title ?? '',
          description: item.description ?? '',
          url: item.url ?? '',
          image: item.image ?? '',
          active: item.active !== false,
          type: item.type ?? undefined,
          payload: (item.payload ??
            {}) as FormValue['items'][number]['payload'],
        })) ?? [],
    },
  });
  const {fields, append, remove, update} = useFieldArray({
    control: form.control,
    name: 'items',
  });
  const [creatingItem, setCreatingItem] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const crupdate = useCrupdateBiolinkWidget(biolinkId, form, widget?.id);
  const Icon = copy.icon;
  const imageValue = useWatch({control: form.control, name: 'config.image'});
  const ModeIcon = mode === 'content' ? null : getWidgetEditorModeIcon(mode);

  return (
    <FileUploadProvider>
      <HookForm.Root
        form={form}
        onSubmit={values => {
          crupdate.mutate(
            {
              type,
              config: compactConfig(type, values.config),
              items: supportsItems
                ? values.items.map((item, index) =>
                    normalizeShowcaseItem(type, item, index),
                  )
                : undefined,
            } as never,
            {onSuccess: onClose},
          );
        }}
      >
        <Dialog.Content className="sm:max-w-3xl">
          <Dialog.Header>
            <Dialog.Title>
              {ModeIcon ? <ModeIcon /> : <Icon />}
              {mode === 'design' ? (
                <Trans message="Design and layout" />
              ) : mode === 'advanced' ? (
                <Trans message="Details and advanced settings" />
              ) : (
                copy.title
              )}
            </Dialog.Title>
            <Dialog.Description>
              {mode === 'design' ? (
                <Trans message="Adjust the layout, images and colors of this widget." />
              ) : mode === 'advanced' ? (
                <Trans message="Configure the section surface and navigation details." />
              ) : (
                copy.description
              )}
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.Body>
            <Field.Group>
              {mode === 'content' ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <HookForm.Field name="config.title">
                      <Field.Label>
                        <Trans message="Title" />
                      </Field.Label>
                      <Input required autoFocus />
                      <Field.Error />
                    </HookForm.Field>
                    <HookForm.Field name="config.description">
                      <Field.Label>
                        <Trans message="Description" />
                      </Field.Label>
                      <Input />
                      <Field.Error />
                    </HookForm.Field>
                  </div>

                  {type === 'spotlight' ? (
                    <HookForm.Field name="config.body">
                      <Field.Label>
                        <Trans message="Content" />
                      </Field.Label>
                      <Textarea rows={5} />
                      <Field.Error />
                    </HookForm.Field>
                  ) : null}

                  {type === 'spotlight' || type === 'ctaBanner' ? (
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                      <ImageSelector.Square
                        className="size-32 shrink-0"
                        cropDimensions={{width: 1200, height: 675}}
                        placeholderVariant="icon"
                        uploadType={UploadType.linkImages}
                        value={imageValue ?? ''}
                        onChange={value =>
                          form.setValue('config.image', value, {
                            shouldDirty: true,
                          })
                        }
                      />
                      <div className="grid min-w-0 flex-1 gap-4">
                        <HookForm.Field name="config.url">
                          <Field.Label>
                            <Trans message="Action URL" />
                          </Field.Label>
                          <Input type="url" />
                          <Field.Error />
                        </HookForm.Field>
                        <HookForm.Field name="config.buttonLabel">
                          <Field.Label>
                            <Trans message="Button label" />
                          </Field.Label>
                          <Input />
                          <Field.Error />
                        </HookForm.Field>
                      </div>
                    </div>
                  ) : null}

                  {supportsItems ? (
                    <div className="flex flex-col gap-3 border-t pt-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold">
                            <Trans message="Items" />
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {itemHelp(type)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCreatingItem(true)}
                        >
                          <PlusIcon data-icon="inline-start" />
                          <Trans message="Add item" />
                        </Button>
                      </div>
                      {fields.length ? (
                        <div className="space-y-2">
                          {fields.map((field, index) => (
                            <ShowcaseItemPreview
                              key={field.id}
                              item={form.getValues(`items.${index}`)}
                              type={type}
                              onEdit={() => setEditingItemIndex(index)}
                              onRemove={() => remove(index)}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="rounded-card border border-dashed p-5 text-center text-sm text-muted-foreground">
                          <Trans message="Add the first item to complete this section." />
                        </p>
                      )}
                    </div>
                  ) : null}
                </>
              ) : null}

              {mode === 'design' ? (
                <>
                  {type === 'spotlight' ? (
                    <VisualOptionGrid
                      ariaLabel={trans(message('Image position'))}
                      columns="grid-cols-2 sm:grid-cols-4"
                      value={form.watch('config.imagePosition') ?? 'left'}
                      onChange={value =>
                        form.setValue(
                          'config.imagePosition',
                          value as ShowcaseConfig['imagePosition'],
                          {shouldDirty: true},
                        )
                      }
                      items={[
                        {value: 'left', label: <Trans message="Left" />},
                        {value: 'right', label: <Trans message="Right" />},
                        {value: 'top', label: <Trans message="Top" />},
                        {
                          value: 'background',
                          label: <Trans message="Background" />,
                        },
                      ]}
                    />
                  ) : (
                    <VisualOptionGrid
                      ariaLabel={trans(message('Widget layout'))}
                      columns="grid-cols-2 sm:grid-cols-3"
                      value={
                        form.watch('config.layout') ??
                        layoutOptions(type)[0].value
                      }
                      onChange={value =>
                        form.setValue('config.layout', value, {
                          shouldDirty: true,
                        })
                      }
                      items={layoutOptions(type).map(option => ({
                        ...option,
                        preview: (
                          <ShowcaseLayoutPreview layout={option.value} />
                        ),
                        kind: 'thumbnail' as const,
                      }))}
                    />
                  )}
                  {type === 'ctaBanner' ? (
                    <div className="grid gap-4 border-t pt-5 sm:grid-cols-2">
                      <HookForm.Field name="config.backgroundColor">
                        <Field.Label>
                          <Trans message="Background" />
                        </Field.Label>
                        <ColorField
                          label={null}
                          value={
                            form.watch('config.backgroundColor') || '#ffffff'
                          }
                          onChange={value =>
                            form.setValue('config.backgroundColor', value, {
                              shouldDirty: true,
                            })
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          color="default"
                          size="xs"
                          className="mt-2"
                          onClick={() =>
                            form.setValue('config.backgroundColor', '', {
                              shouldDirty: true,
                            })
                          }
                        >
                          <Trans message="Use theme background" />
                        </Button>
                        <Field.Error />
                      </HookForm.Field>
                      <HookForm.Field name="config.textColor">
                        <Field.Label>
                          <Trans message="Text" />
                        </Field.Label>
                        <ColorField
                          label={null}
                          value={form.watch('config.textColor') || '#111827'}
                          onChange={value =>
                            form.setValue('config.textColor', value, {
                              shouldDirty: true,
                            })
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          color="default"
                          size="xs"
                          className="mt-2"
                          onClick={() =>
                            form.setValue('config.textColor', '', {
                              shouldDirty: true,
                            })
                          }
                        >
                          <Trans message="Use page text" />
                        </Button>
                        <Field.Error />
                      </HookForm.Field>
                    </div>
                  ) : null}
                </>
              ) : null}

              {mode === 'advanced' ? (
                <BiolinkSectionFields
                  prefix="config."
                  showPresentation={type !== 'ctaBanner'}
                />
              ) : null}
            </Field.Group>
          </Dialog.Body>
          <Dialog.Footer variant="muted" className="py-4 sm:justify-between">
            <WidgetFormActionButtons form={form} widget={widget} />
            <Dialog.CloseButton>
              <Trans message="Cancel" />
            </Dialog.CloseButton>
            <Button type="submit" disabled={crupdate.isPending}>
              <Trans message="Save" />
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </HookForm.Root>
      <ShowcaseItemEditorDialog
        open={creatingItem || editingItemIndex !== null}
        type={type}
        item={
          editingItemIndex === null
            ? emptyShowcaseItem(type)
            : form.getValues(`items.${editingItemIndex}`)
        }
        onOpenChange={open => {
          if (!open) {
            setCreatingItem(false);
            setEditingItemIndex(null);
          }
        }}
        onSubmit={item => {
          if (editingItemIndex === null) {
            append(item);
          } else {
            update(editingItemIndex, item);
          }
          form.setValue('items', form.getValues('items'), {shouldDirty: true});
          setCreatingItem(false);
          setEditingItemIndex(null);
        }}
      />
    </FileUploadProvider>
  );
}

function ShowcaseItemPreview({
  item,
  type,
  onEdit,
  onRemove,
}: {
  item: ShowcaseItem;
  type: ShowcaseWidgetType;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-card border bg-card p-3">
      {item.image ? (
        <SafeImage
          src={item.image}
          alt=""
          className="size-12 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
          {type === 'socialFeed' ? (
            <MessageCircleIcon className="size-5" />
          ) : type === 'logoCloud' ? (
            <UsersRoundIcon className="size-5" />
          ) : (
            <SparklesIcon className="size-5" />
          )}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {item.title || <Trans message="Untitled item" />}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {item.description || item.url || <Trans message="No details" />}
        </p>
      </div>
      <Button type="button" variant="ghost" size="icon-sm" onClick={onEdit}>
        <PencilIcon />
        <span className="sr-only">
          <Trans message="Edit item" />
        </span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        color="danger"
        size="icon-sm"
        onClick={onRemove}
      >
        <Trash2Icon />
        <span className="sr-only">
          <Trans message="Remove item" />
        </span>
      </Button>
    </div>
  );
}

function ShowcaseItemEditorDialog({
  open,
  type,
  item,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  type: ShowcaseWidgetType;
  item: ShowcaseItem;
  onOpenChange: (open: boolean) => void;
  onSubmit: (item: ShowcaseItem) => void;
}) {
  const form = useForm<ShowcaseItem>({defaultValues: item});
  const imageValue = useWatch({control: form.control, name: 'image'});
  const supportsImage = type === 'logoCloud' || type === 'socialFeed';

  useEffect(() => {
    if (open) form.reset(item);
  }, [form, item, open]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <HookForm.Root
          form={form}
          onSubmit={values =>
            onSubmit({
              ...values,
              active: values.active !== false,
              type: values.type || defaultItemType(type),
            })
          }
        >
          <Dialog.Content className="sm:max-w-2xl">
            <Dialog.Header>
              <Dialog.Title>
                <PencilIcon />
                <Trans message="Item details" />
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                {supportsImage ? (
                  <ImageSelector.Square
                    className="size-32 shrink-0"
                    cropDimensions={{width: 800, height: 800}}
                    placeholderVariant="icon"
                    uploadType={UploadType.linkImages}
                    value={imageValue ?? ''}
                    onChange={value =>
                      form.setValue('image', value, {shouldDirty: true})
                    }
                  />
                ) : null}
                <Field.Group className="min-w-0 flex-1">
                  <HookForm.Field name="title">
                    <Field.Label>
                      <Trans message="Title" />
                    </Field.Label>
                    <Input required autoFocus />
                    <Field.Error />
                  </HookForm.Field>
                  {type !== 'logoCloud' ? (
                    <HookForm.Field name="description">
                      <Field.Label>
                        <Trans message="Description" />
                      </Field.Label>
                      <Textarea rows={3} />
                      <Field.Error />
                    </HookForm.Field>
                  ) : null}
                  {type !== 'spotlight' ? (
                    <HookForm.Field name="url">
                      <Field.Label>
                        <Trans message="URL" />
                      </Field.Label>
                      <Input type="url" />
                      <Field.Error />
                    </HookForm.Field>
                  ) : null}
                  {type === 'socialFeed' ? (
                    <>
                      <HookForm.Field name="payload.network">
                        <Field.Label>
                          <Trans message="Network" />
                        </Field.Label>
                        <Select.Root items={socialNetworkOptions}>
                          <Select.Trigger className="w-full">
                            <Select.Value />
                          </Select.Trigger>
                          <Select.Content>
                            {socialNetworkOptions.map(option => (
                              <Select.Item
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Root>
                        <Field.Error />
                      </HookForm.Field>
                      <div className="grid grid-cols-2 gap-3">
                        <HookForm.Field name="payload.likes">
                          <Field.Label>
                            <Trans message="Likes" />
                          </Field.Label>
                          <Input type="number" min="0" />
                          <Field.Error />
                        </HookForm.Field>
                        <HookForm.Field name="payload.comments">
                          <Field.Label>
                            <Trans message="Comments" />
                          </Field.Label>
                          <Input type="number" min="0" />
                          <Field.Error />
                        </HookForm.Field>
                      </div>
                    </>
                  ) : null}
                </Field.Group>
              </div>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.CloseButton>
                <Trans message="Cancel" />
              </Dialog.CloseButton>
              <Button type="submit">
                <Trans message="Done" />
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </HookForm.Root>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function emptyShowcaseItem(type: ShowcaseWidgetType): ShowcaseItem {
  return {
    title: '',
    description: '',
    url: '',
    image: '',
    active: true,
    type: defaultItemType(type),
    payload: type === 'socialFeed' ? {network: 'instagram'} : {},
  };
}

function ShowcaseLayoutPreview({layout}: {layout: string}) {
  const split = layout === 'split' || layout === 'grid';
  const background = layout === 'background';

  return (
    <span className="grid h-12 w-full grid-cols-2 gap-1 rounded-lg bg-primary/10 p-2 text-primary">
      <span
        className={cn(
          'rounded bg-current/25',
          !split && 'col-span-2',
          background && 'col-span-2 row-span-2 bg-current/35',
        )}
      />
      {split ? <span className="rounded bg-current/45" /> : null}
      {!background ? (
        <span className="col-span-2 h-1.5 self-end rounded bg-current/55" />
      ) : null}
    </span>
  );
}

export function SpotlightWidgetRenderer({
  widget,
  appearance,
  variant,
}: WidgetRendererProps<ShowcaseWidget>) {
  if (variant === 'editor') {
    return <ShowcaseEditorPreview widget={widget} />;
  }

  const items = visibleItems(widget.items);
  const image = widget.config.image;
  const imagePosition = widget.config.imagePosition ?? 'left';

  return (
    <BiolinkSectionFrame
      appearance={appearance}
      title={widget.config.title}
      description={widget.config.description}
      config={widget.config.section}
    >
      <div
        className={cn(
          'relative grid items-center gap-5 overflow-hidden',
          image &&
            imagePosition !== 'top' &&
            imagePosition !== 'background' &&
            '@2xl:grid-cols-2',
          imagePosition === 'background' && 'min-h-56 rounded-xl p-5',
        )}
      >
        {image && imagePosition === 'background' ? (
          <SafeImage
            src={image}
            alt=""
            className="absolute inset-0 size-full object-cover opacity-25"
          />
        ) : image ? (
          <SafeImage
            src={image}
            alt=""
            className={cn(
              'aspect-4/3 w-full rounded-xl object-cover',
              imagePosition === 'right' && '@2xl:order-2',
            )}
          />
        ) : null}
        <div className="relative z-1 min-w-0">
          {widget.config.body ? (
            <div
              className="prose prose-sm max-w-none text-current prose-headings:text-current prose-p:text-current/80"
              dangerouslySetInnerHTML={{__html: widget.config.body}}
            />
          ) : null}
          {items.length ? (
            <ul className="mt-4 grid gap-2">
              {items.map(item => (
                <li
                  key={item.id}
                  className="flex items-start gap-2 text-sm leading-5"
                >
                  <SparklesIcon className="mt-0.5 size-4 shrink-0" />
                  <span>
                    <span className="font-medium">{item.title}</span>
                    {item.description ? (
                      <span className="block text-current/70">
                        {item.description}
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          {widget.config.url ? (
            <PublicCta
              className="mt-5"
              href={widget.config.url}
              label={widget.config.buttonLabel || 'Learn more'}
            />
          ) : null}
        </div>
      </div>
    </BiolinkSectionFrame>
  );
}

export function CtaBannerWidgetRenderer({
  widget,
  appearance,
  variant,
}: WidgetRendererProps<ShowcaseWidget>) {
  if (variant === 'editor') {
    return <ShowcaseEditorPreview widget={widget} />;
  }

  const layout = widget.config.layout ?? 'compact';
  const showHeading = shouldShowBiolinkSectionHeading(widget.config.section);
  const titleAndDescription = showHeading ? (
    <div className="min-w-0">
      <h2 className="text-xl font-semibold wrap-break-word">
        {widget.config.title}
      </h2>
      {widget.config.description ? (
        <p className="mt-2 max-w-prose text-sm leading-5 opacity-80">
          {widget.config.description}
        </p>
      ) : null}
    </div>
  ) : null;
  const cta = widget.config.url ? (
    <PublicCta
      href={widget.config.url}
      label={widget.config.buttonLabel || 'Learn more'}
    />
  ) : null;

  return (
    <BiolinkWidgetSurface
      appearance={appearance}
      config={{
        boxBackgroundColor: widget.config.backgroundColor,
        boxTextColor: widget.config.textColor,
      }}
      className={cn((layout === 'split' || layout === 'background') && '!p-0')}
    >
      <div
        className={cn(
          'relative overflow-hidden',
          layout === 'compact' &&
            'flex min-h-24 flex-col items-stretch gap-4 @2xl:flex-row @2xl:items-center',
          layout === 'split' && 'grid min-h-44',
          layout === 'split' &&
            widget.config.image &&
            '@2xl:grid-cols-[minmax(0,1fr)_minmax(9rem,0.55fr)]',
          layout === 'background' &&
            'grid min-h-48 items-center gap-5 p-5 @2xl:grid-cols-[minmax(0,1fr)_auto] @2xl:p-7',
        )}
      >
        {widget.config.image && layout === 'background' ? (
          <SafeImage
            src={widget.config.image}
            alt=""
            className="absolute inset-0 size-full object-cover opacity-25"
          />
        ) : null}
        {widget.config.image && layout === 'compact' ? (
          <SafeImage
            src={widget.config.image}
            alt=""
            className="size-16 shrink-0 rounded-lg object-cover"
          />
        ) : null}
        {layout === 'split' ? (
          <>
            <div className="flex flex-col items-start justify-center gap-4 p-5 @2xl:p-6">
              {titleAndDescription}
              {cta}
            </div>
            {widget.config.image ? (
              <SafeImage
                src={widget.config.image}
                alt=""
                className="aspect-video size-full max-h-56 object-cover @2xl:aspect-auto @2xl:max-h-none"
              />
            ) : null}
          </>
        ) : (
          <>
            <div className="relative z-1 min-w-0 flex-1">
              {titleAndDescription}
            </div>
            {cta ? <div className="relative z-1 shrink-0">{cta}</div> : null}
          </>
        )}
      </div>
    </BiolinkWidgetSurface>
  );
}

export function LogoCloudWidgetRenderer({
  widget,
  appearance,
  variant,
}: WidgetRendererProps<ShowcaseWidget>) {
  if (variant === 'editor') {
    return <ShowcaseEditorPreview widget={widget} />;
  }

  const items = visibleItems(widget.items);
  const strip = (widget.config.layout ?? 'strip') === 'strip';
  return (
    <BiolinkSectionFrame
      appearance={appearance}
      title={widget.config.title}
      description={widget.config.description}
      config={widget.config.section}
    >
      <div
        className={cn(
          strip
            ? 'flex flex-wrap items-center justify-center gap-5'
            : 'grid grid-cols-2 gap-3 @2xl:grid-cols-4',
        )}
      >
        {items.map(item => {
          const content = item.image ? (
            <SafeImage
              src={item.image}
              alt={item.title || ''}
              className="max-h-10 max-w-32 object-contain"
            />
          ) : (
            <span className="text-sm font-semibold">{item.title}</span>
          );
          return item.url ? (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-11 min-w-24 items-center justify-center rounded-lg px-2 py-1 opacity-85 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            >
              {content}
            </a>
          ) : (
            <div
              key={item.id}
              className="flex min-h-11 min-w-24 items-center justify-center px-2 py-1 opacity-85"
            >
              {content}
            </div>
          );
        })}
      </div>
    </BiolinkSectionFrame>
  );
}

export function SocialFeedWidgetRenderer({
  widget,
  appearance,
  variant,
}: WidgetRendererProps<ShowcaseWidget>) {
  if (variant === 'editor') {
    return <ShowcaseEditorPreview widget={widget} />;
  }

  const items = visibleItems(widget.items);
  return (
    <BiolinkSectionFrame
      appearance={appearance}
      title={widget.config.title}
      description={widget.config.description}
      config={widget.config.section}
    >
      <div
        className={cn(
          (widget.config.layout ?? 'line') === 'grid'
            ? 'grid gap-3 @2xl:grid-cols-2'
            : 'divide-y divide-current/15',
        )}
      >
        {items.map(item => {
          const metrics = item.payload ?? {};
          return (
            <article
              key={item.id}
              className={cn(
                'grid gap-4',
                (widget.config.layout ?? 'line') === 'grid'
                  ? 'biolink-surface-item rounded-xl border p-4'
                  : 'py-4 first:pt-0 last:pb-0 @2xl:grid-cols-[minmax(0,1fr)_10rem]',
              )}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold wrap-break-word">
                  {item.title}
                </p>
                {item.description ? (
                  <p className="mt-2 text-sm leading-5 wrap-break-word text-current/80">
                    {item.description}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-current/65">
                  {typeof metrics.network === 'string' ? (
                    <span>{metrics.network}</span>
                  ) : null}
                  {typeof metrics.likes === 'number' ? (
                    <span className="inline-flex items-center gap-1">
                      <HeartIcon className="size-3.5" />
                      {metrics.likes}
                    </span>
                  ) : null}
                  {typeof metrics.comments === 'number' ? (
                    <span className="inline-flex items-center gap-1">
                      <MessageCircleIcon className="size-3.5" />
                      {metrics.comments}
                    </span>
                  ) : null}
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 items-center gap-1 font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                    >
                      <Trans message="View post" />
                      <ArrowRightIcon className="size-3.5" />
                    </a>
                  ) : null}
                </div>
              </div>
              {item.image ? (
                <SafeImage
                  src={item.image}
                  alt=""
                  className="aspect-video w-full rounded-xl object-cover @2xl:aspect-square"
                />
              ) : null}
            </article>
          );
        })}
      </div>
    </BiolinkSectionFrame>
  );
}

function ShowcaseEditorPreview({widget}: {widget: ShowcaseWidget}) {
  const items = visibleItems(widget.items);
  const previewImage =
    widget.config.image || items.find(item => item.image)?.image;
  const body = widget.config.body
    ?.replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const Icon = widgetCopy[widget.type].icon;

  return (
    <div className="flex min-w-0 items-center gap-3 overflow-hidden text-sm">
      {previewImage ? (
        <SafeImage
          src={previewImage}
          alt=""
          className="size-11 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-5" />
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">
          {widget.config.title || widgetCopy[widget.type].defaultTitle}
        </p>
        <p className="truncate text-muted-foreground">
          {widget.config.description || body || (
            <>
              {items.length} <Trans message="items" />
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function PublicCta({
  className,
  href,
  label,
}: {
  className?: string;
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noreferrer' : undefined}
      className={cn(
        'biolink-btn-custom inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current',
        className,
      )}
    >
      {label}
      <ArrowRightIcon className="size-4" />
    </a>
  );
}

function SafeImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const {trans} = useTrans();
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        className={cn(
          'flex min-h-20 items-center justify-center rounded-xl bg-current/5 text-current/60',
          className,
        )}
        role="img"
        aria-label={alt || trans(message('Image unavailable'))}
      >
        <ImageIcon className="size-5" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function visibleItems(items?: BiolinkWidgetItem[]) {
  return (items ?? []).filter(item => item.active !== false);
}

function defaultItemType(type: ShowcaseWidgetType): string {
  return {
    spotlight: 'benefit',
    ctaBanner: 'item',
    logoCloud: 'logo',
    socialFeed: 'post',
  }[type];
}

function itemHelp(type: ShowcaseWidgetType) {
  if (type === 'spotlight') {
    return <Trans message="Add short benefits or supporting facts." />;
  }
  if (type === 'logoCloud') {
    return <Trans message="Each item can have a logo, name and link." />;
  }
  return (
    <Trans message="Add posts manually and link to the original network." />
  );
}

const socialNetworkOptions = [
  {value: 'instagram', label: 'Instagram'},
  {value: 'tiktok', label: 'TikTok'},
  {value: 'youtube', label: 'YouTube'},
  {value: 'facebook', label: 'Facebook'},
  {value: 'linkedin', label: 'LinkedIn'},
  {value: 'x', label: 'X'},
];

function layoutOptions(type: ShowcaseWidgetType) {
  if (type === 'ctaBanner') {
    return [
      {value: 'compact', label: <Trans message="Compact" />},
      {value: 'split', label: <Trans message="Split" />},
      {value: 'background', label: <Trans message="Background image" />},
    ];
  }
  if (type === 'logoCloud') {
    return [
      {value: 'strip', label: <Trans message="Manual strip" />},
      {value: 'grid', label: <Trans message="Grid" />},
    ];
  }
  return [
    {value: 'line', label: <Trans message="Feed list" />},
    {value: 'grid', label: <Trans message="Grid" />},
  ];
}

function normalizeShowcaseItem(
  type: ShowcaseWidgetType,
  item: FormValue['items'][number],
  index: number,
) {
  const payload = {...(item.payload ?? {})};
  if (type === 'socialFeed') {
    for (const key of ['likes', 'comments'] as const) {
      const value = payload[key] as unknown;
      if (value === '' || value === undefined || value === null) {
        delete payload[key];
      } else {
        payload[key] = Number(value);
      }
    }
  }

  return {
    ...item,
    type: item.type || defaultItemType(type),
    active: item.active !== false,
    payload,
    sort_order: index,
  };
}

function compactConfig(
  type: ShowcaseWidgetType,
  config: ShowcaseConfig,
): ShowcaseConfig {
  const normalized = showcaseConfigKeys[type].reduce((result, key) => {
    const value = config[key];
    if (value !== undefined) {
      result[key] = value as never;
    }
    return result;
  }, {} as ShowcaseConfig);

  if (config.section) {
    normalized.section = Object.fromEntries(
      Object.entries(config.section).filter(
        ([, value]) => value !== '' && value !== null,
      ),
    );
  }

  if (config.blueprintKey !== undefined) {
    normalized.blueprintKey = config.blueprintKey;
  }

  return normalized;
}
