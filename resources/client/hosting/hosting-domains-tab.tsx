import {
  createHostingSubdomainOptions,
  deleteHostingDomainOptions,
  hostingDomainsOptions,
  openHostingToolOptions,
  verifyHostingDomainOptions,
} from '@app/hosting/hosting-queries';
import {
  HostingAccount,
  HostingDnsInstruction,
  HostingDomain,
  HostingDomainVerification,
} from '@app/hosting/hosting-types';
import {showHttpErrorToast} from '@common/http/errors/show-http-error-toast';
import {AlertDialog} from '@shadcn/alert-dialog/alert-dialog';
import {Badge} from '@shadcn/badge/badge';
import {Button} from '@shadcn/button/button';
import {Card} from '@shadcn/card/card';
import {Input} from '@shadcn/forms/input/input';
import {Select} from '@shadcn/forms/select/select';
import {Skeleton} from '@shadcn/skeleton/skeleton';
import {toast} from '@shadcn/toast/toast';
import {useMutation, useQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import useClipboard from '@ui/utils/hooks/use-clipboard';
import {
  ArrowLeftRightIcon,
  AtSignIcon,
  CheckIcon,
  CheckCircle2Icon,
  CircleAlertIcon,
  Clock3Icon,
  CopyIcon,
  ExternalLinkIcon,
  Globe2Icon,
  LoaderCircleIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  Trash2Icon,
} from 'lucide-react';
import {FormEvent, ReactNode, useEffect, useMemo, useState} from 'react';
import {useOutletContext} from 'react-router';
import {useSafeExternalToolPopup} from './use-safe-external-tool-popup';

const emptyAllowedZones: string[] = [];
const emptyDomains: HostingDomain[] = [];

export function Component() {
  const {account} = useOutletContext<{account: HostingAccount}>();
  const {trans} = useTrans();
  const domains = useQuery(hostingDomainsOptions(account.id));
  const [search, setSearch] = useState('');
  const [addressMethod, setAddressMethod] =
    useState<AddressMethod>('subdomain');
  const [domain, setDomain] = useState('');
  const [label, setLabel] = useState('');
  const [zone, setZone] = useState('');
  const allowedZones = domains.data?.allowed_zones ?? emptyAllowedZones;
  const listedDomains = domains.data?.data ?? emptyDomains;
  const visibleDomains = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    if (!query) return listedDomains;

    return listedDomains.filter(item =>
      item.domain.toLocaleLowerCase().includes(query),
    );
  }, [listedDomains, search]);
  const openExternalTool = useSafeExternalToolPopup();
  const openPanel = useMutation(openHostingToolOptions(account.id));

  const openControlPanel = () => {
    void openExternalTool({
      loadUrl: async () => (await openPanel.mutateAsync('control-panel')).url,
      onBlocked: () =>
        toast.error(
          <Trans message="Permita pop-ups para abrir o painel de hospedagem." />,
        ),
      onUnsafeUrl: () =>
        toast.error(
          <Trans message="O painel retornou um endereço que não pode ser aberto com segurança." />,
        ),
      onError: error => showHttpErrorToast(error),
    });
  };

  useEffect(() => {
    if (!zone && allowedZones[0]) {
      setZone(allowedZones[0]);
    }
  }, [allowedZones, zone]);

  const verify = useMutation({
    ...verifyHostingDomainOptions(account.id),
    onSuccess: result => {
      if (result.data.status === 'active') {
        toast.success(<Trans message="Domínio confirmado nesta hospedagem." />);
      } else if (result.dns.status === 'verified') {
        toast.success(
          <Trans message="Registro DNS confirmado. Agora adicione o domínio no painel de hospedagem." />,
        );
      } else if (result.dns.status === 'pending') {
        toast.warning(
          <Trans message="Aguardando a propagação do registro DNS." />,
        );
      } else {
        toast.error(
          <Trans message="Não foi possível consultar o DNS agora." />,
        );
      }
    },
    onError: error => showHttpErrorToast(error),
  });
  const createSubdomain = useMutation({
    ...createHostingSubdomainOptions(account.id),
    onSuccess: () => {
      setLabel('');
      toast.success(<Trans message="Subdomínio criado com sucesso." />);
    },
    onError: error => showHttpErrorToast(error),
  });

  const submitVerification = (event: FormEvent) => {
    event.preventDefault();
    verify.mutate(domain.trim().toLowerCase());
  };

  const submitSubdomain = (event: FormEvent) => {
    event.preventDefault();
    createSubdomain.mutate({label: label.trim().toLowerCase(), zone});
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-8">
      <header>
        <h1 className="text-xl font-semibold">
          <Trans message="Domínios" />
        </h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
          <Trans message="Encontre os endereços desta hospedagem, crie um subdomínio gratuito ou conecte um domínio que você já possui." />
        </p>
      </header>

      <Card.Root>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <Trans message="Domínios da hospedagem" />
            {!domains.isLoading && (
              <Badge variant="outline">{listedDomains.length}</Badge>
            )}
          </Card.Title>
          <Card.Description>
            <Trans message="A lista é sincronizada com o servidor. Pesquise pelo endereço completo para localizar um site rapidamente." />
          </Card.Description>
          <Card.Action className="col-span-full row-start-3 mt-3 w-full justify-self-stretch lg:col-span-1 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:w-auto lg:justify-self-end">
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
          </Card.Action>
        </Card.Header>
        <Card.Content>
          {domains.isLoading ? (
            <div className="space-y-3" aria-label="Carregando domínios">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : domains.isError && !listedDomains.length ? (
            <DomainListState
              icon={<CircleAlertIcon />}
              title={<Trans message="Não foi possível carregar os domínios" />}
              description={
                <Trans message="A integração não respondeu. Atualize a lista sem alterar sua hospedagem." />
              }
              action={
                <Button variant="outline" onClick={() => domains.refetch()}>
                  <RefreshCwIcon />
                  <Trans message="Tentar novamente" />
                </Button>
              }
            />
          ) : !listedDomains.length ? (
            <DomainListState
              icon={<Globe2Icon />}
              title={<Trans message="Nenhum domínio sincronizado" />}
              description={
                <Trans message="Use as opções abaixo para criar o primeiro endereço desta hospedagem." />
              }
            />
          ) : !visibleDomains.length ? (
            <DomainListState
              icon={<SearchIcon />}
              title={<Trans message="Nenhum domínio encontrado" />}
              description={
                <Trans message="Tente outro endereço ou limpe a pesquisa para ver a lista completa." />
              }
              action={
                <Button variant="outline" onClick={() => setSearch('')}>
                  <Trans message="Limpar pesquisa" />
                </Button>
              }
            />
          ) : (
            <div className="divide-y overflow-hidden rounded-card-sm border">
              {visibleDomains.map(item => (
                <DomainRow
                  accountId={account.id}
                  domain={item}
                  canDelete={
                    !item.is_primary &&
                    item.type === 'subdomain' &&
                    Boolean(domains.data?.can_manage_subdomains)
                  }
                  key={item.domain}
                />
              ))}
            </div>
          )}

          {(domains.isError || domains.data?.availability !== 'available') && (
            <div
              className="mt-4 flex gap-3 rounded-card-sm bg-warning/10 p-4 text-sm"
              role="status"
            >
              <CircleAlertIcon className="mt-0.5 size-5 shrink-0 text-warning" />
              <div className="min-w-0">
                <p className="font-medium">
                  <Trans message="Sincronização de domínios indisponível" />
                </p>
                <p className="mt-1 text-muted-foreground">
                  <Trans message="A lista pode não refletir a alteração mais recente. Tente novamente quando a integração do servidor estiver disponível." />
                </p>
              </div>
            </div>
          )}
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Card.Title>
            <Trans message="Adicionar endereço" />
          </Card.Title>
          <Card.Description>
            <Trans message="Escolha como o novo endereço será conectado a esta hospedagem." />
          </Card.Description>
        </Card.Header>
        <Card.Content className="space-y-6">
          <div
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
            role="group"
            aria-label={trans({message: 'Forma de adicionar domínio'})}
          >
            <AddressMethodButton
              icon={<AtSignIcon />}
              title={<Trans message="Subdomínio gratuito" />}
              description={
                <Trans message="Crie um endereço em uma zona disponível para sua conta." />
              }
              selected={addressMethod === 'subdomain'}
              onClick={() => setAddressMethod('subdomain')}
            />
            <AddressMethodButton
              icon={<Globe2Icon />}
              title={<Trans message="Usar domínio próprio" />}
              description={
                <Trans message="Verifique um endereço que você já registrou." />
              }
              selected={addressMethod === 'own-domain'}
              onClick={() => setAddressMethod('own-domain')}
            />
            <AddressMethodButton
              icon={<ShoppingCartIcon />}
              title={<Trans message="Registrar novo domínio" />}
              description={
                <Trans message="Contrate um novo endereço pelo HospedFree." />
              }
              disabled
            />
            <AddressMethodButton
              icon={<ArrowLeftRightIcon />}
              title={<Trans message="Transferir domínio" />}
              description={
                <Trans message="Traga a gestão de um domínio já registrado." />
              }
              disabled
            />
          </div>

          <div
            id="domain-method-panel"
            className="border-t pt-6"
            aria-live="polite"
          >
            {addressMethod === 'subdomain' ? (
              <section className="min-w-0">
                <h2 className="text-base font-semibold">
                  <Trans message="Crie seu endereço gratuito" />
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                  <Trans message="Escolha um nome curto e uma das extensões liberadas. O endereço será adicionado à hospedagem atual." />
                </p>
                <form
                  onSubmit={submitSubdomain}
                  className="mt-5 max-w-2xl space-y-4"
                >
                  <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(9rem,0.7fr)]">
                    <div className="min-w-0">
                      <label
                        htmlFor="hosting-subdomain"
                        className="text-sm font-medium"
                      >
                        <Trans message="Nome" />
                      </label>
                      <Input
                        id="hosting-subdomain"
                        className="mt-2"
                        value={label}
                        onChange={event =>
                          setLabel(event.target.value.toLowerCase())
                        }
                        placeholder="meusite"
                        autoComplete="off"
                        spellCheck={false}
                        minLength={2}
                        maxLength={63}
                        pattern="[a-z0-9](?:[a-z0-9-]*[a-z0-9])?"
                        required
                        disabled={!domains.data?.can_manage_subdomains}
                      />
                    </div>
                    <div className="min-w-0">
                      <label className="text-sm font-medium">
                        <Trans message="Extensão" />
                      </label>
                      <Select.Root
                        value={zone}
                        onValueChange={value => setZone(value ?? '')}
                        disabled={!domains.data?.can_manage_subdomains}
                        items={allowedZones.map(item => ({
                          value: item,
                          label: item,
                        }))}
                      >
                        <Select.Trigger className="mt-2 w-full">
                          <Select.Value
                            placeholder={<Trans message="Selecione" />}
                          />
                        </Select.Trigger>
                        <Select.Content>
                          {allowedZones.map(item => (
                            <Select.Item key={item} value={item}>
                              {item}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Root>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={
                      createSubdomain.isPending ||
                      !label.trim() ||
                      !zone ||
                      !domains.data?.can_manage_subdomains
                    }
                  >
                    {createSubdomain.isPending ? (
                      <LoaderCircleIcon className="animate-spin" />
                    ) : (
                      <PlusIcon />
                    )}
                    <Trans message="Criar subdomínio" />
                  </Button>
                  {!domains.data?.can_manage_subdomains &&
                    !domains.isLoading && (
                      <p
                        className="text-sm text-muted-foreground"
                        role="status"
                      >
                        <Trans message="A criação ficará disponível quando a conta e a integração do painel estiverem prontas." />
                      </p>
                    )}
                </form>
              </section>
            ) : (
              <section className="min-w-0">
                <h2 className="text-base font-semibold">
                  <Trans message="Conecte um domínio que você já possui" />
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                  <Trans message="Informe o endereço completo. O HospedFree verifica o DNS público e mostra a próxima ação sem alterar o registro do domínio." />
                </p>
                <form
                  onSubmit={submitVerification}
                  className="mt-5 max-w-2xl space-y-4"
                >
                  <div className="min-w-0">
                    <label
                      htmlFor="hosting-domain"
                      className="text-sm font-medium"
                    >
                      <Trans message="Nome do domínio" />
                    </label>
                    <Input
                      id="hosting-domain"
                      className="mt-2"
                      value={domain}
                      onChange={event => {
                        setDomain(event.target.value.toLowerCase());
                        verify.reset();
                      }}
                      placeholder="exemplo.com"
                      autoComplete="off"
                      spellCheck={false}
                      maxLength={253}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={verify.isPending || !domain.trim()}
                  >
                    {verify.isPending ? (
                      <LoaderCircleIcon className="animate-spin" />
                    ) : (
                      <ShieldCheckIcon />
                    )}
                    <Trans message="Verificar domínio" />
                  </Button>
                </form>
                {verify.data ? (
                  <DomainVerificationResult
                    result={verify.data}
                    openingPanel={openPanel.isPending}
                    canOpenPanel={account.tools.control_panel}
                    onOpenPanel={openControlPanel}
                  />
                ) : (
                  <p className="mt-4 max-w-2xl text-xs leading-5 text-muted-foreground">
                    <Trans message="A verificação consulta somente dados públicos do DNS. Credenciais da hospedagem nunca são enviadas ao navegador." />
                  </p>
                )}
              </section>
            )}
          </div>

          <div className="flex items-start gap-3 border-t pt-5 text-sm">
            <Clock3Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="font-medium">
                <Trans message="Registro e transferência estão em preparação" />
              </p>
              <p className="mt-1 max-w-3xl leading-6 text-muted-foreground">
                <Trans message="Essas opções serão liberadas quando a integração de registro de domínios estiver configurada. Nenhum preço ou disponibilidade é exibido antes dessa conexão." />
              </p>
            </div>
          </div>
        </Card.Content>
      </Card.Root>
    </div>
  );
}

type AddressMethod = 'subdomain' | 'own-domain';

function AddressMethodButton({
  icon,
  title,
  description,
  selected = false,
  disabled = false,
  onClick,
}: {
  icon: ReactNode;
  title: ReactNode;
  description: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={`flex min-h-36 w-full flex-col items-start rounded-card-sm border p-4 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-100 ${
        selected
          ? 'border-primary bg-primary/5'
          : disabled
            ? 'bg-muted/20 text-muted-foreground'
            : 'hover:bg-muted/30'
      }`}
      aria-pressed={selected}
      aria-controls={!disabled ? 'domain-method-panel' : undefined}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="flex w-full items-start justify-between gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-button [&>svg]:size-5 ${selected ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}
        >
          {icon}
        </span>
        {disabled && (
          <Badge variant="secondary">
            <Trans message="Em preparação" />
          </Badge>
        )}
      </span>
      <span className="mt-4 font-semibold text-foreground">{title}</span>
      <span className="mt-1 text-sm leading-5 text-muted-foreground">
        {description}
      </span>
    </button>
  );
}

function DomainListState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: ReactNode;
  description: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-card-sm border px-5 py-8 text-center">
      <span className="flex size-10 items-center justify-center rounded-button bg-primary/10 text-primary [&>svg]:size-5">
        {icon}
      </span>
      <h2 className="mt-3 font-medium">{title}</h2>
      <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function DomainVerificationResult({
  result,
  openingPanel,
  canOpenPanel,
  onOpenPanel,
}: {
  result: HostingDomainVerification;
  openingPanel: boolean;
  canOpenPanel: boolean;
  onOpenPanel: () => void;
}) {
  const active = result.data.status === 'active';
  const dnsVerified = result.dns.status === 'verified';

  return (
    <div
      className={`mt-4 rounded-card-sm border p-4 ${
        active || dnsVerified
          ? 'border-positive/30 bg-positive/5'
          : result.dns.status === 'pending'
            ? 'border-warning/30 bg-warning/5'
            : 'border-danger/30 bg-danger/5'
      }`}
      role="status"
    >
      <div className="flex gap-3">
        {active || dnsVerified ? (
          <CheckCircle2Icon className="mt-0.5 size-5 shrink-0 text-positive" />
        ) : (
          <CircleAlertIcon className="mt-0.5 size-5 shrink-0 text-warning" />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium">
            {active ? (
              <Trans message="Domínio ativo nesta hospedagem" />
            ) : dnsVerified ? (
              <Trans message="DNS confirmado" />
            ) : result.dns.status === 'pending' ? (
              <Trans message="Configure o registro CNAME" />
            ) : (
              <Trans message="Não foi possível consultar o DNS" />
            )}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {active ? (
              <Trans message="O servidor já reconhece este domínio como parte da sua conta." />
            ) : dnsVerified ? (
              <Trans message="A propriedade foi confirmada. Use o painel de hospedagem para concluir a inclusão do domínio." />
            ) : result.dns.status === 'pending' ? (
              <Trans message="Crie o registro abaixo no provedor DNS do seu domínio e verifique novamente após a propagação." />
            ) : (
              <Trans message="Tente novamente em alguns minutos. Nenhuma alteração foi feita no seu domínio." />
            )}
          </p>
        </div>
      </div>

      {!active && result.dns.instructions.length ? (
        <div className="mt-4 space-y-3 border-t pt-4">
          {result.dns.instructions.map(instruction => (
            <DnsInstruction
              key={`${instruction.type}:${instruction.name}`}
              instruction={instruction}
            />
          ))}
        </div>
      ) : null}

      {!active && dnsVerified && canOpenPanel ? (
        <Button
          className="mt-4 w-full sm:w-auto"
          size="sm"
          onClick={onOpenPanel}
          disabled={openingPanel}
        >
          {openingPanel ? (
            <LoaderCircleIcon className="animate-spin" />
          ) : (
            <ExternalLinkIcon />
          )}
          <Trans message="Adicionar no painel de hospedagem" />
        </Button>
      ) : null}
    </div>
  );
}

function DnsInstruction({instruction}: {instruction: HostingDnsInstruction}) {
  return (
    <dl className="grid min-w-0 gap-3 text-sm sm:grid-cols-[5rem_minmax(0,1fr)]">
      <div>
        <dt className="text-xs font-medium text-muted-foreground">
          <Trans message="Tipo" />
        </dt>
        <dd className="mt-1 font-medium">{instruction.type}</dd>
      </div>
      <DnsValue
        label={<Trans message="Nome do registro" />}
        value={instruction.name}
        kind="name"
      />
      <DnsValue
        className="sm:col-start-2"
        label={<Trans message="Destino" />}
        value={instruction.value}
        kind="value"
      />
      <div className="sm:col-start-2">
        <dt className="text-xs font-medium text-muted-foreground">TTL</dt>
        <dd className="mt-1 font-medium">{instruction.ttl}</dd>
      </div>
    </dl>
  );
}

function DnsValue({
  label,
  value,
  kind,
  className,
}: {
  label: ReactNode;
  value: string;
  kind: 'name' | 'value';
  className?: string;
}) {
  const [copied, copy] = useClipboard(value);
  const {trans} = useTrans();
  const copyLabel =
    kind === 'name'
      ? trans({message: 'Copiar nome do registro DNS'})
      : trans({message: 'Copiar destino do registro DNS'});

  return (
    <div className={`min-w-0 ${className ?? ''}`}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 flex min-w-0 items-center gap-2">
        <code className="min-w-0 flex-1 text-xs break-all">{value}</code>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={copyLabel}
          onClick={copy}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </Button>
      </dd>
    </div>
  );
}

function DomainRow({
  accountId,
  domain,
  canDelete,
}: {
  accountId: number;
  domain: HostingDomain;
  canDelete: boolean;
}) {
  const active = domain.status === 'active';
  const [confirming, setConfirming] = useState(false);
  const remove = useMutation({
    ...deleteHostingDomainOptions(accountId),
    onSuccess: () => {
      setConfirming(false);
      toast.success(<Trans message="Domínio removido com sucesso." />);
    },
    onError: error => showHttpErrorToast(error),
  });

  return (
    <div className="flex min-w-0 flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Globe2Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold break-all">{domain.domain}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {domain.is_primary ? (
            <Trans message="Domínio principal" />
          ) : domain.type === 'subdomain' ? (
            <Trans message="Subdomínio" />
          ) : (
            <Trans message="Domínio próprio" />
          )}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex w-max items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${active ? 'bg-positive/10 text-positive' : 'bg-warning/10 text-warning'}`}
        >
          {active ? (
            <CheckCircle2Icon className="size-3.5" />
          ) : (
            <CircleAlertIcon className="size-3.5" />
          )}
          {active ? (
            <Trans message="Ativo" />
          ) : domain.status === 'suspended' ? (
            <Trans message="Suspenso" />
          ) : (
            <Trans message="Verificação pendente" />
          )}
        </span>
        {canDelete && (
          <AlertDialog.Root open={confirming} onOpenChange={setConfirming}>
            <AlertDialog.Trigger
              render={
                <Button
                  variant="ghost"
                  color="danger"
                  size="icon-sm"
                  aria-label="Remover subdomínio"
                />
              }
            >
              <Trash2Icon />
            </AlertDialog.Trigger>
            <AlertDialog.Portal>
              <AlertDialog.Backdrop />
              <AlertDialog.Content size="sm">
                <AlertDialog.Header>
                  <AlertDialog.Media>
                    <Trash2Icon />
                  </AlertDialog.Media>
                  <AlertDialog.Title>
                    <Trans message="Remover subdomínio" />
                  </AlertDialog.Title>
                  <AlertDialog.Description>
                    <Trans
                      message="Remover :domain da hospedagem? Os arquivos existentes não serão apagados automaticamente."
                      values={{domain: domain.domain}}
                    />
                  </AlertDialog.Description>
                </AlertDialog.Header>
                <AlertDialog.Footer>
                  <AlertDialog.Cancel disabled={remove.isPending}>
                    <Trans message="Cancelar" />
                  </AlertDialog.Cancel>
                  <AlertDialog.Action
                    color="danger"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(domain.domain)}
                  >
                    {remove.isPending && (
                      <LoaderCircleIcon className="animate-spin" />
                    )}
                    <Trans message="Remover" />
                  </AlertDialog.Action>
                </AlertDialog.Footer>
              </AlertDialog.Content>
            </AlertDialog.Portal>
          </AlertDialog.Root>
        )}
      </div>
    </div>
  );
}
