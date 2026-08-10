import {LinkeableFormDecoratedPanel} from '@app/dashboard/links/forms/linkeable-form-decorated-panel';
import {QrCodeRenderer} from '@app/dashboard/qr-codes/qr-code-renderer';
import {SelectQrCodeStyleDialog} from '@app/dashboard/qr-codes/style-dialog/select-qr-code-style-dialog';
import {tryBuildQrCodePayload} from '@app/dashboard/qr-codes/types/build-qr-code-payload';
import {
  getQrCodeTypeOption,
  QrCodeFormValues,
  qrCodeCapabilities,
} from '@app/dashboard/qr-codes/types/qr-code-types';
import {Button} from '@shadcn/button/button';
import {Dialog} from '@shadcn/dialog/dialog';
import {toast} from '@shadcn/toast/toast';
import {Trans} from '@ui/i18n/trans';
import {useSettings} from '@ui/settings/use-settings';
import useClipboard from '@ui/utils/hooks/use-clipboard';
import {CheckIcon, CopyIcon, PencilIcon} from 'lucide-react';
import {ReactNode} from 'react';
import {useFormContext, useWatch} from 'react-hook-form';
import {useDebounce} from 'use-debounce';

interface Props {
  size?: number;
  redirectPayload?: string;
}

export function QrCodePreviewPanel({size = 160, redirectPayload}: Props) {
  const {base_url} = useSettings();
  const form = useFormContext<QrCodeFormValues>();
  const [type, data, longUrl, style] = useWatch({
    name: ['type', 'data', 'long_url', 'style'],
    control: form.control,
  });
  const livePayload = tryBuildQrCodePayload(type, data ?? {}, longUrl);
  const resolvedPayload =
    redirectPayload && qrCodeCapabilities[type].tracking
      ? redirectPayload
      : livePayload;
  const [payload] = useDebounce(resolvedPayload, 300);

  return (
    <LinkeableFormDecoratedPanel
      title={<Trans message="QR code preview" />}
      floatingActions={
        <SelectQrCodeStyleDialog
          url={payload || base_url}
          style={style}
          onSubmit={nextStyle => {
            form.setValue('style', nextStyle, {shouldDirty: true});
          }}
        >
          <Dialog.Trigger
            render={
              <Button
                variant="default"
                color="white"
                size="icon-sm"
                className="shadow-sm"
              />
            }
          >
            <PencilIcon />
            <span className="sr-only">
              <Trans message="Customize QR code" />
            </span>
          </Dialog.Trigger>
        </SelectQrCodeStyleDialog>
      }
      footer={
        <PreviewFooter
          typeLabel={getQrCodeTypeOption(type).label}
          payload={payload}
          isPix={type === 'pix'}
        />
      }
    >
      <QrCodeRenderer url={payload || base_url} size={size} style={style} />
    </LinkeableFormDecoratedPanel>
  );
}

function PreviewFooter({
  typeLabel,
  payload,
  isPix,
}: {
  typeLabel: ReactNode;
  payload: string | null | undefined;
  isPix: boolean;
}) {
  const [copied, copy] = useClipboard(payload ?? '');
  return (
    <div className="min-w-0 space-y-2">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium">
          <Trans message="Type" />: {typeLabel}
        </span>
        {!payload ? (
          <span className="text-right text-muted-foreground">
            <Trans message="Complete the fields to update the preview." />
          </span>
        ) : null}
      </div>
      {isPix && payload ? (
        <div className="rounded-card-sm border bg-muted/40 p-2.5">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="text-xs font-medium">
              <Trans message="Pix copy and paste" />
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                copy();
                toast.success(<Trans message="Pix code copied" />);
              }}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
              <span className="sr-only">
                <Trans message="Copy Pix code" />
              </span>
            </Button>
          </div>
          <code className="line-clamp-2 block text-[10px] leading-4 break-all text-muted-foreground">
            {payload}
          </code>
          <details className="mt-1.5 text-[11px]">
            <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
              <Trans message="View full code" />
            </summary>
            <code className="compact-scrollbar mt-2 block max-h-24 overflow-y-auto rounded-sm bg-background p-2 text-[10px] leading-4 break-all">
              {payload}
            </code>
          </details>
        </div>
      ) : null}
    </div>
  );
}
