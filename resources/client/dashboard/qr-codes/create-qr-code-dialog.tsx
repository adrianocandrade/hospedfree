import {LinkFormActionButtons} from '@app/dashboard/links/forms/link-form-action-buttons';
import {ShortUrlField} from '@app/dashboard/links/forms/short-url-field';
import {createQrCodeOptions} from '@app/dashboard/qr-codes/qr-codes-queries';
import {QrCodePreviewPanel} from '@app/dashboard/qr-codes/types/qr-code-preview-panel';
import {QrCodeTypeFields} from '@app/dashboard/qr-codes/types/qr-code-type-fields';
import {QrCodeTypeSelector} from '@app/dashboard/qr-codes/types/qr-code-type-selector';
import {
  getDefaultQrCodeData,
  QrCodeFormValues,
  QrCodeType,
  QrCodeTypeData,
  qrCodeCapabilities,
  sanitizeQrCodeFormValues,
} from '@app/dashboard/qr-codes/types/qr-code-types';
import {onFormQueryError} from '@common/http/errors/on-form-query-error';
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
import {Switch} from '@shadcn/forms/switch/switch';
import {toast} from '@shadcn/toast/toast';
import {useMutation} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CornerDownLeftIcon,
  QrCodeIcon,
} from 'lucide-react';
import {ReactElement, useRef, useState} from 'react';
import {useForm, useWatch} from 'react-hook-form';

const defaultValues: QrCodeFormValues = {
  name: '',
  type: 'url',
  data: {},
  long_url: '',
  short_link: {
    create: false,
    back_half: '',
    domain_id: 0,
  },
};

type CreateQrCodeDialogProps = {
  children: ReactElement<typeof Dialog.Trigger>;
};

export function CreateQrCodeDialog({children}: CreateQrCodeDialogProps) {
  const [open, setOpen] = useState(false);
  const dataByType = useRef<Partial<Record<QrCodeType, QrCodeTypeData>>>({});
  const form = useForm<QrCodeFormValues>({defaultValues});
  const type = useWatch({name: 'type', control: form.control});
  const capabilities = qrCodeCapabilities[type];
  const createQrCode = useMutation(createQrCodeOptions());

  const handleTypeChange = (nextType: QrCodeType) => {
    const currentType = form.getValues('type');
    if (nextType === currentType) return;
    dataByType.current[currentType] = form.getValues('data') ?? {};
    form.setValue('type', nextType, {shouldDirty: true});
    form.setValue(
      'data',
      dataByType.current[nextType] ?? getDefaultQrCodeData(nextType),
      {shouldDirty: true},
    );
    form.clearErrors();
    window.setTimeout(() => {
      document.querySelector<HTMLElement>('[data-qr-primary-field]')?.focus();
    });
  };

  const handleSubmit = (values: QrCodeFormValues) => {
    createQrCode.mutate(sanitizeQrCodeFormValues(values), {
      onSuccess: () => {
        toast.success(<Trans message="QR code created" />);
        form.reset(defaultValues);
        dataByType.current = {};
        setOpen(false);
      },
      onError: err => onFormQueryError(err, form),
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {children}
      <Dialog.Portal>
        <Dialog.Backdrop />
        <HookForm.Root form={form} onSubmit={handleSubmit}>
          <Dialog.Content className="sm:max-w-5xl">
            <Dialog.Header>
              <Dialog.Title>
                <QrCodeIcon />
                <Trans message="New QR code" />
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body className="space-y-6">
              <QrCodeTypeSelector value={type} onChange={handleTypeChange} />
              <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
                <FormFields type={type} />
                <section className="w-full lg:sticky lg:top-0">
                  <QrCodePreviewPanel />
                </section>
              </div>
            </Dialog.Body>
            <Dialog.Footer variant="muted" className="py-4 sm:justify-between">
              <div className="min-w-0 space-y-1">
                <LinkFormActionButtons
                  form={form}
                  disabled={!capabilities.tracking}
                />
                {!capabilities.tracking ? (
                  <p className="text-xs text-muted-foreground">
                    <Trans message="Tracking, retargeting, password and scheduling are available for URL and WhatsApp QR codes." />
                  </p>
                ) : null}
              </div>
              <Button
                variant="default"
                color="primary"
                size="sm"
                type="submit"
                disabled={createQrCode.isPending}
              >
                <Trans message="Create QR code" />
                <CornerDownLeftIcon data-icon="inline-end" />
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </HookForm.Root>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function FormFields({type}: {type: QrCodeType}) {
  return (
    <Field.Group>
      <QrCodeTypeFields type={type} />
      <HookForm.Field name="name">
        <Field.Label>
          <Trans message="Title (optional)" />
        </Field.Label>
        <Input maxLength={100} />
        <Field.Description>
          <Trans message="This title is used to identify the QR code in your dashboard." />
        </Field.Description>
        <Field.Error />
      </HookForm.Field>
      {qrCodeCapabilities[type].tracking ? <MoreOptionsPanel /> : null}
    </Field.Group>
  );
}

function MoreOptionsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const isShortLinkEnabled = useWatch({name: 'short_link.create'});

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 rounded-md text-left text-sm font-medium outline-none focus-visible:ring">
        <Trans message="Sharing options" />
        {isOpen ? (
          <ChevronDownIcon className="size-4" />
        ) : (
          <ChevronRightIcon className="size-4" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <Field.Group>
          <HookForm.Field name="short_link.create">
            <Field.Label>
              <Switch />
              <Trans message="Create short link" />
            </Field.Label>
          </HookForm.Field>
          <div
            className={
              !isShortLinkEnabled ? 'pointer-events-none opacity-50' : undefined
            }
          >
            <ShortUrlField
              backHalfName="short_link.back_half"
              domainName="short_link.domain_id"
              disabled={!isShortLinkEnabled}
            />
          </div>
        </Field.Group>
      </CollapsibleContent>
    </Collapsible>
  );
}
