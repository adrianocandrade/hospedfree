import {
  hostingDomainsOptions,
  hostingSslOptions,
  requestHostingSslOptions,
  revokeHostingSslOptions,
  verifyHostingSslOptions,
} from '@app/hosting/hosting-queries';
import {
  HostingAccount,
  HostingSslCertificate,
  HostingSslFilter,
} from '@app/hosting/hosting-types';
import {usePasswordConfirmedAction} from '@common/auth/ui/confirm-password/use-password-confirmed-action';
import {DataTablePaginationFooter} from '@common/datatable/data-table-pagination-footer';
import {showHttpErrorToast} from '@common/http/errors/show-http-error-toast';
import {Alert} from '@shadcn/alert/alert';
import {AlertDialog} from '@shadcn/alert-dialog/alert-dialog';
import {Badge} from '@shadcn/badge/badge';
import {Button} from '@shadcn/button/button';
import {Dialog} from '@shadcn/dialog/dialog';
import {Empty} from '@shadcn/empty/empty';
import {Select} from '@shadcn/forms/select/select';
import {Skeleton} from '@shadcn/skeleton/skeleton';
import {Tabs} from '@shadcn/tabs/tabs';
import {toast} from '@shadcn/toast/toast';
import {useMutation, useQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import useClipboard from '@ui/utils/hooks/use-clipboard';
import {
  CheckCircle2Icon,
  CheckIcon,
  CircleAlertIcon,
  CopyIcon,
  LoaderCircleIcon,
  PlusIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  ShieldXIcon,
  SparklesIcon,
} from 'lucide-react';
import {ReactNode, useMemo, useState} from 'react';
import {useOutletContext, useSearchParams} from 'react-router';
import {formatHostingDate} from './format-hosting-date';

const certificateFilters: HostingSslFilter[] = [
  'all',
  'action_required',
  'issued',
  'expired',
  'revoked',
  'failed',
];

const perPageOptions = [15, 30, 60, 100];

export function Component() {
  const {account} = useOutletContext<{account: HostingAccount}>();
  const {trans} = useTrans();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedFilter = searchParams.get('sslStatus') as HostingSslFilter;
  const status = certificateFilters.includes(requestedFilter)
    ? requestedFilter
    : 'all';
  const requestedPage = Number(searchParams.get('sslPage'));
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const requestedPerPage = Number(searchParams.get('sslPerPage'));
  const perPage = perPageOptions.includes(requestedPerPage)
    ? requestedPerPage
    : 15;
  const [requestOpen, setRequestOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState('');
  const domainSelectId = `hosting-${account.id}-ssl-domain`;
  const domainSelectLabelId = `${domainSelectId}-label`;
  const {withConfirmedPassword, isLoading: isConfirmingPassword} =
    usePasswordConfirmedAction();
  const certificates = useQuery(
    hostingSslOptions(account.id, {status, page, perPage}),
  );
  const domains = useQuery(hostingDomainsOptions(account.id));
  const activeDomains = useMemo(() => {
    const values = (domains.data?.data ?? [])
      .filter(domain => domain.status === 'active')
      .map(domain => domain.domain.toLowerCase());

    if (account.status === 'active' && account.fqdn) {
      values.push(account.fqdn.toLowerCase());
    }

    return [...new Set(values)];
  }, [account.fqdn, account.status, domains.data?.data]);
  const requestDomain = activeDomains.includes(selectedDomain)
    ? selectedDomain
    : (activeDomains[0] ?? '');
  const requestCertificate = useMutation({
    ...requestHostingSslOptions(account.id),
    onSuccess: () => {
      setRequestOpen(false);
      toast.success(<Trans message="Solicitação SSL criada." />);
    },
    onError: error => showHttpErrorToast(error),
  });

  const updateSearch = (
    changes: Partial<Record<'sslStatus' | 'sslPage' | 'sslPerPage', string>>,
  ) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
    });
    setSearchParams(next, {replace: true});
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            <Trans message="HTTPS e certificados SSL" />
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            <Trans message="Valide o domínio por DNS e acompanhe a emissão do certificado. Chaves privadas nunca são enviadas ao navegador." />
          </p>
        </div>
        <Button
          disabled={
            !account.tools.ssl ||
            account.status !== 'active' ||
            domains.isLoading ||
            activeDomains.length === 0
          }
          onClick={() => {
            if (account.tools.ssl) setRequestOpen(true);
          }}
        >
          <PlusIcon />
          <Trans message="Solicitar SSL" />
        </Button>
      </div>

      <section className="overflow-hidden rounded-card border bg-card">
        <div className="space-y-4 border-b px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-semibold">
              <Trans message="Certificados desta hospedagem" />
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              <Trans message="O DNS pode levar alguns minutos para propagar antes da emissão." />
            </p>
          </div>
          <div className="overflow-x-auto pb-1">
            <Tabs.Root
              value={status}
              onValueChange={value =>
                updateSearch({
                  sslStatus: value === 'all' ? '' : value,
                  sslPage: '',
                })
              }
            >
              <Tabs.List
                variant="line"
                aria-label={trans({
                  message: 'Filtrar certificados por status',
                })}
              >
                {certificateFilters.map(filter => (
                  <Tabs.Tab key={filter} value={filter}>
                    <CertificateFilterLabel filter={filter} />
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground tabular-nums">
                      {certificates.data?.counts?.[filter] ?? 0}
                    </span>
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs.Root>
          </div>
        </div>

        {certificates.isLoading ? (
          <div className="space-y-3 p-5 sm:p-6">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
          </div>
        ) : certificates.isError ? (
          <Empty.Root className="min-h-72 px-5 py-10">
            <Empty.Header>
              <Empty.Media variant="icon">
                <ShieldXIcon />
              </Empty.Media>
              <Empty.Title>
                <Trans message="Não foi possível carregar os certificados" />
              </Empty.Title>
              <Empty.Description>
                <Trans message="Tente novamente em alguns minutos sem alterar sua hospedagem." />
              </Empty.Description>
            </Empty.Header>
            <Empty.Content>
              <Button variant="outline" onClick={() => certificates.refetch()}>
                <RefreshCwIcon />
                <Trans message="Tentar novamente" />
              </Button>
            </Empty.Content>
          </Empty.Root>
        ) : certificates.data?.data.length ? (
          <div className="divide-y">
            {certificates.data.data.map(certificate => (
              <CertificateRow
                key={certificate.id}
                account={account}
                certificate={certificate}
              />
            ))}
          </div>
        ) : (
          <Empty.Root className="min-h-72 px-5 py-10">
            <Empty.Header>
              <Empty.Media variant="icon">
                {status === 'all' && !account.tools.ssl ? (
                  <ShieldXIcon />
                ) : (
                  <ShieldCheckIcon />
                )}
              </Empty.Media>
              <Empty.Title>
                {status === 'all' && !account.tools.ssl ? (
                  <Trans message="SSL não está disponível nesta hospedagem" />
                ) : status === 'all' && !activeDomains.length ? (
                  <Trans message="Nenhum domínio ativo para solicitar SSL" />
                ) : status === 'all' ? (
                  <Trans message="Nenhum certificado solicitado" />
                ) : (
                  <Trans message="Nenhum certificado neste filtro" />
                )}
              </Empty.Title>
              <Empty.Description>
                {status === 'all' && !account.tools.ssl ? (
                  <Trans message="A integração SSL precisa estar ativa para permitir novas solicitações. Certificados já existentes continuam visíveis." />
                ) : status === 'all' && !activeDomains.length ? (
                  <Trans message="Ative um domínio nesta hospedagem antes de solicitar um certificado." />
                ) : status === 'all' ? (
                  <Trans message="Solicite um certificado gratuito para qualquer domínio ativo desta hospedagem." />
                ) : (
                  <Trans message="Escolha outro status para consultar os demais certificados." />
                )}
              </Empty.Description>
            </Empty.Header>
          </Empty.Root>
        )}

        <DataTablePaginationFooter
          data={certificates.data}
          isLoading={certificates.isFetching}
          hideIfOnlyOnePage
          onPageChange={nextPage =>
            updateSearch({sslPage: nextPage > 1 ? `${nextPage}` : ''})
          }
          onPerPageChange={nextPerPage =>
            updateSearch({
              sslPerPage: nextPerPage === 15 ? '' : `${nextPerPage}`,
              sslPage: '',
            })
          }
        />
      </section>

      <Dialog.Root
        open={requestOpen && account.tools.ssl}
        onOpenChange={open => setRequestOpen(open && account.tools.ssl)}
      >
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>
                <ShieldCheckIcon />
                <Trans message="Novo certificado SSL" />
              </Dialog.Title>
              <Dialog.Description>
                <Trans message="Escolha um domínio ativo desta hospedagem. A chave privada permanecerá protegida no servidor." />
              </Dialog.Description>
            </Dialog.Header>
            <form
              className="space-y-5"
              onSubmit={event => {
                event.preventDefault();
                if (!account.tools.ssl || !requestDomain) return;
                withConfirmedPassword(() =>
                  requestCertificate.mutate(requestDomain),
                );
              }}
            >
              <div className="grid gap-1.5 text-sm">
                <label
                  id={domainSelectLabelId}
                  htmlFor={domainSelectId}
                  className="font-medium"
                >
                  <Trans message="Domínio" />
                </label>
                <Select.Root
                  value={requestDomain}
                  onValueChange={value => setSelectedDomain(value ?? '')}
                >
                  <Select.Trigger
                    id={domainSelectId}
                    aria-labelledby={domainSelectLabelId}
                    className="w-full"
                  >
                    <Select.Value
                      placeholder={<Trans message="Selecione um domínio" />}
                    />
                  </Select.Trigger>
                  <Select.Content>
                    {activeDomains.map(domain => (
                      <Select.Item key={domain} value={domain}>
                        {domain}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </div>

              {domains.isError ? (
                <Alert variant="warning" fillStyle="subtleFill">
                  <CircleAlertIcon />
                  <Alert.Title>
                    <Trans message="A lista de domínios não foi sincronizada" />
                  </Alert.Title>
                  <Alert.Description>
                    <Trans message="O domínio principal compatível continua disponível. Atualize a lista de domínios antes de escolher outro endereço." />
                  </Alert.Description>
                </Alert>
              ) : null}

              <Dialog.Footer>
                <Dialog.CloseButton
                  disabled={
                    isConfirmingPassword || requestCertificate.isPending
                  }
                >
                  <Trans message="Cancelar" />
                </Dialog.CloseButton>
                <Button
                  type="submit"
                  disabled={
                    !account.tools.ssl ||
                    !requestDomain ||
                    isConfirmingPassword ||
                    requestCertificate.isPending
                  }
                >
                  {requestCertificate.isPending || isConfirmingPassword ? (
                    <LoaderCircleIcon className="animate-spin" />
                  ) : (
                    <ShieldCheckIcon />
                  )}
                  <Trans message="Solicitar certificado" />
                </Button>
              </Dialog.Footer>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function CertificateFilterLabel({filter}: {filter: HostingSslFilter}) {
  if (filter === 'all') return <Trans message="Todos" />;
  if (filter === 'action_required') return <Trans message="Ação necessária" />;
  if (filter === 'issued') return <Trans message="Emitidos" />;
  if (filter === 'expired') return <Trans message="Expirados" />;
  if (filter === 'revoked') return <Trans message="Revogados" />;
  return <Trans message="Falhas" />;
}

function CertificateRow({
  account,
  certificate,
}: {
  account: HostingAccount;
  certificate: HostingSslCertificate;
}) {
  const [confirming, setConfirming] = useState(false);
  const {withConfirmedPassword, isLoading: isConfirmingPassword} =
    usePasswordConfirmedAction();
  const isRenewal =
    certificate.status === 'issued' &&
    certificate.renewal_status === 'action_required';
  const isExpired =
    certificate.status !== 'revoked' &&
    certificate.valid_until != null &&
    new Date(certificate.valid_until).getTime() <= Date.now();
  const displayStatus = isExpired ? 'expired' : certificate.status;
  const verify = useMutation({
    ...verifyHostingSslOptions(account.id),
    onSuccess: () =>
      toast.success(
        isRenewal ? (
          <Trans message="Verificação da renovação iniciada." />
        ) : (
          <Trans message="Certificado SSL emitido com sucesso." />
        ),
      ),
    onError: error => showHttpErrorToast(error),
  });
  const revoke = useMutation({
    ...revokeHostingSslOptions(account.id),
    onSuccess: () => {
      setConfirming(false);
      toast.success(
        <Trans
          message={
            certificate.status === 'issued'
              ? 'Certificado revogado.'
              : 'Solicitação SSL cancelada.'
          }
        />,
      );
    },
    onError: error => showHttpErrorToast(error),
  });
  const canVerify =
    account.tools.ssl &&
    !isExpired &&
    (isRenewal ||
      ['requested', 'action_required', 'failed'].includes(certificate.status));
  const canRemove = certificate.status !== 'revoked';

  return (
    <article className="px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold break-all">{certificate.domain}</h3>
            <CertificateStatusBadge status={displayStatus} />
            {certificate.status === 'issued' ? (
              <InstallationStatusBadge
                status={certificate.installation_status}
              />
            ) : null}
            {certificate.renewal_status ? (
              <RenewalStatusBadge status={certificate.renewal_status} />
            ) : null}
          </div>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {certificate.safe_message ?? (
              <Trans message="Aguardando atualização do processo SSL." />
            )}
          </p>
          <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <CertificateDetail
              label={<Trans message="Solicitado em" />}
              value={formatHostingDate(certificate.requested_at)}
            />
            <CertificateDetail
              label={<Trans message="Emitido em" />}
              value={formatHostingDate(certificate.issued_at)}
            />
            <CertificateDetail
              label={<Trans message="Válido até" />}
              value={formatHostingDate(certificate.valid_until)}
            />
            <CertificateDetail
              label={<Trans message="Instalado em" />}
              value={formatHostingDate(certificate.installed_at)}
            />
          </dl>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          {canVerify ? (
            <Button
              variant="outline"
              disabled={verify.isPending}
              onClick={() => verify.mutate(certificate.id)}
            >
              {verify.isPending ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                <RefreshCwIcon />
              )}
              {isRenewal ? (
                <Trans message="Verificar renovação" />
              ) : (
                <Trans message="Verificar e emitir" />
              )}
            </Button>
          ) : null}
          {canRemove ? (
            <AlertDialog.Root open={confirming} onOpenChange={setConfirming}>
              <AlertDialog.Trigger
                render={<Button variant="outline" color="danger" />}
              >
                <ShieldXIcon />
                {certificate.status === 'issued' ? (
                  <Trans message="Revogar certificado" />
                ) : (
                  <Trans message="Cancelar solicitação" />
                )}
              </AlertDialog.Trigger>
              <AlertDialog.Portal>
                <AlertDialog.Backdrop />
                <AlertDialog.Content size="sm">
                  <AlertDialog.Header>
                    <AlertDialog.Media>
                      <ShieldXIcon />
                    </AlertDialog.Media>
                    <AlertDialog.Title>
                      {certificate.status === 'issued' ? (
                        <Trans message="Revogar certificado" />
                      ) : (
                        <Trans message="Cancelar solicitação" />
                      )}
                    </AlertDialog.Title>
                    <AlertDialog.Description>
                      {certificate.status === 'issued' ? (
                        <Trans message="A revogação invalida o certificado atual e não pode ser desfeita." />
                      ) : (
                        <Trans message="O desafio DNS e esta solicitação serão cancelados." />
                      )}
                    </AlertDialog.Description>
                  </AlertDialog.Header>
                  <AlertDialog.Footer className="group-data-[size=sm]/alert-dialog-content:grid-cols-1 sm:group-data-[size=sm]/alert-dialog-content:grid-cols-2">
                    <AlertDialog.Cancel
                      disabled={isConfirmingPassword || revoke.isPending}
                    >
                      <Trans message="Voltar" />
                    </AlertDialog.Cancel>
                    <AlertDialog.Action
                      color="danger"
                      disabled={isConfirmingPassword || revoke.isPending}
                      onClick={() =>
                        withConfirmedPassword(() =>
                          revoke.mutate(certificate.id),
                        )
                      }
                    >
                      {revoke.isPending ? (
                        <LoaderCircleIcon className="animate-spin" />
                      ) : null}
                      {certificate.status === 'issued' ? (
                        <Trans message="Revogar" />
                      ) : (
                        <Trans message="Cancelar solicitação" />
                      )}
                    </AlertDialog.Action>
                  </AlertDialog.Footer>
                </AlertDialog.Content>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          ) : null}
        </div>
      </div>

      {certificate.dns_validation && certificate.status !== 'issued' ? (
        <div className="mt-5 space-y-4 rounded-input border bg-muted/30 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h4 className="text-sm font-semibold">
                <Trans message="Registro de validação DNS" />
              </h4>
              <p className="mt-1 text-sm text-muted-foreground">
                {certificate.dns_validation.managed ? (
                  <Trans message="Este registro foi criado automaticamente pelo HospedFree." />
                ) : (
                  <Trans message="Adicione este registro TXT no provedor DNS do domínio." />
                )}
              </p>
            </div>
            {certificate.dns_validation.managed ? (
              <Badge variant="positive">
                <SparklesIcon />
                <Trans message="DNS automático" />
              </Badge>
            ) : null}
          </div>
          <dl className="grid gap-3 text-sm md:grid-cols-[100px_minmax(0,1fr)_minmax(0,1.25fr)]">
            <CertificateDetail
              label={<Trans message="Tipo" />}
              value={certificate.dns_validation.type ?? '—'}
            />
            <DnsValue
              label={<Trans message="Nome" />}
              value={certificate.dns_validation.name ?? ''}
              kind="name"
            />
            <DnsValue
              label={<Trans message="Valor" />}
              value={certificate.dns_validation.value ?? ''}
              kind="value"
            />
          </dl>
          <Alert fillStyle="subtleFill">
            <RefreshCwIcon />
            <Alert.Title>
              <Trans message="Aguarde a propagação" />
            </Alert.Title>
            <Alert.Description>
              <Trans message="Depois que o registro estiver público, use Verificar e emitir. Uma tentativa antecipada não apaga a solicitação." />
            </Alert.Description>
          </Alert>
        </div>
      ) : null}

      {certificate.renewal_dns_validation ? (
        <div className="mt-5 space-y-4 rounded-input border bg-muted/30 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h4 className="text-sm font-semibold">
                <Trans message="Registro DNS da renovação" />
              </h4>
              <p className="mt-1 text-sm text-muted-foreground">
                {certificate.renewal_dns_validation.managed ? (
                  <Trans message="O novo desafio foi configurado automaticamente pelo HospedFree." />
                ) : (
                  <Trans message="Atualize o registro TXT abaixo para concluir a renovação." />
                )}
              </p>
            </div>
            {certificate.renewal_dns_validation.managed ? (
              <Badge variant="positive">
                <SparklesIcon />
                <Trans message="DNS automático" />
              </Badge>
            ) : null}
          </div>
          <dl className="grid gap-3 text-sm md:grid-cols-[100px_minmax(0,1fr)_minmax(0,1.25fr)]">
            <CertificateDetail
              label={<Trans message="Tipo" />}
              value={certificate.renewal_dns_validation.type ?? '—'}
            />
            <DnsValue
              label={<Trans message="Nome" />}
              value={certificate.renewal_dns_validation.name ?? ''}
              kind="name"
            />
            <DnsValue
              label={<Trans message="Valor" />}
              value={certificate.renewal_dns_validation.value ?? ''}
              kind="value"
            />
          </dl>
          <Alert fillStyle="subtleFill">
            <RefreshCwIcon />
            <Alert.Title>
              <Trans message="O certificado atual continua válido" />
            </Alert.Title>
            <Alert.Description>
              <Trans message="A renovação só substitui o certificado depois da nova emissão e instalação. Uma falha não apaga o certificado atual." />
            </Alert.Description>
          </Alert>
        </div>
      ) : null}

      {certificate.status === 'issued' &&
      certificate.installation_status === 'manual_required' ? (
        <Alert variant="warning" fillStyle="subtleFill" className="mt-5">
          <CircleAlertIcon />
          <Alert.Title>
            <Trans message="Certificado emitido, mas ainda não instalado" />
          </Alert.Title>
          <Alert.Description>
            <Trans message="O painel desta hospedagem não oferece instalação automática segura. O HospedFree não envia sua chave privada ao navegador e ainda não confirma HTTPS ativo para este domínio." />
          </Alert.Description>
        </Alert>
      ) : null}
    </article>
  );
}

function DnsValue({
  label,
  value,
  kind,
}: {
  label: ReactNode;
  value: string;
  kind: 'name' | 'value';
}) {
  const [copied, copy] = useClipboard(value);
  const {trans} = useTrans();
  const copyLabel =
    kind === 'name'
      ? trans({message: 'Copiar nome do registro DNS'})
      : trans({message: 'Copiar valor do registro DNS'});

  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 flex min-w-0 items-center gap-2">
        <span className="min-w-0 flex-1 font-medium break-all">
          {value || '—'}
        </span>
        {value ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={copyLabel}
            onClick={copy}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </Button>
        ) : null}
      </dd>
    </div>
  );
}

function CertificateStatusBadge({
  status,
}: {
  status: HostingSslCertificate['status'] | 'expired';
}) {
  const variant =
    status === 'issued'
      ? 'positive'
      : status === 'failed' || status === 'revoked' || status === 'expired'
        ? 'destructive'
        : 'secondary';

  return (
    <Badge variant={variant}>
      {status === 'issued' ? <CheckCircle2Icon /> : null}
      <CertificateStatusLabel status={status} />
    </Badge>
  );
}

function InstallationStatusBadge({
  status,
}: {
  status: HostingSslCertificate['installation_status'];
}) {
  const variant =
    status === 'installed'
      ? 'positive'
      : status === 'failed'
        ? 'destructive'
        : 'secondary';

  return (
    <Badge variant={variant}>
      {status === 'installed' ? <CheckCircle2Icon /> : null}
      {status === 'installed' ? (
        <Trans message="Instalado" />
      ) : status === 'manual_required' ? (
        <Trans message="Instalação manual necessária" />
      ) : status === 'queued' || status === 'installing' ? (
        <Trans message="Instalando" />
      ) : status === 'failed' || status === 'action_required' ? (
        <Trans message="Instalação pendente" />
      ) : (
        <Trans message="Não instalado" />
      )}
    </Badge>
  );
}

function RenewalStatusBadge({
  status,
}: {
  status: NonNullable<HostingSslCertificate['renewal_status']>;
}) {
  return (
    <Badge variant={status === 'failed' ? 'destructive' : 'secondary'}>
      {status === 'verifying' ? (
        <Trans message="Renovação em verificação" />
      ) : status === 'failed' ? (
        <Trans message="Renovação falhou" />
      ) : (
        <Trans message="Renovação pendente" />
      )}
    </Badge>
  );
}

function CertificateStatusLabel({
  status,
}: {
  status: HostingSslCertificate['status'] | 'expired';
}) {
  if (status === 'requested') return <Trans message="Solicitado" />;
  if (status === 'action_required') return <Trans message="Ação necessária" />;
  if (status === 'verifying') return <Trans message="Verificando" />;
  if (status === 'issued') return <Trans message="Emitido" />;
  if (status === 'expired') return <Trans message="Expirado" />;
  if (status === 'failed') return <Trans message="Falhou" />;
  return <Trans message="Revogado" />;
}

function CertificateDetail({label, value}: {label: ReactNode; value: string}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
