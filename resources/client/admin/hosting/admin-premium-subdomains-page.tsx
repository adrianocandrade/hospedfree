import {
  AdminPremiumSubdomainPayload,
  adminPremiumSubdomainsOptions,
  createAdminPremiumSubdomainOptions,
  deleteAdminPremiumSubdomainOptions,
  updateAdminPremiumSubdomainOptions,
} from '@app/hosting/hosting-queries';
import {
  AdminPremiumSubdomain,
  AdminPremiumSubdomainsResponse,
} from '@app/hosting/hosting-types';
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
import {Textarea} from '@shadcn/forms/textarea/textarea';
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
  BadgeDollarSignIcon,
  EllipsisIcon,
  PencilIcon,
  PlusIcon,
  SaveIcon,
  SparklesIcon,
  Trash2Icon,
} from 'lucide-react';
import {FormEvent, ReactElement, useEffect, useMemo, useState} from 'react';

export function Component() {
  const premiumQuery = useQuery(adminPremiumSubdomainsOptions());
  const {queryState, setQueryState, isFiltering} = useTableQueryState();
  const items = premiumQuery.data?.data ?? [];
  const columns = useMemo(
    () => premiumColumns(premiumQuery.data),
    [premiumQuery.data],
  );
  const table = useTable({
    data: items,
    columns,
    enableMultiRowSelection: false,
    sort: queryState.sort,
    onSortChange: sort => setQueryState({sort}),
    isClientSide: true,
    globalFilter: queryState.query,
    pagination: {per_page: queryState.per_page, page: queryState.page},
    onPaginationChange: pagination => setQueryState({...pagination}),
  });

  return (
    <DashboardLayout.MainSection>
      <StaticPageTitle>
        <Trans message="Nomes premium" />
      </StaticPageTitle>
      <DashboardLayout.SectionHeader>
        <DashboardLayout.SidebarToggle />
        <DashboardLayout.SectionTitle>
          <h1>
            <Trans message="Nomes premium" />
          </h1>
        </DashboardLayout.SectionTitle>
        <LinkButton variant="outline" to="/admin/plans">
          <BadgeDollarSignIcon />
          <Trans message="Produtos e preços" />
        </LinkButton>
        {premiumQuery.data ? (
          <PremiumFormDialog options={premiumQuery.data}>
            <Dialog.Trigger render={<Button />}>
              <PlusIcon />
              <Trans message="Novo nome premium" />
            </Dialog.Trigger>
          </PremiumFormDialog>
        ) : null}
      </DashboardLayout.SectionHeader>

      <DashboardLayout.SectionContent>
        <DashboardLayout.SectionContentHeader>
          <TableSearchInput className="mr-auto" debounce={false} />
          <p className="hidden text-sm text-muted-foreground lg:block">
            <Trans message="Nomes comuns começam com 5 caracteres. Cadastre aqui somente nomes de 3 ou 4 caracteres." />
          </p>
        </DashboardLayout.SectionContentHeader>
        <DashboardLayout.SectionScrollContainer>
          <GenericTable table={table} />
          {!table.getRowCount() ? (
            <Empty.Root>
              <Empty.Header>
                <Empty.Media variant="icon">
                  <SparklesIcon />
                </Empty.Media>
                <Empty.Title>
                  {isFiltering ? (
                    <Trans message="Nenhum nome encontrado" />
                  ) : (
                    <Trans message="Nenhum nome premium cadastrado" />
                  )}
                </Empty.Title>
                <Empty.Description>
                  <Trans message="Associe um preço anual para venda ou conceda o nome diretamente a um usuário." />
                </Empty.Description>
              </Empty.Header>
            </Empty.Root>
          ) : null}
          <TablePagination table={table} />
        </DashboardLayout.SectionScrollContainer>
      </DashboardLayout.SectionContent>
    </DashboardLayout.MainSection>
  );
}

function premiumColumns(
  options?: AdminPremiumSubdomainsResponse,
): ColumnDef<AdminPremiumSubdomain>[] {
  return [
    {
      id: 'fqdn',
      accessorKey: 'fqdn',
      enableSorting: true,
      size: 260,
      header: ({column}) => (
        <SortableHeader column={column}>
          <Trans message="Endereço" />
        </SortableHeader>
      ),
      cell: ({row}) => (
        <div>
          <div className="font-medium">{row.original.fqdn}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.label.length} caracteres
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
      cell: ({row}) => <PremiumStatus item={row.original} />,
    },
    {
      id: 'price',
      accessorFn: row => row.price?.amount ?? -1,
      enableSorting: true,
      header: ({column}) => (
        <SortableHeader column={column}>
          <Trans message="Preço anual" />
        </SortableHeader>
      ),
      cell: ({row}) =>
        row.original.price ? (
          <div>
            <div className="font-medium">
              {formatCurrency(
                row.original.price.amount,
                row.original.price.currency,
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {row.original.price.product_name}
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: 'owner',
      accessorFn: row =>
        row.assigned_user?.email ?? row.reserved_user?.email ?? '',
      header: () => <Trans message="Usuário" />,
      cell: ({row}) => (
        <div className="max-w-64 truncate text-sm">
          {row.original.assigned_user?.email ??
            row.original.reserved_user?.email ?? (
              <span className="text-muted-foreground">—</span>
            )}
        </div>
      ),
    },
    {
      id: 'actions',
      size: 1,
      header: () => (
        <span className="sr-only">
          <Trans message="Ações" />
        </span>
      ),
      cell: ({row}) =>
        options ? (
          <PremiumActions item={row.original} options={options} />
        ) : null,
    },
  ];
}

function PremiumStatus({item}: {item: AdminPremiumSubdomain}) {
  const content = {
    inactive: <Trans message="Inativo" />,
    expired: <Trans message="Assinatura expirada" />,
    paid: <Trans message="Assinatura ativa" />,
    complimentary: <Trans message="Concedido" />,
    reserved: <Trans message="Reservado" />,
    for_sale: <Trans message="À venda" />,
    draft: <Trans message="Rascunho" />,
  }[item.status];
  const variant =
    item.status === 'paid' || item.status === 'complimentary'
      ? 'positive'
      : item.status === 'reserved'
        ? 'outline'
        : item.status === 'inactive' ||
            item.status === 'expired' ||
            item.status === 'draft'
          ? 'secondary'
          : 'outline';

  return (
    <Badge
      variant={variant}
      className={
        item.status === 'reserved'
          ? 'border-warning/50 text-warning'
          : undefined
      }
    >
      {content}
    </Badge>
  );
}

function PremiumActions({
  item,
  options,
}: {
  item: AdminPremiumSubdomain;
  options: AdminPremiumSubdomainsResponse;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <div className="flex justify-end">
        <Dropdown.Root>
          <Dropdown.Trigger
            aria-label={`Ações para ${item.fqdn}`}
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <EllipsisIcon />
          </Dropdown.Trigger>
          <Dropdown.Content align="end">
            <Dropdown.Item onClick={() => setEditOpen(true)}>
              <PencilIcon />
              <Trans message="Editar" />
            </Dropdown.Item>
            <Dropdown.Item
              disabled={!item.can_delete}
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2Icon />
              <Trans message="Excluir" />
            </Dropdown.Item>
          </Dropdown.Content>
        </Dropdown.Root>
      </div>
      <PremiumFormDialog
        options={options}
        item={item}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeletePremiumDialog
        item={item}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}

function PremiumFormDialog({
  children,
  options,
  item,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  children?: ReactElement;
  options: AdminPremiumSubdomainsResponse;
  item?: AdminPremiumSubdomain;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
  const [zoneId, setZoneId] = useState('');
  const [label, setLabel] = useState('');
  const [priceId, setPriceId] = useState('none');
  const [grantEmail, setGrantEmail] = useState('');
  const [grantUntil, setGrantUntil] = useState('');
  const [active, setActive] = useState(true);
  const [notes, setNotes] = useState('');
  const mutation = useMutation({
    ...(item
      ? updateAdminPremiumSubdomainOptions(item.id)
      : createAdminPremiumSubdomainOptions()),
    onSuccess: () => {
      setOpen(false);
      toast.success(
        item ? (
          <Trans message="Nome premium atualizado." />
        ) : (
          <Trans message="Nome premium criado." />
        ),
      );
    },
    onError: error => showHttpErrorToast(error),
  });

  useEffect(() => {
    if (!open) return;
    setZoneId(`${item?.hosting_zone_id ?? options.options.zones[0]?.id ?? ''}`);
    setLabel(item?.label ?? '');
    setPriceId(item?.annual_price_id ? `${item.annual_price_id}` : 'none');
    setGrantEmail(item?.assigned_user?.email ?? '');
    setGrantUntil(item?.complimentary_until?.slice(0, 10) ?? '');
    setActive(item?.is_active ?? true);
    setNotes(item?.notes ?? '');
  }, [item, open, options.options.zones]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const payload: AdminPremiumSubdomainPayload = {
      hosting_zone_id: Number(zoneId),
      label,
      annual_price_id: priceId === 'none' ? null : Number(priceId),
      grant_user_email: grantEmail.trim() || null,
      complimentary_until: grantEmail.trim() && grantUntil ? grantUntil : null,
      is_active: active,
      notes: notes.trim() || null,
    };
    mutation.mutate(payload);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {children}
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>
              {item ? (
                <Trans message="Editar nome premium" />
              ) : (
                <Trans message="Novo nome premium" />
              )}
            </Dialog.Title>
            <Dialog.Description>
              <Trans message="Associe uma cobrança anual, conceda o nome a um usuário, ou use as duas opções para permitir uma futura conversão." />
            </Dialog.Description>
          </Dialog.Header>
          <form className="space-y-5" onSubmit={submit}>
            <div className="grid gap-4 sm:grid-cols-[1fr_1.5fr]">
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">
                  <Trans message="Nome" />
                </span>
                <Input
                  bindToHookForm={false}
                  value={label}
                  minLength={3}
                  maxLength={4}
                  pattern="[a-z0-9](?:[a-z0-9-]*[a-z0-9])?"
                  onChange={event =>
                    setLabel(
                      event.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, '')
                        .slice(0, 4),
                    )
                  }
                  required
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">
                  <Trans message="Zona" />
                </span>
                <Select.Root
                  value={zoneId}
                  onValueChange={value => value && setZoneId(value)}
                >
                  <Select.Trigger className="w-full">
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    {options.options.zones.map(zone => (
                      <Select.Item key={zone.id} value={`${zone.id}`}>
                        {zone.domain}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </label>
            </div>

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">
                <Trans message="Preço anual" />
              </span>
              <Select.Root
                value={priceId}
                onValueChange={value => value && setPriceId(value)}
              >
                <Select.Trigger className="w-full">
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="none">
                    <Trans message="Sem venda pública" />
                  </Select.Item>
                  {options.options.annual_prices.map(price => (
                    <Select.Item key={price.id} value={`${price.id}`}>
                      {price.product_name} ·{' '}
                      {formatCurrency(price.amount, price.currency)} / ano
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
              <span className="text-xs text-muted-foreground">
                <Trans message="Somente preços anuais ativos aparecem aqui. Configure o produto e o gateway em Produtos e preços." />
              </span>
            </label>

            <fieldset className="rounded-card border p-4">
              <legend className="px-1 text-sm font-semibold">
                <Trans message="Concessão para usuário ou influenciador" />
              </legend>
              <div className="mt-2 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium">
                    <Trans message="E-mail do usuário" />
                  </span>
                  <Input
                    bindToHookForm={false}
                    type="email"
                    value={grantEmail}
                    onChange={event => setGrantEmail(event.target.value)}
                    placeholder="usuario@exemplo.com"
                    disabled={Boolean(item?.subscription_id)}
                  />
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium">
                    <Trans message="Válido até" />
                  </span>
                  <Input
                    bindToHookForm={false}
                    type="date"
                    value={grantUntil}
                    onChange={event => setGrantUntil(event.target.value)}
                    disabled={!grantEmail || Boolean(item?.subscription_id)}
                  />
                </label>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                <Trans message="Deixe a data vazia para uma concessão sem vencimento. Endereços com assinatura paga vinculada não podem ser reassociados por este formulário." />
              </p>
            </fieldset>

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">
                <Trans message="Notas internas" />
              </span>
              <Textarea
                value={notes}
                onChange={event => setNotes(event.target.value)}
                maxLength={1000}
                rows={3}
              />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                className="size-4"
                checked={active}
                onChange={event => setActive(event.target.checked)}
              />
              <Trans message="Nome ativo" />
            </label>

            <Dialog.Footer>
              <Dialog.CloseButton>
                <Trans message="Cancelar" />
              </Dialog.CloseButton>
              <Button type="submit" disabled={mutation.isPending || !zoneId}>
                <SaveIcon />
                <Trans message="Salvar" />
              </Button>
            </Dialog.Footer>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DeletePremiumDialog({
  item,
  open,
  onOpenChange,
}: {
  item: AdminPremiumSubdomain;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const remove = useMutation({
    ...deleteAdminPremiumSubdomainOptions(),
    onSuccess: () => {
      onOpenChange(false);
      toast.success(<Trans message="Nome premium excluído." />);
    },
    onError: error => showHttpErrorToast(error),
  });

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>
              <Trans message="Excluir nome premium" />
            </Dialog.Title>
            <Dialog.Description>
              <Trans
                message="Excluir :domain? Esta ação só é permitida quando não há usuário, reserva, assinatura ou histórico de hospedagem vinculado."
                values={{domain: item.fqdn}}
              />
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.Footer>
            <Dialog.CloseButton>
              <Trans message="Cancelar" />
            </Dialog.CloseButton>
            <Button
              color="danger"
              disabled={remove.isPending}
              onClick={() => remove.mutate(item.id)}
            >
              <Trash2Icon />
              <Trans message="Excluir" />
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}
