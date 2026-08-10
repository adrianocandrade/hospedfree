import {LinkFormActionButtons} from '@app/dashboard/links/forms/link-form-action-buttons';
import {LinkeableTagsField} from '@app/dashboard/links/forms/linkeable-tags-field';
import {FormattedUrl} from '@app/dashboard/links/utils/formatted-url';
import {useLinkeableDefaultFormValues} from '@app/dashboard/links/utils/use-linkeable-default-form-values';
import {buildQrCodeUrl} from '@app/dashboard/qr-codes/build-qr-code-url';
import {
  retrieveQrCodeOptions,
  updateQrCodeOptions,
} from '@app/dashboard/qr-codes/qr-codes-queries';
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
import {useDatatableRouteType} from '@app/dashboard/use-datatable-route-type';
import {QrCode} from '@app/gen/schemas/qr-code';
import {DirtyFormSaveDrawer} from '@common/admin/crupdate-resource-layout';
import {UserAvatar} from '@common/auth/user-avatar';
import {onFormQueryError} from '@common/http/errors/on-form-query-error';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {Button, LinkButton} from '@shadcn/button/button';
import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Input} from '@shadcn/forms/input/input';
import {toast} from '@shadcn/toast/toast';
import {useMutation, useSuspenseQuery} from '@tanstack/react-query';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import useClipboard from '@ui/utils/hooks/use-clipboard';
import {useMediaQuery} from '@ui/utils/hooks/use-media-query';
import {
  CheckIcon,
  CopyIcon,
  CornerDownRightIcon,
  PencilIcon,
} from 'lucide-react';
import {useRef} from 'react';
import {useForm, useWatch} from 'react-hook-form';
import {Link} from 'react-router';

type QrCodeWithType = QrCode & {
  type?: QrCodeType;
  data?: QrCodeTypeData | null;
  payload?: string;
};

export function Component() {
  const {trans} = useTrans();
  const {routeType} = useDatatableRouteType();
  const navigate = useNavigate();
  const {qrCodeId} = useRequiredParams(['qrCodeId']);
  const query = useSuspenseQuery(retrieveQrCodeOptions(Number(qrCodeId)));
  const qrCode = query.data.data as QrCodeWithType;
  const linkeableDefaultValues = useLinkeableDefaultFormValues(qrCode as any);
  const initialType: QrCodeType = qrCode.linkeable
    ? 'url'
    : (qrCode.type ?? 'url');
  const dataByType = useRef<Partial<Record<QrCodeType, QrCodeTypeData>>>({
    [initialType]: qrCode.data ?? {},
  });
  const form = useForm<QrCodeFormValues>({
    defaultValues: {
      ...linkeableDefaultValues,
      name: qrCode.name ?? '',
      type: initialType,
      data: qrCode.data ?? getDefaultQrCodeData(initialType),
      long_url: qrCode.long_url ?? '',
      style: qrCode.style ?? undefined,
    },
  });
  const type = useWatch({name: 'type', control: form.control});
  const updateQrCode = useMutation(updateQrCodeOptions(Number(qrCodeId)));
  const shouldCollapseSidebar = useMediaQuery('(max-width: 1200px)');

  const handleTypeChange = (nextType: QrCodeType) => {
    const currentType = form.getValues('type');
    if (nextType === currentType || qrCode.linkeable) return;
    const confirmed = window.confirm(
      trans(
        message(
          'Changing the QR code type replaces its destination. Review the new fields before saving.',
        ),
      ),
    );
    if (!confirmed) return;

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
    updateQrCode.mutate(sanitizeQrCodeFormValues(values), {
      onSuccess: () => {
        navigate(`/${routeType}/qr-codes`, {relative: 'path'});
        toast.success(<Trans message="QR code updated" />);
      },
      onError: err => onFormQueryError(err, form),
    });
  };

  return (
    <HookForm.Root
      className="flex h-full min-h-0"
      form={form}
      onSubmit={handleSubmit}
    >
      <DirtyFormSaveDrawer isLoading={updateQrCode.isPending} />
      <Field.Group className="compact-scrollbar mx-auto max-w-3xl flex-auto overflow-y-auto px-4 lg:pt-6">
        <HookForm.Field name="name">
          <Field.Label>
            <Trans message="Title (optional)" />
          </Field.Label>
          <Input autoFocus maxLength={100} />
          <Field.Error />
        </HookForm.Field>
        <QrCodeTypeSelector
          value={type}
          onChange={handleTypeChange}
          disabled={!!qrCode.linkeable}
        />
        {qrCode.linkeable ? (
          <p className="-mt-3 text-sm text-muted-foreground">
            <Trans message="QR codes linked to another resource remain URL QR codes." />
          </p>
        ) : null}
        <LinkeableTagsField />
        {!qrCode.linkeable ? (
          <QrCodeTypeFields type={type} />
        ) : (
          <LinkeableInfoPanel linkeable={qrCode.linkeable} />
        )}
        <LinkFormActionButtons
          form={form}
          disabled={!qrCodeCapabilities[type].tracking}
        />
        {!qrCodeCapabilities[type].tracking ? (
          <p className="-mt-3 text-xs text-muted-foreground">
            <Trans message="Tracking, retargeting, password and scheduling are available for URL and WhatsApp QR codes." />
          </p>
        ) : null}
        {shouldCollapseSidebar ? (
          <QrCodeSidebarPanel previewSize={120} qrCode={qrCode} />
        ) : null}
        <Field.Separator />
        <OwnerInfoSection qrCode={qrCode} />
      </Field.Group>
      {!shouldCollapseSidebar ? (
        <section className="compact-scrollbar hidden w-80 shrink-0 overflow-y-auto border-l border-border/80 p-6 lg:block">
          <QrCodeSidebarPanel previewSize={220} qrCode={qrCode} />
        </section>
      ) : null}
    </HookForm.Root>
  );
}

type QrCodeSidebarPanelProps = {
  qrCode: QrCodeWithType;
  className?: string;
  previewSize: number;
};

function QrCodeSidebarPanel({
  qrCode,
  className,
  previewSize,
}: QrCodeSidebarPanelProps) {
  return (
    <div className={className}>
      <QrCodePreviewPanel
        size={previewSize}
        redirectPayload={buildQrCodeUrl(qrCode)}
      />
    </div>
  );
}

type LinkeableInfoPanelProps = {
  linkeable: Required<QrCode>['linkeable'];
};

function LinkeableInfoPanel({linkeable}: LinkeableInfoPanelProps) {
  const [isCopied, copyToClipboard] = useClipboard(linkeable.short_url ?? '');
  const linkeableUrl = useLinkeableUrl(linkeable);
  return (
    <div className="text-sm">
      <div className="mb-1.5 font-medium">
        <LinkeableTypeLabel linkeable={linkeable} />
      </div>
      <div className="flex items-center">
        {linkeableUrl ? (
          <Link className="hover:underline" to={linkeableUrl}>
            <FormattedUrl url={linkeable.short_url ?? ''} />
          </Link>
        ) : null}
        <Button
          className="ml-2"
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            copyToClipboard();
            toast.success(<Trans message="Copied to clipboard" />);
          }}
        >
          {isCopied ? <CheckIcon /> : <CopyIcon />}
          <span className="sr-only">
            <Trans message="Copy to clipboard" />
          </span>
        </Button>
        {linkeableUrl ? (
          <LinkButton variant="ghost" size="icon-sm" to={linkeableUrl}>
            <PencilIcon />
            <span className="sr-only">
              <Trans message="Edit" />
            </span>
          </LinkButton>
        ) : null}
      </div>
      {linkeable.final_destination_url ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <CornerDownRightIcon className="size-3" />
          <div>
            <FormattedUrl url={linkeable.final_destination_url} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function useLinkeableUrl(
  linkeable: Required<QrCode>['linkeable'],
): string | null {
  const {routeType} = useDatatableRouteType();

  switch (linkeable.model_type) {
    case 'link':
      return `/${routeType}/links/${linkeable.id}`;
    case 'folder':
      return `/${routeType}/folders/${linkeable.id}`;
    case 'biolink':
      return `/${routeType}/biolinks/${linkeable.id}`;
  }

  return null;
}

function LinkeableTypeLabel({
  linkeable,
}: {
  linkeable: Required<QrCode>['linkeable'];
}) {
  switch (linkeable.model_type) {
    case 'link':
      return <Trans message="Short link" />;
    case 'folder':
      return <Trans message="Folder" />;
    case 'biolink':
      return <Trans message="Link in bio" />;
  }
}

type OwnerInfoSectionProps = {
  qrCode: QrCode;
};

function OwnerInfoSection({qrCode}: OwnerInfoSectionProps) {
  if (!qrCode.user) return null;
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <UserAvatar user={qrCode.user} size="xs" />
      <Trans
        message="Created by :name on :date"
        values={{
          name: <strong>{qrCode.user.name}</strong>,
          date: (
            <strong>
              <FormattedDate date={qrCode.created_at} />
            </strong>
          ),
        }}
      />
    </div>
  );
}
