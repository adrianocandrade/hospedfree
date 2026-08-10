import {BlogCategoryNav} from '@app/blog/blog-category-nav';
import {blogCategoryQueryOptions} from '@app/blog/blog-queries';
import {BlogPageHeader, BlogShell} from '@app/blog/blog-shell';
import {PublicBlogPostCard} from '@app/blog/public-blog-post-card';
import {ListPublicBlogCategoryPostsParams} from '@app/gen/schemas/list-public-blog-category-posts-params';
import {useShowGlobalLoadingBar} from '@common/core/use-show-global-loading-bar';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {Empty} from '@shadcn/empty/empty';
import {BackendPagination} from '@shadcn/table/utils/table-pagination';
import {TableSearchInput} from '@shadcn/table/utils/table-search-input';
import {useTableQueryState} from '@shadcn/table/utils/use-table-query-state';
import {useSuspenseQuery} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {FolderTreeIcon} from 'lucide-react';

export function Component() {
  const {categorySlug} = useRequiredParams(['categorySlug']);
  const {setQueryState, searchParams, isLoading, isFiltering} =
    useTableQueryState();
  const query = useSuspenseQuery(
    blogCategoryQueryOptions(
      categorySlug,
      searchParams as ListPublicBlogCategoryPostsParams,
    ),
  );
  const posts = query.data.posts.data ?? [];
  const category = query.data.category;

  useShowGlobalLoadingBar({isLoading});

  return (
    <BlogShell>
      <StaticPageTitle>{category.seo_title || category.name}</StaticPageTitle>
      <BlogPageHeader
        title={category.name}
        description={category.description || undefined}
      >
        <BlogCategoryNav
          categories={query.data.categories.data ?? []}
          activeSlug={category.slug}
        />
      </BlogPageHeader>

      <div className="lp-container py-10 md:py-14 lg:py-16">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <TableSearchInput
            className="w-full max-w-md"
            placeholder={message('Buscar artigos...')}
          />
        </div>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map(post => (
            <PublicBlogPostCard key={post.id} post={post} />
          ))}
          {posts.length === 0 ? (
            <div className="md:col-span-2 lg:col-span-3">
              <CategoryEmptyState isFiltering={isFiltering} />
            </div>
          ) : null}
        </section>
        <div className="mt-10">
          <BackendPagination
            response={query.data.posts}
            onPageChange={page => setQueryState({page})}
            onPageSizeChange={perPage => setQueryState({per_page: perPage})}
          />
        </div>
      </div>
    </BlogShell>
  );
}

function CategoryEmptyState({isFiltering}: {isFiltering: boolean}) {
  return (
    <Empty.Root>
      <Empty.Header>
        <Empty.Media variant="icon">
          <FolderTreeIcon />
        </Empty.Media>
        <Empty.Title>
          {isFiltering ? (
            <Trans message="Nenhum artigo encontrado" />
          ) : (
            <Trans message="Nenhum artigo nesta categoria" />
          )}
        </Empty.Title>
        <Empty.Description>
          {isFiltering ? (
            <Trans message="Tente buscar por outro termo." />
          ) : (
            <Trans message="Os artigos publicados nesta categoria aparecerão aqui." />
          )}
        </Empty.Description>
      </Empty.Header>
    </Empty.Root>
  );
}
