import {BlogPostCard} from '@app/admin/blog/blog-post-card';
import {
  listBlogCategoriesOptions,
  listBlogPostsOptions,
} from '@app/admin/blog/blog-queries';
import {ListBlogPostsParams} from '@app/gen/schemas/list-blog-posts-params';
import {useShowGlobalLoadingBar} from '@common/core/use-show-global-loading-bar';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {DashboardLayout} from '@common/ui/dashboard/dashboard-layout';
import {Button} from '@shadcn/button/button';
import {Empty} from '@shadcn/empty/empty';
import {BackendPagination} from '@shadcn/table/utils/table-pagination';
import {TableSearchInput} from '@shadcn/table/utils/table-search-input';
import {TableSortButton} from '@shadcn/table/utils/table-sort-button';
import {useTableQueryState} from '@shadcn/table/utils/use-table-query-state';
import {Toggle} from '@shadcn/toggle';
import {ToggleGroup} from '@shadcn/toggle-group/toggle-group';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {parseAsString} from 'nuqs';
import {FolderTreeIcon, NewspaperIcon, PlusIcon} from 'lucide-react';
import {Link} from 'react-router';

export function Component() {
  const {queryState, setQueryState, isFiltering, searchParams, isLoading} =
    useTableQueryState({
      parsers: {
        status: parseAsString.withDefault(''),
      },
    });
  const query = useSuspenseQuery(
    listBlogPostsOptions(searchParams as ListBlogPostsParams),
  );
  const categoriesQuery = useSuspenseQuery(
    listBlogCategoriesOptions({per_page: 100}),
  );
  const posts = query.data.data ?? [];

  useShowGlobalLoadingBar({isLoading});

  return (
    <DashboardLayout.MainSection>
      <StaticPageTitle>
        <Trans message="Blog" />
      </StaticPageTitle>
      <DashboardLayout.SectionHeader>
        <DashboardLayout.SidebarToggle />
        <DashboardLayout.SectionTitle>
          <h1>
            <Trans message="Blog" />
          </h1>
        </DashboardLayout.SectionTitle>
        <Button variant="outline" nativeButton={false} render={<Link to="categories" />}>
          <FolderTreeIcon />
          <Trans message="Categories" />
        </Button>
        <NewBlogPostButton />
      </DashboardLayout.SectionHeader>
      <DashboardLayout.SectionContent>
        <DashboardLayout.SectionContentHeader>
          <TableSearchInput className="mr-auto" debounce={false} />
          <TableSortButton
            sortDescriptor={queryState.sort}
            onSortChange={sort => setQueryState({sort})}
            sortOptions={sortOptions}
          />
          <ToggleGroup
            variant="segmented"
            buttonVariant="ghost"
            value={[queryState.status || 'all']}
            onValueChange={value => {
              setQueryState({
                status: value[0] === 'all' ? null : value[0],
              });
            }}
          >
            <Toggle value="all">
              <Trans message="All" />
            </Toggle>
            <Toggle value="published">
              <Trans message="Published" />
            </Toggle>
            <Toggle value="draft">
              <Trans message="Drafts" />
            </Toggle>
          </ToggleGroup>
        </DashboardLayout.SectionContentHeader>
        <DashboardLayout.SectionScrollContainer className="flex flex-col gap-4">
          {posts.map(post => (
            <BlogPostCard key={post.id} post={post} />
          ))}
          <BackendPagination
            response={query.data}
            onPageChange={page => setQueryState({page})}
            onPageSizeChange={perPage => setQueryState({per_page: perPage})}
          />
          {posts.length === 0 && (
            <BlogPostsEmptyState
              isFiltering={isFiltering}
              hasCategories={!!categoriesQuery.data.data.length}
            />
          )}
        </DashboardLayout.SectionScrollContainer>
      </DashboardLayout.SectionContent>
    </DashboardLayout.MainSection>
  );
}

const sortOptions = [
  {
    label: <Trans message="Publish date" />,
    orderBy: 'published_at',
    isDefault: true,
  },
  {
    label: <Trans message="Last updated" />,
    orderBy: 'updated_at',
  },
  {
    label: <Trans message="Title" />,
    orderBy: 'title',
  },
];

function NewBlogPostButton() {
  return (
    <Button
      color="primary"
      nativeButton={false}
      render={<Link to="new" />}
    >
      <PlusIcon />
      <Trans message="New post" />
    </Button>
  );
}

function BlogPostsEmptyState({
  isFiltering,
  hasCategories,
}: {
  isFiltering: boolean;
  hasCategories: boolean;
}) {
  return (
    <Empty.Root>
      <Empty.Header>
        <Empty.Media variant="icon">
          <NewspaperIcon />
        </Empty.Media>
        <Empty.Title>
          {isFiltering ? (
            <Trans message="No matching posts" />
          ) : (
            <Trans message="No posts have been created yet" />
          )}
        </Empty.Title>
        <Empty.Description>
          {isFiltering ? (
            <Trans message="Try another search query or different filters." />
          ) : hasCategories ? (
            <Trans message="Create the first article for the public blog." />
          ) : (
            <Trans message="Create a category before adding posts." />
          )}
        </Empty.Description>
      </Empty.Header>
      {!isFiltering && hasCategories ? (
        <Empty.Content>
          <NewBlogPostButton />
        </Empty.Content>
      ) : null}
    </Empty.Root>
  );
}
