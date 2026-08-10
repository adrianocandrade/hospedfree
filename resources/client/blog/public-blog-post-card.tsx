import {BlogPost} from '@app/gen/schemas/blog-post';
import {Badge} from '@shadcn/badge/badge';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {Trans} from '@ui/i18n/trans';
import {ArrowUpRightIcon, ClockIcon, NewspaperIcon} from 'lucide-react';
import {Link} from 'react-router';

export function PublicBlogPostCard({post}: {post: BlogPost}) {
  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl bg-[var(--lp-surface)] ring-1 ring-[var(--lp-border)] transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[var(--lp-shadow-md)]">
      <Link
        to={`/blog/${post.slug}`}
        className="block aspect-[16/10] overflow-hidden bg-[var(--lp-blue-soft)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--lp-primary)]"
        aria-label={post.title}
      >
        {post.featured_image ? (
          <img
            src={post.featured_image}
            alt=""
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <NewspaperIcon className="size-10 text-[var(--lp-primary)]" />
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--lp-muted)]">
          {post.category ? (
            <Badge variant="secondary">{post.category.name}</Badge>
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
        <h2 className="mt-4 text-xl font-semibold tracking-[-0.02em] text-balance text-[var(--lp-ink)]">
          <Link
            to={`/blog/${post.slug}`}
            className="hover:text-[var(--lp-primary)]"
          >
            {post.title}
          </Link>
        </h2>
        {post.excerpt ? (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--lp-muted)]">
            {post.excerpt}
          </p>
        ) : null}
        <Link
          to={`/blog/${post.slug}`}
          className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-medium text-[var(--lp-primary)] hover:underline"
        >
          <Trans message="Ler artigo" />
          <ArrowUpRightIcon className="size-4" />
        </Link>
      </div>
    </article>
  );
}
