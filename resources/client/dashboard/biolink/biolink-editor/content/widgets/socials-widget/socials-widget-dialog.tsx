import {useBiolinkEditorStore} from '@app/dashboard/biolink/biolink-editor/biolink-editor-store';
import {SocialsType} from '@app/dashboard/biolink/biolink-editor/content/widgets/socials-widget/socials-list';
import {SocialsConfigFields} from '@app/dashboard/biolink/biolink-editor/content/widgets/socials-widget/socials-config-fields';
import {useCrupdateBiolinkWidget} from '@app/dashboard/biolink/biolink-editor/content/widgets/use-crupdate-biolink-widget';
import {WidgetFormActionButtons} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-form-action-buttons';
import {BiolinkWidget} from '@app/gen/schemas/biolink-widget';
import {onFormQueryError} from '@common/http/errors/on-form-query-error';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {useControlledState} from '@react-stately/utils';
import {Button} from '@shadcn/button/button';
import {Dialog} from '@shadcn/dialog/dialog';
import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Trans} from '@ui/i18n/trans';
import {removeEmptyValuesFromObject} from '@ui/utils/objects/remove-empty-values-from-object';
import {Share2Icon} from 'lucide-react';
import {ReactElement} from 'react';
import {useForm} from 'react-hook-form';

export interface SocialsWidget extends BiolinkWidget {
  type: 'socials';
  config: Partial<Record<SocialsType, string>> & {
    style?: 'icons' | 'buttons' | 'pills';
    colorMode?: 'theme' | 'brand' | 'monochrome';
  };
}

type SocialsWidgetConfig = SocialsWidget['config'];

type Props = {
  widget?: SocialsWidget;
  children?: ReactElement<typeof Dialog.Trigger>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialConfig?: Record<string, unknown>;
};

export function SocialsWidgetDialog({
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
        <SocialsWidgetDialogContent
          widget={widget}
          initialConfig={initialConfig}
          onClose={() => setOpen(false)}
        />
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function SocialsWidgetDialogContent({
  widget,
  initialConfig,
  onClose,
}: {
  widget?: SocialsWidget;
  initialConfig?: Record<string, unknown>;
  onClose: () => void;
}) {
  const {biolinkId} = useRequiredParams(['biolinkId']);
  const content = useBiolinkEditorStore(s => s.content);
  const form = useForm<SocialsWidgetConfig>({
    defaultValues: {
      ...widget?.config,
      ...(initialConfig?.style ? {style: initialConfig.style} : {}),
      ...(initialConfig?.colorMode
        ? {colorMode: initialConfig.colorMode}
        : {}),
      style: widget?.config?.style ?? 'icons',
      colorMode: widget?.config?.colorMode ?? 'theme',
    } as SocialsWidgetConfig,
  });
  const initialType = (initialConfig?.presetNetwork as SocialsType | undefined) ?? Object.keys(widget?.config ?? {}).find(
    key =>
      key !== 'style' &&
      key !== 'colorMode' &&
      !!widget?.config?.[key as SocialsType],
  ) as SocialsType | undefined;

  const crupdateWidget = useCrupdateBiolinkWidget(biolinkId, form, widget?.id);
  const handleSubmit = (values: SocialsWidgetConfig) => {
    crupdateWidget.mutate(
      {
        config: removeEmptyValuesFromObject(values),
        type: 'socials',
        ...(!widget && {position: content.length + 1}),
      },
      {
        onSuccess: () => onClose(),
        onError: err => onFormQueryError(err, form),
      },
    );
  };

  return (
    <HookForm.Root form={form} onSubmit={handleSubmit}>
      <Dialog.Content className="md:max-w-2xl">
        <Dialog.Header>
          <Dialog.Title>
            <Share2Icon />
            <Trans message="Social Links" />
          </Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <Field.Group>
            <SocialsConfigFields form={form} initialType={initialType} />
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
