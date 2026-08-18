/*
  THESIS: Planos are compared through real limits and honest availability, never through invented popularity or placeholder pricing.
  COMPOSITION: Compact promise, one integrated Free/Pro comparison board, semantic quota table, then a short upgrade explanation.
  RESPONSIVE: The board becomes Free, Pro, differences in that order; the table becomes labeled mobile rows without horizontal scrolling.
*/
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
import {ProductEclipseShell} from '@app/landing/product-eclipse-shell';
import {useAuth} from '@common/auth/use-auth';
import {FormattedPrice} from '@common/billing/formatted-price';
import {UpsellBillingCycle} from '@common/billing/pricing-table/find-best-price';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {Button} from '@shadcn/button/button';
import {Skeleton} from '@shadcn/skeleton/skeleton';
import {useQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {cn} from '@ui/utils/cn';
import {
  ArrowRightIcon,
  CheckIcon,
  CircleDollarSignIcon,
  DatabaseIcon,
  GaugeIcon,
  Globe2Icon,
  HardDriveIcon,
  HelpCircleIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
} from 'lucide-react';
import {ComponentType, ReactNode, useState} from 'react';
import {Link} from 'react-router';
import './hosting-plans-page.css';

const limitMeta: Record<
  HostingPlanLimitKey,
  {label: string; note: string; icon: ComponentType<{className?: string}>}
> = {
  disk_mb: {
    label: 'Espaço em disco',
    note: 'Arquivos, sites e aplicações',
    icon: HardDriveIcon,
  },
  bandwidth_mb: {
    label: 'Tráfego mensal',
    note: 'Transferência renovada a cada ciclo',
    icon: GaugeIcon,
  },
  domains: {
    label: 'Domínios',
    note: 'Endereços vinculados à hospedagem',
    icon: Globe2Icon,
  },
  databases: {
    label: 'Bancos MySQL',
    note: 'Bancos disponíveis no pacote',
    icon: DatabaseIcon,
  },
  ad_free: {
    label: 'Anúncios',
    note: 'Exibição de publicidade da HospedFree',
    icon: ShieldCheckIcon,
  },
};

export function Component() {
  const {isLoggedIn} = useAuth();
  const {trans} = useTrans();
  const plansQuery = useQuery(hostingPlansOptions());
  const accountsQuery = useQuery({
    ...hostingAccountsOptions(),
    enabled: isLoggedIn,
  });
  const [selectedCycle, setSelectedCycle] =
    useState<UpsellBillingCycle>('monthly');
  const [selectedPaidId, setSelectedPaidId] = useState<number | null>(null);

  const plans = orderHostingPlans(plansQuery.data ?? []);
  const cycles = getHostingBillingCycles(plans);
  const cycle = cycles.includes(selectedCycle)
    ? selectedCycle
    : (cycles[0] ?? 'monthly');
  const freePlan = getFreeHostingPlan(plans);
  const paidPlans = plans.filter(plan => plan.type === 'paid');
  const paidPlan =
    paidPlans.find(plan => plan.id === selectedPaidId) ??
    getPreferredPaidHostingPlan(plans);
  const activeAccount = accountsQuery.data?.find(
    account => account.status !== 'deleted',
  );
  const isLoading =
    plansQuery.isLoading || (isLoggedIn && accountsQuery.isLoading);

  return (
    <ProductEclipseShell className="hf-plans-page">
      <StaticPageTitle>
        <Trans message="Planos de hospedagem" />
      </StaticPageTitle>

      <section className="hf-plans-intro">
        <div className="hf-shell">
          <div className="hf-plans-intro-grid">
            <div>
              <h1 className="hf-display">
                <Trans message="Comece grátis. Cresça depois." />
              </h1>
              <p>
                <Trans message="Compare limites reais e escolha sem surpresa. Seu domínio, seus arquivos e sua conta permanecem no mesmo painel durante o upgrade." />
              </p>
            </div>
            <div className="hf-plans-trust-note">
              <ShieldCheckIcon />
              <div>
                <strong>
                  <Trans message="Sem oferta incompleta" />
                </strong>
                <span>
                  <Trans message="Um plano pago só pode ser contratado quando preço, gateway e pacote técnico estiverem ativos." />
                </span>
              </div>
            </div>
          </div>

          {activeAccount && (
            <div className="hf-current-hosting">
              <span>
                <Trans message="Sua hospedagem atual" />
              </span>
              <strong>{activeAccount.fqdn}</strong>
              <small>
                {activeAccount.plan?.name ?? <Trans message="Hospedagem" />}
              </small>
            </div>
          )}

          {paidPlans.length > 1 && (
            <div
              className="hf-paid-plan-switch"
              aria-label={trans({message: 'Planos pagos'})}
            >
              {paidPlans.map(plan => (
                <button
                  key={plan.id}
                  type="button"
                  className={cn(plan.id === paidPlan?.id && 'is-selected')}
                  onClick={() => setSelectedPaidId(plan.id)}
                  aria-pressed={plan.id === paidPlan?.id}
                >
                  {plan.product.name}
                </button>
              ))}
            </div>
          )}

          {cycles.length > 1 && (
            <div
              className="hf-plan-cycle"
              aria-label={trans({message: 'Ciclo de cobrança'})}
            >
              {cycles.map(item => (
                <button
                  key={item}
                  type="button"
                  className={cn(item === cycle && 'is-selected')}
                  aria-pressed={item === cycle}
                  onClick={() => setSelectedCycle(item)}
                >
                  <Trans message={item === 'monthly' ? 'Mensal' : 'Anual'} />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section
        className="hf-plans-catalog"
        aria-labelledby="hosting-plans-catalog-title"
      >
        <h2 id="hosting-plans-catalog-title" className="sr-only">
          <Trans message="Comparação de planos" />
        </h2>
        <div className="hf-shell">
          {isLoading ? (
            <PlansSkeleton />
          ) : plansQuery.isError ? (
            <CatalogState
              icon={RefreshCwIcon}
              title="Não foi possível carregar os planos"
              description="Tente novamente para consultar o catálogo atualizado."
              action={
                <Button
                  variant="outline"
                  className="hf-button-secondary"
                  onClick={() => plansQuery.refetch()}
                >
                  <RefreshCwIcon />
                  <Trans message="Tentar novamente" />
                </Button>
              }
            />
          ) : !plans.length ? (
            <CatalogState
              icon={CircleDollarSignIcon}
              title="Nenhum plano público agora"
              description="O catálogo está sendo configurado. A central de ajuda continua disponível."
              action={
                <Button
                  nativeButton={false}
                  render={<Link to="/faq" />}
                  variant="outline"
                  className="hf-button-secondary"
                >
                  <HelpCircleIcon />
                  <Trans message="Abrir central de ajuda" />
                </Button>
              }
            />
          ) : (
            <>
              <PlanComparisonBoard
                freePlan={freePlan}
                paidPlan={paidPlan}
                cycle={cycle}
                activeAccount={activeAccount}
              />
              <PlanComparisonTable freePlan={freePlan} paidPlan={paidPlan} />
            </>
          )}
        </div>
      </section>

      <section className="hf-plans-next-step">
        <div className="hf-shell hf-plans-next-step-grid">
          <div>
            <h2 className="hf-display">
              <Trans message="O upgrade muda recursos, não o seu caminho." />
            </h2>
            <p>
              <Trans message="A cobrança confirma o plano escolhido. Depois, o painel aplica o novo pacote e mantém o site na mesma conta." />
            </p>
          </div>
          <ol>
            <li>
              <span>1</span>
              <Trans message="Escolha um plano disponível" />
            </li>
            <li>
              <span>2</span>
              <Trans message="Confirme a cobrança no gateway ativo" />
            </li>
            <li>
              <span>3</span>
              <Trans message="Acompanhe a alteração pelo painel" />
            </li>
          </ol>
        </div>
      </section>
    </ProductEclipseShell>
  );
}

function PlanComparisonBoard({
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
    <div className="hf-pricing-board">
      {freePlan && (
        <PlanTier plan={freePlan} cycle={cycle} activeAccount={activeAccount} />
      )}
      {paidPlan && (
        <PlanTier
          plan={paidPlan}
          cycle={cycle}
          activeAccount={activeAccount}
          emphasized
        />
      )}
      <div className="hf-plan-delta">
        <div className="hf-plan-delta-heading">
          <span>
            <Trans message="O que muda no Pro" />
          </span>
          <p>
            <Trans message="Diferenças calculadas diretamente dos limites cadastrados." />
          </p>
        </div>
        <div className="hf-plan-delta-list">
          {hostingPlanLimitKeys.slice(0, 4).map(key => {
            const Icon = limitMeta[key].icon;
            return (
              <div key={key}>
                <Icon />
                <span>
                  <Trans message={limitMeta[key].label} />
                </span>
                <strong>
                  {formatHostingPlanLimit(freePlan, key) ?? (
                    <Trans message="Não informado" />
                  )}
                  <ArrowRightIcon aria-hidden="true" />
                  {formatHostingPlanLimit(paidPlan, key) ?? (
                    <Trans message="Não informado" />
                  )}
                </strong>
              </div>
            );
          })}
        </div>
        <div className="hf-plan-delta-note">
          <CheckIcon />
          <Trans message="Free e Pro estão configurados sem anúncios." />
        </div>
      </div>
    </div>
  );
}

function PlanTier({
  plan,
  cycle,
  activeAccount,
  emphasized = false,
}: {
  plan: HostingPlan;
  cycle: UpsellBillingCycle;
  activeAccount?: HostingAccount;
  emphasized?: boolean;
}) {
  const {isLoggedIn} = useAuth();
  const price = getHostingPlanPrice(plan, cycle);
  const currentPlanId = activeAccount?.plan?.id;
  const isCurrent = currentPlanId === plan.id;
  const canChoose = isHostingPlanPurchasable(plan, price);
  const canAddAnotherFree = plan.type === 'free' && canChoose;
  const details = getHostingPlanDetails(plan).slice(0, 5);
  const href = getHostingPlanDestination({
    plan,
    priceId: price?.id,
    activeAccountId: activeAccount?.id,
    isLoggedIn,
  });

  return (
    <article
      className={cn('hf-pricing-tier', emphasized && 'is-emphasized')}
      aria-current={isCurrent ? 'true' : undefined}
    >
      <div className="hf-pricing-tier-heading">
        <div>
          <span>
            <Trans
              message={plan.type === 'free' ? 'Para começar' : 'Para crescer'}
            />
          </span>
          <h2>{plan.product.name}</h2>
        </div>
        {isCurrent ? (
          <small>
            <Trans message="Plano atual" />
          </small>
        ) : plan.product.recommended ? (
          <small>
            <Trans message="Recomendado" />
          </small>
        ) : null}
      </div>

      <p className="hf-pricing-tier-description">
        {plan.product.description ?? (
          <Trans message="Hospedagem para publicar e acompanhar seu projeto." />
        )}
      </p>

      <div className="hf-pricing-tier-price">
        {plan.type === 'free' ? (
          <>
            <strong>R$ 0,00</strong>
            <span>
              <Trans message="para começar" />
            </span>
          </>
        ) : price ? (
          <FormattedPrice
            price={price}
            priceClassName="text-[2.35rem] font-semibold tracking-[-0.04em] text-white"
            periodClassName="text-sm text-white/45"
          />
        ) : (
          <div>
            <strong className="!text-xl">
              <Trans message="Preço em configuração" />
            </strong>
            <span>
              <Trans message="O plano já pode ser comparado, mas ainda não contratado." />
            </span>
          </div>
        )}
      </div>

      <ul className="hf-pricing-tier-features">
        {details.map(detail => (
          <li key={detail}>
            <CheckIcon />
            <span>{detail}</span>
          </li>
        ))}
      </ul>

      {(isCurrent && !canAddAnotherFree) || !canChoose || !href ? (
        <Button disabled className="hf-pricing-tier-action" variant="outline">
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
          render={<Link to={href} />}
          className="hf-pricing-tier-action"
          variant={emphasized ? 'default' : 'outline'}
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

function PlanComparisonTable({
  freePlan,
  paidPlan,
}: {
  freePlan?: HostingPlan;
  paidPlan?: HostingPlan;
}) {
  if (!freePlan && !paidPlan) return null;

  return (
    <section className="hf-plan-table-section">
      <div className="hf-plan-table-heading">
        <div>
          <h2 className="hf-display">
            <Trans message="Compare recurso por recurso" />
          </h2>
          <p>
            <Trans message="Estes valores são os limites atuais definidos para cada pacote." />
          </p>
        </div>
        <Link to="/faq" className="hf-inline-link">
          <Trans message="Tirar uma dúvida" />
          <ArrowRightIcon />
        </Link>
      </div>

      <div className="hf-plan-table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">
                <Trans message="Recurso" />
              </th>
              <th scope="col">{freePlan?.product.name ?? 'Free'}</th>
              <th scope="col">{paidPlan?.product.name ?? 'Pro'}</th>
            </tr>
          </thead>
          <tbody>
            {hostingPlanLimitKeys.map(key => {
              const Icon = limitMeta[key].icon;
              return (
                <tr key={key}>
                  <th scope="row">
                    <Icon />
                    <span>
                      <strong>
                        <Trans message={limitMeta[key].label} />
                      </strong>
                      <small>
                        <Trans message={limitMeta[key].note} />
                      </small>
                    </span>
                  </th>
                  <td data-label={freePlan?.product.name ?? 'Free'}>
                    {formatHostingPlanLimit(freePlan, key) ?? (
                      <Trans message="Não informado" />
                    )}
                  </td>
                  <td data-label={paidPlan?.product.name ?? 'Pro'}>
                    {formatHostingPlanLimit(paidPlan, key) ?? (
                      <Trans message="Não informado" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CatalogState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: ComponentType<{className?: string}>;
  title: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <div className="hf-plan-catalog-state">
      <Icon />
      <h2>
        <Trans message={title} />
      </h2>
      <p>
        <Trans message={description} />
      </p>
      {action}
    </div>
  );
}

function PlansSkeleton() {
  return (
    <div className="hf-pricing-board">
      <span className="sr-only">
        <Trans message="Carregando planos" />
      </span>
      <Skeleton className="h-[34rem] rounded-none bg-white/[0.04]" />
      <Skeleton className="h-[34rem] rounded-none bg-white/[0.05]" />
      <Skeleton className="h-[34rem] rounded-none bg-white/[0.04]" />
    </div>
  );
}
