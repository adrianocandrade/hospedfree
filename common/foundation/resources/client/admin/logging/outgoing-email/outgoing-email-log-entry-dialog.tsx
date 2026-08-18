import {retrieveOutgoingEmailLogItemOptions} from '@common/admin/logging/outgoing-email/outgoing-email-queries';
import {useAuth} from '@common/auth/use-auth';
import {buttonVariants} from '@shadcn/button/button';
import {Dialog} from '@shadcn/dialog/dialog';
import {Spinner} from '@shadcn/spinner/spinner';
import {useQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {useSettings} from '@ui/settings/use-settings';
import {cn} from '@ui/utils/cn';
import {ReactElement} from 'react';

interface Props {
  children: ReactElement<typeof Dialog.Trigger>;
  logItemId: number;
}

export function OutgoingEmailLogEntryDialog({children, logItemId}: Props) {
  return (
    <Dialog.Root>
      {children}
      <Dialog.Portal>
        <Dialog.Backdrop />
        <DialogContent logItemId={logItemId} />
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DialogContent({logItemId}: {logItemId: number}) {
  const query = useQuery(retrieveOutgoingEmailLogItemOptions(logItemId));
  const {base_url} = useSettings();
  const {hasPermission} = useAuth();
  const body = query.data?.data?.parsed_message?.body;

  return (
    <Dialog.Content className="h-full sm:max-w-full">
      <Dialog.Header className="flex-row items-center pe-12">
        <Dialog.Title className="flex-1">
          <Trans message="Conteúdo protegido do e-mail" />
        </Dialog.Title>
        {hasPermission('email_logs.download') ? (
          <a
            href={`${base_url}/api/v1/logs/outgoing-email/${logItemId}/download`}
            download
            className={cn(
              buttonVariants({
                variant: 'outline',
                color: 'default',
                size: 'sm',
              }),
            )}
          >
            <Trans message="Baixar MIME" />
          </a>
        ) : null}
      </Dialog.Header>
      <Dialog.Body className="flex items-center justify-center">
        {body?.html ? (
          <iframe
            title="Visualização do e-mail"
            srcDoc={body.html}
            sandbox=""
            referrerPolicy="no-referrer"
            className="size-full border-none"
            onLoad={e => {
              const iframe = e.target as HTMLIFrameElement;
              iframe.style.height =
                iframe.contentWindow!.document.body.scrollHeight + 'px';
            }}
          />
        ) : body?.text ? (
          <pre className="size-full overflow-auto p-6 text-sm break-words whitespace-pre-wrap">
            {body.text}
          </pre>
        ) : query.isError ? (
          <p className="max-w-md text-center text-sm text-destructive">
            <Trans message="Não foi possível abrir este conteúdo protegido. Verifique sua permissão e tente novamente." />
          </p>
        ) : (
          <Spinner className="size-6" />
        )}
      </Dialog.Body>
    </Dialog.Content>
  );
}
