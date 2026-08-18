import {hostingAccountsIndexOptions} from '@app/hosting/hosting-queries';
import {HostingAccount, HostingAccountStatus} from '@app/hosting/hosting-types';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {DashboardLayout} from '@common/ui/dashboard/dashboard-layout';
import {Button, LinkButton} from '@shadcn/button/button';
import {Empty} from '@shadcn/empty/empty';
import {Trans} from '@ui/i18n/trans';
import {
  CheckIcon,
  ChevronRightIcon,
  CircleAlertIcon,
  Globe2Icon,
  LifeBuoyIcon,
  LoaderCircleIcon,
  MoveRightIcon,
  PauseCircleIcon,
  PlusIcon,
  RefreshCwIcon,
  Trash2Icon,
} from 'lucide-react';
import {ReactNode} from 'react';
import {Link} from 'react-router';
import {FormattedRelativeTime} from '@ui/i18n/formatted-relative-time';
import {DataTableHeader} from '@common/datatable/data-table-header';
import {DataTablePaginationFooter} from '@common/datatable/data-table-pagination-footer';
import {Table} from '@common/ui/tables/table';
import {useDatatableQuery} from '@common/datatable/requests/use-datatable-query';
import {useDatatableSearchParams} from '@common/datatable/filters/utils/use-datatable-search-params';
import {validateDatatableSearch} from '@common/datatable/filters/utils/validate-datatable-search';
import {ColumnConfig} from '@common/datatable/column-config';
import {PendingHostingOrders} from '@app/hosting/pending-hosting-orders';

const columns: ColumnConfig<HostingAccount>[] = [
  {
    key: 'fqdn',
    allowsSorting: true,
    header: () => <Trans message="Domínio principal" />,
    body: account => (
      <div className="flex items-center gap-4 py-1">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted/50 text-primary shadow-sm">
          <Globe2Icon className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <Link
            to={`/dashboard/hosting/${account.id}`}
            className="block truncate text-sm font-semibold hover:underline"
          >
            {account.fqdn}
          </Link>
          <div className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
            <MoveRightIcon className="size-3" />
            {account.plan?.name ?? 'Hospedagem'}
          </div>
        </div>
      </div>
    ),
  },
  {
    key: 'status',
    allowsSorting: true,
    header: () => <Trans message="Status" />,
    body: account => <StatusLabel status={account.status} />,
  },
  {
    key: 'created_at',
    allowsSorting: true,
    header: () => <Trans message="Data de criação" />,
    body: account => (
      <span className="text-sm text-muted-foreground">
        <FormattedRelativeTime date={account.created_at} />
      </span>
    ),
  },
  {
    key: 'actions',
    header: () => (
      <span className="sr-only">
        <Trans message="Ações" />
      </span>
    ),
    align: 'end',
    body: account => (
      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={<Link to={`/dashboard/hosting/${account.id}`} />}
      >
        <Trans message="Gerenciar" />
        <ChevronRightIcon className="ml-1.5 size-3" />
      </Button>
    ),
  },
];

export function Component() {
  const {
    searchParams,
    sortDescriptor,
    mergeIntoSearchParams,
    setSearchQuery,
    isFiltering,
  } = useDatatableSearchParams(validateDatatableSearch);

  const query = useDatatableQuery(hostingAccountsIndexOptions(searchParams));

  const showEmptyState = query.isSuccess && !query.items.length && !isFiltering;

  return (
    <DashboardLayout.MainSection>
      <StaticPageTitle>
        <Trans message="Minha hospedagem" />
      </StaticPageTitle>
      <DashboardLayout.SectionHeader>
        <DashboardLayout.SidebarToggle />
        <DashboardLayout.SectionTitle>
          <Trans message="Minha hospedagem" />
        </DashboardLayout.SectionTitle>
        <LinkButton to="/dashboard/hosting/new">
          <PlusIcon />
          <span className="hidden sm:inline">
            <Trans message="Adicionar hospedagem" />
          </span>
          <span className="sm:hidden">
            <Trans message="Adicionar" />
          </span>
        </LinkButton>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link to="/faq" />}
        >
          <LifeBuoyIcon />
          <Trans message="Central de ajuda" />
        </Button>
      </DashboardLayout.SectionHeader>

      <DashboardLayout.SectionContent>
        <div className="flex-auto overflow-y-auto p-3 md:p-6">
          <PendingHostingOrders />
          {query.isError ? (
            <Empty.Root className="min-h-[28rem] rounded-card border bg-card">
              <Empty.Header>
                <Empty.Media variant="icon">
                  <CircleAlertIcon />
                </Empty.Media>
                <Empty.Title>
                  <Trans message="Não foi possível carregar suas hospedagens" />
                </Empty.Title>
                <Empty.Description>
                  <Trans message="Tente novamente. Nenhuma hospedagem ou configuração foi alterada." />
                </Empty.Description>
              </Empty.Header>
              <Empty.Content>
                <Button
                  variant="outline"
                  onClick={() => query.refetch()}
                  disabled={query.isFetching}
                >
                  <RefreshCwIcon
                    className={query.isFetching ? 'animate-spin' : undefined}
                  />
                  <Trans message="Tentar novamente" />
                </Button>
              </Empty.Content>
            </Empty.Root>
          ) : showEmptyState ? (
            <Empty.Root className="min-h-[28rem] rounded-card border bg-card">
              <Empty.Header>
                <Empty.Media variant="icon">
                  <Globe2Icon />
                </Empty.Media>
                <Empty.Title>
                  <Trans message="Você ainda não possui uma hospedagem" />
                </Empty.Title>
                <Empty.Description>
                  <Trans message="Escolha o plano e verifique um endereço hsite.top para criar sua primeira conta." />
                </Empty.Description>
              </Empty.Header>
              <Empty.Content>
                <LinkButton to="/dashboard/hosting/new">
                  <PlusIcon />
                  <Trans message="Adicionar hospedagem" />
                </LinkButton>
              </Empty.Content>
            </Empty.Root>
          ) : (
            <>
              <DataTableHeader
                searchValue={searchParams.query}
                onSearchChange={setSearchQuery}
              />
              <div className="relative overflow-x-auto rounded-sm border bg-card md:overflow-hidden">
                <Table
                  cellHeight="h-16"
                  columns={columns}
                  data={query.items}
                  sortDescriptor={sortDescriptor}
                  onSortChange={descriptor =>
                    mergeIntoSearchParams({
                      orderBy: descriptor?.orderBy ?? '',
                      orderDir: descriptor?.orderDir ?? '',
                    })
                  }
                />
                {query.isEmpty && (
                  <div className="p-12 text-center text-sm text-muted-foreground">
                    <Trans message="Nenhuma hospedagem encontrada." />
                  </div>
                )}
              </div>
              <DataTablePaginationFooter
                className="mt-2.5"
                data={query.data?.pagination}
                isLoading={query.isLoading}
                onPageChange={page => mergeIntoSearchParams({page})}
                onPerPageChange={perPage => mergeIntoSearchParams({perPage})}
              />
            </>
          )}
        </div>
      </DashboardLayout.SectionContent>
    </DashboardLayout.MainSection>
  );
}

function StatusLabel({status}: {status: HostingAccountStatus}) {
  switch (status) {
    case 'pending':
      return (
        <StatusValue icon={<LoaderCircleIcon />} tone="warning" spinning>
          <Trans message="Aguardando" />
        </StatusValue>
      );
    case 'provisioning':
      return (
        <StatusValue icon={<LoaderCircleIcon />} tone="warning" spinning>
          <Trans message="Configurando" />
        </StatusValue>
      );
    case 'active':
      return (
        <StatusValue icon={<CheckIcon />} tone="positive">
          <Trans message="Ativo" />
        </StatusValue>
      );
    case 'suspended':
      return (
        <StatusValue icon={<PauseCircleIcon />} tone="destructive">
          <Trans message="Suspensa" />
        </StatusValue>
      );
    case 'pending_downgrade':
      return (
        <StatusValue icon={<LoaderCircleIcon />} tone="warning" spinning>
          <Trans message="Alterando plano" />
        </StatusValue>
      );
    case 'pending_deletion':
      return (
        <StatusValue icon={<Trash2Icon />} tone="warning">
          <Trans message="Exclusão agendada" />
        </StatusValue>
      );
    case 'deleting':
      return (
        <StatusValue icon={<LoaderCircleIcon />} tone="destructive" spinning>
          <Trans message="Excluindo" />
        </StatusValue>
      );
    case 'deleted':
      return (
        <StatusValue icon={<Trash2Icon />} tone="muted">
          <Trans message="Excluída" />
        </StatusValue>
      );
    case 'failed':
      return (
        <StatusValue icon={<CircleAlertIcon />} tone="destructive">
          <Trans message="Falha no provisionamento" />
        </StatusValue>
      );
    case 'action_required':
      return (
        <StatusValue icon={<CircleAlertIcon />} tone="warning">
          <Trans message="Ação necessária" />
        </StatusValue>
      );
    default: {
      const exhaustiveStatus: never = status;
      return exhaustiveStatus;
    }
  }
}

function StatusValue({
  children,
  icon,
  tone,
  spinning = false,
}: {
  children: ReactNode;
  icon: ReactNode;
  tone: 'positive' | 'warning' | 'destructive' | 'muted';
  spinning?: boolean;
}) {
  const toneClass = {
    positive: 'text-positive',
    warning: 'text-warning',
    destructive: 'text-destructive',
    muted: 'text-muted-foreground',
  }[tone];

  return (
    <span
      className={`inline-flex items-center [&>svg]:mr-1.5 [&>svg]:size-4 ${toneClass} ${spinning ? '[&>svg]:animate-spin' : ''}`}
    >
      {icon}
      {children}
    </span>
  );
}
