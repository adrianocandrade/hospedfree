import {
  cancelHostingDeletionOptions,
  hostingDomainsOptions,
  hostingStatsOptions,
  hostingToolsOptions,
  openHostingToolOptions,
  reactivateHostingAccountOptions,
  reconcileHostingAccountOptions,
  suspendHostingAccountOptions,
} from '@app/hosting/hosting-queries';
import {HostingAccount, HostingStats} from '@app/hosting/hosting-types';
import {
  HostingResourceUsage,
  resolveHostingResourceSummary,
} from '@app/hosting/hosting-resource-usage';
import {showHttpErrorToast} from '@common/http/errors/show-http-error-toast';
import {usePasswordConfirmedAction} from '@common/auth/ui/confirm-password/use-password-confirmed-action';
import {AlertDialog} from '@shadcn/alert-dialog/alert-dialog';
import {Badge} from '@shadcn/badge/badge';
import {Button, LinkButton} from '@shadcn/button/button';
import {Card} from '@shadcn/card/card';
import {Skeleton} from '@shadcn/skeleton/skeleton';
import {toast} from '@shadcn/toast/toast';
import {useMutation, useQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {
  CalendarDaysIcon,
  ChevronRightIcon,
  CircleAlertIcon,
  CircleGaugeIcon,
  DatabaseIcon,
  ExternalLinkIcon,
  FolderOpenIcon,
  Globe2Icon,
  HardDriveIcon,
  KeyRoundIcon,
  LayoutTemplateIcon,
  LoaderCircleIcon,
  NetworkIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  ServerIcon,
  ShieldCheckIcon,
  WrenchIcon,
} from 'lucide-react';
import {ReactNode, useState} from 'react';
import {useOutletContext} from 'react-router';
import {formatHostingDate} from './format-hosting-date';
import {HostingDeleteDialog} from './hosting-delete-dialog';

export function Component() {
  const {account} = useOutletContext<{account: HostingAccount}>();
  const domains = useQuery(hostingDomainsOptions(account.id));
  const stats = useQuery({
    ...hostingStatsOptions(account.id),
    enabled: account.status === 'active',
  });
  const tools = useQuery(hostingToolsOptions(account.id));
  const reconcile = useMutation({
    ...reconcileHostingAccountOptions(),
    onError: error => showHttpErrorToast(error),
  });
  const primaryDomain = domains.data?.data.find(item => item.is_primary);
  const domainIsActive = primaryDomain?.status === 'active';

  const refresh = () => {
    reconcile.mutate(account.id, {
      onSettled: () => {
        void Promise.all([domains.refetch(), stats.refetch(), tools.refetch()]);
      },
    });
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-5 pb-4">
      <AccountStatus
        account={account}
        domainIsActive={domainIsActive}
        domainsLoading={domains.isLoading}
        refreshing={
          reconcile.isPending ||
          domains.isFetching ||
          stats.isFetching ||
          tools.isFetching
        }
        onRefresh={refresh}
      />

      <div className="grid min-w-0 gap-5 min-[1360px]:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-5">
          <QuickActions account={account} />
          <ResourceUsage
            account={account}
            stats={stats.data}
            loading={stats.isLoading}
            domainCount={
              domains.data?.availability === 'available'
                ? domains.data.data.length
                : null
            }
          />
          <TechnicalDetails account={account} />
        </div>

        <aside className="min-w-0 space-y-5">
          <AccountSummary
            account={account}
            domainCount={domains.data?.data.length}
            domainsAvailable={domains.data?.availability === 'available'}
          />
          <AccountManagement account={account} />
        </aside>
      </div>
    </div>
  );
}

function AccountStatus({
  account,
  domainIsActive,
  domainsLoading,
  refreshing,
  onRefresh,
}: {
  account: HostingAccount;
  domainIsActive: boolean;
  domainsLoading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const accountActive = account.status === 'active';
  const processing = [
    'pending',
    'provisioning',
    'pending_downgrade',
    'deleting',
  ].includes(account.status);
  const healthy = accountActive && domainIsActive;
  const Icon = healthy
    ? ShieldCheckIcon
    : processing || domainsLoading
      ? LoaderCircleIcon
      : CircleAlertIcon;

  return (
    <section className="relative overflow-hidden rounded-card bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary)_13%,var(--color-card)),var(--color-card)_58%,color-mix(in_srgb,var(--color-primary)_7%,var(--color-card)))] p-5 shadow-sm ring-1 ring-primary/15 sm:p-7">
      <div className="pointer-events-none absolute -top-20 -right-14 size-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex min-w-0 flex-col gap-6 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <span
            className={`flex size-14 shrink-0 items-center justify-center rounded-card-sm ring-1 ring-inset ${healthy ? 'bg-positive/10 text-positive ring-positive/20' : 'bg-warning/10 text-warning ring-warning/20'}`}
          >
            <Icon
              className={`size-7 ${processing || domainsLoading ? 'animate-spin' : ''}`}
            />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight [overflow-wrap:anywhere] break-words sm:text-3xl">
                {account.fqdn}
              </h1>
              <Badge variant={healthy ? 'positive' : 'secondary'}>
                {healthy ? (
                  <Trans message="Ativo no provedor" />
                ) : processing ? (
                  <Trans message="Processando" />
                ) : (
                  <Trans message="Verificação necessária" />
                )}
              </Badge>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {healthy ? (
                <Trans message="A conta e o domínio estão ativos no provedor. Abra o site para confirmar se a publicação já responde." />
              ) : accountActive ? (
                <Trans message="A conta está ativa, mas não foi possível confirmar o domínio no servidor agora." />
              ) : processing ? (
                <Trans message="A hospedagem ainda está processando uma alteração. Atualize em alguns instantes." />
              ) : (
                <Trans message="A hospedagem precisa de uma ação antes de publicar o site." />
              )}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ServerIcon className="size-3.5 text-primary" />
                {account.plan?.name ?? 'â€”'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <RefreshCwIcon className="size-3.5 text-primary" />
                <Trans
                  message="Sincronizado em :date"
                  values={{date: formatHostingDate(account.last_synced_at)}}
                />
              </span>
            </div>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {!healthy ? (
            <Button variant="outline" onClick={onRefresh} disabled={refreshing}>
              <RefreshCwIcon
                className={refreshing ? 'animate-spin' : undefined}
              />
              <Trans message="Sincronizar" />
            </Button>
          ) : null}
          {healthy ? (
            <Button
              nativeButton={false}
              render={
                <a
                  href={`http://${account.fqdn}`}
                  target="_blank"
                  rel="noreferrer"
                />
              }
            >
              <ExternalLinkIcon />
              <Trans message="Abrir site" />
            </Button>
          ) : (
            <Button disabled>
              <ExternalLinkIcon />
              <Trans message="Abrir site" />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

function QuickActions({account}: {account: HostingAccount}) {
  const openTool = useMutation({
    ...openHostingToolOptions(account.id),
    onSuccess: data => window.open(data.url, '_blank', 'noopener,noreferrer'),
    onError: error => showHttpErrorToast(error),
  });

  return (
    <Card.Root className="shadow-sm ring-border/80">
      <Card.Header className="pb-1">
        <Card.Title>
          <Trans message="Ações rápidas" />
        </Card.Title>
        <Card.Description>
          <Trans message="Publique e gerencie seu site sem sair do painel." />
        </Card.Description>
      </Card.Header>
      <Card.Content className="grid gap-3 min-[1360px]:grid-cols-4 sm:grid-cols-2">
        <ExternalAction
          href={`http://${account.fqdn}`}
          icon={<ExternalLinkIcon />}
          label={<Trans message="Visualizar site" />}
          description={<Trans message="Abrir em uma nova aba" />}
          tone="primary"
          enabled={account.status === 'active'}
        />
        <ActionLink
          to={`/dashboard/hosting/${account.id}/files`}
          icon={<FolderOpenIcon />}
          label={<Trans message="Gerenciador de arquivos" />}
          description={
            account.tools.file_manager ? (
              <Trans message="Enviar, editar e organizar arquivos" />
            ) : (
              <Trans message="Integração ainda indisponível" />
            )
          }
          enabled={account.tools.file_manager && account.status === 'active'}
          tone="warning"
        />
        <ToolAction
          icon={<LayoutTemplateIcon />}
          label={<Trans message="Construtor de site" />}
          description={<Trans message="Abrir uma sessão segura no editor" />}
          enabled={account.tools.site_builder && account.status === 'active'}
          loading={openTool.isPending}
          onClick={() => openTool.mutate('site-builder')}
          tone="note"
        />
        <ActionLink
          to={`/dashboard/hosting/${account.id}/domains`}
          tone="positive"
          icon={<Globe2Icon />}
          label={<Trans message="Domínios" />}
          description={<Trans message="Ver domínios e criar subdomínios" />}
        />
      </Card.Content>
    </Card.Root>
  );
}

type ActionTone = 'primary' | 'warning' | 'note' | 'positive';

const actionToneClass: Record<ActionTone, string> = {
  primary: 'bg-primary/12 text-primary ring-primary/20',
  warning: 'bg-warning/12 text-warning ring-warning/20',
  note: 'bg-note/12 text-note ring-note/20',
  positive: 'bg-positive/12 text-positive ring-positive/20',
};

function ActionLink({
  to,
  icon,
  label,
  description,
  enabled = true,
  tone = 'primary',
}: {
  to: string;
  icon: ReactNode;
  label: ReactNode;
  description: ReactNode;
  enabled?: boolean;
  tone?: ActionTone;
}) {
  const content = (
    <>
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-card-sm ring-1 ring-inset [&_svg]:size-5 ${actionToneClass[tone]}`}
      >
        {icon}
      </span>
      <span className="w-full min-w-0">
        <span className="block font-semibold">{label}</span>
        <span className="mt-1 block text-sm leading-snug text-muted-foreground">
          {description}
        </span>
      </span>
    </>
  );

  return enabled ? (
    <LinkButton
      to={to}
      variant="outline"
      className="group h-auto min-h-32 min-w-0 flex-col items-start justify-start gap-4 bg-muted/15 px-4 py-4 text-start transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-muted/40"
    >
      {content}
    </LinkButton>
  ) : (
    <Button
      variant="outline"
      disabled
      className="h-auto min-h-32 min-w-0 flex-col items-start justify-start gap-4 px-4 py-4 text-start"
    >
      {content}
    </Button>
  );
}

function ExternalAction({
  href,
  icon,
  label,
  description,
  enabled,
  tone,
}: {
  href: string;
  icon: ReactNode;
  label: ReactNode;
  description: ReactNode;
  enabled: boolean;
  tone: ActionTone;
}) {
  const content = (
    <>
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-card-sm ring-1 ring-inset [&_svg]:size-5 ${actionToneClass[tone]}`}
      >
        {icon}
      </span>
      <span className="w-full min-w-0">
        <span className="block font-semibold">{label}</span>
        <span className="mt-1 block text-sm leading-snug text-muted-foreground">
          {description}
        </span>
      </span>
    </>
  );

  return enabled ? (
    <Button
      nativeButton={false}
      variant="outline"
      className="group h-auto min-h-32 min-w-0 flex-col items-start justify-start gap-4 bg-muted/15 px-4 py-4 text-start transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-muted/40"
      render={<a href={href} target="_blank" rel="noreferrer" />}
    >
      {content}
    </Button>
  ) : (
    <Button
      variant="outline"
      disabled
      className="h-auto min-h-32 min-w-0 flex-col items-start justify-start gap-4 px-4 py-4 text-start"
    >
      {content}
    </Button>
  );
}

function ToolAction({
  icon,
  label,
  description,
  enabled,
  loading,
  onClick,
  tone,
}: {
  icon: ReactNode;
  label: ReactNode;
  description: ReactNode;
  enabled: boolean;
  loading: boolean;
  onClick: () => void;
  tone: ActionTone;
}) {
  return (
    <Button
      variant="outline"
      className="h-auto min-h-32 min-w-0 flex-col items-start justify-start gap-4 bg-muted/15 px-4 py-4 text-start transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-muted/40"
      disabled={!enabled || loading}
      onClick={onClick}
    >
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-card-sm ring-1 ring-inset [&_svg]:size-5 ${actionToneClass[tone]}`}
      >
        {loading ? <LoaderCircleIcon className="animate-spin" /> : icon}
      </span>
      <span className="w-full min-w-0">
        <span className="block font-semibold">{label}</span>
        <span className="mt-1 block text-sm leading-snug text-muted-foreground">
          {description}
        </span>
      </span>
    </Button>
  );
}

function ResourceUsage({
  account,
  stats,
  loading,
  domainCount,
}: {
  account: HostingAccount;
  stats?: HostingStats;
  loading: boolean;
  domainCount: number | null;
}) {
  const usage = resolveHostingResourceSummary(account, stats, {
    domains: domainCount,
  });

  return (
    <Card.Root className="shadow-sm ring-border/80">
      <Card.Header className="border-b border-border/60 pb-5">
        <Card.Title>
          <span className="flex items-center gap-2">
            <CircleGaugeIcon className="size-5 text-primary" />
            <Trans message="Uso de recursos" />
          </span>
        </Card.Title>
        <Card.Description>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              {stats?.measured_at && usage.hasMeasuredUsage ? (
                <Trans
                  message="Medição realizada em :date"
                  values={{date: formatHostingDate(stats.measured_at)}}
                />
              ) : (
                <Trans message="Consumo sincronizado com o painel e limites definidos pelo plano atual." />
              )}
            </span>
            {account.plan?.quotas?.ad_free === true && (
              <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-300">
                <ShieldCheckIcon className="size-3.5" />
                <Trans message="Sem anúncios" />
              </span>
            )}
          </span>
        </Card.Description>
      </Card.Header>
      <Card.Content>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric
                icon={<HardDriveIcon />}
                label={<Trans message="Disco" />}
                usage={usage.disk}
                tone="primary"
              />
              <Metric
                icon={<NetworkIcon />}
                label={<Trans message="Transferência" />}
                usage={usage.bandwidth}
                tone="note"
              />
              <Metric
                icon={<Globe2Icon />}
                label={<Trans message="Domínios" />}
                usage={usage.domains}
                tone="positive"
              />
              <Metric
                icon={<DatabaseIcon />}
                label={<Trans message="Bancos MySQL" />}
                usage={usage.databases}
                tone="primary"
              />
            </div>
            {!usage.hasMeasuredUsage && (
              <div className="flex items-start gap-3 rounded-card-sm bg-muted/35 p-4 text-sm ring-1 ring-foreground/5 ring-inset">
                <CircleGaugeIcon className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold">
                    <Trans message="Limites do plano disponíveis" />
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    <Trans message="O consumo atual será preenchido automaticamente assim que o painel concluir a sincronização." />
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </Card.Content>
    </Card.Root>
  );
}

function Metric({
  icon,
  label,
  usage,
  tone,
}: {
  icon: ReactNode;
  label: ReactNode;
  usage: HostingResourceUsage;
  tone: ActionTone;
}) {
  const percentage = usage.percentage;

  return (
    <div className="min-w-0 rounded-card-sm bg-muted/20 p-4 ring-1 ring-foreground/7 ring-inset">
      <div className="flex items-center gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-card-xs ring-1 ring-inset [&_svg]:size-5 ${actionToneClass[tone]}`}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-muted-foreground">
            {label}
          </div>
          <div className="mt-0.5 truncate text-sm font-semibold">
            {usage.usedLabel ? (
              usage.valueLabel
            ) : usage.limitLabel ? (
              <Trans
                message="Limite de :limit"
                values={{limit: usage.limitLabel}}
              />
            ) : (
              '—'
            )}
          </div>
        </div>
        <span className="text-lg font-bold tracking-tight">
          {percentage === null ? '—' : `${percentage}%`}
        </span>
      </div>
      {percentage !== null ? (
        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-primary/12"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percentage}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{width: `${percentage}%`}}
          />
        </div>
      ) : (
        <div className="mt-4 h-2 rounded-full bg-primary/12" />
      )}
    </div>
  );
}

function AccountSummary({
  account,
  domainCount,
  domainsAvailable,
}: {
  account: HostingAccount;
  domainCount?: number;
  domainsAvailable: boolean;
}) {
  return (
    <Card.Root className="shadow-sm ring-border/80">
      <Card.Header className="bg-primary/5 pb-5">
        <Card.Title>
          <Trans message="Resumo da conta" />
        </Card.Title>
        <Card.Description>
          <Trans message="Dados comerciais e técnicos da hospedagem." />
        </Card.Description>
      </Card.Header>
      <Card.Content className="divide-y divide-border/70 p-0">
        <SummaryRow
          icon={<ServerIcon />}
          label={<Trans message="Plano" />}
          value={account.plan?.name ?? '—'}
        />
        <SummaryRow
          icon={<KeyRoundIcon />}
          label={<Trans message="Conta FTP" />}
          value={account.username_masked ?? '—'}
        />
        <SummaryRow
          icon={<Globe2Icon />}
          label={<Trans message="Domínios" />}
          value={
            domainsAvailable && domainCount != null ? `${domainCount}` : '—'
          }
        />
        <SummaryRow
          icon={<CalendarDaysIcon />}
          label={
            account.activated_at ? (
              <Trans message="Ativada em" />
            ) : (
              <Trans message="Ativação" />
            )
          }
          value={formatHostingDate(account.activated_at)}
        />
        <SummaryRow
          icon={<RefreshCwIcon />}
          label={<Trans message="Última sincronização" />}
          value={formatHostingDate(account.last_synced_at)}
        />
      </Card.Content>
    </Card.Root>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: ReactNode;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 px-5 py-3.5 text-sm">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-card-xs bg-primary/8 text-primary [&_svg]:size-4">
        {icon}
      </span>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="ml-auto min-w-0 text-end font-semibold [overflow-wrap:anywhere] break-words">
        {value}
      </dd>
    </div>
  );
}

function TechnicalDetails({account}: {account: HostingAccount}) {
  return (
    <Card.Root className="shadow-sm ring-border/80">
      <Card.Header className="border-b border-border/60 pb-5">
        <Card.Title>
          <Trans message="Dados técnicos" />
        </Card.Title>
        <Card.Description>
          <Trans message="Somente informações confirmadas para esta conta são exibidas." />
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <TechnicalItem
            icon={<Globe2Icon />}
            label={<Trans message="Domínio principal" />}
            value={account.fqdn}
          />
          <TechnicalItem
            icon={<ServerIcon />}
            label={<Trans message="Servidor FTP" />}
            value={account.technical.ftp_host}
          />
          <TechnicalItem
            icon={<DatabaseIcon />}
            label={<Trans message="Servidor MySQL" />}
            value={account.technical.sql_host}
          />
        </dl>
      </Card.Content>
    </Card.Root>
  );
}

function TechnicalItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: ReactNode;
  value: string | null;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-card-sm bg-muted/20 p-4 ring-1 ring-foreground/7 ring-inset">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-card-xs bg-primary/8 text-primary [&_svg]:size-4">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-1 text-sm font-medium break-all">
          {value || <Trans message="Não informado" />}
        </dd>
      </div>
    </div>
  );
}

function AccountManagement({account}: {account: HostingAccount}) {
  const {withConfirmedPassword} = usePasswordConfirmedAction();
  const [suspensionOpen, setSuspensionOpen] = useState(false);
  const suspension = useMutation({
    ...suspendHostingAccountOptions(account.id),
    onError: error => showHttpErrorToast(error),
  });
  const reactivation = useMutation({
    ...reactivateHostingAccountOptions(account.id),
    onError: error => showHttpErrorToast(error),
  });
  const cancellation = useMutation({
    ...cancelHostingDeletionOptions(account.id),
    onError: error => showHttpErrorToast(error),
  });

  const deactivationQueued =
    account.status === 'active' && account.desired_status === 'suspended';
  const reactivationQueued =
    account.status === 'suspended' && account.desired_status === 'active';
  const deletionQueued =
    account.status === 'suspended' && account.desired_status === 'deleted';

  return (
    <Card.Root className="shadow-sm ring-border/80">
      <Card.Header className="border-b border-border/60 pb-5">
        <Card.Title>
          <Trans message="Gerenciar hospedagem" />
        </Card.Title>
      </Card.Header>
      <Card.Content className="space-y-2">
        <ManagementLink
          to={`/dashboard/hosting/${account.id}/domains`}
          icon={<Globe2Icon />}
          label={<Trans message="Domínios e subdomínios" />}
          description={<Trans message="Endereços e validação DNS" />}
        />
        <ManagementLink
          to={`/dashboard/hosting/${account.id}/databases`}
          icon={<DatabaseIcon />}
          label={<Trans message="Bancos de dados" />}
          description={
            account.tools.mysql ? (
              <Trans message="Criar e consultar bancos MySQL" />
            ) : (
              <Trans message="Integração ainda indisponível" />
            )
          }
        />
        <ManagementLink
          to={`/dashboard/hosting/${account.id}/credentials`}
          icon={<KeyRoundIcon />}
          label={<Trans message="Credenciais e senha" />}
          description={<Trans message="Acesso FTP e redefinição segura" />}
        />
        <ManagementLink
          to={`/dashboard/hosting/${account.id}/tools`}
          icon={<WrenchIcon />}
          label={<Trans message="Todas as ferramentas" />}
          description={<Trans message="Painel, instalador e integrações" />}
        />
        {account.status === 'active' &&
          (deactivationQueued ? (
            <Button
              variant="ghost"
              color="danger"
              className="w-full justify-start"
              disabled
            >
              <LoaderCircleIcon className="animate-spin" />
              <Trans message="Desativação solicitada" />
            </Button>
          ) : (
            <AlertDialog.Root
              open={suspensionOpen}
              onOpenChange={setSuspensionOpen}
            >
              <AlertDialog.Trigger
                render={
                  <Button
                    variant="ghost"
                    color="danger"
                    className="w-full justify-start"
                  />
                }
              >
                <PauseCircleIcon />
                <Trans message="Desativar hospedagem" />
              </AlertDialog.Trigger>
              <AlertDialog.Portal>
                <AlertDialog.Backdrop />
                <AlertDialog.Content className="max-w-md!">
                  <AlertDialog.Header>
                    <AlertDialog.Media className="bg-warning/10 text-warning">
                      <PauseCircleIcon />
                    </AlertDialog.Media>
                    <AlertDialog.Title>
                      <Trans message="Desativar esta hospedagem?" />
                    </AlertDialog.Title>
                    <AlertDialog.Description>
                      <Trans message="O site e as ferramentas ficarão indisponíveis, mas os arquivos e bancos de dados serão preservados. Você poderá reativar a hospedagem depois." />
                    </AlertDialog.Description>
                  </AlertDialog.Header>
                  <AlertDialog.Footer className="sm:flex-row sm:justify-end">
                    <AlertDialog.Cancel
                      className="min-h-11 sm:min-w-28"
                      disabled={suspension.isPending}
                    >
                      <Trans message="Cancelar" />
                    </AlertDialog.Cancel>
                    <AlertDialog.Action
                      color="danger"
                      className="min-h-11 min-w-fit px-5 text-background"
                      disabled={suspension.isPending}
                      onClick={() =>
                        withConfirmedPassword(() =>
                          suspension.mutate(undefined, {
                            onSuccess: () => {
                              setSuspensionOpen(false);
                              toast.success(
                                <Trans message="Desativação solicitada. O status será atualizado automaticamente." />,
                              );
                            },
                          }),
                        )
                      }
                    >
                      {suspension.isPending && (
                        <LoaderCircleIcon className="animate-spin" />
                      )}
                      <Trans message="Desativar hospedagem" />
                    </AlertDialog.Action>
                  </AlertDialog.Footer>
                </AlertDialog.Content>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          ))}

        {account.status === 'suspended' && !deletionQueued && (
          <Button
            variant="ghost"
            color="positive"
            className="w-full justify-start"
            disabled={reactivation.isPending || reactivationQueued}
            onClick={() =>
              reactivation.mutate(undefined, {
                onSuccess: () =>
                  toast.success(
                    <Trans message="Reativação solicitada. O status será atualizado automaticamente." />,
                  ),
              })
            }
          >
            {reactivation.isPending || reactivationQueued ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <PlayCircleIcon />
            )}
            {reactivationQueued ? (
              <Trans message="Reativação solicitada" />
            ) : (
              <Trans message="Reativar hospedagem" />
            )}
          </Button>
        )}

        {account.status === 'pending_deletion' && (
          <Button
            variant="ghost"
            className="w-full justify-start"
            disabled={!account.can_cancel_deletion || cancellation.isPending}
            onClick={() =>
              cancellation.mutate(undefined, {
                onSuccess: () =>
                  toast.success(<Trans message="Exclusão cancelada." />),
              })
            }
          >
            {cancellation.isPending ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <RotateCcwIcon />
            )}
            <Trans message="Cancelar exclusão" />
          </Button>
        )}

        {deletionQueued && (
          <Button
            variant="ghost"
            color="danger"
            className="w-full justify-start"
            disabled
          >
            <LoaderCircleIcon className="animate-spin" />
            <Trans message="Exclusão em andamento" />
          </Button>
        )}

        {account.status === 'suspended' &&
          !reactivationQueued &&
          !deletionQueued && (
            <HostingDeleteDialog
              account={account}
              variant="ghost"
              className="w-full justify-start"
            />
          )}
      </Card.Content>
    </Card.Root>
  );
}

function ManagementLink({
  to,
  icon,
  label,
  description,
}: {
  to: string;
  icon: ReactNode;
  label: ReactNode;
  description: ReactNode;
}) {
  return (
    <LinkButton
      to={to}
      variant="ghost"
      className="group h-auto min-h-14 w-full justify-start gap-3 px-2 py-2 text-start"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-card-xs bg-primary/8 text-primary [&_svg]:size-4">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
      <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </LinkButton>
  );
}
