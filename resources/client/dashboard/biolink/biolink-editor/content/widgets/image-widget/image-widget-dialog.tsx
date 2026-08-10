import {useCrupdateBiolinkWidget} from '@app/dashboard/biolink/biolink-editor/content/widgets/use-crupdate-biolink-widget';
import {WidgetFormActionButtons} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-form-action-buttons';
import {BiolinkWidget} from '@app/gen/schemas/biolink-widget';
import {VisualOptionGrid} from '@app/dashboard/biolink/biolink-editor/visual-option-card';
import {onFormQueryError} from '@common/http/errors/on-form-query-error';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {ImageSelector} from '@common/uploads/components/image-selector';
import {FileUploadProvider} from '@common/uploads/uploader/file-upload-provider';
import {useControlledState} from '@react-stately/utils';
import {Button} from '@shadcn/button/button';
import {Checkbox} from '@shadcn/forms/checkbox/checkbox';
import {Dialog} from '@shadcn/dialog/dialog';
import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Input} from '@shadcn/forms/input/input';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {ImageIcon} from 'lucide-react';
import {ReactElement} from 'react';
import {useForm, useWatch} from 'react-hook-form';

export interface ImageWidget extends BiolinkWidget {
  type: 'image';
  config: {
    url: string;
    destinationUrl?: string;
    type: 'default' | 'avatar';
    imageZoom?: boolean;
  };
}

type Props = {
  widget?: ImageWidget;
  children?: ReactElement<typeof Dialog.Trigger>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function ImageWidgetDialog({
  children,
  open: propsOpen,
  onOpenChange: propsOnOpenChange,
  widget,
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
        <ImageWidgetDialogContent
          widget={widget}
          onClose={() => setOpen(false)}
        />
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ImageWidgetDialogContent({
  widget,
  onClose,
}: {
  widget?: ImageWidget;
  onClose: () => void;
}) {
  const {trans} = useTrans();
  const {biolinkId} = useRequiredParams(['biolinkId']);
  const form = useForm<ImageWidget['config']>({
    defaultValues: {
      url: widget?.config?.url ?? '',
      destinationUrl: widget?.config?.destinationUrl ?? '',
      type: widget?.config?.type ?? 'avatar',
    },
  });
  const urlValue = useWatch({control: form.control, name: 'url'});
  const typeValue = useWatch({control: form.control, name: 'type'}) ?? 'avatar';

  const crupdateWidget = useCrupdateBiolinkWidget(biolinkId, form, widget?.id);
  const handleSubmit = (values: ImageWidget['config']) => {
    crupdateWidget.mutate(
      {
        config: values,
        type: 'image',
      },
      {
        onSuccess: () => onClose(),
        onError: err => onFormQueryError(err, form),
      },
    );
  };

  return (
    <FileUploadProvider>
      <HookForm.Root form={form} onSubmit={handleSubmit}>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>
              <ImageIcon />
              <Trans message="Image" />
            </Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <Field.Group>
              <Field.Root name="url">
                <Field.Label>
                  <Trans message="File" />
                </Field.Label>
                <ImageSelector.Input
                  cropDimensions={{width: 1200, height: 800}}
                  value={urlValue}
                  onChange={value =>
                    form.setValue('url', value, {shouldDirty: true})
                  }
                  uploadType="linkImages"
                  required
                />
                <Field.Error />
              </Field.Root>

              <HookForm.Field name="type">
                <Field.Label>
                  <Trans message="Style" />
                </Field.Label>
                <VisualOptionGrid
                  ariaLabel={trans(message('Image style'))}
                  columns="grid-cols-2"
                  value={typeValue}
                  onChange={value =>
                    form.setValue(
                      'type',
                      value as ImageWidget['config']['type'],
                      {
                        shouldDirty: true,
                        shouldValidate: true,
                      },
                    )
                  }
                  items={[
                    {
                      value: 'default',
                      label: <Trans message="Default" />,
                      preview: <ImageStylePreview type="default" />,
                    },
                    {
                      value: 'avatar',
                      label: <Trans message="Avatar" />,
                      preview: <ImageStylePreview type="avatar" />,
                    },
                  ]}
                />
                <Field.Error />
              </HookForm.Field>
              <HookForm.Field name="destinationUrl">
                <Field.Label>
                  <Trans message="Destination url" />
                </Field.Label>
                <Input type="url" placeholder={trans(message('Optional'))} />
                <Field.Description>
                  <Trans message="Redirect user to this url when clicking the image." />
                </Field.Description>
                <Field.Error />
              </HookForm.Field>
              {/* zoom toggle — only for default images, not avatar */}
              {typeValue === 'default' ? (
                <HookForm.Field name="imageZoom">
                  <label className="flex min-h-11 items-center justify-between gap-3 rounded-card-sm border bg-card px-3 py-2 text-sm">
                    <span>
                      <span className="block font-medium">
                        <Trans message="Zoom on click" />
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        <Trans message="Open image in fullscreen viewer when clicked." />
                      </span>
                    </span>
                    <Checkbox bindToHookForm />
                  </label>
                  <Field.Error />
                </HookForm.Field>
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

function ImageStylePreview({type}: {type: 'default' | 'avatar'}) {
  return (
    <span
      className={
        type === 'avatar'
          ? 'size-10 rounded-full bg-primary/50 ring-2 ring-primary/20'
          : 'h-8 w-14 rounded-card-sm bg-primary/35'
      }
    />
  );
}
