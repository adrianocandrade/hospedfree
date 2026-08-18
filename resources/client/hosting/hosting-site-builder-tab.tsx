import {
  getHostingPlanDetails,
  getPreferredPaidHostingPlan,
} from '@app/hosting/hosting-plan-presentation';
import {
  hostingDomainsOptions,
  hostingPlansOptions,
  openHostingToolOptions,
} from '@app/hosting/hosting-queries';
import {HostingAccount, HostingDomain} from '@app/hosting/hosting-types';
import {showHttpErrorToast} from '@common/http/errors/show-http-error-toast';
import {Badge} from '@shadcn/badge/badge';
import {Button, LinkButton} from '@shadcn/button/button';
import {Empty} from '@shadcn/empty/empty';
import {Input} from '@shadcn/forms/input/input';
import {Skeleton} from '@shadcn/skeleton/skeleton';
import {Table} from '@shadcn/table/table';
import {toast} from '@shadcn/toast/toast';
import {useMutation, useQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {
  ArrowRightIcon,
  CheckIcon,
  CircleAlertIcon,
  ExternalLinkIcon,
  Globe2Icon,
  LoaderCircleIcon,
  PaletteIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from 'lucide-react';
import {ReactNode, useMemo, useState} from 'react';
import {useOutletContext} from 'react-router';
import {useSafeExternalToolPopup} from './use-safe-external-tool-popup';

export function Component() {
  const {account} = useOutletContext<{account: HostingAccount}>();
  const {trans} = useTrans();
  const domains = useQuery(hostingDomainsOptions(account.id));
  const plans = useQuery(hostingPlansOptions());
  const [search, setSearch] = useState('');
  const openExternalTool = useSafeExternalToolPopup();
  const openBuilder = useMutation(openHostingToolOptions(account.id));
  const editSite = (domain: string) => {
    void openExternalTool({
      loadUrl: async () =>
        (
          await openBuilder.mutateAsync({
            tool: 'site-builder',
            domain,
          })
        ).url,
      onBlocked: () =>
        toast.error(
          <Trans message="Permita pop-ups para abrir o construtor de sites." />,
        ),
      onUnsafeUrl: () =>
        toast.error(
          <Trans message="O construtor retornou um endereço que não pode ser aberto com segurança." />,
        ),
      onError: error => showHttpErrorToast(error),
    });
  };
  const visibleDomains = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const availableDomains = domains.data?.data ?? [];

    if (!query) return availableDomains;

    return availableDomains.filter(domain =>
      domain.domain.toLocaleLowerCase().includes(query),
    );
  }, [domains.data?.data, search]);
  const paidPlan = getPreferredPaidHostingPlan(plans.data ?? []);
  const paidPlanDetails = paidPlan
    ? getHostingPlanDetails(paidPlan).slice(0, 3)
    : [];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            <Trans message="Construtor de sites" />
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            <Trans message="Edite um domínio ativo da sua hospedagem. Para começar outro site, adicione um domínio e aguarde a ativação antes de abrir o editor." />
          </p>
        </div>
        <LinkButton
          className="w-full shrink-0 sm:w-auto"
          to={`/dashboard/hosting/${account.id}/domains`}
        >
          <PlusIcon />
          <Trans message="Adicionar domínio" />
        </LinkButton>
      </header>

      <section className="overflow-hidden rounded-card border bg-card">
        <div className="flex flex-col gap-4 border-b px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">
                <Trans message="Sites e domínios" />
              </h2>
              {!domains.isLoading && (
                <Badge variant="outline">
                  {domains.data?.data.length ?? 0}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              <Trans message="Somente domínios pertencentes a esta hospedagem podem abrir o editor." />
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <div className="relative min-w-0 sm:w-72">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                bindToHookForm={false}
                type="search"
                value={search}
                onChange={event => setSearch(event.target.value)}
                aria-label={trans({
                  message: 'Pesquisar nos meus domínios',
                })}
                placeholder={trans({
                  message: 'Pesquisar nos meus domínios',
                })}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => domains.refetch()}
              disabled={domains.isFetching}
            >
              <RefreshCwIcon
                className={domains.isFetching ? 'animate-spin' : undefined}
              />
              <Trans message="Atualizar" />
            </Button>
          </div>
        </div>

        {domains.data && domains.data.availability !== 'available' && (
          <div
            className="flex items-start gap-3 border-b bg-muted/35 px-5 py-3 text-sm sm:px-6"
            role="status"
          >
            <CircleAlertIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="text-muted-foreground">
              <Trans message="A sincronização dos domínios está temporariamente indisponível. A lista abaixo pode não refletir a alteração mais recente." />
            </p>
          </div>
        )}

        {domains.isLoading ? (
          <SitesSkeleton />
        ) : domains.isError ? (
          <Empty.Root className="min-h-72">
            <Empty.Header>
              <Empty.Media variant="icon">
                <CircleAlertIcon />
              </Empty.Media>
              <Empty.Title>
                <Trans message="Não foi possível carregar seus sites" />
              </Empty.Title>
              <Empty.Description>
                <Trans message="Verifique sua conexão e tente carregar os domínios novamente." />
              </Empty.Description>
            </Empty.Header>
            <Button variant="outline" onClick={() => domains.refetch()}>
              <RefreshCwIcon />
              <Trans message="Tentar novamente" />
            </Button>
          </Empty.Root>
        ) : !domains.data?.data.length ? (
          <Empty.Root className="min-h-72">
            <Empty.Header>
              <Empty.Media variant="icon">
                <PaletteIcon />
              </Empty.Media>
              <Empty.Title>
                <Trans message="Nenhum domínio disponível" />
              </Empty.Title>
              <Empty.Description>
                <Trans message="Adicione um domínio à hospedagem. Quando ele estiver ativo, você poderá abrir o construtor com segurança." />
              </Empty.Description>
            </Empty.Header>
            <LinkButton to={`/dashboard/hosting/${account.id}/domains`}>
              <PlusIcon />
              <Trans message="Adicionar domínio" />
            </LinkButton>
          </Empty.Root>
        ) : !visibleDomains.length ? (
          <Empty.Root className="min-h-56">
            <Empty.Header>
              <Empty.Media variant="icon">
                <SearchIcon />
              </Empty.Media>
              <Empty.Title>
                <Trans message="Nenhum domínio encontrado" />
              </Empty.Title>
              <Empty.Description>
                <Trans message="Tente pesquisar por outro nome de domínio." />
              </Empty.Description>
            </Empty.Header>
            <Button variant="outline" onClick={() => setSearch('')}>
              <Trans message="Limpar pesquisa" />
            </Button>
          </Empty.Root>
        ) : (
          <>
            <div className="hidden md:block">
              <Table.Root
                aria-label={trans({message: 'Sites disponíveis no construtor'})}
              >
                <Table.Header>
                  <Table.Row>
                    <Table.Head className="pl-6">
                      <Trans message="Site" />
                    </Table.Head>
                    <Table.Head>
                      <Trans message="Plano de hospedagem" />
                    </Table.Head>
                    <Table.Head>
                      <Trans message="Integração do construtor" />
                    </Table.Head>
                    <Table.Head>
                      <Trans message="Status" />
                    </Table.Head>
                    <Table.Head className="pr-6 text-right">
                      <span className="sr-only">
                        <Trans message="Ações" />
                      </span>
                    </Table.Head>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {visibleDomains.map(domain => (
                    <SiteTableRow
                      key={domain.domain}
                      account={account}
                      domain={domain}
                      busy={openBuilder.isPending}
                      opening={isOpeningDomain(openBuilder, domain.domain)}
                      onOpen={() => editSite(domain.domain)}
                    />
                  ))}
                </Table.Body>
              </Table.Root>
            </div>

            <div className="divide-y md:hidden">
              {visibleDomains.map(domain => (
                <SiteMobileRow
                  key={domain.domain}
                  account={account}
                  domain={domain}
                  busy={openBuilder.isPending}
                  opening={isOpeningDomain(openBuilder, domain.domain)}
                  onOpen={() => editSite(domain.domain)}
                />
              ))}
            </div>
          </>
        )}
      </section>

      <section className="grid overflow-hidden rounded-card border bg-card lg:grid-cols-[1.1fr_0.9fr]">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheckIcon className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold">
                <Trans message="Acesso protegido ao editor" />
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                <Trans message="A sessão do construtor é criada pelo servidor somente quando você clica em Editar site. Credenciais da hospedagem não aparecem nos dados comuns da conta." />
              </p>
            </div>
          </div>
          <ul className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <BuilderFact>
              <Trans message="Use somente domínios ativos desta hospedagem" />
            </BuilderFact>
            <BuilderFact>
              <Trans message="Abra cada site em uma sessão independente" />
            </BuilderFact>
          </ul>
          <LinkButton
            className="mt-5"
            variant="outline"
            to="/construtor-de-sites"
          >
            <Trans message="Conhecer o construtor" />
            <ArrowRightIcon />
          </LinkButton>
        </div>

        <div className="border-t bg-muted/25 p-5 sm:p-6 lg:border-t-0 lg:border-l">
          {plans.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-7 w-52" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-9 w-36" />
            </div>
          ) : paidPlan ? (
            <>
              <div className="flex items-center gap-2 text-primary">
                <SparklesIcon className="size-4" />
                <span className="text-sm font-medium">
                  {account.plan?.type === 'free' ? (
                    <Trans message="Mais recursos de hospedagem" />
                  ) : (
                    <Trans message="Seu catálogo de hospedagem" />
                  )}
                </span>
              </div>
              <h2 className="mt-2 text-lg font-semibold">
                {paidPlan.product.name}
              </h2>
              {paidPlan.product.description && (
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {paidPlan.product.description}
                </p>
              )}
              {paidPlanDetails.length > 0 && (
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {paidPlanDetails.map(detail => (
                    <li key={detail} className="flex items-start gap-2">
                      <CheckIcon className="mt-0.5 size-4 shrink-0 text-positive" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                <Trans message="Este é um plano de hospedagem. Os recursos comerciais do construtor dependem da configuração própria do editor." />
              </p>
              <LinkButton className="mt-5" to="/dashboard/hosting/plans">
                {account.plan?.type === 'free' ? (
                  <Trans message="Comparar planos" />
                ) : (
                  <Trans message="Gerenciar plano" />
                )}
                <ArrowRightIcon />
              </LinkButton>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-muted-foreground">
                <PaletteIcon className="size-4" />
                <span className="text-sm font-medium">
                  <Trans message="Integração do construtor" />
                </span>
              </div>
              <h2 className="mt-2 text-lg font-semibold">
                {account.tools.site_builder ? (
                  <Trans message="Editor disponível" />
                ) : (
                  <Trans message="Ainda não configurado" />
                )}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {account.tools.site_builder ? (
                  <Trans message="Você pode abrir o editor nos domínios ativos listados acima." />
                ) : (
                  <Trans message="O administrador precisa concluir a integração antes que o editor possa ser aberto." />
                )}
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function SiteTableRow({account, domain, busy, opening, onOpen}: SiteRowProps) {
  const canEdit = canEditDomain(account, domain);

  return (
    <Table.Row>
      <Table.Cell className="pl-6">
        <DomainIdentity domain={domain} />
      </Table.Cell>
      <Table.Cell>
        <p className="font-medium">
          {account.plan?.name ?? <Trans message="Plano indisponível" />}
        </p>
      </Table.Cell>
      <Table.Cell>
        <BuilderPlanBadge available={account.tools.site_builder} />
      </Table.Cell>
      <Table.Cell>
        <DomainStatusBadge account={account} domain={domain} />
      </Table.Cell>
      <Table.Cell className="pr-6 text-right">
        <EditSiteButton
          canEdit={canEdit}
          busy={busy}
          opening={opening}
          onOpen={onOpen}
        />
      </Table.Cell>
    </Table.Row>
  );
}

function SiteMobileRow({account, domain, busy, opening, onOpen}: SiteRowProps) {
  return (
    <article className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <DomainIdentity domain={domain} />
        <DomainStatusBadge account={account} domain={domain} />
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">
            <Trans message="Plano de hospedagem" />
          </dt>
          <dd className="mt-1 font-medium">
            {account.plan?.name ?? <Trans message="Plano indisponível" />}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">
            <Trans message="Integração do construtor" />
          </dt>
          <dd className="mt-1">
            <BuilderPlanBadge available={account.tools.site_builder} />
          </dd>
        </div>
      </dl>
      <EditSiteButton
        className="w-full"
        canEdit={canEditDomain(account, domain)}
        busy={busy}
        opening={opening}
        onOpen={onOpen}
      />
    </article>
  );
}

function DomainIdentity({domain}: {domain: HostingDomain}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Globe2Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate font-semibold" title={domain.domain}>
          {domain.domain}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {domain.is_primary ? (
            <Trans message="Domínio principal" />
          ) : (
            <Trans message="Domínio adicional" />
          )}
        </p>
      </div>
    </div>
  );
}

function BuilderPlanBadge({available}: {available: boolean}) {
  return available ? (
    <Badge variant="positive">
      <CheckIcon />
      <Trans message="Editor disponível" />
    </Badge>
  ) : (
    <Badge variant="secondary">
      <Trans message="Não configurado" />
    </Badge>
  );
}

function DomainStatusBadge({
  account,
  domain,
}: {
  account: HostingAccount;
  domain: HostingDomain;
}) {
  if (account.status !== 'active') {
    return (
      <Badge variant="secondary">
        <Trans message="Hospedagem indisponível" />
      </Badge>
    );
  }

  if (domain.status === 'active') {
    return account.tools.site_builder ? (
      <Badge variant="positive">
        <Trans message="Pronto para editar" />
      </Badge>
    ) : (
      <Badge variant="secondary">
        <Trans message="Construtor indisponível" />
      </Badge>
    );
  }

  if (['pending', 'processing', 'provisioning'].includes(domain.status)) {
    return (
      <Badge variant="secondary">
        <Trans message="Em configuração" />
      </Badge>
    );
  }

  if (['failed', 'action_required'].includes(domain.status)) {
    return (
      <Badge variant="destructive">
        <Trans message="Ação necessária" />
      </Badge>
    );
  }

  return (
    <Badge variant="secondary">
      <Trans message="Indisponível" />
    </Badge>
  );
}

function EditSiteButton({
  canEdit,
  busy,
  opening,
  onOpen,
  className,
}: {
  canEdit: boolean;
  busy: boolean;
  opening: boolean;
  onOpen: () => void;
  className?: string;
}) {
  return (
    <Button
      className={className}
      variant="outline"
      disabled={!canEdit || busy}
      onClick={onOpen}
    >
      {opening ? (
        <LoaderCircleIcon className="animate-spin" />
      ) : (
        <PaletteIcon />
      )}
      {opening ? (
        <Trans message="Abrindo..." />
      ) : (
        <Trans message="Editar site" />
      )}
      {!opening && <ExternalLinkIcon />}
    </Button>
  );
}

function BuilderFact({children}: {children: ReactNode}) {
  return (
    <li className="flex items-start gap-2 text-muted-foreground">
      <CheckIcon className="mt-0.5 size-4 shrink-0 text-positive" />
      <span>{children}</span>
    </li>
  );
}

function SitesSkeleton() {
  return (
    <div className="space-y-3 p-5 sm:p-6">
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-14 w-full" />
    </div>
  );
}

type SiteRowProps = {
  account: HostingAccount;
  domain: HostingDomain;
  busy: boolean;
  opening: boolean;
  onOpen: () => void;
};

function canEditDomain(account: HostingAccount, domain: HostingDomain) {
  return (
    account.status === 'active' &&
    domain.status === 'active' &&
    account.tools.site_builder
  );
}

function isOpeningDomain(
  mutation: {isPending: boolean; variables: unknown},
  domain: string,
) {
  return (
    mutation.isPending &&
    typeof mutation.variables === 'object' &&
    mutation.variables !== null &&
    'domain' in mutation.variables &&
    mutation.variables.domain === domain
  );
}
