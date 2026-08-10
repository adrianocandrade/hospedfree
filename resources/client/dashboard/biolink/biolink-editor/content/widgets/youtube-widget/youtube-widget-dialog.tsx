import {useCrupdateBiolinkWidget} from '@app/dashboard/biolink/biolink-editor/content/widgets/use-crupdate-biolink-widget';
import {WidgetFormActionButtons} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-form-action-buttons';
import {
  getWidgetEditorModeIcon,
  type WidgetEditorMode,
} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-editor-mode';
import {UploadType} from '@app/site-config';
import {BiolinkWidget} from '@app/gen/schemas/biolink-widget';
import {ImageSelector} from '@common/uploads/components/image-selector';
import {FileUploadProvider} from '@common/uploads/uploader/file-upload-provider';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {SiYoutube} from '@icons-pack/react-simple-icons';
import {useControlledState} from '@react-stately/utils';
import {Button} from '@shadcn/button/button';
import {Dialog} from '@shadcn/dialog/dialog';
import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Input} from '@shadcn/forms/input/input';
import {Select} from '@shadcn/forms/select/select';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import getVideoId from 'get-video-id';
import {useForm} from 'react-hook-form';

export interface YoutubeWidget extends BiolinkWidget {
  type: 'youtube';
  config: {
    url: string;
    presentation?: 'embed' | 'cover';
    coverImage?: string;
    playButtonMotion?: 'none' | 'pulse';
  };
}

type Props = {
  widget?: YoutubeWidget;
  children?: Dialog.TriggerElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  mode?: WidgetEditorMode;
};

export function YoutubeWidgetDialog({
  children,
  open: propsOpen,
  onOpenChange: propsOnOpenChange,
  widget,
  mode = 'content',
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
        <YoutubeWidgetDialogContent
          widget={widget}
          mode={mode}
          onClose={() => setOpen(false)}
        />
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function YoutubeWidgetDialogContent({
  widget,
  mode,
  onClose,
}: {
  widget?: YoutubeWidget;
  mode: WidgetEditorMode;
  onClose: () => void;
}) {
  const {trans} = useTrans();
  const {biolinkId} = useRequiredParams(['biolinkId']);
  const form = useForm<YoutubeWidget['config']>({
    defaultValues: {
      url: widget?.config?.url ?? '',
      presentation: widget ? (widget.config.presentation ?? 'embed') : 'cover',
      coverImage: widget?.config?.coverImage ?? '',
      playButtonMotion: widget
        ? (widget.config.playButtonMotion ?? 'none')
        : 'pulse',
    },
  });

  const crupdateWidget = useCrupdateBiolinkWidget(biolinkId, form, widget?.id);
  const ModeIcon = mode === 'content' ? null : getWidgetEditorModeIcon(mode);
  const handleSubmit = (values: YoutubeWidget['config']) => {
    const youtubeId = getVideoId(values.url).id;

    if (!youtubeId) {
      form.setError('url', {
        message: trans(message('Invalid youtube url')),
      });
      return;
    }

    crupdateWidget.mutate(
      {
        config: values,
        type: 'youtube',
      },
      {
        onSuccess: () => onClose(),
      },
    );
  };

  return (
    <FileUploadProvider>
      <HookForm.Root form={form} onSubmit={handleSubmit}>
        <Dialog.Content className="sm:max-w-3xl">
          <Dialog.Header>
            <Dialog.Title>
              {ModeIcon ? <ModeIcon /> : <SiYoutube />}
              {mode === 'presentation' ? (
                <Trans message="Video presentation" />
              ) : (
                <Trans message="Youtube Video" />
              )}
            </Dialog.Title>
            {mode === 'presentation' ? (
              <Dialog.Description>
                <Trans message="Choose the cover, playback style and motion shown before the video starts." />
              </Dialog.Description>
            ) : null}
          </Dialog.Header>
          <Dialog.Body>
            <Field.Group>
              {mode === 'content' ? (
                <HookForm.Field name="url">
                  <Field.Label>
                    <Trans message="Youtube video url" />
                  </Field.Label>
                  <Input
                    required
                    autoFocus
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=YE7VzlLtp-4"
                  />
                  <Field.Description>
                    <Trans message="Paste the video link. The preview is loaded only when a visitor chooses to play." />
                  </Field.Description>
                  <Field.Error />
                </HookForm.Field>
              ) : null}
              {mode === 'presentation' ? (
                <>
                  <HookForm.Field name="presentation">
                    <Field.Label>
                      <Trans message="Video presentation" />
                    </Field.Label>
                    <Select.Root
                      items={[
                        {
                          value: 'embed',
                          label: <Trans message="Embedded player" />,
                        },
                        {
                          value: 'cover',
                          label: <Trans message="Poster before playback" />,
                        },
                      ]}
                    >
                      <Select.Trigger className="w-full">
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="embed">
                          <Trans message="Embedded player" />
                        </Select.Item>
                        <Select.Item value="cover">
                          <Trans message="Poster before playback" />
                        </Select.Item>
                      </Select.Content>
                    </Select.Root>
                    <Field.Description>
                      <Trans message="Poster mode keeps the page lighter and shows a cover before playback." />
                    </Field.Description>
                    <Field.Error />
                  </HookForm.Field>
                  <Field.Root name="coverImage">
                    <Field.Label>
                      <Trans message="Custom cover (optional)" />
                    </Field.Label>
                    <ImageSelector.Input
                      cropDimensions={{width: 1280, height: 720}}
                      value={form.watch('coverImage') ?? ''}
                      onChange={value =>
                        form.setValue('coverImage', value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      uploadType={UploadType.linkImages}
                    />
                    <Field.Description>
                      <Trans message="Upload a 16:9 image. Without one, the best YouTube thumbnail is used." />
                    </Field.Description>
                    <Field.Error />
                  </Field.Root>
                  <HookForm.Field name="playButtonMotion">
                    <Field.Label>
                      <Trans message="Play button motion" />
                    </Field.Label>
                    <Select.Root
                      items={[
                        {value: 'none', label: <Trans message="None" />},
                        {
                          value: 'pulse',
                          label: <Trans message="Subtle pulse" />,
                        },
                      ]}
                    >
                      <Select.Trigger className="w-full">
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="none">
                          <Trans message="None" />
                        </Select.Item>
                        <Select.Item value="pulse">
                          <Trans message="Subtle pulse" />
                        </Select.Item>
                      </Select.Content>
                    </Select.Root>
                    <Field.Error />
                  </HookForm.Field>
                </>
              ) : null}
            </Field.Group>
          </Dialog.Body>
          <Dialog.Footer variant="muted" className="py-4 sm:justify-between">
            <WidgetFormActionButtons form={form} widget={widget} />
            <Dialog.CloseButton>
              <Trans message="Cancel" />
            </Dialog.CloseButton>
            <Button
              type="submit"
              disabled={crupdateWidget.isPending || !form.formState.isDirty}
            >
              {widget ? <Trans message="Update" /> : <Trans message="Add" />}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </HookForm.Root>
    </FileUploadProvider>
  );
}
