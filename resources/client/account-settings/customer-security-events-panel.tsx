import {PaginatedResource} from '@app/hosting/hosting-types';
import {AccountSettingsPanel} from '@common/auth/ui/account-settings/account-settings-panel';
import {apiClient} from '@common/http/query-client';
import {Button} from '@shadcn/button/button';
import {Empty} from '@shadcn/empty/empty';
import {keepPreviousData, useQuery} from '@tanstack/react-query';
import {FormattedRelativeTime} from '@ui/i18n/formatted-relative-time';
import {Trans} from '@ui/i18n/trans';
import {ChevronLeftIcon, ChevronRightIcon, ShieldCheckIcon} from 'lucide-react';
import {ReactNode, useState} from 'react';

type CustomerSecurityEvent = {
  id: number;
  event: string;
  ip_address: string | null;
  created_at: string;
};

export function CustomerSecurityEventsPanel() {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['account', 'security-events', page],
    queryFn: async () =>
      (
        await apiClient.get<PaginatedResource<CustomerSecurityEvent>>(
          'account/security-events',
          {params: {page}},
        )
      ).data,
    placeholderData: keepPreviousData,
  });
  const events = query.data?.data ?? [];
  const meta = query.data?.meta;

  return (
    <AccountSettingsPanel
      id="customer-security-events"
      title={<Trans message="Eventos de segurança" />}
    >
      <p className="max-w-3xl text-sm text-muted-foreground">
        <Trans message="Acompanhe alterações importantes e tentativas de acesso. Endereços IP são mascarados e dados sensíveis não aparecem neste histórico." />
      </p>

      {query.isError ? (
        <div className="mt-6 rounded-card bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-medium">
            <Trans message="Não foi possível carregar os eventos de segurança." />
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
      ) : events.length ? (
        <div className="mt-6">
          <div className="divide-y rounded-card border">
            {events.map(event => (
              <SecurityEventRow key={event.id} event={event} />
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
              <ShieldCheckIcon />
            </Empty.Media>
            <Empty.Title>
              <Trans message="Nenhum evento de segurança registrado" />
            </Empty.Title>
            <Empty.Description>
              <Trans message="Novos acessos e alterações importantes aparecerão aqui." />
            </Empty.Description>
          </Empty.Header>
        </Empty.Root>
      )}
    </AccountSettingsPanel>
  );
}

function SecurityEventRow({event}: {event: CustomerSecurityEvent}) {
  return (
    <div className="flex min-w-0 items-start gap-3 p-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-card bg-primary/10 text-primary">
        <ShieldCheckIcon className="size-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium break-words">
          <SecurityEventLabel event={event.event} />
        </p>
        <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <FormattedRelativeTime date={event.created_at} />
          {event.ip_address ? (
            <span className="break-all">{event.ip_address}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SecurityEventLabel({event}: {event: string}): ReactNode {
  switch (event) {
    case 'login_succeeded':
      return <Trans message="Acesso realizado" />;
    case 'login_failed':
      return <Trans message="Tentativa de acesso sem sucesso" />;
    case 'logout':
      return <Trans message="Sessão encerrada" />;
    case 'password_changed':
      return <Trans message="Senha alterada" />;
    case 'email_change_requested':
      return <Trans message="Alteração de e-mail solicitada" />;
    case 'email_changed':
      return <Trans message="E-mail da conta alterado" />;
    case 'email_change_cancelled':
      return <Trans message="Alteração de e-mail cancelada" />;
    case 'two_factor_enabled':
      return <Trans message="Verificação em duas etapas ativada" />;
    case 'two_factor_disabled':
      return <Trans message="Verificação em duas etapas desativada" />;
    case 'access_token_created':
      return <Trans message="Token de API criado" />;
    case 'access_token_revoked':
      return <Trans message="Token de API revogado" />;
    case 'other_sessions_ended':
      return <Trans message="Outras sessões encerradas" />;
    default:
      return <Trans message="Atividade de segurança registrada" />;
  }
}
