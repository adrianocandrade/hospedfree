import {PaginatedResource} from '@app/hosting/hosting-types';
import {AccountSettingsPanel} from '@common/auth/ui/account-settings/account-settings-panel';
import {apiClient} from '@common/http/query-client';
import {Badge} from '@shadcn/badge/badge';
import {Button} from '@shadcn/button/button';
import {Empty} from '@shadcn/empty/empty';
import {keepPreviousData, useQuery} from '@tanstack/react-query';
import {FormattedRelativeTime} from '@ui/i18n/formatted-relative-time';
import {Trans} from '@ui/i18n/trans';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MailCheckIcon,
  MailIcon,
} from 'lucide-react';
import {useState} from 'react';

type CustomerCommunication = {
  id: number;
  kind: string;
  subject: string;
  status: 'sending' | 'sent' | 'failed';
  sent_at: string | null;
  created_at: string;
};

export function CustomerCommunicationsPanel() {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['account', 'communications', page],
    queryFn: async () =>
      (
        await apiClient.get<PaginatedResource<CustomerCommunication>>(
          'account/communications',
          {params: {page}},
        )
      ).data,
    placeholderData: keepPreviousData,
  });
  const communications = query.data?.data ?? [];
  const meta = query.data?.meta;

  return (
    <AccountSettingsPanel
      id="customer-communications"
      title={<Trans message="E-mails enviados" />}
    >
      <p className="max-w-3xl text-sm text-muted-foreground">
        <Trans message="Consulte os avisos de segurança, hospedagem, suporte e faturamento enviados para sua conta. Por segurança, códigos e conteúdo completo não são armazenados neste histórico." />
      </p>

      {query.isError ? (
        <div className="mt-6 rounded-card bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-medium">
            <Trans message="Não foi possível carregar o histórico de e-mails." />
          </p>
          <Button
            className="mt-3"
            variant="outline"
            size="sm"
            onClick={() => query.refetch()}
          >
            <Trans message="Tentar novamente" />
          </Button>
        </div>
      ) : communications.length ? (
        <div className="mt-6">
          <div className="divide-y rounded-card border">
            {communications.map(communication => (
              <CommunicationRow
                key={communication.id}
                communication={communication}
              />
            ))}
          </div>

          {meta && meta.last_page > 1 ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                <Trans
                  message="Página :current de :total"
                  values={{current: meta.current_page, total: meta.last_page}}
                />
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.current_page <= 1 || query.isFetching}
                  onClick={() => setPage(current => Math.max(1, current - 1))}
                >
                  <ChevronLeftIcon />
                  <Trans message="Anterior" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    meta.current_page >= meta.last_page || query.isFetching
                  }
                  onClick={() => setPage(current => current + 1)}
                >
                  <Trans message="Próxima" />
                  <ChevronRightIcon />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : query.isPending ? (
        <div className="mt-6 h-28 animate-pulse rounded-card bg-muted" />
      ) : (
        <Empty.Root className="mt-6 rounded-card border border-dashed">
          <Empty.Header>
            <Empty.Media variant="icon">
              <MailIcon />
            </Empty.Media>
            <Empty.Title>
              <Trans message="Nenhum e-mail registrado" />
            </Empty.Title>
            <Empty.Description>
              <Trans message="Os próximos avisos importantes enviados pela HospedFree aparecerão aqui." />
            </Empty.Description>
          </Empty.Header>
        </Empty.Root>
      )}
    </AccountSettingsPanel>
  );
}

function CommunicationRow({
  communication,
}: {
  communication: CustomerCommunication;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-card bg-primary/10 text-primary">
        <MailCheckIcon className="size-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium break-words">
          {communication.subject}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          <FormattedRelativeTime
            date={communication.sent_at ?? communication.created_at}
          />
        </p>
      </div>
      <CommunicationStatus status={communication.status} />
    </div>
  );
}

function CommunicationStatus({
  status,
}: {
  status: CustomerCommunication['status'];
}) {
  if (status === 'sent') {
    return (
      <Badge variant="positive">
        <Trans message="Enviado" />
      </Badge>
    );
  }

  if (status === 'failed') {
    return (
      <Badge variant="destructive">
        <Trans message="Falhou" />
      </Badge>
    );
  }

  return (
    <Badge variant="secondary">
      <Trans message="Enviando" />
    </Badge>
  );
}
