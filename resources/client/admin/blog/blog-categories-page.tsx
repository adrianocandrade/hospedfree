import {
  createBlogCategoryOptions,
  deleteBlogCategoryOptions,
  listBlogCategoriesOptions,
  updateBlogCategoryOptions,
} from '@app/admin/blog/blog-queries';
import {slugifyBlogValue} from '@app/admin/blog/blog-post-form';
import {BlogCategory} from '@app/gen/schemas/blog-category';
import {CrupdateBlogCategoryBody} from '@app/gen/schemas/crupdate-blog-category-body';
import {ListBlogCategoriesParams} from '@app/gen/schemas/list-blog-categories-params';
import {useShowGlobalLoadingBar} from '@common/core/use-show-global-loading-bar';
import {onFormQueryError} from '@common/http/errors/on-form-query-error';
import {showHttpErrorToast} from '@common/http/errors/show-http-error-toast';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {DashboardLayout} from '@common/ui/dashboard/dashboard-layout';
import {AlertDialog} from '@shadcn/alert-dialog/alert-dialog';
import {Badge} from '@shadcn/badge/badge';
import {Button} from '@shadcn/button/button';
import {Dialog} from '@shadcn/dialog/dialog';
import {Dropdown} from '@shadcn/dropdown/dropdown';
import {Empty} from '@shadcn/empty/empty';
import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Input} from '@shadcn/forms/input/input';
import {Item} from '@shadcn/item/item';
import {BackendPagination} from '@shadcn/table/utils/table-pagination';
import {TableSearchInput} from '@shadcn/table/utils/table-search-input';
import {TableSortButton} from '@shadcn/table/utils/table-sort-button';
import {useTableQueryState} from '@shadcn/table/utils/use-table-query-state';
import {toast} from '@shadcn/toast/toast';
import {useMutation, useSuspenseQuery} from '@tanstack/react-query';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Trans} from '@ui/i18n/trans';
import {DeleteIcon} from '@ui/icons/material/Delete';
import {EditIcon} from '@ui/icons/material/Edit';
import {
  EllipsisIcon,
  FolderTreeIcon,
  NewspaperIcon,
  PlusIcon,
} from 'lucide-react';
import {ReactElement, useEffect, useRef, useState} from 'react';
import {useForm, useWatch} from 'react-hook-form';
import {Link} from 'react-router';

type CategoryFormValues = Omit<CrupdateBlogCategoryBody, 'sort_order'> & {
  sort_order?: number | string | null;
};

export function Component() {
  const {queryState, setQueryState, isFiltering, searchParams, isLoading} =
    useTableQueryState();
  const query = useSuspenseQuery(
    listBlogCategoriesOptions(searchParams as ListBlogCategoriesParams),
  );
  const categories = query.data.data ?? [];

  useShowGlobalLoadingBar({isLoading});

  return (
    <DashboardLayout.MainSection>
      <StaticPageTitle>
        <Trans message="Blog categories" />
      </StaticPageTitle>
      <DashboardLayout.SectionHeader>
        <DashboardLayout.SidebarToggle />
        <DashboardLayout.SectionTitle>
          <h1>
            <Trans message="Blog categories" />
          </h1>
        </DashboardLayout.SectionTitle>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link to="/admin/blog" />}
        >
          <NewspaperIcon />
          <Trans message="Posts" />
        </Button>
        <CategoryDialog>
          <Dialog.Trigger render={<Button color="primary" />}>
            <PlusIcon />
            <Trans message="New category" />
          </Dialog.Trigger>
        </CategoryDialog>
      </DashboardLayout.SectionHeader>
      <DashboardLayout.SectionContent>
        <DashboardLayout.SectionContentHeader>
          <TableSearchInput className="mr-auto" debounce={false} />
          <TableSortButton
            sortDescriptor={queryState.sort}
            onSortChange={sort => setQueryState({sort})}
            sortOptions={sortOptions}
          />
        </DashboardLayout.SectionContentHeader>
        <DashboardLayout.SectionScrollContainer className="flex flex-col gap-4">
          {categories.map(category => (
            <BlogCategoryCard key={category.id} category={category} />
          ))}
          <BackendPagination
            response={query.data}
            onPageChange={page => setQueryState({page})}
            onPageSizeChange={perPage => setQueryState({per_page: perPage})}
          />
          {categories.length === 0 && (
            <BlogCategoriesEmptyState isFiltering={isFiltering} />
          )}
        </DashboardLayout.SectionScrollContainer>
      </DashboardLayout.SectionContent>
    </DashboardLayout.MainSection>
  );
}

const sortOptions = [
  {
    label: <Trans message="Sort order" />,
    orderBy: 'sort_order',
    isDefault: true,
  },
  {
    label: <Trans message="Name" />,
    orderBy: 'name',
  },
  {
    label: <Trans message="Last updated" />,
    orderBy: 'updated_at',
  },
];

function BlogCategoryCard({category}: {category: BlogCategory}) {
  return (
    <Item.Root variant="outline">
      <Item.Media align="center" className="size-9.5 rounded-full border">
        <FolderTreeIcon className="size-4" />
      </Item.Media>
      <Item.Content>
        <Item.Title>{category.name}</Item.Title>
        <Item.Description className="flex flex-wrap items-center gap-2">
          <span>/blog/categoria/{category.slug}</span>
          <Badge variant="secondary">
            <Trans
              message="[one :count post|other :count posts]"
              values={{count: Number(category.posts_count ?? 0)}}
            />
          </Badge>
          <Badge variant="outline">
            <Trans
              message="[one :count published|other :count published]"
              values={{count: Number(category.published_posts_count ?? 0)}}
            />
          </Badge>
        </Item.Description>
      </Item.Content>
      <Item.Actions>
        <BlogCategoryActionsButton category={category} />
      </Item.Actions>
    </Item.Root>
  );
}

function BlogCategoryActionsButton({category}: {category: BlogCategory}) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  return (
    <>
      <CategoryDialog
        category={category}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
      <DeleteBlogCategoryDialog
        categoryId={Number(category.id)}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
      <Dropdown.Root>
        <Dropdown.Trigger render={<Button variant="ghost" size="icon" />}>
          <EllipsisIcon />
        </Dropdown.Trigger>
        <Dropdown.Content align="end">
          <Dropdown.Item onClick={() => setEditDialogOpen(true)}>
            <EditIcon />
            <Trans message="Edit" />
          </Dropdown.Item>
          <Dropdown.Item
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <DeleteIcon />
            <Trans message="Delete" />
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Root>
    </>
  );
}

function BlogCategoriesEmptyState({isFiltering}: {isFiltering: boolean}) {
  return (
    <Empty.Root>
      <Empty.Header>
        <Empty.Media variant="icon">
          <FolderTreeIcon />
        </Empty.Media>
        <Empty.Title>
          {isFiltering ? (
            <Trans message="No matching categories" />
          ) : (
            <Trans message="No categories have been created yet" />
          )}
        </Empty.Title>
        <Empty.Description>
          {isFiltering ? (
            <Trans message="Try another search query." />
          ) : (
            <Trans message="Create the first category for the public blog." />
          )}
        </Empty.Description>
      </Empty.Header>
      {!isFiltering ? (
        <Empty.Content>
          <CategoryDialog>
            <Dialog.Trigger render={<Button color="primary" />}>
              <PlusIcon />
              <Trans message="New category" />
            </Dialog.Trigger>
          </CategoryDialog>
        </Empty.Content>
      ) : null}
    </Empty.Root>
  );
}

type CategoryDialogProps = {
  category?: BlogCategory;
  children?: ReactElement<typeof Dialog.Trigger>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function CategoryDialog({
  category,
  children,
  open: controlledOpen,
  onOpenChange,
}: CategoryDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {children}
      <Dialog.Portal>
        <Dialog.Backdrop />
        <CategoryDialogContent
          category={category}
          onClose={() => setOpen(false)}
        />
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function CategoryDialogContent({
  category,
  onClose,
}: {
  category?: BlogCategory;
  onClose: () => void;
}) {
  const form = useForm<CategoryFormValues>({
    defaultValues: {
      name: category?.name ?? '',
      slug: category?.slug ?? '',
      description: category?.description ?? '',
      seo_title: category?.seo_title ?? '',
      seo_description: category?.seo_description ?? '',
      sort_order: category?.sort_order ?? 0,
    },
  });
  const createCategory = useMutation(createBlogCategoryOptions());
  const updateCategory = useMutation(
    updateBlogCategoryOptions(Number(category?.id ?? 0)),
  );
  const name = useWatch({control: form.control, name: 'name'}) ?? '';
  const slug = useWatch({control: form.control, name: 'slug'}) ?? '';
  const lastAutoSlug = useRef('');

  useEffect(() => {
    const nextSlug = slugifyBlogValue(name);
    if (!nextSlug) {
      return;
    }

    if (!slug || slug === lastAutoSlug.current) {
      form.setValue('slug', nextSlug, {shouldDirty: true});
      lastAutoSlug.current = nextSlug;
    }
  }, [form, name, slug]);

  const handleSubmit = (values: CategoryFormValues) => {
    const payload = normalizeCategoryPayload(values);
    const mutation = category ? updateCategory : createCategory;

    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success(
          category ? (
            <Trans message="Category updated" />
          ) : (
            <Trans message="Category created" />
          ),
        );
        onClose();
      },
      onError: err => onFormQueryError(err, form, [], true),
    });
  };

  const isPending = createCategory.isPending || updateCategory.isPending;

  return (
    <HookForm.Root form={form} onSubmit={handleSubmit}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>
            {category ? (
              <Trans message="Edit category" />
            ) : (
              <Trans message="New category" />
            )}
          </Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <Field.Group>
            <HookForm.Field name="name">
              <Field.Label>
                <Trans message="Name" />
              </Field.Label>
              <Input required />
              <Field.Error />
            </HookForm.Field>
            <HookForm.Field name="slug">
              <Field.Label>
                <Trans message="Slug" />
              </Field.Label>
              <Input required />
              <Field.Description>
                /blog/categoria/{slug || 'category-slug'}
              </Field.Description>
              <Field.Error />
            </HookForm.Field>
            <HookForm.Field name="sort_order">
              <Field.Label>
                <Trans message="Sort order" />
              </Field.Label>
              <Input type="number" min={0} max={999999} />
              <Field.Error />
            </HookForm.Field>
            <FormTextField
              name="description"
              inputElementType="textarea"
              rows={3}
              label={<Trans message="Description" />}
              maxLength={1000}
            />
            <FormTextField
              name="seo_title"
              label={<Trans message="SEO title" />}
              maxLength={160}
            />
            <FormTextField
              name="seo_description"
              inputElementType="textarea"
              rows={3}
              label={<Trans message="SEO description" />}
              maxLength={320}
            />
          </Field.Group>
        </Dialog.Body>
        <Dialog.Footer>
          <Dialog.CloseButton disabled={isPending}>
            <Trans message="Cancel" />
          </Dialog.CloseButton>
          <Button type="submit" disabled={isPending}>
            {category ? <Trans message="Save" /> : <Trans message="Create" />}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </HookForm.Root>
  );
}

function normalizeCategoryPayload(
  values: CategoryFormValues,
): CrupdateBlogCategoryBody {
  return {
    name: values.name,
    slug: slugifyBlogValue(values.slug || values.name),
    description: values.description || null,
    seo_title: values.seo_title || null,
    seo_description: values.seo_description || null,
    sort_order: values.sort_order === '' ? null : Number(values.sort_order),
  };
}

type DeleteBlogCategoryDialogProps = {
  categoryId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function DeleteBlogCategoryDialog({
  categoryId,
  open,
  onOpenChange,
}: DeleteBlogCategoryDialogProps) {
  const deleteCategory = useMutation(deleteBlogCategoryOptions());

  const handleDelete = () => {
    deleteCategory.mutate(categoryId, {
      onSuccess: () => {
        toast.success(<Trans message="Category deleted" />);
        onOpenChange(false);
      },
      onError: err => showHttpErrorToast(err),
    });
  };

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop />
        <AlertDialog.Content size="sm">
          <AlertDialog.Header>
            <AlertDialog.Title>
              <Trans message="Delete category" />
            </AlertDialog.Title>
            <AlertDialog.Description>
              <Trans message="Are you sure you want to delete this category?" />
            </AlertDialog.Description>
          </AlertDialog.Header>
          <AlertDialog.Footer>
            <AlertDialog.Cancel disabled={deleteCategory.isPending}>
              <Trans message="Cancel" />
            </AlertDialog.Cancel>
            <AlertDialog.Action
              color="danger"
              disabled={deleteCategory.isPending}
              onClick={handleDelete}
            >
              <Trans message="Delete" />
            </AlertDialog.Action>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
