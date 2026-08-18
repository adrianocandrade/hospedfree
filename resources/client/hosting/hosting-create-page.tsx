import {
  getHostingPlanDetails,
  orderHostingPlans,
} from '@app/hosting/hosting-plan-presentation';
import {
  checkAvailabilityOptions,
  createHostingOrderOptions,
  hostingPlansOptions,
  reservePremiumSubdomainOptions,
} from '@app/hosting/hosting-queries';
import {
  HostingPlan,
  HostingPlanCreationUnavailableReason,
} from '@app/hosting/hosting-types';
import {
  withCheckoutReturnPath,
  withHostingOrderReference,
  withPremiumPurchaseReference,
} from '@common/billing/checkout/checkout-return-path';
import {FormattedPrice} from '@common/billing/formatted-price';
import {showHttpErrorToast} from '@common/http/errors/show-http-error-toast';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {DashboardLayout} from '@common/ui/dashboard/dashboard-layout';
import {Alert} from '@shadcn/alert/alert';
import {Badge} from '@shadcn/badge/badge';
import {Button, LinkButton} from '@shadcn/button/button';
import {Card} from '@shadcn/card/card';
import {Empty} from '@shadcn/empty/empty';
import {Input} from '@shadcn/forms/input/input';
import {Skeleton} from '@shadcn/skeleton/skeleton';
import {toast} from '@shadcn/toast/toast';
import {useMutation, useQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {cn} from '@ui/utils/cn';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  CircleAlertIcon,
  Clock3Icon,
  CreditCardIcon,
  Globe2Icon,
  LoaderCircleIcon,
  LockKeyholeIcon,
  SearchIcon,
  ServerIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  SparklesIcon,
} from 'lucide-react';
import {ReactNode, useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate, useSearchParams} from 'react-router';

type AddressMethod = 'free_subdomain';

function isHostingPlanEligible(plan: HostingPlan): boolean {
  return plan.can_create_account && plan.purchase_available;
}

export function Component() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const plansQuery = useQuery(hostingPlansOptions());
  const plans = useMemo(
    () => orderHostingPlans(plansQuery.data ?? []),
    [plansQuery.data],
  );
  const eligiblePlans = useMemo(
    () => plans.filter(isHostingPlanEligible),
    [plans],
  );

  const requestedPlanId = Number(searchParams.get('plan'));
  const selectedPlan =
    eligiblePlans.find(plan => plan.id === requestedPlanId) ?? eligiblePlans[0];
  const requestedPriceId = Number(searchParams.get('price'));
  const selectedPrice =
    selectedPlan?.prices.find(
      price => price.id === requestedPriceId && price.purchase_available,
    ) ?? selectedPlan?.prices.find(price => price.purchase_available);

  const addressMethod: AddressMethod = 'free_subdomain';
  const [subdomain, setSubdomain] = useState(() =>
    (searchParams.get('subdomain') ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 63),
  );
  const [checkedSubdomain, setCheckedSubdomain] = useState<string | null>(null);
  const idempotencyKey = useRef(createIdempotencyKey());
  const premiumReturnChecked = useRef(false);

  const availability = useMutation({
    ...checkAvailabilityOptions(),
    onError: error => showHttpErrorToast(error),
  });
  const reservePremium = useMutation({
    ...reservePremiumSubdomainOptions(),
    onError: error => showHttpErrorToast(error),
  });
  const createOrder = useMutation({
    ...createHostingOrderOptions(),
    onError: error => showHttpErrorToast(error),
  });

  const normalizedSubdomain = subdomain.trim().toLowerCase();
  const checkedAvailabilityMatches =
    checkedSubdomain === normalizedSubdomain &&
    availability.data?.available === true;
  const checkedAddressMatches =
    checkedAvailabilityMatches && availability.data?.can_use === true;
  const selectedPlanReady = Boolean(
    selectedPlan?.can_create_account && selectedPlan.purchase_available,
  );
  const selectedPriceReady =
    selectedPlan?.type === 'free' || Boolean(selectedPrice?.purchase_available);
  const canSubmit =
    selectedPlanReady &&
    selectedPriceReady &&
    checkedAddressMatches &&
    !createOrder.isPending;

  const selectPlan = (plan: HostingPlan) => {
    if (!isHostingPlanEligible(plan)) return;

    const next = new URLSearchParams(searchParams);
    next.set('plan', `${plan.id}`);
    next.delete('price');
    const price = plan.prices.find(item => item.purchase_available);
    if (price) next.set('price', `${price.id}`);
    setSearchParams(next);
    setCheckedSubdomain(null);
    idempotencyKey.current = createIdempotencyKey();
    availability.reset();
  };

  const selectPrice = (priceId: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('price', `${priceId}`);
    setSearchParams(next);
    idempotencyKey.current = createIdempotencyKey();
  };

  const checkAddress = () => {
    if (!normalizedSubdomain) return;
    setCheckedSubdomain(normalizedSubdomain);
    availability.mutate(normalizedSubdomain);
  };

  useEffect(() => {
    if (
      premiumReturnChecked.current ||
      searchParams.get('premium') !== 'confirmed' ||
      normalizedSubdomain.length < 3
    ) {
      return;
    }

    premiumReturnChecked.current = true;
    setCheckedSubdomain(normalizedSubdomain);
    availability.mutate(normalizedSubdomain);
  }, [availability, normalizedSubdomain, searchParams]);

  const purchasePremiumAddress = async () => {
    if (!selectedPlan || !availability.data?.premium?.price) return;

    const reservation = await reservePremium.mutateAsync(normalizedSubdomain);
    const premiumPrice = reservation.premium.price;
    if (!premiumPrice) return;

    const returnParams = new URLSearchParams(searchParams);
    returnParams.set('plan', `${selectedPlan.id}`);
    if (selectedPrice) returnParams.set('price', `${selectedPrice.id}`);
    returnParams.set('subdomain', normalizedSubdomain);
    returnParams.set('premium', 'confirmed');

    if (!reservation.premium.purchase?.uuid) return;

    navigate(
      withPremiumPurchaseReference(
        withCheckoutReturnPath(
          `/checkout/${premiumPrice.product_id}/${premiumPrice.id}`,
          `/dashboard/hosting/new?${returnParams.toString()}`,
        ),
        reservation.premium.purchase.uuid,
      ),
    );
  };

  const submit = async () => {
    if (!selectedPlan || !canSubmit) return;

    const order = await createOrder.mutateAsync({
      hosting_plan_id: selectedPlan.id,
      subdomain: normalizedSubdomain,
      price_id: selectedPlan.type === 'paid' ? selectedPrice?.id : undefined,
      idempotency_key: idempotencyKey.current,
    });

    if (selectedPlan.type === 'free') {
      navigate(
        order.account?.id
          ? `/dashboard/hosting/${order.account.id}/created`
          : '/dashboard/hosting',
      );
      return;
    }

    if (order.status !== 'awaiting_payment' || !selectedPrice) {
      toast.error(
        <Trans message="O pedido foi registrado, mas o checkout ainda não está disponível. Tente novamente pelo painel de planos." />,
      );
      return;
    }

    navigate(
      withHostingOrderReference(
        withCheckoutReturnPath(
          `/checkout/${selectedPlan.product.id}/${selectedPrice.id}`,
          '/dashboard/hosting',
        ),
        order.uuid,
      ),
    );
  };

  return (
    <DashboardLayout.MainSection>
      <StaticPageTitle>
        <Trans message="Adicionar hospedagem" />
      </StaticPageTitle>
      <DashboardLayout.SectionHeader>
        <DashboardLayout.SidebarToggle />
        <DashboardLayout.SectionTitle>
          <h1>
            <Trans message="Adicionar hospedagem" />
          </h1>
        </DashboardLayout.SectionTitle>
        <LinkButton variant="outline" to="/dashboard/hosting">
          <ArrowLeftIcon />
          <Trans message="Minhas hospedagens" />
        </LinkButton>
      </DashboardLayout.SectionHeader>

      <DashboardLayout.SectionContent>
        <DashboardLayout.SectionScrollContainer>
          <div className="mx-auto w-full max-w-6xl pb-12">
            <header className="mb-7 max-w-3xl">
              <Badge variant="secondary">
                <ServerIcon />
                <Trans message="Nova conta de hospedagem" />
              </Badge>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
                <Trans message="Escolha o plano e o endereço do novo site" />
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
                <Trans message="O plano gratuito permite até duas hospedagens separadas. Hospedagens pagas adicionais começam com um pedido pendente e só são ativadas depois da confirmação do pagamento." />
              </p>
            </header>

            {plansQuery.isLoading ? (
              <CreateHostingSkeleton />
            ) : plansQuery.isError ? (
              <Empty.Root className="rounded-card border py-16">
                <Empty.Header>
                  <Empty.Media variant="icon">
                    <CircleAlertIcon />
                  </Empty.Media>
                  <Empty.Title>
                    <Trans message="Não foi possível carregar os planos" />
                  </Empty.Title>
                  <Empty.Description>
                    <Trans message="Tente novamente antes de iniciar uma nova hospedagem." />
                  </Empty.Description>
                </Empty.Header>
                <Empty.Content>
                  <Button
                    variant="outline"
                    onClick={() => plansQuery.refetch()}
                  >
                    <Trans message="Tentar novamente" />
                  </Button>
                </Empty.Content>
              </Empty.Root>
            ) : !plans.length ? (
              <Empty.Root className="rounded-card border py-16">
                <Empty.Header>
                  <Empty.Media variant="icon">
                    <ServerIcon />
                  </Empty.Media>
                  <Empty.Title>
                    <Trans message="Nenhum plano disponível" />
                  </Empty.Title>
                  <Empty.Description>
                    <Trans message="O catálogo ainda não possui um plano pronto para novas contas." />
                  </Empty.Description>
                </Empty.Header>
              </Empty.Root>
            ) : !eligiblePlans.length ? (
              <div className="space-y-6">
                <PlanSelection plans={plans} onSelect={selectPlan} />
                <Empty.Root className="rounded-card border bg-card py-12">
                  <Empty.Header>
                    <Empty.Media variant="icon">
                      <CircleAlertIcon />
                    </Empty.Media>
                    <Empty.Title>
                      <Trans message="Nenhum plano pode criar uma nova hospedagem agora" />
                    </Empty.Title>
                    <Empty.Description>
                      <Trans message="Sua conta atingiu os limites atuais ou o checkout dos planos pagos está indisponível. Nenhum pedido foi criado." />
                    </Empty.Description>
                  </Empty.Header>
                  <Empty.Content>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        variant="outline"
                        onClick={() => plansQuery.refetch()}
                        disabled={plansQuery.isFetching}
                      >
                        {plansQuery.isFetching ? (
                          <LoaderCircleIcon className="animate-spin" />
                        ) : null}
                        <Trans message="Verificar novamente" />
                      </Button>
                      <LinkButton to="/dashboard/hosting">
                        <Trans message="Voltar para minhas hospedagens" />
                      </LinkButton>
                    </div>
                  </Empty.Content>
                </Empty.Root>
              </div>
            ) : (
              <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
                <div className="space-y-6">
                  <PlanSelection
                    plans={plans}
                    selectedPlan={selectedPlan}
                    onSelect={selectPlan}
                  />

                  {selectedPlan?.type === 'paid' && (
                    <BillingCycleSelection
                      plan={selectedPlan}
                      selectedPriceId={selectedPrice?.id}
                      onSelect={selectPrice}
                    />
                  )}

                  <AddressSelection selected={addressMethod} />

                  <Card.Root>
                    <Card.Header className="border-b">
                      <Card.Title>
                        <Trans message="Escolha seu subdomínio" />
                      </Card.Title>
                      <Card.Description>
                        <Trans message="Esta etapa cria um endereço real em hsite.top. Você poderá gerenciar outros domínios depois que a hospedagem estiver ativa." />
                      </Card.Description>
                    </Card.Header>
                    <Card.Content>
                      <label
                        htmlFor="new-hosting-subdomain"
                        className="text-sm font-medium"
                      >
                        <Trans message="Endereço do site" />
                      </label>
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                        <div className="flex min-w-0 flex-1 items-center rounded-input border border-input bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                          <Input
                            id="new-hosting-subdomain"
                            bindToHookForm={false}
                            value={subdomain}
                            onChange={event => {
                              setSubdomain(
                                event.target.value
                                  .toLowerCase()
                                  .replace(/[^a-z0-9-]/g, ''),
                              );
                              setCheckedSubdomain(null);
                              availability.reset();
                              idempotencyKey.current = createIdempotencyKey();
                            }}
                            minLength={3}
                            maxLength={63}
                            pattern="[a-z0-9](?:[a-z0-9-]*[a-z0-9])?"
                            placeholder="meu-site"
                            autoComplete="off"
                            spellCheck={false}
                            className="border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
                          />
                          <span className="shrink-0 border-l px-3 text-sm text-muted-foreground">
                            .hsite.top
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          onClick={checkAddress}
                          disabled={
                            normalizedSubdomain.length < 3 ||
                            availability.isPending
                          }
                        >
                          {availability.isPending ? (
                            <LoaderCircleIcon className="animate-spin" />
                          ) : (
                            <SearchIcon />
                          )}
                          <Trans message="Verificar disponibilidade" />
                        </Button>
                      </div>
                      <div className="mt-3 min-h-6 text-sm">
                        {checkedAddressMatches ? (
                          <span className="inline-flex items-center gap-2 text-positive">
                            <CheckIcon className="size-4" />
                            <Trans
                              message=":domain está disponível"
                              values={{domain: availability.data?.fqdn}}
                            />
                          </span>
                        ) : checkedAvailabilityMatches &&
                          availability.data?.premium?.requires_purchase ? (
                          <span className="inline-flex items-center gap-2 text-warning">
                            <SparklesIcon className="size-4" />
                            <Trans message="Nome premium disponível para assinatura anual." />
                          </span>
                        ) : checkedSubdomain && availability.data ? (
                          <span className="inline-flex items-center gap-2 text-destructive">
                            <CircleAlertIcon className="size-4" />
                            <Trans message="Este endereço não está disponível. Escolha outro nome." />
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            <Trans message="Use de 5 a 63 caracteres sem custo adicional. Nomes de 3 ou 4 caracteres são premium." />
                          </span>
                        )}
                      </div>
                      {checkedAvailabilityMatches &&
                      availability.data?.premium?.requires_purchase &&
                      availability.data.premium.price ? (
                        <Alert.Root
                          className="mt-4"
                          variant="warning"
                          fillStyle="subtleFill"
                        >
                          <SparklesIcon />
                          <Alert.Title>
                            <Trans message="Nome curto premium" />
                          </Alert.Title>
                          <Alert.Description>
                            <Trans
                              message=":domain está livre e pode ser reservado com uma assinatura anual separada da hospedagem."
                              values={{domain: availability.data.fqdn}}
                            />
                            <div className="mt-3 flex flex-wrap items-center gap-3">
                              <strong className="text-foreground">
                                <FormattedPrice
                                  price={availability.data.premium.price}
                                />
                              </strong>
                              <Button
                                size="sm"
                                onClick={purchasePremiumAddress}
                                disabled={reservePremium.isPending}
                              >
                                {reservePremium.isPending ? (
                                  <LoaderCircleIcon className="animate-spin" />
                                ) : (
                                  <CreditCardIcon />
                                )}
                                <Trans message="Reservar e assinar" />
                              </Button>
                            </div>
                          </Alert.Description>
                        </Alert.Root>
                      ) : null}
                    </Card.Content>
                  </Card.Root>
                </div>

                <OrderSummary
                  plan={selectedPlan}
                  price={selectedPrice}
                  fqdn={
                    normalizedSubdomain
                      ? `${normalizedSubdomain}.hsite.top`
                      : null
                  }
                  canSubmit={canSubmit}
                  isPending={createOrder.isPending}
                  onSubmit={submit}
                />
              </div>
            )}
          </div>
        </DashboardLayout.SectionScrollContainer>
      </DashboardLayout.SectionContent>
    </DashboardLayout.MainSection>
  );
}

function PlanSelection({
  plans,
  selectedPlan,
  onSelect,
}: {
  plans: HostingPlan[];
  selectedPlan?: HostingPlan;
  onSelect: (plan: HostingPlan) => void;
}) {
  return (
    <Card.Root>
      <Card.Header className="border-b">
        <Card.Title>
          <Trans message="Escolha o plano" />
        </Card.Title>
        <Card.Description>
          <Trans message="Os limites e a disponibilidade vêm diretamente do catálogo configurado no painel." />
        </Card.Description>
      </Card.Header>
      <Card.Content className="grid gap-3 md:grid-cols-2">
        {plans.map(plan => {
          const selected = plan.id === selectedPlan?.id;
          const unavailable =
            !plan.purchase_available || !plan.can_create_account;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => {
                if (!unavailable) onSelect(plan);
              }}
              disabled={unavailable}
              className={cn(
                'rounded-card border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                unavailable
                  ? 'cursor-not-allowed bg-muted/30 text-muted-foreground opacity-75'
                  : selected
                    ? 'border-primary bg-primary/[0.06] ring-1 ring-primary'
                    : 'bg-background hover:border-foreground/20',
              )}
              aria-pressed={selected}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{plan.product.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {plan.type === 'free' ? (
                      <Trans message="Grátis para começar" />
                    ) : (
                      <Trans message="Hospedagem paga recorrente" />
                    )}
                  </p>
                </div>
                {selected ? (
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <CheckIcon className="size-4" />
                  </span>
                ) : plan.product.recommended ? (
                  <Badge variant="secondary">
                    <Trans message="Recomendado" />
                  </Badge>
                ) : null}
              </div>
              <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                {getHostingPlanDetails(plan)
                  .slice(0, 4)
                  .map(detail => (
                    <li key={detail} className="flex items-start gap-2">
                      <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-positive" />
                      <span>{detail}</span>
                    </li>
                  ))}
              </ul>
              {unavailable && (
                <div className="mt-4 border-t pt-3 text-xs text-warning">
                  <PlanUnavailableReason
                    reason={plan.creation_unavailable_reason}
                  />
                </div>
              )}
            </button>
          );
        })}
      </Card.Content>
    </Card.Root>
  );
}

function BillingCycleSelection({
  plan,
  selectedPriceId,
  onSelect,
}: {
  plan: HostingPlan;
  selectedPriceId?: number;
  onSelect: (priceId: number) => void;
}) {
  const prices = plan.prices.filter(price => price.purchase_available);

  return (
    <Card.Root>
      <Card.Header className="border-b">
        <Card.Title>
          <Trans message="Escolha o ciclo de cobrança" />
        </Card.Title>
        <Card.Description>
          <Trans message="O pedido ficará aguardando pagamento antes de qualquer provisionamento." />
        </Card.Description>
      </Card.Header>
      <Card.Content className="grid gap-3 sm:grid-cols-2">
        {prices.length ? (
          prices.map(price => (
            <button
              key={price.id}
              type="button"
              onClick={() => onSelect(price.id)}
              className={cn(
                'flex min-h-20 items-center justify-between gap-3 rounded-card border p-4 text-left transition-colors',
                selectedPriceId === price.id
                  ? 'border-primary bg-primary/[0.06] ring-1 ring-primary'
                  : 'bg-background hover:border-foreground/20',
              )}
              aria-pressed={selectedPriceId === price.id}
            >
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  <PriceInterval price={price} />
                </p>
                <FormattedPrice
                  price={price}
                  priceClassName="mt-1 text-xl font-semibold"
                  periodClassName="text-xs text-muted-foreground"
                />
              </div>
              {selectedPriceId === price.id && (
                <CheckIcon className="size-5 text-primary" />
              )}
            </button>
          ))
        ) : (
          <Alert.Root
            variant="warning"
            fillStyle="subtleFill"
            className="sm:col-span-2"
          >
            <CreditCardIcon />
            <Alert.Title>
              <Trans message="Checkout indisponível" />
            </Alert.Title>
            <Alert.Description>
              <Trans message="Nenhum preço deste plano possui um gateway de pagamento ativo." />
            </Alert.Description>
          </Alert.Root>
        )}
      </Card.Content>
    </Card.Root>
  );
}

function AddressSelection({selected}: {selected: AddressMethod}) {
  return (
    <Card.Root>
      <Card.Header className="border-b">
        <Card.Title>
          <Trans message="Escolha como começar" />
        </Card.Title>
        <Card.Description>
          <Trans message="Somente a opção integrada abaixo pode ser usada nesta contratação." />
        </Card.Description>
      </Card.Header>
      <Card.Content className="grid gap-3 md:grid-cols-2">
        <AddressOption
          active={selected === 'free_subdomain'}
          icon={<Globe2Icon />}
          title={<Trans message="Subdomínio gratuito" />}
          description={
            <Trans message="Crie agora um endereço exclusivo terminado em hsite.top." />
          }
        />
        <AddressOption
          disabled
          icon={<ShoppingCartIcon />}
          title={<Trans message="Registrar novo domínio" />}
          description={
            <Trans message="A integração com um registrador ainda não está disponível neste fluxo." />
          }
        />
        <AddressOption
          disabled
          icon={<ArrowRightIcon />}
          title={<Trans message="Transferir domínio" />}
          description={
            <Trans message="Transferência de registro será liberada em uma integração futura." />
          }
        />
        <AddressOption
          disabled
          icon={<LockKeyholeIcon />}
          title={<Trans message="Usar domínio existente" />}
          description={
            <Trans message="Depois da ativação, o painel poderá orientar a vinculação quando este recurso estiver habilitado." />
          }
        />
      </Card.Content>
    </Card.Root>
  );
}

function AddressOption({
  active = false,
  disabled = false,
  icon,
  title,
  description,
}: {
  active?: boolean;
  disabled?: boolean;
  icon: ReactNode;
  title: ReactNode;
  description: ReactNode;
}) {
  return (
    <div
      className={cn(
        'relative flex gap-3 rounded-card border p-4',
        active && 'border-primary bg-primary/[0.06] ring-1 ring-primary',
        disabled && 'bg-muted/30 opacity-65',
      )}
      aria-disabled={disabled || undefined}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-card-xs bg-primary/10 text-primary [&>svg]:size-5">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{title}</p>
          {active ? (
            <Badge variant="positive">
              <Trans message="Disponível" />
            </Badge>
          ) : (
            <Badge variant="outline">
              <Clock3Icon />
              <Trans message="Em breve" />
            </Badge>
          )}
        </div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

function OrderSummary({
  plan,
  price,
  fqdn,
  canSubmit,
  isPending,
  onSubmit,
}: {
  plan?: HostingPlan;
  price?: HostingPlan['prices'][number];
  fqdn: string | null;
  canSubmit: boolean;
  isPending: boolean;
  onSubmit: () => void;
}) {
  return (
    <Card.Root className="xl:sticky xl:top-5">
      <Card.Header className="border-b">
        <Card.Title>
          <Trans message="Resumo do pedido" />
        </Card.Title>
        <Card.Description>
          <Trans message="Confira antes de continuar." />
        </Card.Description>
      </Card.Header>
      <Card.Content className="space-y-4">
        <SummaryRow
          label={<Trans message="Plano" />}
          value={plan?.product.name ?? '—'}
        />
        <SummaryRow label={<Trans message="Endereço" />} value={fqdn ?? '—'} />
        <div className="border-y py-4">
          <p className="text-xs text-muted-foreground">
            <Trans message="Valor" />
          </p>
          {plan?.type === 'free' ? (
            <p className="mt-1 text-2xl font-semibold">R$ 0,00</p>
          ) : price ? (
            <FormattedPrice
              price={price}
              priceClassName="mt-1 text-2xl font-semibold"
              periodClassName="text-xs text-muted-foreground"
            />
          ) : (
            <p className="mt-1 text-sm font-medium text-warning">
              <Trans message="Ciclo indisponível" />
            </p>
          )}
        </div>

        {plan && !plan.can_create_account && (
          <Alert.Root variant="warning" fillStyle="subtleFill">
            <CircleAlertIcon />
            <Alert.Title>
              <Trans message="Este plano não pode criar outra conta agora" />
            </Alert.Title>
            <Alert.Description>
              <PlanUnavailableReason
                reason={plan.creation_unavailable_reason}
              />
            </Alert.Description>
          </Alert.Root>
        )}

        <Button
          size="lg"
          className="w-full"
          disabled={!canSubmit}
          onClick={onSubmit}
        >
          {isPending ? (
            <LoaderCircleIcon className="animate-spin" />
          ) : plan?.type === 'paid' ? (
            <CreditCardIcon />
          ) : (
            <ServerIcon />
          )}
          {plan?.type === 'paid' ? (
            <Trans message="Criar pedido e ir ao checkout" />
          ) : (
            <Trans message="Criar hospedagem gratuita" />
          )}
        </Button>
        <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
          <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-positive" />
          {plan?.type === 'paid' ? (
            <Trans message="A conta paga só será criada depois que o gateway confirmar a assinatura." />
          ) : (
            <Trans message="Você pode manter até duas hospedagens gratuitas separadas nesta conta." />
          )}
        </p>
      </Card.Content>
    </Card.Root>
  );
}

function SummaryRow({label, value}: {label: ReactNode; value: ReactNode}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <strong className="max-w-[65%] text-right font-medium break-words">
        {value}
      </strong>
    </div>
  );
}

function PriceInterval({price}: {price: HostingPlan['prices'][number]}) {
  if (price.interval === 'year' || price.interval_count === 12) {
    return <Trans message="Cobrança anual" />;
  }
  return <Trans message="Cobrança mensal" />;
}

function PlanUnavailableReason({
  reason,
}: {
  reason: HostingPlanCreationUnavailableReason | null;
}) {
  switch (reason) {
    case 'free_entitlement_used':
      return (
        <Trans message="Você já utiliza as duas hospedagens gratuitas disponíveis." />
      );
    case 'plan_account_limit_reached':
      return <Trans message="Você atingiu o limite de contas deste plano." />;
    case 'checkout_unavailable':
      return (
        <Trans message="O checkout deste plano ainda não está configurado." />
      );
    case 'paid_hosting_disabled':
      return (
        <Trans message="Novas hospedagens pagas estão temporariamente desativadas." />
      );
    case 'provider_unavailable':
      return (
        <Trans message="O pacote técnico deste plano ainda não está disponível." />
      );
    case 'workspace_unavailable':
      return (
        <Trans message="Não encontramos o espaço pessoal necessário para criar a conta." />
      );
    case 'plan_unavailable':
    default:
      return (
        <Trans message="Este plano não está disponível para uma nova conta agora." />
      );
  }
}

function CreateHostingSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-6">
        <Skeleton className="h-72 rounded-card" />
        <Skeleton className="h-60 rounded-card" />
        <Skeleton className="h-48 rounded-card" />
      </div>
      <Skeleton className="h-96 rounded-card" />
    </div>
  );
}

function createIdempotencyKey(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `hosting-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}
