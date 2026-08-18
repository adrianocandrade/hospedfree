import {
  hostingAccountsOptions,
  hostingActivityOptions,
  hostingStatsOptions,
} from '@app/hosting/hosting-queries';
import {
  HostingAccount,
  HostingAccountActivity,
  HostingAccountStatus,
  HostingStats,
} from '@app/hosting/hosting-types';
import {formatHostingDate} from '@app/hosting/format-hosting-date';
import {
  HostingResourceUsage,
  resolveHostingResourceSummary,
} from '@app/hosting/hosting-resource-usage';
import {useAuth} from '@common/auth/use-auth';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {DashboardLayout} from '@common/ui/dashboard/dashboard-layout';
import {Button} from '@shadcn/button/button';
import {Dropdown} from '@shadcn/dropdown/dropdown';
import {Skeleton} from '@shadcn/skeleton/skeleton';
import {useQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {
  ActivityIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  CircleHelpIcon,
  CloudIcon,
  DatabaseIcon,
  FileIcon,
  Globe2Icon,
  LifeBuoyIcon,
  ServerIcon,
  ShieldCheckIcon,
  CrownIcon,
  ClockIcon,
  CheckIcon,
  CircleGaugeIcon,
} from 'lucide-react';
import {ReactNode} from 'react';
import {Link, useSearchParams} from 'react-router';

export function Component() {
  const {user} = useAuth();
  const accountsQuery = useQuery(hostingAccountsOptions());
  const [searchParams, setSearchParams] = useSearchParams();

  const accounts = (accountsQuery.data ?? []).filter(
    account => account.status !== 'deleted',
  );
  const requestedId = Number(searchParams.get('account'));
  const account =
    accounts.find(item => item.id === requestedId) ??
    accounts.find(item => item.status === 'active') ??
    accounts[0] ??
    null;
  const statsQuery = useQuery(hostingStatsOptions(account?.id ?? null));
  const activityQuery = useQuery(hostingActivityOptions(account?.id ?? null));

  if (accountsQuery.isLoading) {
    return <DashboardHomeSkeleton />;
  }

  if (!account) {
    return <EmptyDashboard name={firstName(user?.name)} />;
  }

  const selectAccount = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('account', id);
    setSearchParams(next, {replace: true});
  };

  const databaseCount = statsQuery.data?.metrics?.databases.used ?? null;
  const domainCount = statsQuery.data?.metrics?.domains.used ?? null;
  const sslCount = 0;

  return (
    <DashboardLayout.MainSection>
      <StaticPageTitle>
        <Trans message="Visão geral" />
      </StaticPageTitle>

      <DashboardLayout.SectionContent>
        <DashboardLayout.SectionScrollContainer>
          <main className="mx-auto w-full max-w-7xl space-y-6 px-4 pt-6 pb-12 sm:px-6">
            <div className="grid gap-6 xl:grid-cols-5">
              <div className="xl:col-span-3">
                <AccountHero
                  account={account}
                  name={firstName(user?.name)}
                  accounts={accounts}
                  onChangeAccount={selectAccount}
                />
              </div>
              <div className="xl:col-span-2">
                <AccountSummaryGrid
                  accountCount={accounts.length}
                  databaseCount={databaseCount}
                  domainCount={domainCount}
                  sslCount={sslCount}
                />
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-5">
              <div className="xl:col-span-3">
                <ResourceUsage
                  account={account}
                  stats={statsQuery.data}
                  loading={statsQuery.isLoading}
                />
              </div>
              <div className="xl:col-span-2">
                <QuickActions account={account} />
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-5">
              <div className="grid gap-6 sm:grid-cols-3 xl:col-span-3">
                <PrimaryDomainCard account={account} />
                <HostingCard account={account} />
                <PlanCard account={account} />
              </div>
              <div className="grid gap-6 sm:grid-cols-2 xl:col-span-2">
                <RecentActivity
                  activities={activityQuery.data ?? []}
                  loading={activityQuery.isLoading}
                />
                <NotificationsCard />
              </div>
            </div>

            <HelpBanner />
          </main>
        </DashboardLayout.SectionScrollContainer>
      </DashboardLayout.SectionContent>
    </DashboardLayout.MainSection>
  );
}

function DashboardAccountSelector({
  accounts,
  account,
  onChange,
}: {
  accounts: HostingAccount[];
  account: HostingAccount;
  onChange: (id: string) => void;
}) {
  if (accounts.length <= 1) {
    return null;
  }

  return (
    <Dropdown.Root>
      <Dropdown.Trigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          />
        }
      >
        <span className="max-w-32 truncate sm:max-w-xs">{account.fqdn}</span>
        <ChevronDownIcon className="ml-2 size-4" />
      </Dropdown.Trigger>
      <Dropdown.Content>
        <Dropdown.RadioGroup value={`${account.id}`} onValueChange={onChange}>
          {accounts.map(item => (
            <Dropdown.RadioItem value={`${item.id}`} key={item.id}>
              {item.fqdn}
            </Dropdown.RadioItem>
          ))}
        </Dropdown.RadioGroup>
      </Dropdown.Content>
    </Dropdown.Root>
  );
}

function AccountHero({
  account,
  name,
  accounts,
  onChangeAccount,
}: {
  account: HostingAccount;
  name: string;
  accounts: HostingAccount[];
  onChangeAccount: (id: string) => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-indigo-950 via-slate-900 to-[#0B0F19] p-6 text-white shadow-md sm:p-8">
      <div className="pointer-events-none absolute -top-12 -right-12 opacity-10">
        <CloudIcon className="size-64 text-indigo-500 blur-sm" />
      </div>

      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
              <Trans message="Olá, :name!" values={{name}} />{' '}
              <span className="text-2xl">👋</span>
            </h1>
            <p className="mt-1 text-sm text-indigo-200">
              <Trans message="Aqui está um resumo da sua hospedagem." />
            </p>
          </div>

          <DashboardAccountSelector
            accounts={accounts}
            account={account}
            onChange={onChangeAccount}
          />
        </div>

        <div className="mt-10 flex flex-wrap gap-x-8 gap-y-6 rounded-xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
          <HeroFact
            icon={<ServerIcon />}
            label={<Trans message="Plano atual" />}
            value={account.plan?.name ?? '—'}
          />
          <HeroFact
            icon={<Globe2Icon />}
            label={<Trans message="Domínio principal" />}
            value={account.fqdn}
          />
          <HeroFact
            icon={<CheckCircle2Icon className="text-emerald-400" />}
            label={<Trans message="Status" />}
            value={
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                <StatusText status={account.status} />
              </span>
            }
          />
          <HeroFact
            icon={<FileIcon />}
            label={<Trans message="Criado em" />}
            value={formatHostingDate(account.created_at)}
          />
        </div>
      </div>
    </section>
  );
}

function HeroFact({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: ReactNode;
  value: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-indigo-300 [&>svg]:size-5">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-medium text-indigo-200/70">
          {label}
        </div>
        <div className="mt-0.5 truncate text-sm font-bold text-white">
          {value}
        </div>
      </div>
    </div>
  );
}

function AccountSummaryGrid({
  accountCount,
  databaseCount,
  domainCount,
  sslCount,
}: {
  accountCount: number;
  databaseCount: number | null;
  domainCount: number | null;
  sslCount: number;
}) {
  return (
    <div className="h-full rounded-2xl border bg-card p-6 shadow-sm">
      <h3 className="mb-5 text-base font-semibold">
        <Trans message="Resumo da conta" />
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <SummaryBox
          icon={<Globe2Icon />}
          count={domainCount}
          label={<Trans message="Domínio" />}
        />
        <SummaryBox
          icon={<ServerIcon />}
          count={accountCount}
          label={<Trans message="Conta de hospedagem" />}
        />
        <SummaryBox
          icon={<DatabaseIcon />}
          count={databaseCount}
          label={<Trans message="Bancos de dados" />}
        />
        <SummaryBox
          icon={<ShieldCheckIcon />}
          count={sslCount}
          label={<Trans message="Certificados SSL" />}
        />
      </div>
    </div>
  );
}

function SummaryBox({
  icon,
  count,
  label,
}: {
  icon: ReactNode;
  count: number | null;
  label: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-4 transition-colors hover:bg-muted/40 dark:bg-white/[0.02] dark:hover:bg-white/[0.04]">
      <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </span>
      <div>
        <div className="text-xl font-bold">{count ?? '—'}</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function CircularProgress({
  percentage,
  label,
  usage,
  colorClass,
}: {
  percentage: number | null;
  label: ReactNode;
  usage: HostingResourceUsage;
  colorClass: string;
}) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    percentage == null
      ? circumference
      : circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex size-20 items-center justify-center">
        <svg
          className="size-full -rotate-90 transform overflow-visible drop-shadow-sm"
          viewBox="0 0 100 100"
        >
          <circle
            className="stroke-current text-muted/50"
            strokeWidth="10"
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
          />
          <circle
            className={`${colorClass} stroke-current transition-all duration-1000 ease-in-out`}
            strokeWidth="10"
            strokeLinecap="round"
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-[13px] font-bold">
          {percentage == null ? '—' : `${percentage}%`}
        </div>
      </div>
      <div>
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="mt-1 text-[13px] font-bold">
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
    </div>
  );
}

function ResourceUsage({
  account,
  stats,
  loading,
}: {
  account: HostingAccount;
  stats?: HostingStats;
  loading: boolean;
}) {
  const usage = resolveHostingResourceSummary(account, stats);

  return (
    <div className="h-full rounded-2xl border bg-card p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-base font-semibold">
          <Trans message="Uso de recursos" />
          <span className="ml-2 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <CircleGaugeIcon className="size-3" />
            {usage.hasMeasuredUsage ? (
              <Trans message="Consumo sincronizado" />
            ) : (
              <Trans message="Limites do plano" />
            )}
          </span>
        </h3>
        {account.plan?.quotas?.ad_free === true && (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
            <ShieldCheckIcon className="size-3.5" />
            <Trans message="Sem anúncios" />
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Skeleton className="h-full w-full" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <CircularProgress
              percentage={usage.disk.percentage}
              label={<Trans message="Disco" />}
              usage={usage.disk}
              colorClass="text-indigo-500"
            />
            <CircularProgress
              percentage={usage.bandwidth.percentage}
              label={<Trans message="Tráfego" />}
              usage={usage.bandwidth}
              colorClass="text-indigo-500"
            />
            <PlanCount
              icon={<Globe2Icon />}
              label={<Trans message="Domínios" />}
              usage={usage.domains}
            />
            <PlanCount
              icon={<DatabaseIcon />}
              label={<Trans message="Bancos MySQL" />}
              usage={usage.databases}
            />
          </div>
          {!usage.hasMeasuredUsage && (
            <div className="flex items-start gap-3 rounded-card-sm bg-muted/40 p-4">
              <CircleHelpIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  <Trans message="Limites do plano disponíveis" />
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  <Trans message="O consumo atual será preenchido automaticamente assim que o painel concluir a sincronização." />
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PlanCount({
  icon,
  label,
  usage,
}: {
  icon: ReactNode;
  label: ReactNode;
  usage: HostingResourceUsage;
}) {
  return (
    <div className="flex min-w-0 items-center gap-4 rounded-xl bg-muted/25 p-4 ring-1 ring-foreground/7 ring-inset">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary [&>svg]:size-5">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="mt-1 text-sm leading-tight font-bold">
          {usage.usedLabel && usage.limitLabel ? (
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
    </div>
  );
}

function QuickActions({account}: {account: HostingAccount}) {
  const actions = [
    {
      key: 'files',
      label: <Trans message="Gerenciar arquivos" />,
      icon: FileIcon,
      to: `/dashboard/hosting/${account.id}/files`,
      available: account.tools.file_manager || account.tools.webftp,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      key: 'databases',
      label: <Trans message="Criar banco de dados" />,
      icon: DatabaseIcon,
      to: `/dashboard/hosting/${account.id}/databases`,
      available: account.tools.mysql,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      key: 'email',
      label: <Trans message="Configurar e-mail" />,
      icon: ActivityIcon,
      to: `/dashboard/hosting/${account.id}/tools`,
      available: true,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      key: 'domain',
      label: <Trans message="Verificar domínio" />,
      icon: Globe2Icon,
      to: `/dashboard/hosting/${account.id}/domains`,
      available: true,
      color: 'text-teal-500',
      bg: 'bg-teal-500/10',
    },
    {
      key: 'apps',
      label: <Trans message="Instalar aplicativo" />,
      icon: ServerIcon,
      to: `/dashboard/hosting/${account.id}/tools`,
      available: account.tools.installer,
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
    },
    {
      key: 'backup',
      label: <Trans message="Gerar backup" />,
      icon: CloudIcon,
      to: `/dashboard/hosting/${account.id}/tools`,
      available: true,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
  ];

  return (
    <div className="h-full rounded-2xl border bg-card p-6 shadow-sm">
      <h3 className="mb-5 text-base font-semibold">
        <Trans message="Ações rápidas" />
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {actions.map(action => (
          <Link
            key={action.key}
            to={action.available ? action.to : '#'}
            aria-disabled={!action.available}
            onClick={(event: any) =>
              !action.available && event.preventDefault()
            }
            className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-muted/20 p-4 text-center transition-colors hover:bg-muted/40 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:bg-white/[0.02] dark:hover:bg-white/[0.04]"
          >
            <span
              className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${action.bg} ${action.color}`}
            >
              <action.icon className="size-6" />
            </span>
            <span className="text-[11px] leading-tight font-medium text-muted-foreground">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function PrimaryDomainCard({account}: {account: HostingAccount}) {
  return (
    <div className="relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-2xl border bg-card p-6 shadow-sm">
      <div className="pointer-events-none absolute -right-4 -bottom-4 opacity-[0.03] dark:opacity-10">
        <Globe2Icon className="size-32" />
      </div>
      <div className="relative z-10">
        <p className="mb-2 text-[11px] font-medium text-muted-foreground">
          <Trans message="Domínio principal" />
        </p>
        <p className="truncate pr-4 text-base font-bold">{account.fqdn}</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 uppercase dark:text-emerald-400">
            <Trans message="Ativo" />
          </span>
          <span className="text-[10px] text-muted-foreground">
            Expira em: —
          </span>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="mt-6 w-fit border-border bg-transparent hover:bg-muted/50"
        nativeButton={false}
        render={<Link to={`/dashboard/hosting/${account.id}/domains`} />}
      >
        <Trans message="Gerenciar domínio" />
      </Button>
    </div>
  );
}

function HostingCard({account}: {account: HostingAccount}) {
  return (
    <div className="relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-2xl border bg-card p-6 shadow-sm">
      <div>
        <p className="mb-4 text-[11px] font-medium text-muted-foreground">
          <Trans message="Hospedagem" />
        </p>
        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
            <ServerIcon className="size-6" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">
              <Trans message="Hospedagem Free" />
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600 uppercase dark:text-emerald-400">
                <Trans message="Ativo" />
              </span>
            </div>
          </div>
        </div>
        <p className="mt-4 text-[10px] text-muted-foreground">
          <Trans message="Conta criada em:" />{' '}
          {formatHostingDate(account.created_at)}
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="mt-6 w-fit border-border bg-transparent hover:bg-muted/50"
        nativeButton={false}
        render={<Link to={`/dashboard/hosting/${account.id}`} />}
      >
        <Trans message="Gerenciar hospedagem" />
      </Button>
    </div>
  );
}

function PlanCard({account}: {account: HostingAccount}) {
  return (
    <div className="relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-[#0B0F19] p-6 text-white shadow-sm">
      <div className="pointer-events-none absolute top-1/2 -right-4 -translate-y-1/2 opacity-[0.15]">
        <CrownIcon className="size-32 text-indigo-300" />
      </div>
      <div className="relative z-10 flex h-full gap-4">
        <div className="flex h-full w-full flex-col justify-between">
          <p className="mb-2 text-[11px] font-medium text-indigo-200/80">
            <Trans message="Planos" />
          </p>
          <div>
            <p className="text-[10px] text-indigo-300">
              <Trans message="Plano atual" />
            </p>
            <p className="mt-0.5 text-base font-bold">
              {account.plan?.name ?? '—'}
            </p>
            <p className="mt-2 max-w-[80%] text-[11px] leading-relaxed text-indigo-200/90">
              <Trans message="Faça upgrade e tenha mais recursos!" />
            </p>
          </div>
          <Button
            size="sm"
            className="mt-6 w-fit border-0 bg-indigo-500 text-white hover:bg-indigo-600"
            nativeButton={false}
            render={<Link to="/dashboard/hosting/plans" />}
          >
            <Trans message="Ver planos" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function RecentActivity({
  activities,
  loading,
}: {
  activities: HostingAccountActivity[];
  loading: boolean;
}) {
  return (
    <div className="flex min-h-[220px] flex-col rounded-2xl border bg-card p-6 shadow-sm">
      <h3 className="mb-5 text-base font-semibold">
        <Trans message="Últimos acessos" />
      </h3>
      <div className="flex-1">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : activities.length ? (
          <div className="flex flex-col">
            {activities.slice(0, 2).map(activity => (
              <div
                key={activity.id}
                className="flex items-center gap-3 border-b border-border/50 py-2.5 first:pt-0 last:border-0 last:pb-0"
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted/40 text-muted-foreground">
                  <ClockIcon className="size-3" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="truncate text-[11px] font-medium text-foreground">
                    <ActivityLabel activity={activity} />
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {formatHostingDate(activity.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            <Trans message="Nenhuma atividade recente para exibir." />
          </p>
        )}
      </div>
      <Link
        to="#"
        className="mt-4 block text-[11px] font-medium text-indigo-500 hover:underline"
      >
        <Trans message="Ver histórico completo" />
      </Link>
    </div>
  );
}

function NotificationsCard() {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border bg-card p-6 text-center shadow-sm">
      <h3 className="mb-2 self-start text-base font-semibold">
        <Trans message="Notificações" />
      </h3>
      <div className="flex w-full flex-1 flex-col items-center justify-center">
        <span className="mb-3 flex size-12 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 shadow-sm">
          <CheckIcon className="size-6" />
        </span>
        <p className="text-sm font-bold">
          <Trans message="Tudo certo!" />
        </p>
        <p className="mt-1.5 max-w-[160px] text-[11px] leading-relaxed text-muted-foreground">
          <Trans message="Nenhuma notificação no momento." />
        </p>
      </div>
      <Link
        to="#"
        className="mt-4 self-start text-[11px] font-medium text-indigo-500 hover:underline"
      >
        <Trans message="Ver todas" />
      </Link>
    </div>
  );
}

function HelpBanner() {
  return (
    <div className="relative mt-10 overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-r from-indigo-950 via-slate-900 to-[#0B0F19] text-white shadow-lg">
      <div className="pointer-events-none absolute top-0 right-0 p-8 opacity-10">
        <LifeBuoyIcon className="size-48 text-indigo-300" />
      </div>
      <div className="relative z-10 grid gap-0 md:grid-cols-2">
        <div className="flex flex-col items-start gap-6 border-b border-white/10 p-8 sm:flex-row sm:items-center md:border-r md:border-b-0">
          <div className="flex-shrink-0 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner backdrop-blur-sm">
            <BookOpenIcon className="size-10 text-indigo-400" />
          </div>
          <div>
            <p className="text-base font-bold text-white">
              <Trans message="Precisa de ajuda?" />
            </p>
            <p className="mt-1.5 mb-5 text-xs leading-relaxed text-indigo-200/70">
              <Trans message="Acesse nossa base de conhecimento com tutoriais passo a passo e guias completos." />
            </p>
            <Button
              size="sm"
              className="border-none bg-indigo-600 px-6 text-white hover:bg-indigo-500"
              nativeButton={false}
              render={<Link to="/faq" />}
            >
              <Trans message="Acessar documentação" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-start gap-6 p-8 sm:flex-row sm:items-center">
          <div className="flex-shrink-0 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner backdrop-blur-sm">
            <LifeBuoyIcon className="size-10 text-indigo-400" />
          </div>
          <div>
            <p className="text-base font-bold text-white">
              <Trans message="Não encontrou o que precisa?" />
            </p>
            <p className="mt-1.5 mb-5 text-xs leading-relaxed text-indigo-200/70">
              <Trans message="Nossa equipe de suporte está pronta para te ajudar com qualquer problema." />
            </p>
            <Button
              size="sm"
              className="border border-white/20 bg-white/10 px-6 text-white hover:bg-white/20"
              nativeButton={false}
              render={<Link to="/dashboard/support" />}
            >
              <Trans message="Abrir ticket" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusText({status}: {status: HostingAccountStatus}) {
  if (status === 'active') return <Trans message="Ativo" />;
  if (status === 'provisioning' || status === 'pending')
    return <Trans message="Em preparação" />;
  if (status === 'pending_deletion' || status === 'deleting')
    return <Trans message="Exclusão agendada" />;
  if (status === 'suspended') return <Trans message="Suspenso" />;
  if (status === 'action_required') return <Trans message="Ação necessária" />;
  if (status === 'pending_downgrade')
    return <Trans message="Alteração pendente" />;
  return <Trans message="Com falha" />;
}

function ActivityLabel({activity}: {activity: HostingAccountActivity}) {
  if (activity.event.includes('provision'))
    return <Trans message="Conta provisionada" />;
  if (activity.event.includes('password'))
    return <Trans message="Senha alterada" />;
  if (activity.event.includes('deletion'))
    return <Trans message="Exclusão atualizada" />;
  if (activity.event.includes('tool'))
    return <Trans message="Acesso ao painel" />;
  if (activity.to_status) return <Trans message="Estado atualizado" />;
  return <Trans message="Hospedagem atualizada" />;
}

function firstName(name?: string | null): string {
  return name?.trim().split(/\s+/)[0] || 'cliente';
}

function EmptyDashboard({name}: {name: string}) {
  return (
    <DashboardLayout.MainSection>
      <StaticPageTitle>
        <Trans message="Visão geral" />
      </StaticPageTitle>
      <DashboardLayout.SectionHeader>
        <DashboardLayout.SidebarToggle />
        <DashboardLayout.SectionTitle>
          <Trans message="Visão geral" />
        </DashboardLayout.SectionTitle>
      </DashboardLayout.SectionHeader>
      <DashboardLayout.SectionContent className="items-center justify-center">
        <div className="max-w-lg text-center">
          <span className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ServerIcon className="size-8" />
          </span>
          <h1 className="text-2xl font-bold">
            <Trans
              message="Olá, :name. Vamos publicar seu site?"
              values={{name}}
            />
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            <Trans message="Crie sua primeira hospedagem para acompanhar domínio, recursos e ferramentas nesta página." />
          </p>
          <Button
            className="mt-8 px-8"
            nativeButton={false}
            render={<Link to="/dashboard/hosting" />}
          >
            <Trans message="Criar hospedagem" />
          </Button>
        </div>
      </DashboardLayout.SectionContent>
    </DashboardLayout.MainSection>
  );
}

function DashboardHomeSkeleton() {
  return (
    <DashboardLayout.MainSection>
      <DashboardLayout.SectionHeader>
        <DashboardLayout.SidebarToggle />
        <Skeleton className="h-6 w-40" />
      </DashboardLayout.SectionHeader>
      <DashboardLayout.SectionContent>
        <div className="mx-auto w-full max-w-7xl space-y-6 px-4 pt-6">
          <div className="grid gap-6 xl:grid-cols-5">
            <Skeleton className="h-64 rounded-2xl xl:col-span-3" />
            <Skeleton className="h-64 rounded-2xl xl:col-span-2" />
          </div>
          <div className="grid gap-6 xl:grid-cols-5">
            <Skeleton className="h-48 rounded-2xl xl:col-span-3" />
            <Skeleton className="h-48 rounded-2xl xl:col-span-2" />
          </div>
        </div>
      </DashboardLayout.SectionContent>
    </DashboardLayout.MainSection>
  );
}
