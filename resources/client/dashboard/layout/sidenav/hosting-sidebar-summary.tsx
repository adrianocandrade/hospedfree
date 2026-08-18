import {
  hostingAccountsOptions,
  hostingPlansOptions,
  hostingStatsOptions,
} from '@app/hosting/hosting-queries';
import {
  HostingResourceUsage,
  resolveHostingResourceSummary,
} from '@app/hosting/hosting-resource-usage';
import {
  getHostingPlanDetails,
  getPreferredPaidHostingPlan,
} from '@app/hosting/hosting-plan-presentation';
import {Button} from '@shadcn/button/button';
import {useQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {CircleGaugeIcon, SparklesIcon, CrownIcon} from 'lucide-react';
import {ReactNode} from 'react';
import {Link, useParams, useSearchParams} from 'react-router';

export function HostingSidebarSummary() {
  const accountsQuery = useQuery(hostingAccountsOptions());
  const plansQuery = useQuery(hostingPlansOptions());
  const {accountId} = useParams();
  const [searchParams] = useSearchParams();
  const requestedId = Number(accountId ?? searchParams.get('account'));
  const accounts = (accountsQuery.data ?? []).filter(
    account => account.status !== 'deleted',
  );
  const account =
    accounts.find(item => item.id === requestedId) ??
    accounts.find(item => item.status === 'active') ??
    accounts[0] ??
    null;
  const stats = useQuery(hostingStatsOptions(account?.id ?? null));
  const paidPlan = getPreferredPaidHostingPlan(plansQuery.data ?? []);

  if (!account) return null;

  const usage = resolveHostingResourceSummary(account, stats.data);

  return (
    <div className="mt-auto space-y-3 px-3 pb-3">
      {account.plan?.type === 'free' && paidPlan ? (
        <section className="relative overflow-hidden rounded-card-sm border border-white/10 bg-[#171831] p-4 text-white shadow-md">
          <div className="pointer-events-none absolute -top-4 -right-4 opacity-10">
            <CrownIcon className="size-24 text-indigo-300" />
          </div>
          <div className="relative z-10">
            <CrownIcon className="mb-2.5 size-5 text-indigo-400" />
            <p className="text-[15px] leading-tight font-bold text-white">
              <Trans
                message={
                  paidPlan.purchase_available ? 'Upgrade para o' : 'Conheça o'
                }
              />
              <br />
              {paidPlan.product.name}
            </p>

            {getHostingPlanDetails(paidPlan).length > 0 && (
              <ul className="mt-4 space-y-2.5 text-[13px] text-indigo-100/90">
                {getHostingPlanDetails(paidPlan)
                  .slice(0, 4)
                  .map(feature => (
                    <li key={feature} className="flex items-center gap-2.5">
                      <SparklesIcon className="size-3.5 shrink-0 text-indigo-400" />
                      <span className="line-clamp-1">{feature}</span>
                    </li>
                  ))}
              </ul>
            )}

            <Button
              size="sm"
              className="mt-5 w-full border-0 bg-white/10 text-white transition-colors hover:bg-white/20"
              nativeButton={false}
              render={<Link to="/dashboard/hosting/plans" />}
            >
              <Trans
                message={
                  paidPlan.purchase_available ? 'Ver planos' : 'Comparar planos'
                }
              />
            </Button>
          </div>
        </section>
      ) : (
        <section className="rounded-card-sm border p-3.5">
          <p className="text-xs text-muted-foreground">
            <Trans message="Plano atual" />
          </p>
          <p className="mt-1 truncate text-sm font-semibold">
            {account.plan?.name ?? '—'}
          </p>
          {account.plan?.quotas?.ad_free === true && (
            <p className="mt-1 flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300">
              <SparklesIcon className="size-3" />
              <Trans message="Sem anúncios" />
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            nativeButton={false}
            render={<Link to="/dashboard/hosting/plans" />}
          >
            <Trans message="Gerenciar plano" />
          </Button>
        </section>
      )}

      <section className="rounded-card-sm border p-3.5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <CircleGaugeIcon className="size-4 text-primary" />
          <Trans message="Uso de recursos" />
        </div>
        <div className="mt-4 space-y-4">
          <CompactMeter label={<Trans message="Disco" />} usage={usage.disk} />
          <CompactMeter
            label={<Trans message="Tráfego" />}
            usage={usage.bandwidth}
          />
        </div>
        {!usage.hasMeasuredUsage && (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            <Trans message="Limites do plano exibidos. O consumo atual aguarda sincronização." />
          </p>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full"
          nativeButton={false}
          render={<Link to={`/dashboard/hosting/${account.id}`} />}
        >
          <Trans message="Ver detalhes" />
        </Button>
      </section>
    </div>
  );
}

function CompactMeter({
  label,
  usage,
}: {
  label: ReactNode;
  usage: HostingResourceUsage;
}) {
  const percentage = usage.percentage;

  return (
    <div className="space-y-1.5 text-xs">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="font-medium">{label}</span>
        <span className="font-semibold text-foreground">
          {usage.usedLabel ? (
            usage.valueLabel
          ) : usage.limitLabel ? (
            <Trans message="Limite :limit" values={{limit: usage.limitLabel}} />
          ) : (
            '—'
          )}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div
          className="relative h-2 flex-1 overflow-hidden rounded-full bg-primary/20"
          role={percentage == null ? undefined : 'progressbar'}
          aria-valuenow={percentage ?? undefined}
          aria-valuemin={percentage == null ? undefined : 0}
          aria-valuemax={percentage == null ? undefined : 100}
        >
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{width: `${percentage ?? 0}%`}}
          />
        </div>
        <span className="w-8 text-right font-medium text-muted-foreground">
          {percentage == null ? '—' : `${percentage}%`}
        </span>
      </div>
    </div>
  );
}
