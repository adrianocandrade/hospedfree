import {
  blogIndexQueryOptions,
  blogPostQueryOptions,
} from '@app/blog/blog-queries';
import {BlogPostMeta} from '@app/blog/public-blog-post-card';
import {BlogSeo, BlogShell} from '@app/blog/blog-shell';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {useQuery, useSuspenseQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {BookOpenIcon, ChevronRightIcon, LifeBuoyIcon} from 'lucide-react';
import {Link} from 'react-router';

export function Component() {
  const {postSlug} = useRequiredParams(['postSlug']);
  const query = useSuspenseQuery(blogPostQueryOptions(postSlug));
  const recentPosts = useQuery(blogIndexQueryOptions({per_page: 4}));
  const post = query.data.post;
  const related = (recentPosts.data?.posts.data ?? [])
    .filter(item => item.slug !== post.slug)
    .slice(0, 3);
  const description =
    post.seo_description ||
    post.excerpt ||
    truncate(stripHtml(post.body ?? ''), 155) ||
    post.title;

  return (
    <BlogShell>
      <BlogSeo
        title={post.seo_title || post.title}
        description={description}
        canonicalPath={`/blog/${post.slug}`}
        ogType="article"
        image={post.featured_image}
      />

      <header className="hf-editorial-article-header">
        <div className="hf-shell">
          <nav className="hf-editorial-breadcrumbs" aria-label="Breadcrumb">
            <Link to="/">
              <Trans message="Início" />
            </Link>
            <ChevronRightIcon aria-hidden="true" />
            <Link to="/blog">
              <Trans message="Blog" />
            </Link>
            {post.category ? (
              <>
                <ChevronRightIcon aria-hidden="true" />
                <Link to={`/blog/categoria/${post.category.slug}`}>
                  {post.category.name}
                </Link>
              </>
            ) : null}
          </nav>
          <BlogPostMeta post={post} />
          <h1 className="hf-editorial-heading hf-editorial-heading--article mt-5">
            {post.title}
          </h1>
          {post.excerpt ? (
            <p className="hf-editorial-lead">{post.excerpt}</p>
          ) : null}
          {post.author?.name ? (
            <p className="mt-5 text-sm text-[#898da5]">
              <Trans
                message="Por :author"
                values={{author: post.author.name}}
              />
            </p>
          ) : null}
        </div>
      </header>

      <section className="hf-shell hf-editorial-section">
        <div className="hf-editorial-article-layout">
          <article className="hf-editorial-article-body">
            {post.featured_image ? (
              <img
                src={post.featured_image}
                alt=""
                className="hf-editorial-article-image"
                decoding="async"
                fetchPriority="high"
              />
            ) : null}

            <div
              className="hf-editorial-prose prose prose-lg max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{__html: post.body ?? ''}}
            />

            <div className="mt-12 border-t border-[var(--hf-editorial-border)] pt-8">
              <Link className="hf-editorial-inline-link mt-0" to="/faq">
                <BookOpenIcon aria-hidden="true" />
                <Trans message="Consultar a Central de Ajuda" />
              </Link>
            </div>
          </article>

          <aside className="space-y-4">
            {related.length ? (
              <section className="hf-editorial-aside-card">
                <h2>
                  <Trans message="Continuar lendo" />
                </h2>
                <div className="hf-editorial-related-list">
                  {related.map(item => (
                    <Link key={item.id} to={`/blog/${item.slug}`}>
                      <span>{item.title}</span>
                      <ChevronRightIcon aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="hf-editorial-aside-card">
              <span className="hf-help-sidebar-icon" aria-hidden="true">
                <LifeBuoyIcon />
              </span>
              <h2 className="mt-4">
                <Trans message="Precisa de uma resposta direta?" />
              </h2>
              <p>
                <Trans message="Pesquise tutoriais sobre domínio, arquivos, bancos, SSL e publicação na Central de Ajuda." />
              </p>
              <Link className="hf-editorial-inline-link" to="/faq">
                <Trans message="Encontrar uma orientação" />
                <ChevronRightIcon aria-hidden="true" />
              </Link>
            </section>
          </aside>
        </div>
      </section>
    </BlogShell>
  );
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(value: string, limit: number): string {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit - 1).trim()}…`;
}
