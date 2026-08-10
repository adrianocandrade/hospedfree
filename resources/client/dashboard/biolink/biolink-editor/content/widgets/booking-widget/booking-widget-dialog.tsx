import {useCrupdateBiolinkWidget} from '@app/dashboard/biolink/biolink-editor/content/widgets/use-crupdate-biolink-widget';
import {BiolinkSectionFields} from '@app/dashboard/biolink/biolink-editor/content/widgets/biolink-section-fields';
import {WidgetFormActionButtons} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-form-action-buttons';
import {
  getWidgetEditorModeIcon,
  type WidgetEditorMode,
} from '@app/dashboard/biolink/biolink-editor/content/widgets/widget-editor-mode';
import {
  CollectionLayoutOptions,
  LegacyCollectionLayout,
} from '@app/dashboard/biolink/biolink-editor/content/widgets/collection-layout';
import {useBiolinkEditorStore} from '@app/dashboard/biolink/biolink-editor/biolink-editor-store';
import {bookingServicesIndex} from '@app/gen/booking-services';
import {BiolinkWidget} from '@app/gen/schemas/biolink-widget';
import {onFormQueryError} from '@common/http/errors/on-form-query-error';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {Button} from '@shadcn/button/button';
import {Checkbox} from '@shadcn/forms/checkbox/checkbox';
import {Dialog} from '@shadcn/dialog/dialog';
import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Input} from '@shadcn/forms/input/input';
import {Textarea} from '@shadcn/forms/textarea/textarea';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {useControlledState} from '@react-stately/utils';
import {useQuery} from '@tanstack/react-query';
import {CalendarClockIcon, CheckIcon} from 'lucide-react';
import {ReactElement} from 'react';
import {useForm} from 'react-hook-form';

type BookingWidgetConfig = {
  title?: string;
  description?: string;
  serviceIds?: number[];
  showServiceDetails?: boolean;
  layout?: LegacyCollectionLayout;
  section?: {
    presentation?: 'contained' | 'open';
    showTitle?: boolean;
    icon?: string;
    anchorLabel?: string;
    actionLabel?: string;
    actionUrl?: string;
  };
  blueprintKey?: string;
};

type BookingWidget = Omit<BiolinkWidget, 'type' | 'config'> & {
  type: 'booking';
  config: BookingWidgetConfig;
};

type Props = {
  widget?: BookingWidget;
  children?: ReactElement<typeof Dialog.Trigger>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  mode?: WidgetEditorMode;
};

export function BookingWidgetDialog({
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
        <BookingWidgetDialogContent
          widget={widget}
          mode={mode}
          onClose={() => setOpen(false)}
        />
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function BookingWidgetDialogContent({
  widget,
  mode,
  onClose,
}: {
  widget?: BookingWidget;
  mode: WidgetEditorMode;
  onClose: () => void;
}) {
  const {biolinkId} = useRequiredParams(['biolinkId']);
  const {trans} = useTrans();
  const content = useBiolinkEditorStore(s => s.content);
  const form = useForm<BookingWidgetConfig>({
    defaultValues: {
      title: widget?.config?.title ?? '',
      description: widget?.config?.description ?? '',
      serviceIds: widget?.config?.serviceIds ?? [],
      showServiceDetails: widget?.config?.showServiceDetails ?? true,
      layout: widget?.config?.layout ?? 'classic',
      section: widget?.config?.section,
      blueprintKey: widget?.config?.blueprintKey,
    },
  });
  const serviceIds = form.watch('serviceIds') ?? [];
  const servicesQuery = useQuery({
    queryKey: ['booking-services', Number(biolinkId)],
    queryFn: () => bookingServicesIndex(Number(biolinkId)),
  });
  const crupdateWidget = useCrupdateBiolinkWidget(biolinkId, form, widget?.id);
  const ModeIcon =
    mode === 'content' ? CalendarClockIcon : getWidgetEditorModeIcon(mode);

  const submit = (values: BookingWidgetConfig) => {
    crupdateWidget.mutate(
      {
        type: 'booking',
        config: {
          ...values,
          serviceIds: values.serviceIds?.map(Number),
        },
        ...(!widget && {position: content.length + 1}),
      },
      {onSuccess: onClose, onError: error => onFormQueryError(error, form)},
    );
  };

  return (
    <Dialog.Content>
      <HookForm.Root form={form} onSubmit={submit}>
        <Dialog.Header>
          <Dialog.Title>
            <ModeIcon />
            {mode === 'design' ? (
              <Trans message="Design and layout" />
            ) : mode === 'advanced' ? (
              <Trans message="Details and advanced settings" />
            ) : (
              <Trans message="Booking" />
            )}
          </Dialog.Title>
          <Dialog.Description>
            {mode === 'design' ? (
              <Trans message="Choose how booking services are displayed." />
            ) : mode === 'advanced' ? (
              <Trans message="Configure the section surface and navigation details." />
            ) : (
              <Trans message="Let visitors choose a service and book an available time." />
            )}
          </Dialog.Description>
        </Dialog.Header>
        <Dialog.Body>
          <Field.Group>
            {mode === 'content' ? (
              <>
                <HookForm.Field name="title">
                  <Field.Label>
                    <Trans message="Title" />
                  </Field.Label>
                  <Input placeholder={trans(message('Book an appointment'))} />
                  <Field.Error />
                </HookForm.Field>
                <HookForm.Field name="description">
                  <Field.Label>
                    <Trans message="Description" />
                  </Field.Label>
                  <Textarea />
                  <Field.Error />
                </HookForm.Field>
                <Field.Root>
                  <Field.Label>
                    <Trans message="Services shown" />
                  </Field.Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(servicesQuery.data?.data ?? []).map(service => {
                      const id = Number(service.id);
                      const selected = serviceIds.includes(id);
                      return (
                        <Button
                          key={id}
                          type="button"
                          variant="outline"
                          className={
                            selected
                              ? 'justify-between border-primary bg-primary/10'
                              : 'justify-between'
                          }
                          onClick={() =>
                            form.setValue(
                              'serviceIds',
                              selected
                                ? serviceIds.filter(value => value !== id)
                                : [...serviceIds, id],
                              {shouldDirty: true},
                            )
                          }
                        >
                          <span className="truncate">{service.name}</span>
                          {selected ? <CheckIcon /> : null}
                        </Button>
                      );
                    })}
                  </div>
                  {!servicesQuery.data?.data?.length ? (
                    <Field.Description>
                      <Trans message="Create a service in the Bookings tab first." />
                    </Field.Description>
                  ) : null}
                </Field.Root>
              </>
            ) : null}
            {mode === 'design' ? (
              <>
                <HookForm.Field name="layout">
                  <Field.Label>
                    <Trans message="Layout" />
                  </Field.Label>
                  <CollectionLayoutOptions
                    ariaLabel={trans(message('Booking service layout'))}
                    value={form.watch('layout')}
                    onChange={value =>
                      form.setValue('layout', value, {shouldDirty: true})
                    }
                  />
                  <Field.Error />
                </HookForm.Field>
                <HookForm.Field name="showServiceDetails">
                  <label className="flex min-h-11 items-center justify-between gap-3 rounded-card-sm border bg-card px-3 py-2 text-sm">
                    <span>
                      <span className="block font-medium">
                        <Trans message="Show service details" />
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        <Trans message="Display duration and price when available." />
                      </span>
                    </span>
                    <Checkbox />
                  </label>
                  <Field.Error />
                </HookForm.Field>
              </>
            ) : null}
            {mode === 'advanced' ? <BiolinkSectionFields /> : null}
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
              crupdateWidget.isPending || (!!widget && !form.formState.isDirty)
            }
          >
            {widget ? <Trans message="Update" /> : <Trans message="Add" />}
          </Button>
        </Dialog.Footer>
      </HookForm.Root>
    </Dialog.Content>
  );
}
