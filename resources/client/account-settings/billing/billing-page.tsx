import {
  hostingAccountsOptions,
  hostingStatsOptions,
} from '@app/hosting/hosting-queries';
import {
  HostingAccount,
  HostingAccountStatus,
  HostingMetric,
} from '@app/hosting/hosting-types';
import {User} from '@app/gen/schemas/user';
import {ActiveTrialBanner} from '@common/billing/billing-page/active-trial-banner';
import {BillingPlanPanel} from '@common/billing/billing-page/billing-plan-panel';
import {InvoiceHistoryPanel} from '@common/billing/billing-page/panels/invoice-history-panel';
import {PaymentMethodPanel} from '@common/billing/billing-page/panels/payment-method-panel';
import {FormattedPrice} from '@common/billing/formatted-price';
import {Badge} from '@shadcn/badge/badge';
import {LinkButton} from '@shadcn/button/button';
import {Skeleton} from '@shadcn/skeleton/skeleton';
import {useQuery} from '@tanstack/react-query';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {Trans} from '@ui/i18n/trans';
import {
  CalendarDaysIcon,
  CircleDollarSignIcon,
  DatabaseIcon,
  Globe2Icon,
  HardDriveIcon,
  ServerIcon,
  ShieldCheckIcon,
  WalletCardsIcon,
  WifiIcon,
} from 'lucide-react';
import {ReactNode} from 'react';
import {useOutletContext} from 'react-router';

export function Component() {
  const user = useOutletContext<User>();
  const accountsQuery = useQuery(hostingAccountsOptions());
  const account = (accountsQuery.data ?? []).find(
    item => item.status !== 'deleted',
  );
  const statsQuery = useQuery(hostingStatsOptions(account?.id ?? null));
  const subscriptionBelongsToHosting = Boolean(
    user.subscription &&
    account?.plan?.product_id &&
    user.subscription.product?.id === account.plan.product_id,
  );
  const isLoading = accountsQuery.isLoading;

  return (
    <div className="mt-8">
      {subscriptionBelongsToHosting ? (
        <ActiveTrialBanner className="mb-8" />
      ) : null}

      <BillingIntroduction />

      {isLoading ? (
        <BillingSkeleton />
      ) : (
        <HostingPlanSummary
          account={account}
          user={user}
          subscriptionBelongsToHosting={subscriptionBelongsToHosting}
        />
      )}

      {account ? (
        <HostingUsagePanel
          account={account}
          metrics={statsQuery.data?.metrics ?? null}
          isLoading={statsQuery.isLoading}
          isAvailable={statsQuery.data?.availability === 'available'}
        />
      ) : null}

      {subscriptionBelongsToHosting ? (
        <>
          <PaymentMethodPanel />
          <InvoiceHistoryPanel />
        </>
      ) : (
        <FreeBillingDetails hasHosting={Boolean(account)} />
      )}
    </div>
  );
}

function BillingIntroduction() {
  return (
    <div className="mb-10 max-w-3xl">
      <h2 className="text-2xl font-semibold tracking-[-0.025em]">
        <Trans message="Plano, cobranças e faturas" />
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        <Trans message="Consulte o plano da sua hospedagem, os limites contratados e o histórico financeiro. Os dados desta página pertencem somente aos serviços de hospedagem." />
      </p>
    </div>
  );
}

function HostingPlanSummary({
  account,
  user,
  subscriptionBelongsToHosting,
}: {
  account?: HostingAccount;
  user: User;
  subscriptionBelongsToHosting: boolean;
}) {
  if (!account) {
    return (
      <BillingPlanPanel title={<Trans message="Plano de hospedagem" />}>
        <div className="flex flex-col gap-5 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ServerIcon className="size-5" />
            </span>
            <div>
              <div className="font-semibold">
                <Trans message="Você ainda não possui uma hospedagem" />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                <Trans message="Crie sua hospedagem gratuita para começar com um endereço hsite.top." />
              </p>
            </div>
          </div>
          <LinkButton to="/dashboard/hosting" color="primary">
            <Trans message="Criar hospedagem" />
          </LinkButton>
        </div>
      </BillingPlanPanel>
    );
  }

  const subscription = subscriptionBelongsToHosting ? user.subscription : null;
  const isPaid = account.plan?.type === 'paid';

  return (
    <BillingPlanPanel title={<Trans message="Plano de hospedagem" />}>
      <div className="flex flex-col gap-6 py-2 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-semibold">
              {account.plan?.name ?? <Trans message="Hospedagem" />}
            </h3>
            <HostingStatusBadge status={account.status} />
          </div>
          <div className="mt-2 flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
            <Globe2Icon className="size-4 shrink-0" />
            <span className="truncate">{account.fqdn}</span>
          </div>

          {subscription?.price ? (
            <FormattedPrice
              className="mt-4 text-lg"
              priceClassName="font-semibold"
              price={subscription.price}
            />
          ) : (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <CircleDollarSignIcon className="size-4 text-positive" />
              <span className="font-medium">
                <Trans message="Plano gratuito, sem cobrança recorrente" />
              </span>
            </div>
          )}

          {subscription?.renews_at ? (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDaysIcon className="size-4" />
              <span>
                <Trans message="Próxima renovação em" />{' '}
                <FormattedDate preset="long" date={subscription.renews_at} />
              </span>
            </div>
          ) : isPaid && !subscriptionBelongsToHosting ? (
            <p className="mt-3 max-w-xl text-sm text-warning">
              <Trans message="Os dados de cobrança deste plano ainda estão sendo sincronizados. Nenhuma assinatura de outro produto será exibida aqui." />
            </p>
          ) : null}
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-48">
          <LinkButton to="/dashboard/hosting/plans" color="primary">
            <Trans message="Ver planos de hospedagem" />
          </LinkButton>
          <LinkButton to={`/dashboard/hosting/${account.id}`} variant="outline">
            <Trans message="Gerenciar hospedagem" />
          </LinkButton>
          {subscriptionBelongsToHosting &&
          subscription?.gateway_name !== 'none' ? (
            <LinkButton to="cancel" variant="link" color="danger">
              <Trans message="Cancelar plano pago" />
            </LinkButton>
          ) : null}
        </div>
      </div>
    </BillingPlanPanel>
  );
}

function HostingUsagePanel({
  account,
  metrics,
  isLoading,
  isAvailable,
}: {
  account: HostingAccount;
  metrics: {
    disk: HostingMetric;
    bandwidth: HostingMetric;
    inodes: HostingMetric;
    domains: HostingMetric;
    databases: HostingMetric;
  } | null;
  isLoading: boolean;
  isAvailable: boolean;
}) {
  const packageMetrics = packageMetricsFor(account, metrics);
  const hasPackageDetails = Object.values(packageMetrics).some(
    metric => metric.limit != null,
  );
  const adFree = account.plan?.quotas.ad_free === true;

  return (
    <BillingPlanPanel title={<Trans message="Detalhes do pacote" />}>
      {isLoading && !hasPackageDetails ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-20 rounded-card" />
          <Skeleton className="h-20 rounded-card" />
        </div>
      ) : hasPackageDetails || (isAvailable && metrics) ? (
        <div>
          {!isAvailable ? (
            <p className="mb-6 max-w-3xl text-sm leading-6 text-muted-foreground">
              <Trans message="O uso atual não pôde ser consultado agora. Os limites contratados do seu pacote continuam disponíveis abaixo." />
            </p>
          ) : isLoading ? (
            <p className="mb-6 text-sm text-muted-foreground">
              <Trans message="Atualizando o uso atual da hospedagem..." />
            </p>
          ) : null}

          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            <MetricRow
              icon={<HardDriveIcon />}
              label={<Trans message="Espaço em disco" />}
              metric={packageMetrics.disk}
            />
            <MetricRow
              icon={<WifiIcon />}
              label={<Trans message="Tráfego mensal" />}
              metric={packageMetrics.bandwidth}
            />
            <MetricRow
              icon={<Globe2Icon />}
              label={<Trans message="Domínios permitidos" />}
              metric={packageMetrics.domains}
            />
            <MetricRow
              icon={<DatabaseIcon />}
              label={<Trans message="Bancos MySQL" />}
              metric={packageMetrics.databases}
            />
          </div>

          {adFree ? (
            <div className="mt-7 flex items-start gap-3 border-t pt-5">
              <ShieldCheckIcon className="mt-0.5 size-5 shrink-0 text-positive" />
              <div>
                <div className="text-sm font-medium">
                  <Trans message="Hospedagem sem anúncios" />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  <Trans message="O pacote não adiciona banners de publicidade ao seu site." />
                </p>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-4 py-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            <Trans message="Os detalhes deste pacote ainda não foram configurados. Isso não altera seu plano nem sua cobrança." />
          </p>
          <LinkButton
            to={`/dashboard/hosting/${account.id}`}
            variant="outline"
            size="sm"
          >
            <Trans message="Ver hospedagem" />
          </LinkButton>
        </div>
      )}
    </BillingPlanPanel>
  );
}

function MetricRow({
  icon,
  label,
  metric,
}: {
  icon: ReactNode;
  label: ReactNode;
  metric: PackageMetric;
}) {
  const percentage = metricPercentage(metric);

  return (
    <div>
      <div className="flex items-center justify-between gap-4 text-sm">
        <div className="flex items-center gap-2 font-medium">
          <span className="text-primary [&>svg]:size-4">{icon}</span>
          {label}
        </div>
        <span className="text-right text-muted-foreground">
          {formatMetric(metric)}
        </span>
      </div>
      {percentage != null ? (
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percentage}
        >
          <div
            className="h-full rounded-full bg-primary"
            style={{width: `${percentage}%`}}
          />
        </div>
      ) : null}
    </div>
  );
}

function FreeBillingDetails({hasHosting}: {hasHosting: boolean}) {
  return (
    <div className="grid gap-x-10 md:grid-cols-2">
      <BillingPlanPanel title={<Trans message="Forma de pagamento" />}>
        <div className="flex items-start gap-3">
          <WalletCardsIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          <div>
            <div className="font-medium">
              <Trans message="Nenhuma forma de pagamento necessária" />
            </div>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {hasHosting ? (
                <Trans message="Seu plano gratuito não gera cobranças. Uma forma de pagamento será solicitada somente ao contratar um plano pago." />
              ) : (
                <Trans message="Você ainda não contratou um plano pago." />
              )}
            </p>
          </div>
        </div>
      </BillingPlanPanel>

      <BillingPlanPanel title={<Trans message="Faturas" />}>
        <div className="flex items-start gap-3">
          <CircleDollarSignIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          <div>
            <div className="font-medium">
              <Trans message="Nenhuma fatura de hospedagem" />
            </div>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              <Trans message="As faturas dos planos pagos aparecerão aqui após a confirmação da cobrança." />
            </p>
          </div>
        </div>
      </BillingPlanPanel>
    </div>
  );
}

function HostingStatusBadge({status}: {status: HostingAccountStatus}) {
  const variant = status === 'active' ? 'positive' : 'outline';

  return (
    <Badge variant={variant}>
      {status === 'active' ? (
        <Trans message="Ativa" />
      ) : status === 'provisioning' || status === 'pending' ? (
        <Trans message="Em processamento" />
      ) : status === 'suspended' ? (
        <Trans message="Suspensa" />
      ) : status === 'pending_deletion' || status === 'deleting' ? (
        <Trans message="Exclusão agendada" />
      ) : status === 'pending_downgrade' ? (
        <Trans message="Alteração de plano pendente" />
      ) : (
        <Trans message="Atenção necessária" />
      )}
    </Badge>
  );
}

function BillingSkeleton() {
  return (
    <div className="mb-16 space-y-3" aria-label="Carregando faturamento">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-36 w-full rounded-card" />
    </div>
  );
}

function metricPercentage(metric: HostingMetric): number | null {
  if (metric.used == null || metric.limit == null || metric.limit <= 0) {
    return null;
  }

  return Math.min(
    100,
    Math.max(0, Math.round((metric.used / metric.limit) * 100)),
  );
}

type PackageMetric = HostingMetric & {limitLabel?: string};

function packageMetricsFor(
  account: HostingAccount,
  metrics: {
    disk: HostingMetric;
    bandwidth: HostingMetric;
    domains: HostingMetric;
    databases: HostingMetric;
  } | null,
): Record<'disk' | 'bandwidth' | 'domains' | 'databases', PackageMetric> {
  const quotas = account.plan?.quotas ?? {};

  return {
    disk: withPackageLimit(metrics?.disk, quotaNumber(quotas.disk_mb), 'disk'),
    bandwidth: withPackageLimit(
      metrics?.bandwidth,
      quotaNumber(quotas.bandwidth_mb),
      'bandwidth',
    ),
    domains: withCountLimit(metrics?.domains, quotaNumber(quotas.domains)),
    databases: withCountLimit(
      metrics?.databases,
      quotaNumber(quotas.databases),
    ),
  };
}

function withPackageLimit(
  metric: HostingMetric | undefined,
  limitMb: number | null,
  kind: 'disk' | 'bandwidth',
): PackageMetric {
  const fallbackLimit =
    limitMb == null ? null : packageMegabytesToBytes(limitMb, kind);

  return {
    used: metric?.used ?? null,
    limit: fallbackLimit ?? metric?.limit ?? null,
    unit: 'bytes',
    limitLabel: limitMb == null ? undefined : formatPackageMegabytes(limitMb),
  };
}

function withCountLimit(
  metric: HostingMetric | undefined,
  limit: number | null,
): PackageMetric {
  return {
    used: metric?.used ?? null,
    limit: limit ?? metric?.limit ?? null,
    unit: 'count',
  };
}

function quotaNumber(
  value: string | number | boolean | undefined,
): number | null {
  if (typeof value === 'boolean' || value == null || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function packageMegabytesToBytes(
  value: number,
  kind: 'disk' | 'bandwidth',
): number {
  const gigabytes = kind === 'bandwidth' ? value / 1000 : value / 1024;
  return gigabytes * 1024 ** 3;
}

function formatPackageMegabytes(value: number): string {
  const divisor = value % 1024 === 0 ? 1024 : 1000;
  const gigabytes = value / divisor;

  return `${new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 1,
  }).format(gigabytes)} GB`;
}

function formatMetric(metric: PackageMetric): string {
  const formattedLimit =
    metric.limitLabel ??
    (metric.limit == null
      ? null
      : metric.unit === 'bytes'
        ? formatBytes(metric.limit)
        : new Intl.NumberFormat('pt-BR').format(metric.limit));

  if (metric.used == null) {
    return formattedLimit ? `Limite de ${formattedLimit}` : '—';
  }

  if (metric.unit === 'bytes') {
    const used = formatBytes(metric.used);

    return formattedLimit ? `${used} de ${formattedLimit}` : `${used} usados`;
  }

  const used = new Intl.NumberFormat('pt-BR').format(metric.used);
  return formattedLimit ? `${used} de ${formattedLimit}` : `${used} usados`;
}

function formatBytes(value: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let amount = Math.max(0, value);
  let unit = 0;

  while (amount >= 1024 && unit < units.length - 1) {
    amount /= 1024;
    unit++;
  }

  return `${new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: amount >= 10 || unit === 0 ? 0 : 1,
  }).format(amount)} ${units[unit]}`;
}
