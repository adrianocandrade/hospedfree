import {
  adminHostingAccountsOptions,
  adminHostingOperationsOptions,
  adminHostingPlansOptions,
  retryAdminHostingOperationOptions,
  runAdminHostingOperationOptions,
} from '@app/hosting/hosting-queries';
import {HostingAccount, HostingOperation} from '@app/hosting/hosting-types';
import {showHttpErrorToast} from '@common/http/errors/show-http-error-toast';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {DashboardLayout} from '@common/ui/dashboard/dashboard-layout';
import {AlertDialog} from '@shadcn/alert-dialog/alert-dialog';
import {Badge} from '@shadcn/badge/badge';
import {Button} from '@shadcn/button/button';
import {Dropdown} from '@shadcn/dropdown/dropdown';
import {Empty} from '@shadcn/empty/empty';
import {Dialog} from '@shadcn/dialog/dialog';
import {Select} from '@shadcn/forms/select/select';
import {GenericTable} from '@shadcn/table/generic-table';
import {SortableHeader} from '@shadcn/table/utils/sortable-header';
import {TablePagination} from '@shadcn/table/utils/table-pagination';
import {TableSearchInput} from '@shadcn/table/utils/table-search-input';
import {useTable} from '@shadcn/table/utils/use-table';
import {useTableQueryState} from '@shadcn/table/utils/use-table-query-state';
import {toast} from '@shadcn/toast/toast';
import {Tabs} from '@shadcn/tabs/tabs';
import {useMutation, useQuery} from '@tanstack/react-query';
import {ColumnDef} from '@tanstack/react-table';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {Trans} from '@ui/i18n/trans';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {
  CircleAlertIcon,
  EllipsisIcon,
  KeyRoundIcon,
  PackageIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  ServerIcon,
  ShieldCheckIcon,
  ShieldOffIcon,
  Trash2Icon,
} from 'lucide-react';
import {useMemo, useState} from 'react';
import {AdminHostingAccountResourcesDialog} from './admin-hosting-account-resources-dialog';

export function Component() {
  const [view, setView] = useState<'accounts' | 'operations'>('accounts');
  const [selectedAccount, setSelectedAccount] = useState<HostingAccount | null>(
    null,
  );
  const {queryState, setQueryState, isFiltering} = useTableQueryState();
  const requestParams = {
    page: queryState.page,
    per_page: queryState.per_page,
    query: queryState.query || undefined,
    sort: queryState.sort
      ? `${queryState.sort.orderBy}:${queryState.sort.orderDir ?? 'desc'}`
      : undefined,
  };
  const accounts = useQuery({
    ...adminHostingAccountsOptions(requestParams),
    enabled: view === 'accounts',
  });
  const operations = useQuery({
    ...adminHostingOperationsOptions(requestParams),
    enabled: view === 'operations',
  });

  const accountItems = accounts.data?.data ?? [];
  const operationItems = operations.data?.data ?? [];
  const failedOperations = operationItems.filter(item =>
    item.status.includes('failed'),
  );

  const accountTable = useTable({
    data: accountItems,
    columns: accountColumns,
    enableMultiRowSelection: false,
    sort: queryState.sort,
    onSortChange: sort => setQueryState({sort}),
    pagination: {
      per_page: queryState.per_page,
      page: queryState.page,
    },
    onPaginationChange: pagination => setQueryState({...pagination}),
    response:
      accounts.data?.meta && accounts.data.links
        ? {meta: accounts.data.meta, links: accounts.data.links}
        : undefined,
  });

  const operationColumns = useMemo<ColumnDef<HostingOperation>[]>(
    () => [
      {
        id: 'operation',
        accessorKey: 'operation',
        enableSorting: true,
        header: ({column}) => (
          <SortableHeader column={column}>
            <Trans message="Operação" />
          </SortableHeader>
        ),
        cell: ({row}) => (
          <div>
            <div className="font-medium">{row.original.operation}</div>
            <div className="text-xs text-muted-foreground">
              #{row.original.id}
            </div>
          </div>
        ),
      },
      {
        id: 'status',
        accessorKey: 'status',
        enableSorting: true,
        header: ({column}) => (
          <SortableHeader column={column}>
            <Trans message="Status" />
          </SortableHeader>
        ),
        cell: ({row}) => <OperationStatusBadge operation={row.original} />,
      },
      {
        id: 'safe_message',
        accessorKey: 'safe_message',
        header: () => <Trans message="Mensagem segura" />,
        cell: ({row}) => (
          <span
            className="block max-w-120 truncate text-muted-foreground"
            title={row.original.safe_message ?? undefined}
          >
            {row.original.safe_message ?? '—'}
          </span>
        ),
      },
      {
        id: 'created_at',
        accessorKey: 'created_at',
        enableSorting: true,
        header: ({column}) => (
          <SortableHeader column={column}>
            <Trans message="Criada em" />
          </SortableHeader>
        ),
        cell: ({row}) => (
          <time>
            <FormattedDate date={row.original.created_at} />
          </time>
        ),
      },
      {
        id: 'actions',
        size: 1,
        header: () => (
          <span className="hidden">
            <Trans message="Ações" />
          </span>
        ),
        cell: ({row}) => <OperationActions operation={row.original} />,
      },
    ],
    [],
  );

  const operationTable = useTable({
    data: operationItems,
    columns: operationColumns,
    enableMultiRowSelection: false,
    sort: queryState.sort,
    onSortChange: sort => setQueryState({sort}),
    pagination: {
      per_page: queryState.per_page,
      page: queryState.page,
    },
    onPaginationChange: pagination => setQueryState({...pagination}),
    response:
      operations.data?.meta && operations.data.links
        ? {meta: operations.data.meta, links: operations.data.links}
        : undefined,
  });

  return (
    <DashboardLayout.MainSection>
      <StaticPageTitle>
        <Trans message="Hospedagens" />
      </StaticPageTitle>
      <DashboardLayout.SectionHeader>
        <DashboardLayout.SidebarToggle />
        <DashboardLayout.SectionTitle>
          <h1>
            <Trans message="Hospedagens" />
          </h1>
        </DashboardLayout.SectionTitle>
      </DashboardLayout.SectionHeader>

      <DashboardLayout.SectionContent>
        {view === 'operations' && failedOperations.length > 0 ? (
          <div className="mb-4 rounded-card border border-warning/30 bg-warning/10 p-4">
            <div className="flex gap-3">
              <CircleAlertIcon className="mt-0.5 size-5 shrink-0 text-warning" />
              <div>
                <div className="font-medium">
                  <Trans
                    message=":count operações precisam de atenção"
                    values={{count: failedOperations.length}}
                  />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  <Trans message="Revise a mensagem segura antes de executar um retry." />
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <DashboardLayout.SectionContentHeader>
          <Tabs.Root
            value={view}
            onValueChange={nextView => {
              setView(nextView as 'accounts' | 'operations');
              setQueryState({page: 1, query: '', sort: null});
            }}
          >
            <Tabs.List variant="line">
              <Tabs.Tab value="accounts">
                <Trans message="Contas" />
              </Tabs.Tab>
              <Tabs.Tab value="operations">
                <Trans message="Operações" />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.Root>
          <TableSearchInput className="mr-auto" debounce={false} />
        </DashboardLayout.SectionContentHeader>

        <DashboardLayout.SectionScrollContainer>
          {view === 'accounts' ? (
            <>
              <GenericTable
                table={accountTable}
                onRowClick={row => setSelectedAccount(row.original)}
              />
              {!accountItems.length ? (
                <HostingAccountsEmptyState isFiltering={isFiltering} />
              ) : null}
              <TablePagination table={accountTable} />
            </>
          ) : (
            <>
              <GenericTable table={operationTable} />
              {!operationItems.length && <OperationsEmptyState />}
              <TablePagination table={operationTable} />
            </>
          )}
        </DashboardLayout.SectionScrollContainer>
      </DashboardLayout.SectionContent>
      <AdminHostingAccountResourcesDialog
        account={selectedAccount}
        open={selectedAccount != null}
        onOpenChange={open => {
          if (!open) setSelectedAccount(null);
        }}
      />
    </DashboardLayout.MainSection>
  );
}

const accountColumns: ColumnDef<HostingAccount>[] = [
  {
    id: 'fqdn',
    accessorKey: 'fqdn',
    enableSorting: true,
    size: 300,
    header: ({column}) => (
      <SortableHeader column={column}>
        <Trans message="Domínio" />
      </SortableHeader>
    ),
    cell: ({row}) => (
      <div className="flex items-center gap-3">
        <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ServerIcon className="size-4" />
        </span>
        <div className="min-w-0">
          <div className="truncate font-medium">{row.original.fqdn}</div>
          <div className="text-xs text-muted-foreground">
            #{row.original.id}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'plan',
    accessorFn: row => row.plan?.name ?? '',
    enableSorting: false,
    header: ({column}) => (
      <SortableHeader column={column}>
        <Trans message="Plano" />
      </SortableHeader>
    ),
    cell: ({row}) => row.original.plan?.name ?? '—',
  },
  {
    id: 'status',
    accessorKey: 'status',
    enableSorting: true,
    header: ({column}) => (
      <SortableHeader column={column}>
        <Trans message="Estado" />
      </SortableHeader>
    ),
    cell: ({row}) => <AccountStatusBadge account={row.original} />,
  },
  {
    id: 'last_synced_at',
    accessorKey: 'last_synced_at',
    enableSorting: true,
    header: ({column}) => (
      <SortableHeader column={column}>
        <Trans message="Sincronização" />
      </SortableHeader>
    ),
    cell: ({row}) =>
      row.original.last_synced_at ? (
        <time>
          <FormattedDate date={row.original.last_synced_at} />
        </time>
      ) : (
        '—'
      ),
  },
  {
    id: 'actions',
    size: 1,
    header: () => (
      <span className="hidden">
        <Trans message="Ações" />
      </span>
    ),
    cell: ({row}) => <AccountActions account={row.original} />,
  },
];

function AccountActions({account}: {account: HostingAccount}) {
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [targetPlanId, setTargetPlanId] = useState('');
  const [confirmation, setConfirmation] =
    useState<AccountConfirmationOperation | null>(null);
  const plans = useQuery(adminHostingPlansOptions());
  const availablePlans = (plans.data ?? []).filter(
    plan =>
      plan.is_active &&
      plan.id !== account.plan?.id &&
      plan.provider_packages?.some(
        providerPackage => providerPackage.is_active,
      ),
  );
  const action = useMutation({
    ...runAdminHostingOperationOptions(account.id),
    onSuccess: () => {
      setConfirmation(null);
      setPlanDialogOpen(false);
      setTargetPlanId('');
      toast.success(<Trans message="Operação adicionada à fila." />);
    },
    onError: error => showHttpErrorToast(error),
  });

  const remoteChangesDisabled = ['deleting', 'deleted'].includes(
    account.status,
  );
  const configurationChangesDisabled = [
    'pending_deletion',
    'deleting',
    'deleted',
  ].includes(account.status);

  return (
    <>
      <div className="flex justify-end text-muted-foreground">
        <Dropdown.Root>
          <Dropdown.Trigger render={<Button variant="ghost" size="icon-sm" />}>
            <EllipsisIcon />
            <span className="sr-only">
              <Trans message="Ações da hospedagem" />
            </span>
          </Dropdown.Trigger>
          <Dropdown.Content align="end">
            <Dropdown.Item
              onClick={() => action.mutate({operation: 'reconcile'})}
              disabled={action.isPending}
            >
              <RefreshCwIcon />
              <Trans message="Reconciliar" />
            </Dropdown.Item>
            {account.status === 'active' ? (
              <Dropdown.Item
                disabled={action.isPending}
                onClick={() => setConfirmation('suspend')}
              >
                <ShieldOffIcon />
                <Trans message="Suspender" />
              </Dropdown.Item>
            ) : null}
            {account.status === 'suspended' ? (
              <Dropdown.Item
                disabled={action.isPending}
                onClick={() => setConfirmation('unsuspend')}
              >
                <ShieldCheckIcon />
                <Trans message="Reativar" />
              </Dropdown.Item>
            ) : null}
            {!remoteChangesDisabled ? <Dropdown.Separator /> : null}
            {!configurationChangesDisabled ? (
              <>
                <Dropdown.Item
                  disabled={action.isPending}
                  onClick={() => setConfirmation('change_password')}
                >
                  <KeyRoundIcon />
                  <Trans message="Redefinir senha" />
                </Dropdown.Item>
                <Dropdown.Item
                  disabled={action.isPending || !availablePlans.length}
                  onClick={() => setPlanDialogOpen(true)}
                >
                  <PackageIcon />
                  <Trans message="Alterar plano ou pacote" />
                </Dropdown.Item>
              </>
            ) : null}
            {account.status === 'suspended' ? (
              <Dropdown.Item
                className="text-destructive focus:text-destructive"
                disabled={action.isPending}
                onClick={() => setConfirmation('delete')}
              >
                <Trash2Icon />
                <Trans message="Excluir hospedagem" />
              </Dropdown.Item>
            ) : null}
          </Dropdown.Content>
        </Dropdown.Root>
      </div>
      <AccountOperationConfirmation
        operation={confirmation}
        isPending={action.isPending}
        onOpenChange={open => {
          if (!open) setConfirmation(null);
        }}
        onConfirm={() => {
          if (confirmation) {
            action.mutate({operation: confirmation});
          }
        }}
      />
      <Dialog.Root open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>
                <PackageIcon />
                <Trans message="Alterar plano ou pacote" />
              </Dialog.Title>
              <Dialog.Description>
                <Trans message="Selecione um plano técnico já configurado. Planos pagos exigem uma assinatura confirmada para o mesmo produto." />
              </Dialog.Description>
            </Dialog.Header>
            <form
              className="space-y-5"
              onSubmit={event => {
                event.preventDefault();
                if (!targetPlanId) return;
                action.mutate({
                  operation: 'change_package',
                  target_plan_id: Number(targetPlanId),
                });
              }}
            >
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">
                  <Trans message="Plano de destino" />
                </span>
                <Select.Root
                  value={targetPlanId}
                  onValueChange={value => setTargetPlanId(value ?? '')}
                >
                  <Select.Trigger className="w-full">
                    <Select.Value
                      placeholder={<Trans message="Selecione um plano" />}
                    />
                  </Select.Trigger>
                  <Select.Content>
                    {availablePlans.map(plan => (
                      <Select.Item key={plan.id} value={`${plan.id}`}>
                        {plan.product.name} ·{' '}
                        {plan.type === 'free' ? (
                          <Trans message="Gratuito" />
                        ) : (
                          <Trans message="Pago" />
                        )}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </label>
              <div className="rounded-card border border-warning/30 bg-warning/10 p-3 text-sm text-muted-foreground">
                <Trans message="A alteração será enviada ao provedor e registrada na auditoria. Em caso de falha, a hospedagem atual será preservada para recuperação operacional." />
              </div>
              <Dialog.Footer>
                <Dialog.CloseButton disabled={action.isPending}>
                  <Trans message="Cancelar" />
                </Dialog.CloseButton>
                <Button
                  type="submit"
                  disabled={action.isPending || !targetPlanId}
                >
                  <PackageIcon />
                  <Trans message="Alterar plano" />
                </Button>
              </Dialog.Footer>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

type AccountConfirmationOperation =
  | 'suspend'
  | 'unsuspend'
  | 'change_password'
  | 'delete';

function AccountOperationConfirmation({
  operation,
  isPending,
  onOpenChange,
  onConfirm,
}: {
  operation: AccountConfirmationOperation | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const destructive = operation === 'suspend' || operation === 'delete';

  return (
    <AlertDialog.Root open={operation !== null} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop />
        <AlertDialog.Content>
          <AlertDialog.Header>
            <AlertDialog.Media>
              {operation === 'delete' ? (
                <Trash2Icon />
              ) : operation === 'change_password' ? (
                <KeyRoundIcon />
              ) : operation === 'unsuspend' ? (
                <ShieldCheckIcon />
              ) : (
                <ShieldOffIcon />
              )}
            </AlertDialog.Media>
            <AlertDialog.Title>
              {operation === 'delete' ? (
                <Trans message="Excluir esta hospedagem agora?" />
              ) : operation === 'change_password' ? (
                <Trans message="Redefinir a senha da hospedagem?" />
              ) : operation === 'unsuspend' ? (
                <Trans message="Reativar esta hospedagem?" />
              ) : (
                <Trans message="Suspender esta hospedagem?" />
              )}
            </AlertDialog.Title>
            <AlertDialog.Description>
              {operation === 'delete' ? (
                <Trans message="A conta será removida imediatamente do provedor, sem a carência de sete dias do cliente. Arquivos, bancos e credenciais poderão ser perdidos permanentemente. Esta ação será auditada." />
              ) : operation === 'change_password' ? (
                <Trans message="Uma nova senha segura será gerada no servidor. O cliente poderá revelá-la novamente após confirmar a própria senha." />
              ) : operation === 'unsuspend' ? (
                <Trans message="A solicitação será enviada ao provedor e registrada na auditoria da conta." />
              ) : (
                <Trans message="O site e as ferramentas ficarão indisponíveis até a conta ser reativada. A ação será registrada na auditoria." />
              )}
            </AlertDialog.Description>
          </AlertDialog.Header>
          <AlertDialog.Footer>
            <AlertDialog.Cancel disabled={isPending}>
              <Trans message="Cancelar" />
            </AlertDialog.Cancel>
            <AlertDialog.Action
              color={destructive ? 'danger' : 'primary'}
              disabled={isPending}
              onClick={onConfirm}
            >
              {operation === 'delete' ? (
                <Trans message="Excluir permanentemente" />
              ) : operation === 'change_password' ? (
                <Trans message="Redefinir senha" />
              ) : operation === 'unsuspend' ? (
                <Trans message="Reativar hospedagem" />
              ) : (
                <Trans message="Suspender hospedagem" />
              )}
            </AlertDialog.Action>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

function OperationActions({operation}: {operation: HostingOperation}) {
  const retry = useMutation({
    ...retryAdminHostingOperationOptions(),
    onSuccess: () =>
      toast.success(<Trans message="Retry adicionado à fila." />),
    onError: error => showHttpErrorToast(error),
  });

  const canRetry =
    operation.status.includes('failed') &&
    operation.operation !== 'change_package';

  if (!canRetry) {
    return null;
  }

  return (
    <DialogTrigger
      type="modal"
      onClose={confirmed => {
        if (confirmed) {
          retry.mutate(operation.id);
        }
      }}
    >
      <Button size="sm" variant="outline" disabled={retry.isPending}>
        <RotateCcwIcon />
        <Trans message="Retry" />
      </Button>
      <ConfirmationDialog
        title={<Trans message="Executar esta operação novamente?" />}
        body={
          <Trans message="Confirme apenas após revisar a mensagem segura. A nova tentativa será registrada na auditoria." />
        }
        confirm={<Trans message="Executar retry" />}
      />
    </DialogTrigger>
  );
}

function AccountStatusBadge({account}: {account: HostingAccount}) {
  const variant =
    account.status === 'active'
      ? 'positive'
      : account.status.includes('failed') ||
          account.status === 'action_required'
        ? 'destructive'
        : 'secondary';

  return (
    <Badge variant={variant}>
      <Trans message={accountStatusLabel(account.status)} />
    </Badge>
  );
}

function OperationStatusBadge({operation}: {operation: HostingOperation}) {
  const variant = operation.status.includes('failed')
    ? 'destructive'
    : operation.status === 'succeeded'
      ? 'positive'
      : 'secondary';

  return (
    <Badge variant={variant}>
      <Trans message={operationStatusLabel(operation.status)} />
    </Badge>
  );
}

function accountStatusLabel(status: HostingAccount['status']) {
  const labels: Record<HostingAccount['status'], string> = {
    pending: 'Pendente',
    provisioning: 'Provisionando',
    active: 'Ativa',
    suspended: 'Suspensa',
    pending_downgrade: 'Aguardando downgrade',
    pending_deletion: 'Exclusão agendada',
    deleting: 'Excluindo',
    deleted: 'Excluída',
    failed: 'Falhou',
    action_required: 'Ação necessária',
  };

  return labels[status];
}

function operationStatusLabel(status: HostingOperation['status']) {
  const labels: Record<HostingOperation['status'], string> = {
    queued: 'Na fila',
    running: 'Em execução',
    succeeded: 'Concluída',
    retryable_failed: 'Falhou, permite nova tentativa',
    permanent_failed: 'Falha permanente',
  };

  return labels[status];
}

function HostingAccountsEmptyState({isFiltering}: {isFiltering: boolean}) {
  return (
    <Empty.Root>
      <Empty.Header>
        <Empty.Media variant="icon">
          <ServerIcon />
        </Empty.Media>
        <Empty.Title>
          {isFiltering ? (
            <Trans message="Nenhuma hospedagem encontrada" />
          ) : (
            <Trans message="Nenhuma hospedagem criada ainda" />
          )}
        </Empty.Title>
        <Empty.Description>
          {isFiltering ? (
            <Trans message="Tente outra pesquisa." />
          ) : (
            <Trans message="As contas provisionadas aparecerão nesta tabela." />
          )}
        </Empty.Description>
      </Empty.Header>
    </Empty.Root>
  );
}

function OperationsEmptyState() {
  return (
    <Empty.Root>
      <Empty.Header>
        <Empty.Media variant="icon">
          <RefreshCwIcon />
        </Empty.Media>
        <Empty.Title>
          <Trans message="Nenhuma operação registrada" />
        </Empty.Title>
      </Empty.Header>
    </Empty.Root>
  );
}
