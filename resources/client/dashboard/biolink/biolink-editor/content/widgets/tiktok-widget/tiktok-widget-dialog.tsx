import {useCrupdateBiolinkWidget} from '@app/dashboard/biolink/biolink-editor/content/widgets/use-crupdate-biolink-widget';
import {WidgetFormActionButtons} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-form-action-buttons';
import {BiolinkWidget} from '@app/gen/schemas/biolink-widget';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {useControlledState} from '@react-stately/utils';
import {Button} from '@shadcn/button/button';
import {Dialog} from '@shadcn/dialog/dialog';
import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Input} from '@shadcn/forms/input/input';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {Music4Icon} from 'lucide-react';
import {ReactElement} from 'react';
import {useForm, useWatch} from 'react-hook-form';
import {VisualOptionGrid} from '@app/dashboard/biolink/biolink-editor/visual-option-card';

export interface TiktokWidget extends BiolinkWidget {
  type: 'tiktok';
  config: {
    url: string;
    presentation?: 'embed' | 'video' | 'link';
  };
}

type Props = {
  widget?: TiktokWidget;
  children?: ReactElement<typeof Dialog.Trigger>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function TiktokWidgetDialog({
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
        <TiktokWidgetDialogContent
          widget={widget}
          onClose={() => setOpen(false)}
        />
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function TiktokWidgetDialogContent({
  widget,
  onClose,
}: {
  widget?: TiktokWidget;
  onClose: () => void;
}) {
  const {trans} = useTrans();
  const {biolinkId} = useRequiredParams(['biolinkId']);
  const form = useForm<TiktokWidget['config']>({
    defaultValues: {
      url: widget?.config?.url ?? '',
      presentation: widget?.config?.presentation ?? 'video',
    },
  });
  const presentationValue =
    useWatch({control: form.control, name: 'presentation'}) ?? 'video';

  const crupdateWidget = useCrupdateBiolinkWidget(biolinkId, form, widget?.id);
  const handleSubmit = (values: TiktokWidget['config']) => {
    if (!values.url.includes('tiktok.com')) {
      form.setError('url', {
        message: trans(message('Invalid tiktok url')),
      });
      return;
    }

    crupdateWidget.mutate(
      {
        config: values,
        type: 'tiktok',
      },
      {
        onSuccess: () => onClose(),
      },
    );
  };

  return (
    <HookForm.Root form={form} onSubmit={handleSubmit}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>
            <Music4Icon />
            <Trans message="TikTok Embed" />
          </Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <Field.Group>
            <HookForm.Field name="url">
              <Field.Label>
                <Trans message="Tiktok url" />
              </Field.Label>
              <Input
                required
                autoFocus
                type="url"
                placeholder="https://www.tiktok.com/@bts_official_bighit/video/6964945720885464322"
              />
              <Field.Description>
                <Trans message="Embed this tiktok video within biolink." />
              </Field.Description>
              <Field.Error />
            </HookForm.Field>
            <HookForm.Field name="presentation">
              <Field.Label>
                <Trans message="Display model" />
              </Field.Label>
              <VisualOptionGrid
                ariaLabel={trans(message('TikTok display model'))}
                columns="grid-cols-3"
                value={presentationValue}
                onChange={value =>
                  form.setValue(
                    'presentation',
                    value as TiktokWidget['config']['presentation'],
                    {
                      shouldDirty: true,
                      shouldValidate: true,
                    },
                  )
                }
                items={[
                  {
                    value: 'video',
                    label: <Trans message="Video Player" />,
                    preview: <TiktokPresentationPreview presentation="video" />,
                  },
                  {
                    value: 'embed',
                    label: <Trans message="Official Card" />,
                    preview: <TiktokPresentationPreview presentation="embed" />,
                  },
                  {
                    value: 'link',
                    label: <Trans message="Simple Button" />,
                    preview: <TiktokPresentationPreview presentation="link" />,
                  },
                ]}
              />
              <Field.Description>
                <Trans message="Choose how the TikTok video will be displayed." />
              </Field.Description>
              <Field.Error />
            </HookForm.Field>
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
  );
}

function TiktokPresentationPreview({
  presentation,
}: {
  presentation: 'video' | 'embed' | 'link';
}) {
  if (presentation === 'video') {
    return (
      <span className="flex w-full max-w-28 flex-col gap-1 overflow-hidden rounded border border-primary/30 bg-black p-0 shadow-sm">
        <span className="relative flex aspect-[9/16] w-full items-center justify-center bg-gray-900">
          {/* Mock background pattern */}
          <span className="absolute inset-0 bg-gradient-to-tr from-cyan-500 to-pink-500 opacity-20" />

          {/* Play button */}
          <span className="relative flex size-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <span className="ml-1 size-0 border-y-[5px] border-l-[7px] border-y-transparent border-l-white" />
          </span>

          {/* Bottom overlay (user, caption) */}
          <span className="absolute right-2 bottom-2 left-2 flex flex-col gap-1">
            <span className="h-1.5 w-1/2 rounded bg-white/80" />
            <span className="h-1 w-3/4 rounded bg-white/50" />
          </span>
        </span>
      </span>
    );
  }

  if (presentation === 'embed') {
    return (
      <span className="flex w-full max-w-28 flex-col overflow-hidden rounded border border-primary/30 bg-white shadow-sm">
        <span className="flex flex-col gap-1.5 p-2">
          {/* Header */}
          <span className="flex items-center gap-1.5">
            <span className="size-5 shrink-0 rounded-full bg-gray-200" />
            <span className="flex w-full flex-col gap-0.5">
              <span className="h-1.5 w-2/3 rounded bg-gray-800" />
              <span className="h-1 w-1/3 rounded bg-gray-400" />
            </span>
          </span>
          {/* Content */}
          <span className="h-12 w-full rounded bg-gray-100" />
        </span>
        {/* Footer */}
        <span className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-2 py-1.5">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-black" />
            <span className="h-1 w-8 rounded bg-gray-600" />
          </span>
        </span>
      </span>
    );
  }

  return (
    <span className="flex w-full max-w-28 items-center justify-center gap-2 rounded border border-primary/30 bg-card p-2 shadow-sm transition-transform group-hover:-translate-y-0.5">
      <Music4Icon className="size-3 text-primary" />
      <span className="h-1.5 w-12 rounded bg-primary/80" />
    </span>
  );
}
