import {
  adminHostingSettingsOptions,
  adminHostingPlansOptions,
  createAdminHostingPlanOptions,
  updateAdminHostingPlanOptions,
  upsertAdminHostingPackageOptions,
} from '@app/hosting/hosting-queries';
import {HostingPlan} from '@app/hosting/hosting-types';
import {listProductsOptions} from '@common/admin/subscriptions/products-queries';
import {showHttpErrorToast} from '@common/http/errors/show-http-error-toast';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {DashboardLayout} from '@common/ui/dashboard/dashboard-layout';
import {Badge} from '@shadcn/badge/badge';
import {Button, LinkButton} from '@shadcn/button/button';
import {Dialog} from '@shadcn/dialog/dialog';
import {Dropdown} from '@shadcn/dropdown/dropdown';
import {Empty} from '@shadcn/empty/empty';
import {Input} from '@shadcn/forms/input/input';
import {Select} from '@shadcn/forms/select/select';
import {GenericTable} from '@shadcn/table/generic-table';
import {SortableHeader} from '@shadcn/table/utils/sortable-header';
import {TablePagination} from '@shadcn/table/utils/table-pagination';
import {TableSearchInput} from '@shadcn/table/utils/table-search-input';
import {useTable} from '@shadcn/table/utils/use-table';
import {useTableQueryState} from '@shadcn/table/utils/use-table-query-state';
import {toast} from '@shadcn/toast/toast';
import {useMutation, useQuery} from '@tanstack/react-query';
import {ColumnDef} from '@tanstack/react-table';
import {Trans} from '@ui/i18n/trans';
import {
  BoxesIcon,
  EllipsisIcon,
  LayersIcon,
  PackageCheckIcon,
  PlusIcon,
  SaveIcon,
  SettingsIcon,
  ShoppingBagIcon,
  SparklesIcon,
} from 'lucide-react';
import {FormEvent, useEffect, useMemo, useState} from 'react';

export function Component() {
  const plans = useQuery(adminHostingPlansOptions());
  const {queryState, setQueryState, isFiltering} = useTableQueryState();
  const items = plans.data ?? [];

  const table = useTable({
    data: items,
    columns: hostingPlanColumns,
    enableMultiRowSelection: false,
    sort: queryState.sort,
    onSortChange: sort => setQueryState({sort}),
    isClientSide: true,
    globalFilter: queryState.query,
    pagination: {
      per_page: queryState.per_page,
      page: queryState.page,
    },
    onPaginationChange: pagination => setQueryState({...pagination}),
  });

  return (
    <DashboardLayout.MainSection>
      <StaticPageTitle>
        <Trans message="Planos e pacotes" />
      </StaticPageTitle>
      <DashboardLayout.SectionHeader>
        <DashboardLayout.SidebarToggle />
        <DashboardLayout.SectionTitle>
          <h1>
            <Trans message="Planos e pacotes" />
          </h1>
        </DashboardLayout.SectionTitle>
        <LinkButton variant="outline" to="/admin/plans">
          <ShoppingBagIcon />
          <Trans message="Produtos e preços" />
        </LinkButton>
        <LinkButton variant="outline" to="/admin/hosting/premium-subdomains">
          <SparklesIcon />
          <Trans message="Nomes premium" />
        </LinkButton>
        <CreatePlanDialog linkedProductIds={items.map(plan => plan.product.id)}>
          <Dialog.Trigger render={<Button variant="default" color="primary" />}>
            <PlusIcon />
            <Trans message="Novo plano de hospedagem" />
          </Dialog.Trigger>
        </CreatePlanDialog>
      </DashboardLayout.SectionHeader>

      <DashboardLayout.SectionContent>
        <DashboardLayout.SectionContentHeader>
          <TableSearchInput className="mr-auto" debounce={false} />
        </DashboardLayout.SectionContentHeader>
        <DashboardLayout.SectionScrollContainer>
          <GenericTable table={table} />
          {!table.getRowCount() ? (
            <PlansEmptyState
              isFiltering={isFiltering}
              linkedProductIds={items.map(plan => plan.product.id)}
            />
          ) : null}
          <TablePagination table={table} />
        </DashboardLayout.SectionScrollContainer>
      </DashboardLayout.SectionContent>
    </DashboardLayout.MainSection>
  );
}

const hostingPlanColumns: ColumnDef<HostingPlan>[] = [
  {
    id: 'product',
    accessorFn: row => row.product.name,
    enableSorting: true,
    size: 300,
    header: ({column}) => (
      <SortableHeader column={column}>
        <Trans message="Produto" />
      </SortableHeader>
    ),
    cell: ({row}) => (
      <div className="flex items-center gap-3">
        <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          <PackageCheckIcon className="size-4" />
        </span>
        <div className="min-w-0">
          <div className="truncate font-medium">
            {row.original.product.name}
          </div>
          <div className="text-xs text-muted-foreground">
            produto #{row.original.product.id}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'type',
    accessorKey: 'type',
    enableSorting: true,
    header: ({column}) => (
      <SortableHeader column={column}>
        <Trans message="Tipo" />
      </SortableHeader>
    ),
    cell: ({row}) => (
      <Badge variant={row.original.type === 'free' ? 'positive' : 'secondary'}>
        {row.original.type === 'free' ? 'Free' : 'Pago'}
      </Badge>
    ),
  },
  {
    id: 'packages',
    accessorFn: row =>
      row.provider_packages?.map(item => item.remote_package).join(' ') ?? '',
    header: () => <Trans message="Pacotes remotos" />,
    cell: ({row}) => {
      const packages = row.original.provider_packages ?? [];
      return packages.length ? (
        <div className="flex flex-wrap gap-1.5">
          {packages.map(item => (
            <Badge
              key={`${item.provider}-${item.remote_package}`}
              variant={item.is_active ? 'outline' : 'secondary'}
            >
              {item.provider}: {item.remote_package}
            </Badge>
          ))}
        </div>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
  {
    id: 'max_accounts_per_workspace',
    accessorKey: 'max_accounts_per_workspace',
    enableSorting: true,
    header: ({column}) => (
      <SortableHeader column={column}>
        <Trans message="Limite" />
      </SortableHeader>
    ),
    cell: ({row}) => row.original.max_accounts_per_workspace,
  },
  {
    id: 'is_active',
    accessorKey: 'is_active',
    enableSorting: true,
    header: ({column}) => (
      <SortableHeader column={column}>
        <Trans message="Status" />
      </SortableHeader>
    ),
    cell: ({row}) => (
      <Badge variant={row.original.is_active ? 'positive' : 'secondary'}>
        {row.original.is_active ? 'Ativo' : 'Oculto'}
      </Badge>
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
    cell: ({row}) => <PlanActions plan={row.original} />,
  },
];

function PlanActions({plan}: {plan: HostingPlan}) {
  const [editOpen, setEditOpen] = useState(false);
  const [packageOpen, setPackageOpen] = useState(false);

  return (
    <>
      <div className="flex justify-end text-muted-foreground">
        <Dropdown.Root>
          <Dropdown.Trigger render={<Button variant="ghost" size="icon-sm" />}>
            <EllipsisIcon />
          </Dropdown.Trigger>
          <Dropdown.Content align="end">
            <Dropdown.Item onClick={() => setEditOpen(true)}>
              <SettingsIcon />
              <Trans message="Editar plano" />
            </Dropdown.Item>
            <Dropdown.Item onClick={() => setPackageOpen(true)}>
              <BoxesIcon />
              <Trans message="Configurar pacote" />
            </Dropdown.Item>
          </Dropdown.Content>
        </Dropdown.Root>
      </div>
      <EditPlanDialog plan={plan} open={editOpen} onOpenChange={setEditOpen} />
      <ProviderPackageDialog
        plan={plan}
        open={packageOpen}
        onOpenChange={setPackageOpen}
      />
    </>
  );
}

type PlanQuotaForm = {
  diskMb: string;
  bandwidthMb: string;
  domains: string;
  databases: string;
  adFree: boolean;
};

function defaultQuotaForm(type: 'free' | 'paid'): PlanQuotaForm {
  return type === 'free'
    ? {
        diskMb: '5120',
        bandwidthMb: '50000',
        domains: '2',
        databases: '2',
        adFree: true,
      }
    : {
        diskMb: '10240',
        bandwidthMb: '150000',
        domains: '5',
        databases: '10',
        adFree: true,
      };
}

function quotaFormFromPlan(plan: HostingPlan): PlanQuotaForm {
  const fallback = defaultQuotaForm(plan.type);
  return {
    diskMb: String(plan.quotas?.disk_mb ?? fallback.diskMb),
    bandwidthMb: String(plan.quotas?.bandwidth_mb ?? fallback.bandwidthMb),
    domains: String(plan.quotas?.domains ?? fallback.domains),
    databases: String(plan.quotas?.databases ?? fallback.databases),
    adFree: Boolean(plan.quotas?.ad_free ?? fallback.adFree),
  };
}

function quotaPayload(value: PlanQuotaForm) {
  return {
    disk_mb: Number(value.diskMb),
    bandwidth_mb: Number(value.bandwidthMb),
    domains: Number(value.domains),
    databases: Number(value.databases),
    ad_free: value.adFree,
  };
}

function PlanQuotaFields({
  value,
  onChange,
}: {
  value: PlanQuotaForm;
  onChange: (value: PlanQuotaForm) => void;
}) {
  const update = (field: keyof PlanQuotaForm, nextValue: string | boolean) => {
    onChange({...value, [field]: nextValue});
  };

  return (
    <fieldset className="rounded-card border p-4">
      <legend className="px-1 text-sm font-semibold">
        <Trans message="Limites do pacote" />
      </legend>
      <p className="mb-4 text-xs text-muted-foreground">
        <Trans message="Defina os recursos exibidos ao cliente e aplicados ao plano de hospedagem." />
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <QuotaNumberField
          label={<Trans message="Espaço em disco (MB)" />}
          value={value.diskMb}
          onChange={nextValue => update('diskMb', nextValue)}
        />
        <QuotaNumberField
          label={<Trans message="Tráfego mensal (MB)" />}
          value={value.bandwidthMb}
          onChange={nextValue => update('bandwidthMb', nextValue)}
        />
        <QuotaNumberField
          label={<Trans message="Domínios" />}
          value={value.domains}
          onChange={nextValue => update('domains', nextValue)}
        />
        <QuotaNumberField
          label={<Trans message="Bancos MySQL" />}
          value={value.databases}
          onChange={nextValue => update('databases', nextValue)}
        />
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          className="size-4"
          checked={value.adFree}
          onChange={event => update('adFree', event.target.checked)}
        />
        <Trans message="Sem anúncios" />
      </label>
    </fieldset>
  );
}

function QuotaNumberField({
  label,
  value,
  onChange,
}: {
  label: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <Input
        bindToHookForm={false}
        type="number"
        min="0"
        step="1"
        value={value}
        onChange={event => onChange(event.target.value)}
        required
      />
    </label>
  );
}

function CreatePlanDialog({
  children,
  linkedProductIds,
}: {
  children: React.ReactElement;
  linkedProductIds: number[];
}) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState('');
  const [type, setType] = useState<'free' | 'paid'>('paid');
  const [quotas, setQuotas] = useState<PlanQuotaForm>(() =>
    defaultQuotaForm('paid'),
  );
  const products = useQuery(listProductsOptions());
  const availableProducts = (products.data?.data ?? []).filter(
    product => !linkedProductIds.includes(product.id),
  );
  const createPlan = useMutation({
    ...createAdminHostingPlanOptions(),
    onSuccess: () => {
      setOpen(false);
      setProductId('');
      toast.success(<Trans message="Plano criado." />);
    },
    onError: error => showHttpErrorToast(error),
  });

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {children}
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>
              <Trans message="Novo plano de hospedagem" />
            </Dialog.Title>
            <Dialog.Description>
              <Trans message="Associe um produto e seus preços existentes ao pacote técnico de hospedagem." />
            </Dialog.Description>
          </Dialog.Header>
          <form
            className="space-y-5"
            onSubmit={event => {
              event.preventDefault();
              createPlan.mutate({
                product_id: Number(productId),
                type,
                max_accounts_per_workspace: 1,
                quotas: quotaPayload(quotas),
                is_active: true,
                sort_order: 50,
              });
            }}
          >
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">
                <Trans message="Produto de cobrança" />
              </span>
              <Select.Root
                value={productId}
                onValueChange={value => {
                  if (value === null) return;
                  setProductId(value);
                  const product = availableProducts.find(
                    item => `${item.id}` === value,
                  );
                  if (product?.free) {
                    setType('free');
                    setQuotas(defaultQuotaForm('free'));
                  } else {
                    setType('paid');
                    setQuotas(defaultQuotaForm('paid'));
                  }
                }}
              >
                <Select.Trigger className="w-full">
                  <Select.Value
                    placeholder={
                      products.isLoading ? (
                        <Trans message="Carregando produtos..." />
                      ) : (
                        <Trans message="Selecione um produto" />
                      )
                    }
                  />
                </Select.Trigger>
                <Select.Content>
                  {availableProducts.map(product => (
                    <Select.Item key={product.id} value={`${product.id}`}>
                      {product.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
              {!products.isLoading && !availableProducts.length ? (
                <span className="text-xs text-muted-foreground">
                  <Trans message="Todos os produtos existentes já estão associados. Crie ou edite produtos na área de Produtos e preços." />
                </span>
              ) : null}
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">
                <Trans message="Tipo" />
              </span>
              <Select.Root
                value={type}
                onValueChange={value => {
                  const nextType = value as 'free' | 'paid';
                  setType(nextType);
                  setQuotas(defaultQuotaForm(nextType));
                }}
              >
                <Select.Trigger className="w-full">
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="paid">
                    <Trans message="Pago" />
                  </Select.Item>
                  <Select.Item value="free">
                    <Trans message="Gratuito" />
                  </Select.Item>
                </Select.Content>
              </Select.Root>
            </label>
            <PlanQuotaFields value={quotas} onChange={setQuotas} />
            <Dialog.Footer>
              <Dialog.CloseButton>
                <Trans message="Cancelar" />
              </Dialog.CloseButton>
              <Button
                type="submit"
                disabled={
                  createPlan.isPending ||
                  !productId ||
                  !availableProducts.length
                }
              >
                <PlusIcon />
                <Trans message="Criar plano" />
              </Button>
            </Dialog.Footer>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function EditPlanDialog({
  plan,
  open,
  onOpenChange,
}: {
  plan: HostingPlan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updatePlan = useMutation({
    ...updateAdminHostingPlanOptions(plan.id),
    onSuccess: () => {
      onOpenChange(false);
      toast.success(<Trans message="Plano atualizado." />);
    },
    onError: error => showHttpErrorToast(error),
  });
  const [active, setActive] = useState(Boolean(plan.is_active));
  const [limit, setLimit] = useState(String(plan.max_accounts_per_workspace));
  const [sortOrder, setSortOrder] = useState(String(plan.sort_order ?? 0));
  const [quotas, setQuotas] = useState<PlanQuotaForm>(() =>
    quotaFormFromPlan(plan),
  );

  useEffect(() => {
    setActive(Boolean(plan.is_active));
    setLimit(String(plan.max_accounts_per_workspace));
    setSortOrder(String(plan.sort_order ?? 0));
    setQuotas(quotaFormFromPlan(plan));
  }, [plan]);

  const savePlan = (event: FormEvent) => {
    event.preventDefault();
    updatePlan.mutate({
      max_accounts_per_workspace: Number(limit),
      is_active: active,
      sort_order: Number(sortOrder),
      quotas: quotaPayload(quotas),
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>{plan.product.name}</Dialog.Title>
            <Dialog.Description>
              <Trans message="Configurações comerciais locais do plano de hospedagem." />
            </Dialog.Description>
          </Dialog.Header>
          <form className="space-y-5" onSubmit={savePlan}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">
                  <Trans message="Limite por workspace" />
                </span>
                <Input
                  bindToHookForm={false}
                  inputMode="numeric"
                  value={limit}
                  onChange={event => setLimit(event.target.value)}
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">
                  <Trans message="Ordem" />
                </span>
                <Input
                  bindToHookForm={false}
                  inputMode="numeric"
                  value={sortOrder}
                  onChange={event => setSortOrder(event.target.value)}
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                className="size-4"
                checked={active}
                onChange={event => setActive(event.target.checked)}
              />
              <Trans message="Disponível publicamente" />
            </label>
            <PlanQuotaFields value={quotas} onChange={setQuotas} />
            <Dialog.Footer>
              <Dialog.CloseButton>
                <Trans message="Cancelar" />
              </Dialog.CloseButton>
              <Button type="submit" disabled={updatePlan.isPending}>
                <SaveIcon />
                <Trans message="Salvar plano" />
              </Button>
            </Dialog.Footer>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ProviderPackageDialog({
  plan,
  open,
  onOpenChange,
}: {
  plan: HostingPlan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const settings = useQuery(adminHostingSettingsOptions());
  const preferredProvider =
    settings.data?.provider_driver ??
    (plan.provider_packages?.some(item => item.provider === 'mofh')
      ? 'mofh'
      : 'fake');
  const [provider, setProvider] = useState<'fake' | 'mofh'>(preferredProvider);
  const selectedPackage = useMemo(
    () => plan.provider_packages?.find(item => item.provider === provider),
    [plan.provider_packages, provider],
  );
  const [remotePackage, setRemotePackage] = useState(
    selectedPackage?.remote_package ?? '',
  );
  const [packageActive, setPackageActive] = useState(
    selectedPackage?.is_active ?? true,
  );
  const savePackage = useMutation({
    ...upsertAdminHostingPackageOptions(plan.id),
    onSuccess: () => {
      onOpenChange(false);
      toast.success(<Trans message="Pacote atualizado." />);
    },
    onError: error => showHttpErrorToast(error),
  });

  useEffect(() => {
    setRemotePackage(selectedPackage?.remote_package ?? '');
    setPackageActive(selectedPackage?.is_active ?? true);
  }, [selectedPackage]);

  useEffect(() => {
    if (open) {
      setProvider(preferredProvider);
    }
  }, [open, preferredProvider]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>
              <Trans message="Pacote remoto" />
            </Dialog.Title>
            <Dialog.Description>
              <Trans message="Mapeie este plano para o pacote do provider. Isso fica restrito ao admin." />
            </Dialog.Description>
          </Dialog.Header>
          <form
            className="space-y-5"
            onSubmit={event => {
              event.preventDefault();
              savePackage.mutate({
                provider,
                remote_package: remotePackage,
                is_active: packageActive,
              });
            }}
          >
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">
                <Trans message="Provider" />
              </span>
              <Select.Root
                value={provider}
                onValueChange={value => setProvider(value as 'fake' | 'mofh')}
              >
                <Select.Trigger className="w-full">
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="fake">fake</Select.Item>
                  <Select.Item value="mofh">mofh</Select.Item>
                </Select.Content>
              </Select.Root>
              <span className="text-xs text-muted-foreground">
                <Trans
                  message="Provider ativo do sistema: :provider"
                  values={{provider: settings.data?.provider_driver ?? '—'}}
                />
              </span>
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">
                <Trans message="Pacote remoto" />
              </span>
              <Input
                bindToHookForm={false}
                value={remotePackage}
                onChange={event => setRemotePackage(event.target.value)}
                required
              />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                className="size-4"
                checked={packageActive}
                onChange={event => setPackageActive(event.target.checked)}
              />
              <Trans message="Pacote ativo" />
            </label>
            <Dialog.Footer>
              <Dialog.CloseButton>
                <Trans message="Cancelar" />
              </Dialog.CloseButton>
              <Button type="submit" disabled={savePackage.isPending}>
                <SaveIcon />
                <Trans message="Salvar pacote" />
              </Button>
            </Dialog.Footer>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PlansEmptyState({
  isFiltering,
  linkedProductIds,
}: {
  isFiltering: boolean;
  linkedProductIds: number[];
}) {
  return (
    <Empty.Root>
      <Empty.Header>
        <Empty.Media variant="icon">
          <LayersIcon />
        </Empty.Media>
        <Empty.Title>
          {isFiltering ? (
            <Trans message="Nenhum plano encontrado" />
          ) : (
            <Trans message="Nenhum plano de hospedagem cadastrado" />
          )}
        </Empty.Title>
        <Empty.Description>
          {isFiltering ? (
            <Trans message="Tente outra pesquisa." />
          ) : (
            <Trans message="Crie o vínculo entre um produto de cobrança e um plano de hospedagem." />
          )}
        </Empty.Description>
      </Empty.Header>
      {!isFiltering ? (
        <Empty.Content>
          <CreatePlanDialog linkedProductIds={linkedProductIds}>
            <Dialog.Trigger render={<Button variant="default" />}>
              <PlusIcon />
              <Trans message="Novo plano de hospedagem" />
            </Dialog.Trigger>
          </CreatePlanDialog>
        </Empty.Content>
      ) : null}
    </Empty.Root>
  );
}
