import {BlogCategoryNav} from '@app/blog/blog-category-nav';
import {blogCategoryQueryOptions} from '@app/blog/blog-queries';
import {BlogPageHeader, BlogSeo, BlogShell} from '@app/blog/blog-shell';
import {
  PublicBlogFeaturedPost,
  PublicBlogPostCard,
} from '@app/blog/public-blog-post-card';
import {ListPublicBlogCategoryPostsParams} from '@app/gen/schemas/list-public-blog-category-posts-params';
import {
  PublicEditorialEmpty,
  PublicEditorialPagination,
  PublicEditorialSearch,
} from '@app/landing/public-editorial-components';
import {useShowGlobalLoadingBar} from '@common/core/use-show-global-loading-bar';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {useTableQueryState} from '@shadcn/table/utils/use-table-query-state';
import {useSuspenseQuery} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {FolderTreeIcon} from 'lucide-react';

export function Component() {
  const {categorySlug} = useRequiredParams(['categorySlug']);
  const {queryState, setQueryState, searchParams, isLoading, isFiltering} =
    useTableQueryState();
  const query = useSuspenseQuery(
    blogCategoryQueryOptions(
      categorySlug,
      searchParams as ListPublicBlogCategoryPostsParams,
    ),
  );
  const posts = query.data.posts.data ?? [];
  const category = query.data.category;
  const showFeatured = !isFiltering && query.data.posts.meta.current_page === 1;
  const featuredPost = showFeatured ? posts[0] : undefined;
  const remainingPosts = featuredPost ? posts.slice(1) : posts;
  const description =
    category.seo_description ||
    category.description ||
    `Artigos da HospedFree sobre ${category.name}.`;

  useShowGlobalLoadingBar({isLoading});

  return (
    <BlogShell>
      <BlogSeo
        title={category.seo_title || category.name}
        description={description}
        canonicalPath={`/blog/categoria/${category.slug}`}
      />
      <BlogPageHeader
        title={category.name}
        description={category.description || undefined}
      >
        <div className="space-y-5">
          <PublicEditorialSearch
            value={queryState.query}
            onSearch={value => setQueryState({query: value}, {resetPage: true})}
            placeholder={message('Pesquisar nesta categoria')}
          />
          <BlogCategoryNav
            categories={query.data.categories.data ?? []}
            activeSlug={category.slug}
          />
        </div>
      </BlogPageHeader>

      <section className="hf-shell hf-editorial-section" aria-busy={isLoading}>
        {featuredPost ? (
          <div className="mb-12 md:mb-16">
            <div className="hf-editorial-section-header">
              <div>
                <h2>
                  <Trans message="Comece por aqui" />
                </h2>
                <p>
                  <Trans message="Uma orientação selecionada para entrar neste tema." />
                </p>
              </div>
            </div>
            <PublicBlogFeaturedPost post={featuredPost} />
          </div>
        ) : null}

        <div className="hf-editorial-section-header">
          <div>
            <h2>
              {isFiltering ? (
                <Trans message="Resultados nesta categoria" />
              ) : (
                <Trans message="Mais artigos" />
              )}
            </h2>
            <p>
              <Trans message="Continue explorando orientações relacionadas a este assunto." />
            </p>
          </div>
        </div>

        {remainingPosts.length ? (
          <div className="hf-editorial-card-grid">
            {remainingPosts.map(post => (
              <PublicBlogPostCard key={post.id} post={post} />
            ))}
          </div>
        ) : featuredPost ? null : (
          <CategoryEmptyState isFiltering={isFiltering} />
        )}

        <PublicEditorialPagination
          currentPage={query.data.posts.meta.current_page}
          hasPrevious={query.data.posts.links.prev !== null}
          hasNext={query.data.posts.links.next !== null}
          onPageChange={page => setQueryState({page})}
          disabled={isLoading}
        />
      </section>
    </BlogShell>
  );
}

function CategoryEmptyState({isFiltering}: {isFiltering: boolean}) {
  return (
    <PublicEditorialEmpty
      icon={<FolderTreeIcon aria-hidden="true" />}
      title={
        isFiltering ? (
          <Trans message="Nenhum artigo encontrado" />
        ) : (
          <Trans message="Nenhum artigo nesta categoria" />
        )
      }
      description={
        isFiltering ? (
          <Trans message="Tente pesquisar por outro termo." />
        ) : (
          <Trans message="Os artigos publicados nesta categoria aparecerão aqui." />
        )
      }
    />
  );
}
