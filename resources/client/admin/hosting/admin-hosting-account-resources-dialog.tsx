import {
  adminHostingAccountResourcesOptions,
  deleteAdminHostingFileOptions,
  revokeAdminHostingSslOptions,
} from '@app/hosting/hosting-queries';
import {
  AdminHostingAccountResources,
  HostingAccount,
  HostingDatabase,
  HostingDomain,
  HostingFileEntry,
  HostingSslCertificate,
} from '@app/hosting/hosting-types';
import {showHttpErrorToast} from '@common/http/errors/show-http-error-toast';
import {AlertDialog} from '@shadcn/alert-dialog/alert-dialog';
import {Badge} from '@shadcn/badge/badge';
import {Button} from '@shadcn/button/button';
import {Dialog} from '@shadcn/dialog/dialog';
import {Skeleton} from '@shadcn/skeleton/skeleton';
import {Table} from '@shadcn/table/table';
import {Tabs} from '@shadcn/tabs/tabs';
import {toast} from '@shadcn/toast/toast';
import {useMutation, useQuery} from '@tanstack/react-query';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {
  ArrowUpIcon,
  DatabaseIcon,
  FileIcon,
  FolderIcon,
  GlobeIcon,
  HistoryIcon,
  LoaderCircleIcon,
  LockKeyholeIcon,
  ServerIcon,
  ShieldXIcon,
  Trash2Icon,
} from 'lucide-react';
import {ReactNode, useEffect, useState} from 'react';

interface Props {
  account: HostingAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminHostingAccountResourcesDialog({
  account,
  open,
  onOpenChange,
}: Props) {
  const [path, setPath] = useState('');
  const accountId = account?.id ?? 0;
  const query = useQuery({
    ...adminHostingAccountResourcesOptions(accountId, path),
    enabled: open && account != null,
    placeholderData: previousData => previousData,
  });

  useEffect(() => {
    if (!open) {
      setPath('');
    }
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Content className="h-[min(52rem,calc(100dvh-1rem))] max-w-[calc(100%-1rem)] sm:max-w-5xl">
          <Dialog.Header className="pe-8">
            <Dialog.Title className="min-w-0">
              <ServerIcon />
              <span className="min-w-0 flex-1 truncate">
                {account?.fqdn ?? <Trans message="Recursos da hospedagem" />}
              </span>
              {account ? <AccountStatus status={account.status} /> : null}
            </Dialog.Title>
            <Dialog.Description>
              <Trans message="Diagnóstico e ações administrativas por recurso. Consultas e alterações ficam registradas na auditoria da conta." />
            </Dialog.Description>
          </Dialog.Header>

          <Dialog.Body className="flex flex-col gap-4">
            {query.isPending ? <ResourcesSkeleton /> : null}
            {query.isError ? <ResourcesError /> : null}
            {query.data ? (
              <>
                <AccountSummary data={query.data} />
                <Tabs.Root defaultValue="domains" className="min-h-0 flex-1">
                  <div className="-mx-1 overflow-x-auto px-1">
                    <Tabs.List variant="line">
                      <Tabs.Tab value="domains">
                        <GlobeIcon />
                        <Trans message="Domínios" />
                      </Tabs.Tab>
                      <Tabs.Tab value="files">
                        <FolderIcon />
                        <Trans message="Arquivos" />
                      </Tabs.Tab>
                      <Tabs.Tab value="databases">
                        <DatabaseIcon />
                        <Trans message="Bancos de dados" />
                      </Tabs.Tab>
                      <Tabs.Tab value="ssl">
                        <LockKeyholeIcon />
                        <Trans message="SSL" />
                      </Tabs.Tab>
                      <Tabs.Tab value="events">
                        <HistoryIcon />
                        <Trans message="Auditoria" />
                      </Tabs.Tab>
                    </Tabs.List>
                  </div>

                  <Tabs.Panel
                    value="domains"
                    className="min-h-0 overflow-auto pt-3"
                  >
                    <DomainsPanel
                      items={query.data.domains.data}
                      availability={query.data.domains.availability}
                      safeCode={query.data.domains.safe_code}
                    />
                  </Tabs.Panel>
                  <Tabs.Panel
                    value="files"
                    className="min-h-0 overflow-auto pt-3"
                  >
                    <FilesPanel
                      accountId={query.data.account.id}
                      items={query.data.files.data}
                      path={query.data.files.path}
                      availability={query.data.files.availability}
                      safeCode={query.data.files.safe_code}
                      isFetching={query.isFetching}
                      onPathChange={setPath}
                    />
                  </Tabs.Panel>
                  <Tabs.Panel
                    value="databases"
                    className="min-h-0 overflow-auto pt-3"
                  >
                    <DatabasesPanel
                      items={query.data.databases.data}
                      availability={query.data.databases.availability}
                      safeCode={query.data.databases.safe_code}
                    />
                  </Tabs.Panel>
                  <Tabs.Panel
                    value="ssl"
                    className="min-h-0 overflow-auto pt-3"
                  >
                    <SslPanel
                      accountId={query.data.account.id}
                      items={query.data.ssl}
                    />
                  </Tabs.Panel>
                  <Tabs.Panel
                    value="events"
                    className="min-h-0 overflow-auto pt-3"
                  >
                    <EventsPanel items={query.data.events} />
                  </Tabs.Panel>
                </Tabs.Root>
              </>
            ) : null}
          </Dialog.Body>
          <Dialog.Footer>
            <Dialog.CloseButton>
              <Trans message="Fechar" />
            </Dialog.CloseButton>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function AccountSummary({data}: {data: AdminHostingAccountResources}) {
  const facts = [
    {
      label: <Trans message="Cliente" />,
      value: data.customer?.display_name ?? '—',
      detail: data.customer?.email,
    },
    {
      label: <Trans message="Plano" />,
      value: data.account.plan?.name ?? '—',
    },
    {
      label: <Trans message="Usuário técnico" />,
      value: data.account.username_masked ?? '—',
    },
    {
      label: <Trans message="Última sincronização" />,
      value: data.account.last_synced_at ? (
        <FormattedDate date={data.account.last_synced_at} />
      ) : (
        '—'
      ),
    },
  ];

  return (
    <div className="grid gap-px overflow-hidden rounded-card border bg-border sm:grid-cols-2 lg:grid-cols-4">
      {facts.map((fact, index) => (
        <div key={index} className="min-w-0 bg-background p-3">
          <div className="text-xs font-medium text-muted-foreground">
            {fact.label}
          </div>
          <div className="mt-1 truncate font-medium">{fact.value}</div>
          {fact.detail ? (
            <div className="truncate text-xs text-muted-foreground">
              {fact.detail}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function DomainsPanel({
  items,
  availability,
  safeCode,
}: {
  items: HostingDomain[];
  availability: string;
  safeCode: string;
}) {
  if (availability !== 'available' && !items.length) {
    return <CapabilityNotice availability={availability} safeCode={safeCode} />;
  }

  return (
    <ResourceTable>
      <Table.Header>
        <Table.Row>
          <Table.Head>
            <Trans message="Domínio" />
          </Table.Head>
          <Table.Head>
            <Trans message="Tipo" />
          </Table.Head>
          <Table.Head>
            <Trans message="Estado" />
          </Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {items.map(item => (
          <Table.Row key={item.domain}>
            <Table.Cell className="max-w-80 truncate font-medium">
              {item.domain}
            </Table.Cell>
            <Table.Cell>
              <DomainType type={item.type} />
            </Table.Cell>
            <Table.Cell>
              <SafeStatus status={item.status} />
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </ResourceTable>
  );
}

function FilesPanel({
  accountId,
  items,
  path,
  availability,
  safeCode,
  isFetching,
  onPathChange,
}: {
  accountId: number;
  items: HostingFileEntry[];
  path: string;
  availability: string;
  safeCode: string;
  isFetching: boolean;
  onPathChange: (path: string) => void;
}) {
  const {trans} = useTrans();

  if (availability !== 'available') {
    return <CapabilityNotice availability={availability} safeCode={safeCode} />;
  }

  return (
    <div className="space-y-3">
      <div className="flex min-w-0 items-center gap-2 rounded-card-sm border bg-muted/30 p-2">
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={trans({message: 'Voltar para a pasta anterior'})}
          disabled={!path || isFetching}
          onClick={() => onPathChange(parentPath(path))}
        >
          <ArrowUpIcon />
        </Button>
        <code className="min-w-0 flex-1 truncate text-xs">/{path}</code>
        <Badge variant="secondary">
          <Trans message="Ações auditadas" />
        </Badge>
      </div>
      {!items.length ? (
        <EmptyResource>
          <Trans message="Nenhum arquivo encontrado nesta pasta." />
        </EmptyResource>
      ) : (
        <ResourceTable>
          <Table.Header>
            <Table.Row>
              <Table.Head>
                <Trans message="Nome" />
              </Table.Head>
              <Table.Head>
                <Trans message="Tamanho" />
              </Table.Head>
              <Table.Head>
                <Trans message="Permissões" />
              </Table.Head>
              <Table.Head>
                <Trans message="Alterado em" />
              </Table.Head>
              <Table.Head className="w-12">
                <span className="sr-only">
                  <Trans message="Ações" />
                </span>
              </Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {items.map(item => (
              <Table.Row key={item.path}>
                <Table.Cell>
                  {item.type === 'directory' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="max-w-80 justify-start px-1"
                      disabled={isFetching}
                      onClick={() => onPathChange(item.path)}
                    >
                      <FolderIcon />
                      <span className="truncate">{item.name}</span>
                    </Button>
                  ) : (
                    <span className="flex max-w-80 items-center gap-2 truncate">
                      <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{item.name}</span>
                    </span>
                  )}
                </Table.Cell>
                <Table.Cell>{formatBytes(item.size)}</Table.Cell>
                <Table.Cell>
                  <code className="text-xs">{item.permissions ?? '—'}</code>
                </Table.Cell>
                <Table.Cell>
                  {item.modified_at ? (
                    <FormattedDate date={item.modified_at} />
                  ) : (
                    '—'
                  )}
                </Table.Cell>
                <Table.Cell className="text-end">
                  <AdminFileDeleteButton accountId={accountId} entry={item} />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </ResourceTable>
      )}
    </div>
  );
}

function DatabasesPanel({
  items,
  availability,
  safeCode,
}: {
  items: HostingDatabase[];
  availability: string;
  safeCode: string;
}) {
  if (availability !== 'available') {
    return <CapabilityNotice availability={availability} safeCode={safeCode} />;
  }
  if (!items.length) {
    return (
      <EmptyResource>
        <Trans message="Nenhum banco de dados encontrado." />
      </EmptyResource>
    );
  }

  return (
    <ResourceTable>
      <Table.Header>
        <Table.Row>
          <Table.Head>
            <Trans message="Banco de dados" />
          </Table.Head>
          <Table.Head>
            <Trans message="Servidor" />
          </Table.Head>
          <Table.Head>
            <Trans message="Usuário" />
          </Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {items.map(item => (
          <Table.Row key={`${item.host}:${item.name}`}>
            <Table.Cell className="font-medium">{item.name}</Table.Cell>
            <Table.Cell>{item.host}</Table.Cell>
            <Table.Cell>{item.username ?? '—'}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </ResourceTable>
  );
}

function SslPanel({
  accountId,
  items,
}: {
  accountId: number;
  items: HostingSslCertificate[];
}) {
  if (!items.length) {
    return (
      <EmptyResource>
        <Trans message="Nenhum certificado SSL solicitado." />
      </EmptyResource>
    );
  }

  return (
    <ResourceTable>
      <Table.Header>
        <Table.Row>
          <Table.Head>
            <Trans message="Domínio" />
          </Table.Head>
          <Table.Head>
            <Trans message="Emissão" />
          </Table.Head>
          <Table.Head>
            <Trans message="Instalação" />
          </Table.Head>
          <Table.Head>
            <Trans message="Validade" />
          </Table.Head>
          <Table.Head className="w-12">
            <span className="sr-only">
              <Trans message="Ações" />
            </span>
          </Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {items.map(item => (
          <Table.Row key={item.id}>
            <Table.Cell className="font-medium">{item.domain}</Table.Cell>
            <Table.Cell>
              <SafeStatus status={item.status} />
            </Table.Cell>
            <Table.Cell>
              <SafeStatus status={item.installation_status} />
            </Table.Cell>
            <Table.Cell>
              {item.valid_until ? (
                <FormattedDate date={item.valid_until} />
              ) : (
                '—'
              )}
            </Table.Cell>
            <Table.Cell className="text-end">
              {item.status !== 'revoked' ? (
                <AdminSslRevokeButton
                  accountId={accountId}
                  certificate={item}
                />
              ) : null}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </ResourceTable>
  );
}

function AdminFileDeleteButton({
  accountId,
  entry,
}: {
  accountId: number;
  entry: HostingFileEntry;
}) {
  const {trans} = useTrans();
  const [open, setOpen] = useState(false);
  const remove = useMutation({
    ...deleteAdminHostingFileOptions(accountId),
    onSuccess: () => {
      setOpen(false);
      toast.success(<Trans message="Item removido e ação registrada." />);
    },
    onError: error => showHttpErrorToast(error),
  });

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger
        render={
          <Button
            variant="ghost"
            color="danger"
            size="icon-sm"
            aria-label={trans({message: 'Remover item da hospedagem'})}
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
              <Trans message="Remover item da hospedagem" />
            </AlertDialog.Title>
            <AlertDialog.Description>
              <Trans
                message="Remover :name permanentemente? A ação será executada no provedor e registrada na auditoria."
                values={{name: entry.name}}
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
              onClick={() => remove.mutate(entry.path)}
            >
              {remove.isPending ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                <Trash2Icon />
              )}
              <Trans message="Remover permanentemente" />
            </AlertDialog.Action>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

function AdminSslRevokeButton({
  accountId,
  certificate,
}: {
  accountId: number;
  certificate: HostingSslCertificate;
}) {
  const {trans} = useTrans();
  const [open, setOpen] = useState(false);
  const revoke = useMutation({
    ...revokeAdminHostingSslOptions(accountId),
    onSuccess: () => {
      setOpen(false);
      toast.success(
        certificate.status === 'issued' ? (
          <Trans message="Certificado revogado e ação registrada." />
        ) : (
          <Trans message="Solicitação SSL cancelada e ação registrada." />
        ),
      );
    },
    onError: error => showHttpErrorToast(error),
  });
  const isIssued = certificate.status === 'issued';

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger
        render={
          <Button
            variant="ghost"
            color="danger"
            size="icon-sm"
            aria-label={
              isIssued
                ? trans({message: 'Revogar certificado SSL'})
                : trans({message: 'Cancelar solicitação SSL'})
            }
          />
        }
      >
        <ShieldXIcon />
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop />
        <AlertDialog.Content size="sm">
          <AlertDialog.Header>
            <AlertDialog.Media>
              <ShieldXIcon />
            </AlertDialog.Media>
            <AlertDialog.Title>
              {isIssued ? (
                <Trans message="Revogar certificado SSL" />
              ) : (
                <Trans message="Cancelar solicitação SSL" />
              )}
            </AlertDialog.Title>
            <AlertDialog.Description>
              {isIssued ? (
                <Trans message="O certificado será invalidado no emissor e os dados sensíveis locais serão apagados. Esta ação será auditada." />
              ) : (
                <Trans message="A solicitação e os desafios DNS gerenciados serão cancelados. Esta ação será auditada." />
              )}
            </AlertDialog.Description>
          </AlertDialog.Header>
          <AlertDialog.Footer>
            <AlertDialog.Cancel disabled={revoke.isPending}>
              <Trans message="Voltar" />
            </AlertDialog.Cancel>
            <AlertDialog.Action
              color="danger"
              disabled={revoke.isPending}
              onClick={() => revoke.mutate(certificate.id)}
            >
              {revoke.isPending ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                <ShieldXIcon />
              )}
              {isIssued ? (
                <Trans message="Revogar certificado" />
              ) : (
                <Trans message="Cancelar solicitação" />
              )}
            </AlertDialog.Action>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

function EventsPanel({items}: {items: AdminHostingAccountResources['events']}) {
  if (!items.length) {
    return (
      <EmptyResource>
        <Trans message="Nenhum evento de auditoria registrado." />
      </EmptyResource>
    );
  }

  return (
    <div className="divide-y rounded-card border">
      {items.map(item => (
        <div
          key={item.id}
          className="flex min-w-0 flex-col gap-1 p-3 sm:flex-row sm:items-center"
        >
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">
              <EventLabel event={item.event} />
            </div>
            {item.safe_message ? (
              <div className="truncate text-xs text-muted-foreground">
                {item.safe_message}
              </div>
            ) : null}
          </div>
          <time className="shrink-0 text-xs text-muted-foreground">
            <FormattedDate date={item.created_at} />
          </time>
        </div>
      ))}
    </div>
  );
}

function ResourceTable({children}: {children: ReactNode}) {
  return (
    <div className="overflow-x-auto rounded-card border">
      <Table.Root>{children}</Table.Root>
    </div>
  );
}

function CapabilityNotice({
  availability,
  safeCode,
}: {
  availability: string;
  safeCode: string;
}) {
  return (
    <div className="rounded-card border border-dashed p-6 text-center">
      <div className="font-medium">
        {availability === 'not_supported' ? (
          <Trans message="Integração não configurada" />
        ) : (
          <Trans message="Dados temporariamente indisponíveis" />
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        <Trans message="Consulte as configurações da hospedagem e tente novamente." />
      </p>
      <code className="mt-3 inline-block rounded bg-muted px-2 py-1 text-xs">
        {safeCode}
      </code>
    </div>
  );
}

function EmptyResource({children}: {children: ReactNode}) {
  return (
    <div className="rounded-card border border-dashed p-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function ResourcesSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 w-full rounded-card" />
      <Skeleton className="h-9 w-96 max-w-full" />
      <Skeleton className="h-64 w-full rounded-card" />
    </div>
  );
}

function ResourcesError() {
  return (
    <div className="rounded-card border border-destructive/30 bg-destructive/5 p-6 text-center">
      <div className="font-medium">
        <Trans message="Não foi possível carregar os recursos" />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        <Trans message="Feche esta janela e tente novamente. Nenhuma ação remota foi executada." />
      </p>
    </div>
  );
}

function AccountStatus({status}: {status: string}) {
  const variant =
    status === 'active'
      ? 'positive'
      : status.includes('failed') || status === 'action_required'
        ? 'destructive'
        : 'secondary';
  return (
    <Badge variant={variant}>
      <StatusLabel status={status} />
    </Badge>
  );
}

function SafeStatus({status}: {status: string}) {
  const positive = ['active', 'issued', 'installed', 'succeeded'].includes(
    status,
  );
  const negative = status.includes('failed') || status === 'action_required';
  return (
    <Badge
      variant={positive ? 'positive' : negative ? 'destructive' : 'secondary'}
    >
      <StatusLabel status={status} />
    </Badge>
  );
}

function StatusLabel({status}: {status: string}) {
  switch (status) {
    case 'active':
      return <Trans message="Ativo" />;
    case 'pending':
      return <Trans message="Pendente" />;
    case 'provisioning':
      return <Trans message="Provisionando" />;
    case 'suspended':
      return <Trans message="Suspenso" />;
    case 'pending_downgrade':
      return <Trans message="Aguardando downgrade" />;
    case 'pending_deletion':
      return <Trans message="Aguardando exclusão" />;
    case 'deleting':
      return <Trans message="Excluindo" />;
    case 'deleted':
      return <Trans message="Excluído" />;
    case 'failed':
      return <Trans message="Falhou" />;
    case 'action_required':
      return <Trans message="Ação necessária" />;
    case 'requested':
      return <Trans message="Solicitado" />;
    case 'verifying':
      return <Trans message="Verificando" />;
    case 'issued':
      return <Trans message="Emitido" />;
    case 'revoked':
      return <Trans message="Revogado" />;
    case 'not_started':
      return <Trans message="Não iniciada" />;
    case 'queued':
      return <Trans message="Na fila" />;
    case 'installing':
      return <Trans message="Instalando" />;
    case 'installed':
      return <Trans message="Instalado" />;
    case 'manual_required':
      return <Trans message="Instalação manual" />;
    default:
      return <Trans message="Estado não reconhecido" />;
  }
}

function DomainType({type}: {type: HostingDomain['type']}) {
  if (type === 'primary') return <Trans message="Principal" />;
  if (type === 'custom') return <Trans message="Domínio próprio" />;
  return <Trans message="Subdomínio" />;
}

function EventLabel({event}: {event: string}) {
  switch (event) {
    case 'status_changed':
      return <Trans message="Estado alterado" />;
    case 'admin_operation_requested':
      return <Trans message="Operação administrativa solicitada" />;
    case 'admin_suspension_requested':
      return <Trans message="Suspensão solicitada pelo administrador" />;
    case 'admin_reactivation_requested':
      return <Trans message="Reativação solicitada pelo administrador" />;
    case 'admin_deletion_requested':
      return <Trans message="Exclusão solicitada pelo administrador" />;
    case 'admin_password_reset_requested':
      return (
        <Trans message="Redefinição de senha solicitada pelo administrador" />
      );
    case 'admin_package_change_requested':
      return (
        <Trans message="Alteração de plano solicitada pelo administrador" />
      );
    case 'operation_retried':
      return <Trans message="Operação reenviada" />;
    case 'admin_resources_inspected':
      return <Trans message="Recursos consultados pelo administrador" />;
    case 'admin_file_deleted':
      return <Trans message="Arquivo removido pelo administrador" />;
    case 'admin_ssl_revoked':
      return <Trans message="Certificado SSL revogado pelo administrador" />;
    case 'admin_ssl_cancelled':
      return <Trans message="Solicitação SSL cancelada pelo administrador" />;
    default:
      return <Trans message="Evento da hospedagem" />;
  }
}

function parentPath(path: string): string {
  return path.split('/').filter(Boolean).slice(0, -1).join('/');
}

function formatBytes(value: number | null): string {
  if (value == null) return '—';
  if (value < 1024) return `${value} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let size = value / 1024;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index++;
  }
  return `${new Intl.NumberFormat('pt-BR', {maximumFractionDigits: 1}).format(size)} ${units[index]}`;
}
