import {BlogCategoryNav} from '@app/blog/blog-category-nav';
import {blogIndexQueryOptions} from '@app/blog/blog-queries';
import {BlogPageHeader, BlogShell} from '@app/blog/blog-shell';
import {PublicBlogPostCard} from '@app/blog/public-blog-post-card';
import {ListPublicBlogPostsParams} from '@app/gen/schemas/list-public-blog-posts-params';
import {useShowGlobalLoadingBar} from '@common/core/use-show-global-loading-bar';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {Empty} from '@shadcn/empty/empty';
import {BackendPagination} from '@shadcn/table/utils/table-pagination';
import {TableSearchInput} from '@shadcn/table/utils/table-search-input';
import {useTableQueryState} from '@shadcn/table/utils/use-table-query-state';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {message} from '@ui/i18n/message';
import {NewspaperIcon} from 'lucide-react';

export function Component() {
  const {setQueryState, searchParams, isLoading, isFiltering} =
    useTableQueryState();
  const query = useSuspenseQuery(
    blogIndexQueryOptions(searchParams as ListPublicBlogPostsParams),
  );
  const posts = query.data.posts.data ?? [];

  useShowGlobalLoadingBar({isLoading});

  return (
    <BlogShell>
      <StaticPageTitle>
        <Trans message="Blog" />
      </StaticPageTitle>
      <BlogPageHeader
        title={
          <Trans message="Conteúdo para fortalecer sua presença digital" />
        }
        description={
          <Trans message="Guias, ideias e novidades sobre páginas de links, QR Codes, conteúdo e resultados." />
        }
      >
        <BlogCategoryNav categories={query.data.categories.data ?? []} />
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
              <BlogEmptyState isFiltering={isFiltering} />
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

function BlogEmptyState({isFiltering}: {isFiltering: boolean}) {
  return (
    <Empty.Root>
      <Empty.Header>
        <Empty.Media variant="icon">
          <NewspaperIcon />
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
            <Trans message="Tente buscar por outro termo." />
          ) : (
            <Trans message="Os novos conteúdos aparecerão aqui quando forem publicados." />
          )}
        </Empty.Description>
      </Empty.Header>
    </Empty.Root>
  );
}
