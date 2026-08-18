import {
  adminKnowledgeArticlesOptions,
  adminKnowledgeCategoriesOptions,
  createAdminKnowledgeArticleOptions,
  createAdminKnowledgeCategoryOptions,
  updateAdminKnowledgeArticleOptions,
} from '@app/hosting/hosting-queries';
import {KnowledgeArticle} from '@app/hosting/hosting-types';
import {showHttpErrorToast} from '@common/http/errors/show-http-error-toast';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {DashboardLayout} from '@common/ui/dashboard/dashboard-layout';
import {Badge} from '@shadcn/badge/badge';
import {Button} from '@shadcn/button/button';
import {Dialog} from '@shadcn/dialog/dialog';
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
import {FormattedDate} from '@ui/i18n/formatted-date';
import {Trans} from '@ui/i18n/trans';
import {BookOpenIcon, EditIcon, FolderPlusIcon, PlusIcon} from 'lucide-react';
import {FormEvent, ReactElement, useEffect, useMemo, useState} from 'react';

type KnowledgeCategory = {id: number; name: string; slug: string};

export function Component() {
  const articles = useQuery(adminKnowledgeArticlesOptions());
  const categories = useQuery(adminKnowledgeCategoriesOptions());
  const {queryState, setQueryState, isFiltering} = useTableQueryState();
  const items = articles.data ?? [];

  const columns = useMemo(
    () => knowledgeColumns(categories.data ?? []),
    [categories.data],
  );

  const table = useTable({
    data: items,
    columns,
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
        <Trans message="Base de conhecimento" />
      </StaticPageTitle>
      <DashboardLayout.SectionHeader>
        <DashboardLayout.SidebarToggle />
        <DashboardLayout.SectionTitle>
          <h1>
            <Trans message="Base de conhecimento" />
          </h1>
        </DashboardLayout.SectionTitle>
        <CreateCategoryDialog>
          <Dialog.Trigger render={<Button variant="outline" />}>
            <FolderPlusIcon />
            <Trans message="Nova categoria" />
          </Dialog.Trigger>
        </CreateCategoryDialog>
        <ArticleDialog categories={categories.data ?? []}>
          <Dialog.Trigger render={<Button variant="default" color="primary" />}>
            <PlusIcon />
            <Trans message="Novo artigo" />
          </Dialog.Trigger>
        </ArticleDialog>
      </DashboardLayout.SectionHeader>

      <DashboardLayout.SectionContent>
        <DashboardLayout.SectionContentHeader>
          <TableSearchInput className="mr-auto" debounce={false} />
        </DashboardLayout.SectionContentHeader>
        <DashboardLayout.SectionScrollContainer>
          <GenericTable table={table} />
          {!table.getRowCount() ? (
            <KnowledgeEmptyState isFiltering={isFiltering} />
          ) : null}
          <TablePagination table={table} />
        </DashboardLayout.SectionScrollContainer>
      </DashboardLayout.SectionContent>
    </DashboardLayout.MainSection>
  );
}

function knowledgeColumns(
  categories: KnowledgeCategory[],
): ColumnDef<KnowledgeArticle>[] {
  return [
    {
      id: 'title',
      accessorKey: 'title',
      enableSorting: true,
      size: 360,
      header: ({column}) => (
        <SortableHeader column={column}>
          <Trans message="Título" />
        </SortableHeader>
      ),
      cell: ({row}) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{row.original.title}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.slug}
          </div>
        </div>
      ),
    },
    {
      id: 'category',
      accessorFn: row => row.category?.name ?? '',
      enableSorting: true,
      header: ({column}) => (
        <SortableHeader column={column}>
          <Trans message="Categoria" />
        </SortableHeader>
      ),
      cell: ({row}) =>
        row.original.category?.name ?? (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: 'status',
      accessorFn: row => (row.published_at ? 'published' : 'draft'),
      enableSorting: true,
      header: ({column}) => (
        <SortableHeader column={column}>
          <Trans message="Status" />
        </SortableHeader>
      ),
      cell: ({row}) => (
        <Badge variant={row.original.published_at ? 'positive' : 'secondary'}>
          {row.original.published_at ? 'Publicado' : 'Rascunho'}
        </Badge>
      ),
    },
    {
      id: 'published_at',
      accessorKey: 'published_at',
      enableSorting: true,
      header: ({column}) => (
        <SortableHeader column={column}>
          <Trans message="Publicado em" />
        </SortableHeader>
      ),
      cell: ({row}) =>
        row.original.published_at ? (
          <time>
            <FormattedDate date={row.original.published_at} />
          </time>
        ) : (
          <span className="text-muted-foreground">—</span>
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
      cell: ({row}) => (
        <ArticleDialog article={row.original} categories={categories}>
          <Dialog.Trigger render={<Button size="sm" variant="outline" />}>
            <EditIcon />
            <Trans message="Editar" />
          </Dialog.Trigger>
        </ArticleDialog>
      ),
    },
  ];
}

function CreateCategoryDialog({children}: {children: ReactElement}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const createCategory = useMutation({
    ...createAdminKnowledgeCategoryOptions(),
    onSuccess: () => {
      setOpen(false);
      setName('');
      toast.success(<Trans message="Categoria criada." />);
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
              <Trans message="Nova categoria" />
            </Dialog.Title>
          </Dialog.Header>
          <form
            className="space-y-5"
            onSubmit={event => {
              event.preventDefault();
              createCategory.mutate(name);
            }}
          >
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">
                <Trans message="Nome" />
              </span>
              <Input
                bindToHookForm={false}
                value={name}
                onChange={event => setName(event.target.value)}
                required
              />
            </label>
            <Dialog.Footer>
              <Dialog.CloseButton>
                <Trans message="Cancelar" />
              </Dialog.CloseButton>
              <Button type="submit" disabled={createCategory.isPending}>
                <FolderPlusIcon />
                <Trans message="Criar categoria" />
              </Button>
            </Dialog.Footer>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ArticleDialog({
  article,
  categories,
  children,
}: {
  article?: KnowledgeArticle;
  categories: KnowledgeCategory[];
  children: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const createArticle = useMutation({
    ...createAdminKnowledgeArticleOptions(),
    onSuccess: () => {
      setOpen(false);
      toast.success(<Trans message="Artigo criado." />);
    },
    onError: error => showHttpErrorToast(error),
  });
  const updateArticle = useMutation({
    ...updateAdminKnowledgeArticleOptions(article?.id ?? 0),
    onSuccess: () => {
      setOpen(false);
      toast.success(<Trans message="Artigo atualizado." />);
    },
    onError: error => showHttpErrorToast(error),
  });

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [body, setBody] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  useEffect(() => {
    setTitle(article?.title ?? '');
    setExcerpt(article?.excerpt ?? '');
    setBody(article?.body ?? '');
    setCategoryId(String(article?.category?.id ?? categories[0]?.id ?? ''));
    setStatus(article?.published_at ? 'published' : 'draft');
  }, [article, categories]);

  const save = (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      knowledge_category_id: Number(categoryId),
      title,
      excerpt,
      body,
      status,
    };
    if (article) {
      updateArticle.mutate(payload);
    } else {
      createArticle.mutate(payload);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {children}
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Content className="max-w-4xl">
          <Dialog.Header>
            <Dialog.Title>
              {article ? (
                <Trans message="Editar artigo" />
              ) : (
                <Trans message="Novo artigo" />
              )}
            </Dialog.Title>
            <Dialog.Description>
              <Trans message="Use HTML seguro somente quando precisar preservar formatação do artigo." />
            </Dialog.Description>
          </Dialog.Header>
          <form className="space-y-5" onSubmit={save}>
            <div className="grid gap-4 sm:grid-cols-[1fr_220px_160px]">
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">
                  <Trans message="Título" />
                </span>
                <Input
                  bindToHookForm={false}
                  value={title}
                  onChange={event => setTitle(event.target.value)}
                  required
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">
                  <Trans message="Categoria" />
                </span>
                <Select.Root
                  value={categoryId}
                  onValueChange={value => setCategoryId(value as string)}
                  disabled={!categories.length}
                >
                  <Select.Trigger className="w-full">
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    {categories.map(category => (
                      <Select.Item key={category.id} value={String(category.id)}>
                        {category.name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">
                  <Trans message="Status" />
                </span>
                <Select.Root
                  value={status}
                  onValueChange={value =>
                    setStatus(value as 'draft' | 'published')
                  }
                >
                  <Select.Trigger className="w-full">
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="draft">Rascunho</Select.Item>
                    <Select.Item value="published">Publicado</Select.Item>
                  </Select.Content>
                </Select.Root>
              </label>
            </div>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">
                <Trans message="Resumo" />
              </span>
              <Input
                bindToHookForm={false}
                value={excerpt}
                onChange={event => setExcerpt(event.target.value)}
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">
                <Trans message="Conteúdo HTML seguro" />
              </span>
              <Textarea
                bindToHookForm={false}
                className="min-h-72 font-mono text-sm"
                value={body}
                onChange={event => setBody(event.target.value)}
                required
              />
            </label>
            <Dialog.Footer>
              <Dialog.CloseButton>
                <Trans message="Cancelar" />
              </Dialog.CloseButton>
              <Button
                type="submit"
                disabled={
                  createArticle.isPending ||
                  updateArticle.isPending ||
                  !categoryId
                }
              >
                <PlusIcon />
                <Trans message="Salvar artigo" />
              </Button>
            </Dialog.Footer>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function KnowledgeEmptyState({isFiltering}: {isFiltering: boolean}) {
  return (
    <Empty.Root>
      <Empty.Header>
        <Empty.Media variant="icon">
          <BookOpenIcon />
        </Empty.Media>
        <Empty.Title>
          {isFiltering ? (
            <Trans message="Nenhum artigo encontrado" />
          ) : (
            <Trans message="Nenhum artigo publicado ainda" />
          )}
        </Empty.Title>
        <Empty.Description>
          {isFiltering ? (
            <Trans message="Tente outra pesquisa." />
          ) : (
            <Trans message="Crie categorias e artigos para orientar clientes de hospedagem." />
          )}
        </Empty.Description>
      </Empty.Header>
    </Empty.Root>
  );
}
