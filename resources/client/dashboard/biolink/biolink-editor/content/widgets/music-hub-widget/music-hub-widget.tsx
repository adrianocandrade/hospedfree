import {getBiolinkButtonStyle} from '@app/dashboard/biolink/biolink-editor/appearance/biolink-button-style-utils';
import {BiolinkWidgetSurface} from '@app/dashboard/biolink/biolink-editor/content/widgets/biolink-widget-surface';
import {SpotifyEmbed} from '@app/dashboard/biolink/biolink-editor/content/widgets/spotify-widget/spotify-widget-renderer';
import {useCrupdateBiolinkWidget} from '@app/dashboard/biolink/biolink-editor/content/widgets/use-crupdate-biolink-widget';
import {WidgetRendererProps} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-renderer-props';
import {WidgetFormActionButtons} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-form-action-buttons';
import {getMetadataFromUrl} from '@app/gen/links';
import {BiolinkWidget} from '@app/gen/schemas/biolink-widget';
import {BiolinkWidgetItem} from '@app/gen/schemas/biolink-widget-item';
import {FileUploadProvider} from '@common/uploads/uploader/file-upload-provider';
import {ImageSelector} from '@common/uploads/components/image-selector';
import {UploadType} from '@app/site-config';
import {onFormQueryError} from '@common/http/errors/on-form-query-error';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {useControlledState} from '@react-stately/utils';
import {Button} from '@shadcn/button/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@shadcn/collapsible/collapsible';
import {Dialog} from '@shadcn/dialog/dialog';
import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Input} from '@shadcn/forms/input/input';
import {Textarea} from '@shadcn/forms/textarea/textarea';
import {Spinner} from '@shadcn/spinner/spinner';
import {
  SiApplemusic,
  SiAudiomack,
  SiBandcamp,
  SiDeezer,
  SiMixcloud,
  SiSoundcloud,
  SiSpotify,
  SiTidal,
  SiYoutube,
  SiYoutubemusic,
} from '@icons-pack/react-simple-icons';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {cn} from '@ui/utils/cn';
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  GripVerticalIcon,
  LinkIcon,
  Music2Icon,
  PlusIcon,
  SparklesIcon,
  StoreIcon,
  Trash2Icon,
} from 'lucide-react';
import {ReactElement, ReactNode, useEffect, useRef, useState} from 'react';
import {UseFormReturn, useFieldArray, useForm, useWatch} from 'react-hook-form';

const musicReleaseTypes = [
  'song',
  'playlist',
  'album',
  'podcast',
  'other',
] as const;
export type MusicReleaseType = (typeof musicReleaseTypes)[number];

const musicServiceTypes = [
  'spotify',
  'appleMusic',
  'youtubeMusic',
  'youtube',
  'deezer',
  'soundcloud',
  'bandcamp',
  'mixcloud',
  'tidal',
  'amazonMusic',
  'audiomack',
  'pandora',
  'yandexMusic',
  'napster',
  'itunes',
  'custom',
] as const;
export type MusicServiceType = (typeof musicServiceTypes)[number];

type MusicHubConfig = {
  title?: string;
  description?: string;
  coverImage?: string;
  spotifyPresentation?: 'embed' | 'link';
  itemStyle?: Record<string, unknown>;
};

type MusicHubRelease = {
  type?: MusicReleaseType | string;
  title?: string;
  description?: string;
  image?: string;
  active?: boolean;
  payload?: Record<string, unknown>;
};

export type MusicHubWidget = Omit<
  BiolinkWidget,
  'config' | 'items' | 'type'
> & {
  type: 'podcastMusic';
  config: MusicHubConfig;
  items?: MusicHubRelease[] | BiolinkWidgetItem[];
};

export type LegacySpotifyWidget = Omit<
  BiolinkWidget,
  'config' | 'items' | 'type'
> & {
  type: 'spotify';
  config: {
    url: string;
    type?: string;
    spotifyPresentation?: 'embed' | 'link';
  };
};

type MusicHubCompatibleWidget = MusicHubWidget | LegacySpotifyWidget;

type MusicServiceForm = {
  type: MusicServiceType;
  title: string;
  url: string;
  active: boolean;
};

type MusicReleaseForm = {
  type: MusicReleaseType;
  title: string;
  description: string;
  image: string;
  active: boolean;
  spotifyPresentation: 'embed' | 'link';
  services: MusicServiceForm[];
};

type AdvancedFields = {
  password?: string | null;
  activates_at?: string | null;
  expires_at?: string | null;
  utm?: Record<string, string>;
  utm_custom?: {key: string; value: string}[];
  pixels?: ({id: number; name?: string} | number)[];
  rules?: {type: string; key?: string | null; value?: string | null}[];
};

type MusicHubFormValues = AdvancedFields & {
  config: {
    title: string;
    description: string;
  };
  releases: MusicReleaseForm[];
};

type MusicMetadata = Awaited<ReturnType<typeof getMetadataFromUrl>>;

type Props = {
  widget?: MusicHubCompatibleWidget;
  children?: ReactElement<typeof Dialog.Trigger>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialConfig?: Record<string, unknown>;
};

export function MusicHubWidgetDialog({
  children,
  open: propsOpen,
  onOpenChange: propsOnOpenChange,
  widget,
  initialConfig,
}: Props) {
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
        <MusicHubWidgetDialogContent
          widget={widget}
          initialConfig={initialConfig}
          onClose={() => setOpen(false)}
        />
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function MusicHubWidgetDialogContent({
  widget,
  initialConfig,
  onClose,
}: {
  widget?: MusicHubCompatibleWidget;
  initialConfig?: Record<string, unknown>;
  onClose: () => void;
}) {
  const {biolinkId} = useRequiredParams(['biolinkId']);
  const form = useForm<MusicHubFormValues>({
    defaultValues: {
      config: {
        title:
          widget?.type === 'podcastMusic' ? (widget.config.title ?? '') : '',
        description:
          widget?.type === 'podcastMusic'
            ? (widget.config.description ?? '')
            : '',
      },
      releases: widget
        ? normalizeMusicReleases(widget)
        : [
            emptyReleaseWithService(
              toMusicServiceType(
                typeof initialConfig?.presetProvider === 'string'
                  ? initialConfig.presetProvider
                  : 'spotify',
              ),
            ),
          ],
      ...advancedDefaultValues(widget),
    },
  });
  const {fields, append, remove, move} = useFieldArray({
    control: form.control,
    name: 'releases',
  });
  const releases = useWatch({control: form.control, name: 'releases'}) ?? [];
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const crupdateWidget = useCrupdateBiolinkWidget(biolinkId, form, widget?.id);
  const {trans} = useTrans();

  const submit = (values: MusicHubFormValues) => {
    crupdateWidget.mutate(
      {
        ...advancedPayload(values),
        type: 'podcastMusic',
        config: {
          title: values.config.title,
          description: values.config.description || '',
          spotifyPresentation: 'embed',
        },
        items: values.releases.map(release => {
          const services = release.services
            .map(service => ({
              ...service,
              url: service.url.trim(),
            }))
            .filter(service => service.url);
          const hasSpotify = services.some(
            service => service.type === 'spotify',
          );

          return {
            type: release.type,
            title: release.title || fallbackReleaseTitle(release, services[0]),
            description: release.description || '',
            image: release.image || '',
            active: release.active,
            payload: {
              spotifyPresentation: hasSpotify
                ? release.spotifyPresentation
                : 'link',
              services: services.map((service, serviceIndex) => ({
                type: service.type,
                title: service.title || '',
                url: service.url,
                active: service.active,
                sort_order: serviceIndex,
              })),
            },
          };
        }),
      },
      {
        onSuccess: () => onClose(),
        onError: error => onFormQueryError(error, form),
      },
    );
  };

  return (
    <FileUploadProvider>
      <HookForm.Root form={form} onSubmit={submit}>
        <Dialog.Content className="sm:max-w-6xl">
          <Dialog.Header>
            <Dialog.Title>
              <Music2Icon />
              <Trans message="Music Hub" />
            </Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <Field.Group>
              <div className="grid gap-4 sm:grid-cols-2">
                <HookForm.Field name="config.title">
                  <Field.Label>
                    <Trans message="Hub title" />
                  </Field.Label>
                  <Input
                    placeholder={trans({message: 'Optional title'})}
                    autoFocus
                  />
                  <Field.Error />
                </HookForm.Field>
                <HookForm.Field name="config.description">
                  <Field.Label>
                    <Trans message="Hub description" />
                  </Field.Label>
                  <Input
                    placeholder={trans({message: 'Optional introduction'})}
                  />
                  <Field.Error />
                </HookForm.Field>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">
                      <Trans message="Releases" />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <Trans message="Add songs, playlists and albums with their cover, description and listening services." />
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append(emptyRelease())}
                  >
                    <PlusIcon />
                    <Trans message="Add release" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <ReleaseEditor
                      key={field.id}
                      form={form}
                      index={index}
                      release={releases[index] ?? field}
                      onDragStart={event => {
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData('text/plain', String(index));
                        setDraggedIndex(index);
                      }}
                      onDragOver={event => event.preventDefault()}
                      onDrop={() => {
                        if (draggedIndex !== null && draggedIndex !== index) {
                          move(draggedIndex, index);
                        }
                        setDraggedIndex(null);
                      }}
                      onDragEnd={() => setDraggedIndex(null)}
                      onMoveUp={() => index > 0 && move(index, index - 1)}
                      onMoveDown={() =>
                        index < fields.length - 1 && move(index, index + 1)
                      }
                      onRemove={() => remove(index)}
                    />
                  ))}
                </div>
              </div>
            </Field.Group>
          </Dialog.Body>
          <Dialog.Footer className="py-4 sm:justify-between" variant="muted">
            <WidgetFormActionButtons form={form} widget={widget} />
            <div className="flex items-center justify-end gap-2">
              <Dialog.CloseButton>
                <Trans message="Cancel" />
              </Dialog.CloseButton>
              <Button
                type="submit"
                disabled={crupdateWidget.isPending || !form.formState.isDirty}
              >
                {widget ? <Trans message="Update" /> : <Trans message="Add" />}
              </Button>
            </div>
          </Dialog.Footer>
        </Dialog.Content>
      </HookForm.Root>
    </FileUploadProvider>
  );
}

function ReleaseEditor({
  form,
  index,
  release,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  form: UseFormReturn<MusicHubFormValues>;
  index: number;
  release: MusicReleaseForm;
  onDragStart: (event: React.DragEvent<HTMLButtonElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const {trans} = useTrans();
  const serviceArray = useFieldArray({
    control: form.control,
    name: `releases.${index}.services` as never,
  });
  const serviceValues =
    (useWatch({
      control: form.control,
      name: `releases.${index}.services` as never,
    }) as MusicServiceForm[] | undefined) ?? [];
  const [draggedServiceIndex, setDraggedServiceIndex] = useState<number | null>(
    null,
  );
  const primaryService = serviceValues[0] ?? emptyService('spotify');
  const hasSpotifyService = serviceValues.some(
    service => service?.type === 'spotify' && !!service.url,
  );
  const metadata = useReleaseMetadataSync({
    form,
    index,
    release,
    service: primaryService,
  });
  const releaseTitle =
    release.title || fallbackReleaseTitle(release, primaryService);

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className="space-y-4 rounded-xl border border-border bg-muted/20 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            draggable
            onDragStart={onDragStart}
            aria-label={trans({message: 'Drag to reorder release'})}
            className="cursor-grab touch-none text-muted-foreground outline-none focus-visible:ring active:cursor-grabbing"
          >
            <GripVerticalIcon aria-hidden className="size-5" />
          </button>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">
              {releaseTitle || <Trans message="Untitled release" />}
            </div>
            <div className="text-xs text-muted-foreground">
              {releaseTypeName(release.type)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9"
            onClick={onMoveUp}
            aria-label={trans({message: 'Move release up'})}
          >
            <ArrowUpIcon />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9"
            onClick={onMoveDown}
            aria-label={trans({message: 'Move release down'})}
          >
            <ArrowDownIcon />
          </Button>
          <Button
            type="button"
            variant="outline"
            color="danger"
            size="icon"
            className="size-9"
            onClick={onRemove}
            aria-label={trans({message: 'Remove release'})}
          >
            <Trash2Icon />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
        <PrimaryMusicLinkEditor
          form={form}
          releaseIndex={index}
          service={primaryService}
        />
        <ReleaseMetadataPreview
          release={release}
          service={primaryService}
          isLoading={metadata.isLoading}
          hasFetched={metadata.hasFetched}
          hasError={metadata.hasError}
        />
      </div>

      {hasSpotifyService ? (
        <HookForm.Field name={`releases.${index}.spotifyPresentation`}>
          <Field.Label>
            <Trans message="Spotify presentation" />
          </Field.Label>
          <div className="grid gap-2 sm:grid-cols-2">
            <PresentationOption
              value="embed"
              selected={release.spotifyPresentation === 'embed'}
              onSelect={() =>
                form.setValue(
                  `releases.${index}.spotifyPresentation`,
                  'embed',
                  {
                    shouldDirty: true,
                    shouldValidate: true,
                  },
                )
              }
              title={<Trans message="Spotify player" />}
              description={
                <Trans message="Dark player with artwork and controls" />
              }
            />
            <PresentationOption
              value="link"
              selected={release.spotifyPresentation === 'link'}
              onSelect={() =>
                form.setValue(`releases.${index}.spotifyPresentation`, 'link', {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              title={<Trans message="Service button" />}
              description={
                <Trans message="Show Spotify with the other services" />
              }
            />
          </div>
          <Field.Error />
        </HookForm.Field>
      ) : null}

      <Collapsible className="group/details rounded-lg border bg-background/60">
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium outline-none focus-visible:ring">
          <span className="flex min-w-0 items-center gap-2">
            <SparklesIcon className="size-4 text-muted-foreground" />
            <Trans message="Adjust imported details" />
          </span>
          <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-data-open/details:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 pb-3">
          <div className="grid gap-4 pt-2 lg:grid-cols-[auto_minmax(0,1fr)]">
            <ImageSelector.Square
              className="size-28 shrink-0"
              cropDimensions={{width: 600, height: 600}}
              placeholderVariant="icon"
              uploadType={UploadType.linkImages}
              value={release.image}
              onChange={value =>
                form.setValue(`releases.${index}.image`, value ?? '', {
                  shouldDirty: true,
                })
              }
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <HookForm.Field name={`releases.${index}.title`}>
                <Field.Label>
                  <Trans message="Release title" />
                </Field.Label>
                <Input
                  placeholder={trans({message: 'Song or playlist name'})}
                />
                <Field.Error />
              </HookForm.Field>
              <HookForm.Field name={`releases.${index}.type`}>
                <Field.Label>
                  <Trans message="Release type" />
                </Field.Label>
                <select
                  {...form.register(`releases.${index}.type`)}
                  defaultValue={release.type}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring"
                >
                  {musicReleaseTypes.map(type => (
                    <option key={type} value={type}>
                      {releaseTypeName(type)}
                    </option>
                  ))}
                </select>
                <Field.Error />
              </HookForm.Field>
              <HookForm.Field name={`releases.${index}.description`}>
                <Field.Label>
                  <Trans message="Description or artist" />
                </Field.Label>
                <Textarea rows={2} className="sm:col-span-2" />
                <Field.Error />
              </HookForm.Field>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="space-y-3 border-t pt-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-sm font-medium">
              <Trans message="Listening services" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              <Trans message="Add more places where this release is available." />
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => serviceArray.append(emptyService())}
          >
            <PlusIcon />
            <Trans message="Add another service" />
          </Button>
        </div>
        <div className="space-y-3">
          {serviceArray.fields.slice(1).map((field, offset) => {
            const serviceIndex = offset + 1;

            return (
              <MusicServiceEditor
                key={field.id}
                form={form}
                releaseIndex={index}
                serviceIndex={serviceIndex}
                service={serviceValues[serviceIndex] ?? emptyService()}
                canMoveUp={serviceIndex > 1}
                canMoveDown={serviceIndex < serviceArray.fields.length - 1}
                isDuplicate={type =>
                  type !== 'custom' &&
                  serviceValues.some(
                    (service, currentIndex) =>
                      currentIndex !== serviceIndex && service?.type === type,
                  )
                }
                onDragStart={event => {
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData(
                    'text/plain',
                    String(serviceIndex),
                  );
                  setDraggedServiceIndex(serviceIndex);
                }}
                onDragOver={event => event.preventDefault()}
                onDrop={() => {
                  if (
                    draggedServiceIndex !== null &&
                    draggedServiceIndex !== serviceIndex &&
                    draggedServiceIndex > 0
                  ) {
                    serviceArray.move(draggedServiceIndex, serviceIndex);
                  }
                  setDraggedServiceIndex(null);
                }}
                onDragEnd={() => setDraggedServiceIndex(null)}
                onMoveUp={() =>
                  serviceIndex > 1 &&
                  serviceArray.move(serviceIndex, serviceIndex - 1)
                }
                onMoveDown={() =>
                  serviceIndex < serviceArray.fields.length - 1 &&
                  serviceArray.move(serviceIndex, serviceIndex + 1)
                }
                onRemove={() => serviceArray.remove(serviceIndex)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PrimaryMusicLinkEditor({
  form,
  releaseIndex,
  service,
}: {
  form: UseFormReturn<MusicHubFormValues>;
  releaseIndex: number;
  service: MusicServiceForm;
}) {
  const {trans} = useTrans();
  const servicePath = `releases.${releaseIndex}.services.0` as const;
  const isCustom = service.type === 'custom';

  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="grid gap-3 sm:grid-cols-[minmax(10rem,0.45fr)_minmax(0,1fr)]">
        <label className="block min-w-0 text-sm">
          <span className="mb-1.5 block font-medium">
            <Trans message="Service" />
          </span>
          <select
            aria-label={trans({message: 'Music service'})}
            value={service.type}
            onChange={event => {
              const type = event.target.value as MusicServiceType;
              form.setValue(`${servicePath}.type`, type, {
                shouldDirty: true,
                shouldValidate: true,
              });
              if (type !== 'custom') {
                form.setValue(`${servicePath}.title`, '', {
                  shouldDirty: true,
                });
              }
            }}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring"
          >
            {musicServiceTypes.map(type => (
              <option key={type} value={type}>
                {musicServiceName(type)}
              </option>
            ))}
          </select>
        </label>
        <HookForm.Field name={`${servicePath}.url`}>
          <Field.Label>
            <Trans message="Music link" />
          </Field.Label>
          <Input
            required
            type="url"
            placeholder="https://open.spotify.com/track/..."
            inputMode="url"
          />
          <Field.Description>
            <Trans message="Paste a song, album, playlist or podcast link. Cover, title and artist are imported automatically." />
          </Field.Description>
          <Field.Error />
        </HookForm.Field>
        {isCustom ? (
          <HookForm.Field name={`${servicePath}.title`}>
            <Field.Label>
              <Trans message="Service name" />
            </Field.Label>
            <Input
              required
              placeholder={trans({message: 'Example: Bandcamp'})}
            />
            <Field.Error />
          </HookForm.Field>
        ) : null}
      </div>
    </div>
  );
}

function ReleaseMetadataPreview({
  release,
  service,
  isLoading,
  hasFetched,
  hasError,
}: {
  release: MusicReleaseForm;
  service: MusicServiceForm;
  isLoading: boolean;
  hasFetched: boolean;
  hasError: boolean;
}) {
  const title = release.title || fallbackReleaseTitle(release, service);
  const description = release.description || null;

  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex min-w-0 gap-3">
        {release.image ? (
          <img
            src={release.image}
            alt={title}
            className="size-16 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <span className="grid size-16 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
            <Music2Icon className="size-5" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{title}</div>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span>{releaseTypeName(release.type)}</span>
            <span aria-hidden>&middot;</span>
            <span className="truncate">{musicServiceName(service.type)}</span>
          </div>
          {description ? (
            <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {description}
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        {isLoading ? (
          <Spinner className="size-3.5" />
        ) : (
          <SparklesIcon className="size-3.5" />
        )}
        {isLoading ? (
          <Trans message="Fetching music details" />
        ) : hasError ? (
          <Trans message="Could not import details. You can adjust them below." />
        ) : hasFetched ? (
          <Trans message="Details imported from the music link." />
        ) : (
          <Trans message="Paste a link to import cover, title and artist." />
        )}
      </div>
    </div>
  );
}

function useReleaseMetadataSync({
  form,
  index,
  service,
}: {
  form: UseFormReturn<MusicHubFormValues>;
  index: number;
  release: MusicReleaseForm;
  service: MusicServiceForm;
}) {
  const [status, setStatus] = useState({
    isLoading: false,
    hasFetched: false,
    hasError: false,
  });
  const syncedMetadata = useRef<{
    title?: string;
    description?: string;
    image?: string;
    type?: MusicReleaseType;
  }>({});
  const url = service.url.trim();

  useEffect(() => {
    const detectedServiceType = inferMusicServiceType(url);
    const serviceType = detectedServiceType ?? service.type;
    if (detectedServiceType && detectedServiceType !== service.type) {
      form.setValue(`releases.${index}.services.0.type`, detectedServiceType, {
        shouldDirty: true,
        shouldValidate: true,
      });
      if (detectedServiceType !== 'custom') {
        form.setValue(`releases.${index}.services.0.title`, '', {
          shouldDirty: true,
        });
      }
    }

    if (!isValidHttpUrl(url)) {
      setStatus(current => ({
        ...current,
        isLoading: false,
        hasError: false,
      }));
      return;
    }

    const abortController = new AbortController();
    const timeout = window.setTimeout(() => {
      setStatus(current => ({
        isLoading: true,
        hasFetched: current.hasFetched,
        hasError: false,
      }));

      getMetadataFromUrl(
        {url},
        {
          signal: abortController.signal,
        },
      )
        .then(metadata => {
          const hasMetadata = applyMusicMetadataToRelease({
            form,
            index,
            metadata,
            serviceType,
            syncedMetadata: syncedMetadata.current,
            url,
          });

          setStatus({
            isLoading: false,
            hasFetched: hasMetadata,
            hasError: !hasMetadata,
          });
        })
        .catch(error => {
          if (isRequestCanceled(error)) {
            return;
          }
          setStatus({
            isLoading: false,
            hasFetched: false,
            hasError: true,
          });
        });
    }, 500);

    return () => {
      window.clearTimeout(timeout);
      abortController.abort();
    };
  }, [form, index, service.type, url]);

  return status;
}

function applyMusicMetadataToRelease({
  form,
  index,
  metadata,
  serviceType,
  syncedMetadata,
  url,
}: {
  form: UseFormReturn<MusicHubFormValues>;
  index: number;
  metadata: MusicMetadata;
  serviceType: MusicServiceType;
  syncedMetadata: {
    title?: string;
    description?: string;
    image?: string;
    type?: MusicReleaseType;
  };
  url: string;
}): boolean {
  const title = cleanMusicMetadataTitle(
    metadata.name,
    serviceType,
    metadata.description,
  );
  const description = cleanMusicMetadataDescription(
    metadata.description,
    title,
    serviceType,
  );
  const image = cleanMusicMetadataImage(metadata.image);
  const releaseType = inferReleaseTypeFromUrl(url, serviceType);

  if (title) {
    const currentTitle = form.getValues(`releases.${index}.title`);
    if (!currentTitle || currentTitle === syncedMetadata.title) {
      form.setValue(`releases.${index}.title`, title, {
        shouldDirty: true,
        shouldValidate: true,
      });
      syncedMetadata.title = title;
    }
  }

  if (description) {
    const currentDescription = form.getValues(`releases.${index}.description`);
    if (
      !currentDescription ||
      currentDescription === syncedMetadata.description
    ) {
      form.setValue(`releases.${index}.description`, description, {
        shouldDirty: true,
      });
      syncedMetadata.description = description;
    }
  }

  if (image) {
    const currentImage = form.getValues(`releases.${index}.image`);
    if (!currentImage || currentImage === syncedMetadata.image) {
      form.setValue(`releases.${index}.image`, image, {shouldDirty: true});
      syncedMetadata.image = image;
    }
  }

  if (releaseType) {
    const currentType = form.getValues(`releases.${index}.type`);
    if (
      !currentType ||
      currentType === 'song' ||
      currentType === syncedMetadata.type
    ) {
      form.setValue(`releases.${index}.type`, releaseType, {
        shouldDirty: true,
        shouldValidate: true,
      });
      syncedMetadata.type = releaseType;
    }
  }

  return Boolean(title || description || image);
}

function MusicServiceEditor({
  form,
  releaseIndex,
  serviceIndex,
  service,
  canMoveUp = true,
  canMoveDown = true,
  isDuplicate,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  form: UseFormReturn<MusicHubFormValues>;
  releaseIndex: number;
  serviceIndex: number;
  service: MusicServiceForm;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  isDuplicate: (type: MusicServiceType) => boolean;
  onDragStart: (event: React.DragEvent<HTMLButtonElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const {trans} = useTrans();
  const servicePath =
    `releases.${releaseIndex}.services.${serviceIndex}` as const;
  const isCustom = service.type === 'custom';

  useEffect(() => {
    const detectedServiceType = inferMusicServiceType(service.url);
    if (
      detectedServiceType &&
      detectedServiceType !== service.type &&
      !isDuplicate(detectedServiceType)
    ) {
      form.setValue(`${servicePath}.type`, detectedServiceType, {
        shouldDirty: true,
        shouldValidate: true,
      });
      if (detectedServiceType !== 'custom') {
        form.setValue(`${servicePath}.title`, '', {shouldDirty: true});
      }
    }
  }, [form, isDuplicate, service.type, service.url, servicePath]);

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className="grid gap-3 rounded-lg border bg-background/60 p-3 sm:grid-cols-[auto_minmax(10rem,0.7fr)_minmax(0,1fr)_auto] sm:items-end"
    >
      <div className="flex items-center gap-2 self-center">
        <button
          type="button"
          draggable
          onDragStart={onDragStart}
          aria-label={trans({message: 'Drag to reorder service'})}
          className="cursor-grab touch-none text-muted-foreground outline-none focus-visible:ring active:cursor-grabbing"
        >
          <GripVerticalIcon aria-hidden className="size-4 shrink-0" />
        </button>
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary [&_svg]:size-4">
          {musicServiceIcon(service.type)}
        </span>
      </div>
      <label className="block min-w-0 text-sm">
        <span className="mb-1.5 block font-medium">
          <Trans message="Service" />
        </span>
        <select
          aria-label={trans({message: 'Music service'})}
          value={service.type}
          onChange={event => {
            const type = event.target.value as MusicServiceType;
            form.setValue(`${servicePath}.type`, type, {
              shouldDirty: true,
              shouldValidate: true,
            });
            if (type !== 'custom') {
              form.setValue(`${servicePath}.title`, '', {shouldDirty: true});
            }
          }}
          className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring"
        >
          {musicServiceTypes.map(type => (
            <option
              key={type}
              value={type}
              disabled={type !== service.type && isDuplicate(type)}
            >
              {musicServiceName(type)}
            </option>
          ))}
        </select>
      </label>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        {isCustom ? (
          <HookForm.Field name={`${servicePath}.title`}>
            <Field.Label>
              <Trans message="Service name" />
            </Field.Label>
            <Input
              required
              placeholder={trans({message: 'Example: Bandcamp'})}
            />
            <Field.Error />
          </HookForm.Field>
        ) : null}
        <HookForm.Field
          name={`${servicePath}.url`}
          className={cn(!isCustom && 'sm:col-span-2')}
        >
          <Field.Label>
            <Trans message="HTTPS URL" />
          </Field.Label>
          <Input required type="url" placeholder="https://" inputMode="url" />
          <Field.Error />
        </HookForm.Field>
      </div>
      <div className="flex items-center gap-1 sm:pb-0.5">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9"
          disabled={!canMoveUp}
          onClick={onMoveUp}
          aria-label={trans({message: 'Move service up'})}
        >
          <ArrowUpIcon />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9"
          disabled={!canMoveDown}
          onClick={onMoveDown}
          aria-label={trans({message: 'Move service down'})}
        >
          <ArrowDownIcon />
        </Button>
        <Button
          type="button"
          variant="outline"
          color="danger"
          size="icon"
          className="size-9"
          onClick={onRemove}
          aria-label={trans({message: 'Remove service'})}
        >
          <Trash2Icon />
        </Button>
      </div>
    </div>
  );
}

function PresentationOption({
  value,
  selected,
  onSelect,
  title,
  description,
}: {
  value: 'embed' | 'link';
  selected: boolean;
  onSelect: () => void;
  title: ReactNode;
  description: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'min-h-20 rounded-lg border px-3 py-3 text-left transition-colors outline-none focus-visible:ring',
        selected
          ? 'border-primary bg-primary/10'
          : 'border-border bg-background hover:bg-muted/50',
      )}
      value={value}
    >
      <span className="block text-sm font-semibold">{title}</span>
      <span className="mt-1 block text-xs text-muted-foreground">
        {description}
      </span>
    </button>
  );
}

export function MusicHubWidgetRenderer({
  widget,
  variant,
  appearance,
}: WidgetRendererProps<MusicHubCompatibleWidget>) {
  const releases = normalizeMusicReleases(widget);

  if (variant === 'editor') {
    return (
      <div className="text-sm text-muted-foreground">
        <div>
          {widget.type === 'podcastMusic' ? (
            widget.config.title || <Trans message="Music Hub" />
          ) : (
            <Trans message="Legacy Spotify release" />
          )}
        </div>
        <div>
          {releases.length} <Trans message="releases" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {widget.type === 'podcastMusic' &&
      (widget.config.title || widget.config.description) ? (
        <div className="mb-5 px-1 text-center">
          {widget.config.title ? (
            <div className="text-base leading-5 font-semibold wrap-break-word">
              {widget.config.title}
            </div>
          ) : null}
          {widget.config.description ? (
            <div className="mt-1 text-sm leading-5 wrap-break-word opacity-80">
              {widget.config.description}
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="space-y-4">
        {releases.map((release, index) => (
          <MusicReleasePublicCard
            key={`${release.title}-${index}`}
            release={release}
            utm={widget.utm}
            appearance={appearance}
          />
        ))}
      </div>
    </div>
  );
}

function MusicReleasePublicCard({
  release,
  utm,
  appearance,
}: {
  release: MusicReleaseForm;
  utm?: string | null;
  appearance?: any;
}) {
  const spotify = release.services.find(
    service => service.type === 'spotify' && service.active && service.url,
  );
  const useSpotifyEmbed =
    release.spotifyPresentation === 'embed' && !!spotify?.url;
  const services = release.services.filter(
    service =>
      service.active &&
      service.url &&
      !(useSpotifyEmbed && service.type === 'spotify'),
  );

  return (
    <div className="flex flex-col gap-4">
      {useSpotifyEmbed && spotify?.url ? (
        <BiolinkWidgetSurface
          appearance={appearance}
          className="overflow-hidden !border-0 !bg-transparent !p-0"
          style={{borderWidth: 0, background: 'transparent'}}
        >
          <div
            className="w-full overflow-hidden bg-[#121212]"
            style={{borderRadius: 'inherit'}}
          >
            <SpotifyEmbed url={spotify.url} />
          </div>
        </BiolinkWidgetSurface>
      ) : null}

      {!useSpotifyEmbed || !spotify?.url || services.length > 0 ? (
        <BiolinkWidgetSurface appearance={appearance} className="p-2 sm:p-2">
          {!useSpotifyEmbed || !spotify?.url ? (
            <div className="flex min-w-0 items-center gap-3 text-left">
              {release.image ? (
                <img
                  src={release.image}
                  alt={release.title}
                  loading="lazy"
                  className="size-14 shrink-0 rounded-md object-cover shadow-sm"
                />
              ) : (
                <span className="grid size-14 shrink-0 place-items-center rounded-md bg-current/10">
                  <Music2Icon className="size-5 opacity-80" />
                </span>
              )}
              <div className="flex min-w-0 flex-1 flex-col justify-center">
                <div className="text-[15px] font-bold wrap-break-word">
                  {release.title || <Trans message="Untitled release" />}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium opacity-80">
                  {spotify ? <SiSpotify className="size-3" /> : null}
                  <span className="truncate">
                    {release.description
                      ? release.description
                      : releaseTypeName(release.type)}
                  </span>
                </div>
              </div>
              <div className="px-3 opacity-60">
                <svg
                  className="size-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <circle cx="12" cy="5" r="1.5" fill="currentColor" />
                  <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                  <circle cx="12" cy="19" r="1.5" fill="currentColor" />
                </svg>
              </div>
            </div>
          ) : null}

          {services.length ? (
            <div
              className={
                !useSpotifyEmbed || !spotify?.url
                  ? 'mt-3 flex flex-col gap-2'
                  : 'flex flex-col gap-2'
              }
            >
              {services.map((service, index) => (
                <MusicServiceLink
                  key={`${service.type}-${service.url}-${index}`}
                  service={service}
                  utm={utm}
                />
              ))}
            </div>
          ) : null}
        </BiolinkWidgetSurface>
      ) : null}
    </div>
  );
}

function MusicServiceLink({
  service,
  utm,
}: {
  service: MusicServiceForm;
  utm?: string | null;
}) {
  const href = applyUtmToUrl(service.url, utm);
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="biolink-public-action biolink-surface-item grid min-h-12 w-full grid-cols-[2rem_minmax(0,1fr)_1.25rem] items-center gap-3 rounded-lg border px-3 py-2 text-inherit no-underline outline-none focus-visible:ring"
      style={getBiolinkButtonStyle({
        btnConfig: undefined,
        override: {
          backgroundColor:
            'var(--biolink-surface-item-background, rgb(0 0 0 / 0.18))',
        },
      })}
    >
      <span className="grid size-8 place-items-center rounded-md bg-current/10 [&_svg]:size-4">
        {musicServiceIcon(service.type)}
      </span>
      <span className="min-w-0 text-left">
        <span className="block truncate text-sm font-semibold">
          {service.title || musicServiceName(service.type)}
        </span>
        {service.type !== 'custom' && service.title ? (
          <span className="mt-0.5 block truncate text-[10px] opacity-70">
            {musicServiceName(service.type)}
          </span>
        ) : null}
      </span>
      <ArrowRightIcon className="size-4 opacity-80" />
    </a>
  );
}

export function normalizeMusicReleases(
  widget?: MusicHubCompatibleWidget,
): MusicReleaseForm[] {
  if (!widget) return [emptyRelease()];

  if (widget.type === 'spotify') {
    return [
      {
        type: spotifyReleaseType(widget.config.type),
        title: 'Spotify release',
        description: '',
        image: '',
        active: true,
        spotifyPresentation: widget.config.spotifyPresentation ?? 'embed',
        services: widget.config.url
          ? [
              {
                type: 'spotify',
                title: '',
                url: widget.config.url,
                active: true,
              },
            ]
          : [],
      },
    ];
  }

  const items = widget.items ?? [];
  const canonical = items.filter(item => hasNestedServices(item));
  if (canonical.length) {
    const flat = items.filter(item => !hasNestedServices(item));
    const releases = canonical.map(item =>
      releaseFromItem(item, widget.config),
    );
    const legacyServices = flat
      .map(serviceFromItem)
      .filter(
        (service): service is MusicServiceForm =>
          service !== null && !!service.url,
      );
    if (legacyServices.length) {
      releases[0].services.push(...legacyServices);
    }
    return releases.length ? releases : [emptyRelease(widget.config)];
  }

  const services = items
    .map(serviceFromItem)
    .filter(
      (service): service is MusicServiceForm =>
        service !== null && !!service.url,
    );

  return [
    {
      type: 'song',
      title: widget.config.title ?? '',
      description: widget.config.description ?? '',
      image: widget.config.coverImage ?? '',
      active: true,
      spotifyPresentation: widget.config.spotifyPresentation ?? 'embed',
      services,
    },
  ];
}

function releaseFromItem(
  item: MusicHubRelease | BiolinkWidgetItem,
  config: MusicHubConfig,
): MusicReleaseForm {
  const payload = isRecord(item.payload) ? item.payload : {};
  const rawServices = Array.isArray(payload.services) ? payload.services : [];

  return {
    type: toReleaseType(item.type),
    title: item.title ?? '',
    description: item.description ?? '',
    image: item.image ?? '',
    active: isActive(item.active),
    spotifyPresentation:
      payload.spotifyPresentation === 'link' ||
      payload.spotifyPresentation === 'embed'
        ? payload.spotifyPresentation
        : (config.spotifyPresentation ?? 'embed'),
    services: rawServices
      .map(serviceFromValue)
      .filter((service): service is MusicServiceForm => !!service),
  };
}

function serviceFromItem(
  item: MusicHubRelease | BiolinkWidgetItem,
): MusicServiceForm | null {
  return serviceFromValue({
    type: item.type,
    title: item.title,
    url: 'url' in item ? item.url : undefined,
    active: item.active,
  });
}

function serviceFromValue(value: unknown): MusicServiceForm | null {
  if (!isRecord(value)) return null;
  const url = typeof value.url === 'string' ? value.url : '';
  const rawType = typeof value.type === 'string' ? value.type : 'custom';
  const type = toMusicServiceType(rawType);
  const title = typeof value.title === 'string' ? value.title : '';

  return {
    type,
    title,
    url,
    active: isActive(value.active),
  };
}

function hasNestedServices(item: MusicHubRelease | BiolinkWidgetItem): boolean {
  return isRecord(item.payload) && Array.isArray(item.payload.services);
}

function emptyRelease(config?: MusicHubConfig): MusicReleaseForm {
  return {
    type: 'song',
    title: '',
    description: '',
    image: '',
    active: true,
    spotifyPresentation: config?.spotifyPresentation ?? 'embed',
    services: [emptyService('spotify')],
  };
}

function emptyReleaseWithService(type: MusicServiceType): MusicReleaseForm {
  const release = emptyRelease();
  release.services = [emptyService(type)];
  release.spotifyPresentation = type === 'spotify' ? 'embed' : 'link';
  return release;
}

function emptyService(type: MusicServiceType = 'custom'): MusicServiceForm {
  return {type, title: '', url: '', active: true};
}

function fallbackReleaseTitle(
  release?: Pick<MusicReleaseForm, 'type'>,
  service?: MusicServiceForm,
): string {
  const serviceName = musicServiceNamePlain(service?.type ?? 'custom');
  if (serviceName) {
    return `${serviceName} release`;
  }

  switch (release?.type) {
    case 'album':
      return 'Album release';
    case 'playlist':
      return 'Playlist release';
    case 'podcast':
      return 'Podcast release';
    default:
      return 'Music release';
  }
}

function inferMusicServiceType(url: string): MusicServiceType | null {
  const parsed = parseHttpUrl(url);
  if (!parsed) return null;

  const host = normalizedHost(parsed);
  const path = parsed.pathname.toLowerCase();

  if (
    host === 'open.spotify.com' ||
    host === 'spotify.link' ||
    host.endsWith('.spotify.com')
  ) {
    return 'spotify';
  }
  if (host === 'music.apple.com') return 'appleMusic';
  if (host === 'itunes.apple.com') return 'itunes';
  if (host === 'music.youtube.com') return 'youtubeMusic';
  if (
    host === 'youtube.com' ||
    host === 'youtu.be' ||
    host.endsWith('.youtube.com')
  ) {
    return 'youtube';
  }
  if (host === 'soundcloud.com' || host.endsWith('.soundcloud.com')) {
    return 'soundcloud';
  }
  if (host === 'bandcamp.com' || host.endsWith('.bandcamp.com')) {
    return 'bandcamp';
  }
  if (host === 'mixcloud.com' || host.endsWith('.mixcloud.com')) {
    return 'mixcloud';
  }
  if (host === 'deezer.com' || host.endsWith('.deezer.com')) {
    return 'deezer';
  }
  if (host === 'deezer.page.link') return 'deezer';
  if (host === 'tidal.com' || host.endsWith('.tidal.com')) return 'tidal';
  if (host === 'audiomack.com' || host.endsWith('.audiomack.com')) {
    return 'audiomack';
  }
  if (host === 'pandora.com' || host.endsWith('.pandora.com')) {
    return 'pandora';
  }
  if (host.includes('napster.com')) return 'napster';
  if (host.includes('yandex.') && path.includes('/music')) {
    return 'yandexMusic';
  }
  if (host.includes('amazon.') && path.includes('/music')) {
    return 'amazonMusic';
  }

  return null;
}

function inferReleaseTypeFromUrl(
  url: string,
  serviceType: MusicServiceType,
): MusicReleaseType | null {
  const parsed = parseHttpUrl(url);
  if (!parsed) return null;

  const parts = parsed.pathname.toLowerCase().split('/').filter(Boolean);

  if (serviceType === 'spotify') {
    const spotifyType = parts.find(part =>
      ['track', 'album', 'playlist', 'episode', 'show', 'artist'].includes(
        part,
      ),
    );

    if (spotifyType === 'album') return 'album';
    if (spotifyType === 'playlist') return 'playlist';
    if (spotifyType === 'episode' || spotifyType === 'show') return 'podcast';
    if (spotifyType === 'artist') return 'other';
    return 'song';
  }

  if (serviceType === 'appleMusic' || serviceType === 'itunes') {
    if (parts.includes('playlist')) return 'playlist';
    if (parts.includes('album')) {
      return parsed.searchParams.has('i') ? 'song' : 'album';
    }
  }

  if (serviceType === 'youtubeMusic' || serviceType === 'youtube') {
    return parsed.searchParams.has('list') ? 'playlist' : 'song';
  }

  if (serviceType === 'soundcloud') {
    return parts.includes('sets') ? 'playlist' : 'song';
  }

  if (serviceType === 'deezer' || serviceType === 'tidal') {
    if (parts.includes('album')) return 'album';
    if (parts.includes('playlist')) return 'playlist';
    if (parts.includes('episode') || parts.includes('show')) return 'podcast';
    if (parts.includes('artist')) return 'other';
  }

  return 'song';
}

function cleanMusicMetadataTitle(
  title: MusicMetadata['name'],
  serviceType: MusicServiceType,
  description?: MusicMetadata['description'],
): string {
  let cleanTitle = typeof title === 'string' ? title.trim() : '';

  if (
    (!cleanTitle || cleanTitle.toLowerCase() === 'spotify') &&
    serviceType === 'spotify' &&
    typeof description === 'string'
  ) {
    const match = description.match(/(?:Listen to|Ouça)\s+(.*?)\s+on Spotify/i);
    if (match && match[1]) {
      cleanTitle = match[1];
    }
  }

  if (!cleanTitle) return '';

  cleanTitle = cleanTitle
    .replace(/\s+\|\s+(Spotify|SoundCloud|YouTube)$/i, '')
    .replace(/\s+-\s+song and lyrics by .+$/i, '')
    .replace(/\s+on Apple Music$/i, '')
    .trim();

  if (serviceType === 'youtube' || serviceType === 'youtubeMusic') {
    cleanTitle = cleanTitle.replace(/\s+-\s+YouTube$/i, '').trim();
  }

  return cleanTitle;
}

function cleanMusicMetadataDescription(
  description: MusicMetadata['description'],
  title: string,
  serviceType?: MusicServiceType,
): string {
  let cleanDescription =
    typeof description === 'string' ? description.trim() : '';

  if (!cleanDescription) {
    return '';
  }

  if (serviceType === 'spotify') {
    const parts = cleanDescription.split(/on Spotify\.?/i);
    if (parts.length > 1) {
      let artistPart = parts.pop() || '';
      artistPart = artistPart
        .replace(
          /^(?:Song|Música|Track|Album|Podcast|Episode)\s*[-–—]?\s*/i,
          '',
        )
        .trim();
      if (artistPart) return artistPart;
    }
  }

  if (cleanDescription === title) {
    return '';
  }

  return cleanDescription;
}

function cleanMusicMetadataImage(image: MusicMetadata['image']): string {
  return typeof image === 'string' && isValidHttpUrl(image) ? image : '';
}

function parseHttpUrl(url: string): URL | null {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function isValidHttpUrl(url: string): boolean {
  return !!parseHttpUrl(url);
}

function normalizedHost(url: URL): string {
  return url.hostname.toLowerCase().replace(/^www\./, '');
}

function isRequestCanceled(error: unknown): boolean {
  if (!isRecord(error)) return false;

  return error.name === 'CanceledError' || error.code === 'ERR_CANCELED';
}

function toReleaseType(type?: string | null): MusicReleaseType {
  return musicReleaseTypes.includes(type as MusicReleaseType)
    ? (type as MusicReleaseType)
    : 'song';
}

function spotifyReleaseType(type?: string): MusicReleaseType {
  if (type === 'playlist') return 'playlist';
  if (type === 'album') return 'album';
  if (type === 'episode' || type === 'show') return 'podcast';
  return 'song';
}

function toMusicServiceType(type?: string | null): MusicServiceType {
  if (type === 'musicLink') return 'custom';
  return musicServiceTypes.includes(type as MusicServiceType)
    ? (type as MusicServiceType)
    : 'custom';
}

function releaseTypeName(type: MusicReleaseType): ReactNode {
  switch (type) {
    case 'song':
      return <Trans message="Song" />;
    case 'playlist':
      return <Trans message="Playlist" />;
    case 'album':
      return <Trans message="Album" />;
    case 'podcast':
      return <Trans message="Podcast" />;
    default:
      return <Trans message="Other release" />;
  }
}

function musicServiceIcon(type: MusicServiceType): ReactNode {
  switch (type) {
    case 'spotify':
      return <SiSpotify />;
    case 'appleMusic':
      return <SiApplemusic />;
    case 'youtubeMusic':
      return <SiYoutubemusic />;
    case 'youtube':
      return <SiYoutube />;
    case 'deezer':
      return <SiDeezer />;
    case 'soundcloud':
      return <SiSoundcloud />;
    case 'bandcamp':
      return <SiBandcamp />;
    case 'mixcloud':
      return <SiMixcloud />;
    case 'tidal':
      return <SiTidal />;
    case 'audiomack':
      return <SiAudiomack />;
    case 'amazonMusic':
      return <StoreIcon />;
    case 'custom':
    case 'pandora':
    case 'yandexMusic':
    case 'napster':
    case 'itunes':
    default:
      return <LinkIcon />;
  }
}

function musicServiceName(type: MusicServiceType): ReactNode {
  switch (type) {
    case 'spotify':
      return <Trans message="Spotify" />;
    case 'appleMusic':
      return <Trans message="Apple Music" />;
    case 'youtubeMusic':
      return <Trans message="YouTube Music" />;
    case 'youtube':
      return <Trans message="YouTube" />;
    case 'deezer':
      return <Trans message="Deezer" />;
    case 'soundcloud':
      return <Trans message="SoundCloud" />;
    case 'bandcamp':
      return <Trans message="Bandcamp" />;
    case 'mixcloud':
      return <Trans message="Mixcloud" />;
    case 'tidal':
      return <Trans message="Tidal" />;
    case 'amazonMusic':
      return <Trans message="Amazon Music" />;
    case 'audiomack':
      return <Trans message="Audiomack" />;
    case 'pandora':
      return <Trans message="Pandora" />;
    case 'yandexMusic':
      return <Trans message="Yandex Music" />;
    case 'napster':
      return <Trans message="Napster" />;
    case 'itunes':
      return <Trans message="iTunes" />;
    default:
      return <Trans message="Other service" />;
  }
}

function musicServiceNamePlain(type: MusicServiceType): string {
  switch (type) {
    case 'spotify':
      return 'Spotify';
    case 'appleMusic':
      return 'Apple Music';
    case 'youtubeMusic':
      return 'YouTube Music';
    case 'youtube':
      return 'YouTube';
    case 'deezer':
      return 'Deezer';
    case 'soundcloud':
      return 'SoundCloud';
    case 'bandcamp':
      return 'Bandcamp';
    case 'mixcloud':
      return 'Mixcloud';
    case 'tidal':
      return 'Tidal';
    case 'amazonMusic':
      return 'Amazon Music';
    case 'audiomack':
      return 'Audiomack';
    case 'pandora':
      return 'Pandora';
    case 'yandexMusic':
      return 'Yandex Music';
    case 'napster':
      return 'Napster';
    case 'itunes':
      return 'iTunes';
    default:
      return 'Music';
  }
}

function isActive(value: unknown): boolean {
  return value !== false && value !== 0 && value !== '0' && value !== 'false';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function advancedDefaultValues(
  widget?: MusicHubCompatibleWidget,
): AdvancedFields {
  return {
    password: widget?.password ?? '',
    activates_at: widget?.activates_at ?? '',
    expires_at: widget?.expires_at ?? '',
    utm: parseUtm(widget?.utm),
    utm_custom: [],
    pixels: widget?.pixels ?? [],
    rules:
      widget?.rules?.map(rule => ({
        type: rule.type,
        key: rule.key ?? null,
        value: rule.value ?? null,
      })) ?? [],
  };
}

function advancedPayload(values: AdvancedFields): AdvancedFields {
  return {
    password: values.password || null,
    activates_at: values.activates_at || null,
    expires_at: values.expires_at || null,
    utm: values.utm ?? {},
    utm_custom: values.utm_custom ?? [],
    pixels: values.pixels ?? [],
    rules: values.rules ?? [],
  };
}

function parseUtm(value?: string | null): Record<string, string> {
  return value ? Object.fromEntries(new URLSearchParams(value)) : {};
}

function applyUtmToUrl(
  url: string | null | undefined,
  utm: string | null | undefined,
): string | undefined {
  if (!url) return undefined;
  if (!utm) return url;

  try {
    const nextUrl = new URL(url);
    new URLSearchParams(utm).forEach((value, key) => {
      nextUrl.searchParams.set(key, value);
    });
    return nextUrl.toString();
  } catch {
    return url;
  }
}
