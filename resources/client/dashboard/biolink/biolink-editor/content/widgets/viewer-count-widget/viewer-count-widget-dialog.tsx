import {useCrupdateBiolinkWidget} from '@app/dashboard/biolink/biolink-editor/content/widgets/use-crupdate-biolink-widget';
import {WidgetFormActionButtons} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-form-action-buttons';
import {BiolinkWidget} from '@app/gen/schemas/biolink-widget';
import {onFormQueryError} from '@common/http/errors/on-form-query-error';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {
  FontDisplayName,
  FontSelector,
} from '@common/ui/font-selector/font-selector';
import {useControlledState} from '@react-stately/utils';
import {Button} from '@shadcn/button/button';
import {Dialog} from '@shadcn/dialog/dialog';
import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {ColorField} from '@ui/color-picker/color-field';
import {BrowserSafeFonts} from '@ui/fonts/font-picker/browser-safe-fonts';
import {FontConfig} from '@ui/fonts/font-picker/font-config';
import {Trans} from '@ui/i18n/trans';
import {message} from '@ui/i18n/message';
import {useTrans} from '@ui/i18n/use-trans';
import {EyeIcon, XIcon} from 'lucide-react';
import {ReactElement} from 'react';
import {useForm} from 'react-hook-form';

export type ViewerCountWidget = Omit<BiolinkWidget, 'config' | 'type'> & {
  type: 'viewerCount';
  config: {
    color?: string;
    fontConfig?: FontConfig;
  };
};

type Props = {
  widget?: ViewerCountWidget;
  children?: ReactElement<typeof Dialog.Trigger>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function ViewerCountWidgetDialog({
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
        <ViewerCountWidgetDialogContent
          widget={widget}
          onClose={() => setOpen(false)}
        />
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ViewerCountWidgetDialogContent({
  widget,
  onClose,
}: {
  widget?: ViewerCountWidget;
  onClose: () => void;
}) {
  const {biolinkId} = useRequiredParams(['biolinkId']);
  const {trans} = useTrans();
  const form = useForm<ViewerCountWidget['config']>({
    defaultValues: {
      color: widget?.config?.color ?? '',
      fontConfig: widget?.config?.fontConfig,
    },
  });
  const fontConfig = form.watch('fontConfig');
  const color = form.watch('color');
  const crupdateWidget = useCrupdateBiolinkWidget(biolinkId, form, widget?.id);

  const handleSubmit = (values: ViewerCountWidget['config']) => {
    crupdateWidget.mutate(
      {
        config: values,
        type: 'viewerCount',
      },
      {
        onSuccess: () => onClose(),
        onError: err => onFormQueryError(err, form),
      },
    );
  };

  return (
    <Dialog.Content>
      <HookForm.Root form={form} onSubmit={handleSubmit}>
        <Dialog.Header>
          <Dialog.Title>
            <EyeIcon />
            <Trans message="Live viewers" />
          </Dialog.Title>
          <Dialog.Description>
            <Trans message="Show how many visitors are viewing this page now." />
          </Dialog.Description>
        </Dialog.Header>
        <Dialog.Body>
          <Field.Group>
            <HookForm.Field name="color">
              <Field.Label>
                <Trans message="Color" />
              </Field.Label>
              <div className="flex items-center gap-2">
                <ColorField
                  label={null}
                  value={color || '#111111'}
                  onChange={value =>
                    form.setValue('color', value, {shouldDirty: true})
                  }
                />
                {color ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label={trans(message('Use system color'))}
                    onClick={() =>
                      form.setValue('color', '', {shouldDirty: true})
                    }
                  >
                    <XIcon />
                  </Button>
                ) : null}
              </div>
              <Field.Description>
                <Trans message="Leave empty to inherit the page text color." />
              </Field.Description>
              <Field.Error />
            </HookForm.Field>

            <HookForm.Field name="fontConfig">
              <Field.Label>
                <Trans message="Font" />
              </Field.Label>
              <FontDialog
                value={fontConfig ?? BrowserSafeFonts[0]}
                onChange={font =>
                  form.setValue('fontConfig', font, {shouldDirty: true})
                }
              />
              {fontConfig ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    form.setValue('fontConfig', undefined, {shouldDirty: true})
                  }
                >
                  <XIcon />
                  <Trans message="Use page font" />
                </Button>
              ) : null}
              <Field.Description>
                <Trans message="Leave the page font selected to inherit the theme." />
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
      </HookForm.Root>
    </Dialog.Content>
  );
}

function FontDialog({
  value,
  onChange,
}: {
  value: FontConfig;
  onChange: (font: FontConfig) => void;
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger
        render={
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between"
          />
        }
      >
        <FontDisplayName font={value} />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Content className="sm:max-w-xl">
          <Dialog.Header>
            <Dialog.Title>
              <Trans message="Select a font" />
            </Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <FontSelector value={value} onChange={onChange} />
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
