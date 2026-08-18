import {BlogCategoryNav} from '@app/blog/blog-category-nav';
import {blogIndexQueryOptions} from '@app/blog/blog-queries';
import {BlogPageHeader, BlogSeo, BlogShell} from '@app/blog/blog-shell';
import {
  PublicBlogFeaturedPost,
  PublicBlogPostCard,
} from '@app/blog/public-blog-post-card';
import {ListPublicBlogPostsParams} from '@app/gen/schemas/list-public-blog-posts-params';
import {
  PublicEditorialEmpty,
  PublicEditorialPagination,
  PublicEditorialSearch,
} from '@app/landing/public-editorial-components';
import {useShowGlobalLoadingBar} from '@common/core/use-show-global-loading-bar';
import {useTableQueryState} from '@shadcn/table/utils/use-table-query-state';
import {useSuspenseQuery} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {NewspaperIcon} from 'lucide-react';

export function Component() {
  const {queryState, setQueryState, searchParams, isLoading, isFiltering} =
    useTableQueryState();
  const query = useSuspenseQuery(
    blogIndexQueryOptions(searchParams as ListPublicBlogPostsParams),
  );
  const posts = query.data.posts.data ?? [];
  const showFeatured = !isFiltering && query.data.posts.meta.current_page === 1;
  const featuredPost = showFeatured ? posts[0] : undefined;
  const remainingPosts = featuredPost ? posts.slice(1) : posts;

  useShowGlobalLoadingBar({isLoading});

  return (
    <BlogShell>
      <BlogSeo
        title="Blog"
        description="Guias práticos da HospedFree sobre hospedagem, domínios, arquivos, bancos MySQL, SSL e publicação de sites."
        canonicalPath="/blog"
      />
      <BlogPageHeader
        title={<Trans message="Guias para publicar e manter seu site" />}
        description={
          <Trans message="Orientações diretas sobre hospedagem, domínios, arquivos, bancos de dados, segurança e as ferramentas usadas para colocar um projeto no ar." />
        }
      >
        <div className="space-y-5">
          <PublicEditorialSearch
            value={queryState.query}
            onSearch={value => setQueryState({query: value}, {resetPage: true})}
            placeholder={message('Pesquisar no blog')}
          />
          <BlogCategoryNav categories={query.data.categories.data ?? []} />
        </div>
      </BlogPageHeader>

      <section className="hf-shell hf-editorial-section" aria-busy={isLoading}>
        {featuredPost ? (
          <div className="mb-12 md:mb-16">
            <div className="hf-editorial-section-header">
              <div>
                <h2>
                  <Trans message="Leitura recomendada" />
                </h2>
                <p>
                  <Trans message="Um ponto de partida para entender melhor sua hospedagem e publicar com segurança." />
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
                <Trans message="Resultados da pesquisa" />
              ) : (
                <Trans message="Artigos recentes" />
              )}
            </h2>
            <p>
              {isFiltering ? (
                <Trans message="Conteúdos relacionados ao termo pesquisado." />
              ) : (
                <Trans message="Novos guias e orientações para cuidar do seu site em cada etapa." />
              )}
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
          <BlogEmptyState isFiltering={isFiltering} />
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

function BlogEmptyState({isFiltering}: {isFiltering: boolean}) {
  return (
    <PublicEditorialEmpty
      icon={<NewspaperIcon aria-hidden="true" />}
      title={
        isFiltering ? (
          <Trans message="Nenhum artigo encontrado" />
        ) : (
          <Trans message="Nenhum artigo publicado ainda" />
        )
      }
      description={
        isFiltering ? (
          <Trans message="Tente pesquisar por outro termo ou escolha uma categoria." />
        ) : (
          <Trans message="Os novos conteúdos aparecerão aqui quando forem publicados." />
        )
      }
    />
  );
}
