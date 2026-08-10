import {blogPostQueryOptions} from '@app/blog/blog-queries';
import {BlogShell} from '@app/blog/blog-shell';
import {Badge} from '@shadcn/badge/badge';
import {useSuspenseQuery} from '@tanstack/react-query';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {Trans} from '@ui/i18n/trans';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {ArrowLeftIcon, ClockIcon} from 'lucide-react';
import {Link} from 'react-router';

export function Component() {
  const {postSlug} = useRequiredParams(['postSlug']);
  const query = useSuspenseQuery(blogPostQueryOptions(postSlug));
  const post = query.data.post;

  return (
    <BlogShell>
      <StaticPageTitle>{post.seo_title || post.title}</StaticPageTitle>
      <header className="border-b border-[var(--lp-border)] bg-[var(--lp-surface-soft)]">
        <div className="lp-container py-10 md:py-14 lg:py-16">
          <Link
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--lp-primary)] hover:underline"
            to="/blog"
          >
            <ArrowLeftIcon className="size-4" />
            <Trans message="Voltar ao blog" />
          </Link>
          <div className="mt-8 flex flex-wrap items-center gap-2 text-sm text-[var(--lp-muted)]">
            {post.category ? (
              <Badge
                variant="secondary"
                render={<Link to={`/blog/categoria/${post.category.slug}`} />}
              >
                {post.category.name}
              </Badge>
            ) : null}
            {post.published_at ? (
              <FormattedDate date={post.published_at} />
            ) : null}
            <span className="inline-flex items-center gap-1">
              <ClockIcon className="size-3.5" />
              <Trans
                message="[one :count min de leitura|other :count min de leitura]"
                values={{count: post.reading_time_minutes}}
              />
            </span>
          </div>
          <h1 className="mt-5 max-w-4xl text-4xl font-[var(--lp-font-display)] font-semibold tracking-[-0.03em] text-balance text-[var(--lp-ink)] md:text-5xl lg:text-6xl">
            {post.title}
          </h1>
          {post.excerpt ? (
            <p className="mt-5 max-w-[68ch] text-lg leading-8 text-[var(--lp-muted)]">
              {post.excerpt}
            </p>
          ) : null}
          {post.author?.name ? (
            <div className="mt-5 text-sm text-[var(--lp-muted)]">
              <Trans
                message="Por :author"
                values={{author: post.author.name}}
              />
            </div>
          ) : null}
        </div>
      </header>

      <article className="mx-auto flex w-full max-w-4xl flex-col px-4 py-10 md:px-6 md:py-14 lg:py-16">
        {post.featured_image ? (
          <img
            src={post.featured_image}
            alt=""
            className="mb-10 aspect-video w-full rounded-2xl object-cover md:mb-12"
          />
        ) : null}

        <div
          className="mx-auto prose prose-lg w-full max-w-3xl dark:prose-invert prose-headings:tracking-[-0.02em] prose-a:text-[var(--lp-primary)]"
          dangerouslySetInnerHTML={{__html: post.body ?? ''}}
        />
      </article>
    </BlogShell>
  );
}
