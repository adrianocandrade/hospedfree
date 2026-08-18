import {UpsellBillingCycle} from '@common/billing/pricing-table/find-best-price';
import {HostingPlan} from './hosting-types';

export type HostingPlanPrice = HostingPlan['prices'][number];
export type HostingPlanLimitKey =
  | 'disk_mb'
  | 'bandwidth_mb'
  | 'domains'
  | 'databases'
  | 'ad_free';

export const hostingPlanLimitKeys: HostingPlanLimitKey[] = [
  'disk_mb',
  'bandwidth_mb',
  'domains',
  'databases',
  'ad_free',
];

export function orderHostingPlans(plans: HostingPlan[]): HostingPlan[] {
  return [...plans].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'free' ? -1 : 1;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
}

export function getFreeHostingPlan(plans: HostingPlan[]) {
  return orderHostingPlans(plans).find(plan => plan.type === 'free');
}

export function getPreferredPaidHostingPlan(plans: HostingPlan[]) {
  const paidPlans = orderHostingPlans(plans).filter(
    plan => plan.type === 'paid',
  );
  return paidPlans.find(plan => plan.product.recommended) ?? paidPlans[0];
}

export function getHostingBillingCycles(
  plans: HostingPlan[],
): UpsellBillingCycle[] {
  const cycles = new Set<UpsellBillingCycle>();

  plans.forEach(plan => {
    plan.prices.forEach(price => {
      const cycle = billingCycleForPrice(price);
      if (cycle) cycles.add(cycle);
    });
  });

  return (['monthly', 'yearly'] as UpsellBillingCycle[]).filter(cycle =>
    cycles.has(cycle),
  );
}

export function getDefaultHostingBillingCycle(
  plans: HostingPlan[],
): UpsellBillingCycle {
  const cycles = getHostingBillingCycles(plans);
  if (cycles.includes('monthly')) return 'monthly';
  return cycles[0] ?? 'monthly';
}

export function getHostingPlanPrice(
  plan: HostingPlan,
  cycle: UpsellBillingCycle,
): HostingPlanPrice | undefined {
  return plan.prices.find(price => billingCycleForPrice(price) === cycle);
}

export function billingCycleForPrice(
  price: HostingPlanPrice,
): UpsellBillingCycle | null {
  if (
    (price.interval === 'month' && price.interval_count === 1) ||
    (price.interval === 'day' &&
      price.interval_count >= 28 &&
      price.interval_count <= 31)
  ) {
    return 'monthly';
  }

  if (
    (price.interval === 'year' && price.interval_count === 1) ||
    (price.interval === 'month' && price.interval_count === 12)
  ) {
    return 'yearly';
  }

  return null;
}

export function isHostingPlanPurchasable(
  plan: HostingPlan,
  price?: HostingPlanPrice,
) {
  return (
    plan.purchase_available &&
    plan.can_create_account &&
    (plan.type === 'free' || Boolean(price?.purchase_available))
  );
}

export function getHostingPlanDestination({
  plan,
  priceId,
  activeAccountId,
  isLoggedIn,
}: {
  plan: HostingPlan;
  priceId?: number;
  activeAccountId?: number;
  isLoggedIn: boolean;
}): string | null {
  if (plan.type === 'free') {
    if (!isLoggedIn) return '/register';

    if (!plan.can_create_account || !plan.purchase_available) {
      return activeAccountId ? `/dashboard/hosting/${activeAccountId}` : null;
    }
  }

  if (!isLoggedIn) return '/register';
  if (!plan.can_create_account || !plan.purchase_available) return null;
  if (plan.type === 'paid' && !priceId) return null;

  const params = new URLSearchParams({plan: `${plan.id}`});
  if (priceId) params.set('price', `${priceId}`);

  return `/dashboard/hosting/new?${params.toString()}`;
}

export function getHostingPlanDetails(plan: HostingPlan): string[] {
  const details: string[] = [];
  const disk = getHostingPlanLimitNumber(plan, 'disk_mb');
  const bandwidth = getHostingPlanLimitNumber(plan, 'bandwidth_mb');
  const domains = getHostingPlanLimitNumber(plan, 'domains');
  const databases = getHostingPlanLimitNumber(plan, 'databases');

  if (disk !== null)
    details.push(`${formatMegabytes(disk)} de espaço em disco`);
  if (bandwidth !== null) {
    details.push(`${formatMegabytes(bandwidth)} de tráfego mensal`);
  }
  if (domains !== null) {
    details.push(
      `${formatCount(domains)} ${domains === 1 ? 'domínio' : 'domínios'}`,
    );
  }
  if (databases !== null) {
    details.push(
      `${formatCount(databases)} ${databases === 1 ? 'banco MySQL' : 'bancos MySQL'}`,
    );
  }
  if (plan.quotas.ad_free === true) details.push('Sem anúncios');

  return details.length ? details : (plan.product.features ?? []).slice(0, 6);
}

export function getHostingPlanLimitNumber(
  plan: HostingPlan | undefined,
  key: Exclude<HostingPlanLimitKey, 'ad_free'>,
): number | null {
  if (!plan) return null;
  const value = plan.quotas[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function formatHostingPlanLimit(
  plan: HostingPlan | undefined,
  key: HostingPlanLimitKey,
): string | null {
  if (!plan) return null;

  if (key === 'ad_free') {
    if (plan.quotas.ad_free === true) return 'Sem anúncios';
    if (plan.quotas.ad_free === false) return 'Com anúncios';
    return null;
  }

  const value = getHostingPlanLimitNumber(plan, key);
  if (value === null) return null;

  if (key === 'disk_mb' || key === 'bandwidth_mb') {
    return formatMegabytes(value);
  }

  return formatCount(value);
}

export function formatMegabytes(value: number): string {
  if (value >= 1024 && value % 1024 === 0) {
    return `${formatCount(value / 1024)} GB`;
  }
  return `${formatCount(value)} MB`;
}

function formatCount(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}
