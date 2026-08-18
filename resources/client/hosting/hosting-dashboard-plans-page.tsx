import {
  formatHostingPlanLimit,
  getFreeHostingPlan,
  getHostingBillingCycles,
  getHostingPlanDestination,
  getHostingPlanDetails,
  getHostingPlanPrice,
  getPreferredPaidHostingPlan,
  hostingPlanLimitKeys,
  HostingPlanLimitKey,
  isHostingPlanPurchasable,
  orderHostingPlans,
} from '@app/hosting/hosting-plan-presentation';
import {
  hostingAccountsOptions,
  hostingPlansOptions,
} from '@app/hosting/hosting-queries';
import {HostingAccount, HostingPlan} from '@app/hosting/hosting-types';
import {useAuth} from '@common/auth/use-auth';
import {FormattedPrice} from '@common/billing/formatted-price';
import {BillingCycleRadio} from '@common/billing/pricing-table/billing-cycle-radio';
import {UpsellBillingCycle} from '@common/billing/pricing-table/find-best-price';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {DashboardLayout} from '@common/ui/dashboard/dashboard-layout';
import {Badge} from '@shadcn/badge/badge';
import {Button, LinkButton} from '@shadcn/button/button';
import {Card} from '@shadcn/card/card';
import {Empty} from '@shadcn/empty/empty';
import {Skeleton} from '@shadcn/skeleton/skeleton';
import {useQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {cn} from '@ui/utils/cn';
import {
  ArrowRightIcon,
  CheckIcon,
  CircleDollarSignIcon,
  DatabaseIcon,
  GaugeIcon,
  Globe2Icon,
  HardDriveIcon,
  RefreshCwIcon,
  ServerIcon,
  ShieldCheckIcon,
} from 'lucide-react';
import {ComponentType, useState} from 'react';
import {Link} from 'react-router';

const limitMeta: Record<
  HostingPlanLimitKey,
  {label: string; icon: ComponentType<{className?: string}>}
> = {
  disk_mb: {label: 'Espaço em disco', icon: HardDriveIcon},
  bandwidth_mb: {label: 'Tráfego mensal', icon: GaugeIcon},
  domains: {label: 'Domínios', icon: Globe2Icon},
  databases: {label: 'Bancos MySQL', icon: DatabaseIcon},
  ad_free: {label: 'Anúncios', icon: ShieldCheckIcon},
};

export function Component() {
  const plansQuery = useQuery(hostingPlansOptions());
  const accountsQuery = useQuery(hostingAccountsOptions());
  const [selectedCycle, setSelectedCycle] =
    useState<UpsellBillingCycle>('monthly');
  const plans = orderHostingPlans(plansQuery.data ?? []);
  const cycles = getHostingBillingCycles(plans);
  const cycle = cycles.includes(selectedCycle)
    ? selectedCycle
    : (cycles[0] ?? 'monthly');
  const activeAccount = accountsQuery.data?.find(
    account => account.status !== 'deleted',
  );
  const freePlan = getFreeHostingPlan(plans);
  const paidPlan = getPreferredPaidHostingPlan(plans);
  const isLoading = plansQuery.isLoading || accountsQuery.isLoading;

  return (
    <DashboardLayout.MainSection>
      <StaticPageTitle>
        <Trans message="Planos de hospedagem" />
      </StaticPageTitle>
      <DashboardLayout.SectionHeader>
        <DashboardLayout.SidebarToggle />
        <DashboardLayout.SectionTitle>
          <h1>
            <Trans message="Planos de hospedagem" />
          </h1>
        </DashboardLayout.SectionTitle>
        <LinkButton variant="outline" to="/account-settings/billing">
          <CircleDollarSignIcon />
          <Trans message="Cobrança e faturas" />
        </LinkButton>
      </DashboardLayout.SectionHeader>

      <DashboardLayout.SectionContent>
        <DashboardLayout.SectionScrollContainer>
          <div className="mx-auto w-full max-w-6xl py-2 pb-10">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
              <div className="min-w-0 lg:flex-1">
                <h2 className="max-w-2xl text-2xl font-semibold tracking-[-0.025em] text-balance">
                  <Trans message="Mais recursos para seu site" />
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  <Trans message="Compare os limites cadastrados para a sua hospedagem. O upgrade mantém a conta e aplica o novo pacote somente depois da confirmação comercial." />
                </p>
              </div>
              {cycles.length > 1 && (
                <BillingCycleRadio
                  selectedCycle={cycle}
                  onChange={setSelectedCycle}
                  className="w-auto shrink-0 text-sm"
                />
              )}
            </div>

            {activeAccount && <CurrentHosting account={activeAccount} />}

            {isLoading ? (
              <PlansSkeleton />
            ) : plansQuery.isError ? (
              <PlansError onRetry={() => plansQuery.refetch()} />
            ) : !plans.length ? (
              <Empty.Root className="rounded-card border py-16">
                <Empty.Header>
                  <Empty.Media variant="icon">
                    <CircleDollarSignIcon />
                  </Empty.Media>
                  <Empty.Title>
                    <Trans message="Nenhum plano disponível" />
                  </Empty.Title>
                  <Empty.Description>
                    <Trans message="Os planos aparecerão aqui quando a configuração comercial e o pacote de hospedagem estiverem ativos." />
                  </Empty.Description>
                </Empty.Header>
              </Empty.Root>
            ) : (
              <>
                <DashboardPlanBoard
                  freePlan={freePlan}
                  paidPlan={paidPlan}
                  cycle={cycle}
                  activeAccount={activeAccount}
                />
                <DashboardComparisonTable
                  freePlan={freePlan}
                  paidPlan={paidPlan}
                />
              </>
            )}
          </div>
        </DashboardLayout.SectionScrollContainer>
      </DashboardLayout.SectionContent>
    </DashboardLayout.MainSection>
  );
}

function CurrentHosting({account}: {account: HostingAccount}) {
  return (
    <Card.Root size="sm" className="mb-5">
      <Card.Content className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ServerIcon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">
              <Trans message="Sua hospedagem atual" />
            </p>
            <p className="truncate font-medium">{account.fqdn}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {account.plan?.name ?? <Trans message="Hospedagem" />}
          </Badge>
          <LinkButton
            size="sm"
            variant="ghost"
            to={`/dashboard/hosting/${account.id}`}
          >
            <Trans message="Abrir hospedagem" />
            <ArrowRightIcon />
          </LinkButton>
        </div>
      </Card.Content>
    </Card.Root>
  );
}

function DashboardPlanBoard({
  freePlan,
  paidPlan,
  cycle,
  activeAccount,
}: {
  freePlan?: HostingPlan;
  paidPlan?: HostingPlan;
  cycle: UpsellBillingCycle;
  activeAccount?: HostingAccount;
}) {
  return (
    <section className="grid overflow-hidden rounded-card border bg-card xl:grid-cols-[0.9fr_1fr_1.15fr]">
      {freePlan && (
        <DashboardPlanTier
          plan={freePlan}
          cycle={cycle}
          activeAccount={activeAccount}
        />
      )}
      {paidPlan && (
        <DashboardPlanTier
          plan={paidPlan}
          cycle={cycle}
          activeAccount={activeAccount}
          emphasized
          className="border-t xl:border-t-0 xl:border-l"
        />
      )}
      <DashboardPlanDelta
        freePlan={freePlan}
        paidPlan={paidPlan}
        className="border-t xl:border-t-0 xl:border-l"
      />
    </section>
  );
}

function DashboardPlanTier({
  plan,
  cycle,
  activeAccount,
  emphasized = false,
  className,
}: {
  plan: HostingPlan;
  cycle: UpsellBillingCycle;
  activeAccount?: HostingAccount;
  emphasized?: boolean;
  className?: string;
}) {
  const {isLoggedIn} = useAuth();
  const price = getHostingPlanPrice(plan, cycle);
  const isCurrent = activeAccount?.plan?.id === plan.id;
  const destination = getHostingPlanDestination({
    plan,
    priceId: price?.id,
    activeAccountId: activeAccount?.id,
    isLoggedIn,
  });
  const canChoose = isHostingPlanPurchasable(plan, price);
  const canAddAnotherFree = plan.type === 'free' && canChoose;

  return (
    <article
      className={cn(
        'flex min-h-[30rem] flex-col p-6',
        emphasized && 'bg-primary/[0.035]',
        className,
      )}
      aria-current={isCurrent ? 'true' : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            <Trans
              message={plan.type === 'free' ? 'Para começar' : 'Para crescer'}
            />
          </p>
          <h3 className="mt-1 text-xl font-semibold tracking-[-0.02em]">
            {plan.product.name}
          </h3>
        </div>
        {isCurrent ? (
          <Badge variant="positive">
            <Trans message="Plano atual" />
          </Badge>
        ) : plan.product.recommended ? (
          <Badge variant="secondary">
            <Trans message="Recomendado" />
          </Badge>
        ) : null}
      </div>

      <p className="mt-3 min-h-14 text-sm leading-6 text-muted-foreground">
        {plan.product.description ?? (
          <Trans message="Hospedagem para publicar e acompanhar seu projeto." />
        )}
      </p>

      <div className="mt-5 flex min-h-24 flex-col justify-center border-y py-4">
        {plan.type === 'free' ? (
          <>
            <strong className="text-3xl font-semibold tracking-[-0.035em]">
              R$ 0,00
            </strong>
            <span className="mt-1 text-xs text-muted-foreground">
              <Trans message="para começar" />
            </span>
          </>
        ) : price ? (
          <FormattedPrice
            price={price}
            priceClassName="text-3xl font-semibold tracking-[-0.035em]"
            periodClassName="text-xs text-muted-foreground"
          />
        ) : (
          <>
            <strong className="text-base font-semibold">
              <Trans message="Preço em configuração" />
            </strong>
            <span className="mt-1 text-xs leading-5 text-muted-foreground">
              <Trans message="A compra será liberada quando a configuração comercial estiver completa." />
            </span>
          </>
        )}
      </div>

      <ul className="mt-5 grid flex-1 content-start gap-2.5 text-sm">
        {getHostingPlanDetails(plan)
          .slice(0, 5)
          .map(detail => (
            <li key={detail} className="flex items-start gap-2.5">
              <CheckIcon className="mt-0.5 size-4 shrink-0 text-positive" />
              <span>{detail}</span>
            </li>
          ))}
      </ul>

      {(isCurrent && !canAddAnotherFree) || !canChoose || !destination ? (
        <Button disabled variant="outline" className="mt-6 w-full">
          {isCurrent && !canAddAnotherFree ? (
            <Trans message="Este é o seu plano" />
          ) : plan.type === 'paid' && !price ? (
            <Trans message="Aguardando preço" />
          ) : (
            <Trans message="Contratação indisponível" />
          )}
        </Button>
      ) : (
        <Button
          nativeButton={false}
          render={<Link to={destination} />}
          color={emphasized ? 'primary' : undefined}
          variant={emphasized ? 'default' : 'outline'}
          className="mt-6 w-full"
        >
          {plan.type === 'free' && !activeAccount ? (
            <Trans message="Criar hospedagem grátis" />
          ) : plan.type === 'free' ? (
            <Trans message="Adicionar outra hospedagem" />
          ) : (
            <Trans message="Escolher este plano" />
          )}
          <ArrowRightIcon />
        </Button>
      )}
    </article>
  );
}

function DashboardPlanDelta({
  freePlan,
  paidPlan,
  className,
}: {
  freePlan?: HostingPlan;
  paidPlan?: HostingPlan;
  className?: string;
}) {
  return (
    <aside className={cn('flex flex-col p-6', className)}>
      <h3 className="text-base font-semibold">
        <Trans message="O que muda no Pro" />
      </h3>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        <Trans message="Diferenças calculadas dos limites cadastrados no pacote." />
      </p>
      <div className="mt-5 divide-y border-y">
        {hostingPlanLimitKeys.slice(0, 4).map(key => {
          const Icon = limitMeta[key].icon;
          return (
            <div key={key} className="grid grid-cols-[1.5rem_1fr] gap-x-2 py-3">
              <Icon className="size-4 text-primary" />
              <span className="text-xs text-muted-foreground">
                <Trans message={limitMeta[key].label} />
              </span>
              <strong className="col-start-2 mt-1 flex items-center gap-2 text-sm font-semibold">
                {formatHostingPlanLimit(freePlan, key) ?? (
                  <Trans message="Não informado" />
                )}
                <ArrowRightIcon className="size-3 text-muted-foreground" />
                {formatHostingPlanLimit(paidPlan, key) ?? (
                  <Trans message="Não informado" />
                )}
              </strong>
            </div>
          );
        })}
      </div>
      <p className="mt-auto flex items-start gap-2 pt-5 text-xs leading-5 text-muted-foreground">
        <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-positive" />
        <Trans message="Nenhum limite ou preço estimado é exibido nesta tela." />
      </p>
    </aside>
  );
}

function DashboardComparisonTable({
  freePlan,
  paidPlan,
}: {
  freePlan?: HostingPlan;
  paidPlan?: HostingPlan;
}) {
  return (
    <Card.Root className="mt-5 gap-0 py-0">
      <Card.Header className="border-b py-5">
        <Card.Title>
          <Trans message="Comparação completa" />
        </Card.Title>
        <Card.Description>
          <Trans message="Limites atuais do catálogo de hospedagem." />
        </Card.Description>
      </Card.Header>
      <Card.Content className="px-0">
        <div className="divide-y">
          {hostingPlanLimitKeys.map(key => {
            const Icon = limitMeta[key].icon;
            return (
              <div
                key={key}
                className="grid gap-3 px-6 py-4 sm:grid-cols-[minmax(0,1fr)_9rem_9rem] sm:items-center"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <span className="text-sm font-medium">
                    <Trans message={limitMeta[key].label} />
                  </span>
                </div>
                <ComparisonValue
                  planName={freePlan?.product.name ?? 'Free'}
                  value={formatHostingPlanLimit(freePlan, key)}
                />
                <ComparisonValue
                  planName={paidPlan?.product.name ?? 'Pro'}
                  value={formatHostingPlanLimit(paidPlan, key)}
                />
              </div>
            );
          })}
        </div>
      </Card.Content>
    </Card.Root>
  );
}

function ComparisonValue({
  planName,
  value,
}: {
  planName: string;
  value: string | null;
}) {
  return (
    <div className="flex justify-between gap-3 text-sm sm:block">
      <span className="text-xs text-muted-foreground sm:mb-1 sm:block">
        {planName}
      </span>
      <strong className="font-semibold">
        {value ?? <Trans message="Não informado" />}
      </strong>
    </div>
  );
}

function PlansError({onRetry}: {onRetry: () => void}) {
  return (
    <Empty.Root className="rounded-card border py-16">
      <Empty.Header>
        <Empty.Media variant="icon">
          <RefreshCwIcon />
        </Empty.Media>
        <Empty.Title>
          <Trans message="Não foi possível carregar os planos" />
        </Empty.Title>
        <Empty.Description>
          <Trans message="Tente novamente para consultar o catálogo atualizado." />
        </Empty.Description>
      </Empty.Header>
      <Empty.Content>
        <Button variant="outline" onClick={onRetry}>
          <RefreshCwIcon />
          <Trans message="Tentar novamente" />
        </Button>
      </Empty.Content>
    </Empty.Root>
  );
}

function PlansSkeleton() {
  return (
    <div className="grid overflow-hidden rounded-card border xl:grid-cols-3">
      <span className="sr-only">
        <Trans message="Carregando planos" />
      </span>
      <Skeleton className="h-[30rem] rounded-none" />
      <Skeleton className="h-[30rem] rounded-none border-t xl:border-t-0 xl:border-l" />
      <Skeleton className="h-[30rem] rounded-none border-t xl:border-t-0 xl:border-l" />
    </div>
  );
}
