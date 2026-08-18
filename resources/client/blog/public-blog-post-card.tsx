import {BlogPost} from '@app/gen/schemas/blog-post';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {Trans} from '@ui/i18n/trans';
import {ArrowRightIcon, ClockIcon, NewspaperIcon} from 'lucide-react';
import {Link} from 'react-router';

export function PublicBlogFeaturedPost({post}: {post: BlogPost}) {
  return (
    <article className="hf-editorial-feature">
      <div className="hf-editorial-feature-media">
        {post.featured_image ? (
          <img
            src={post.featured_image}
            alt=""
            decoding="async"
            fetchPriority="high"
          />
        ) : (
          <div className="hf-editorial-feature-placeholder">
            <NewspaperIcon aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="hf-editorial-feature-copy">
        <BlogPostMeta post={post} />
        <h2>{post.title}</h2>
        {post.excerpt ? <p>{post.excerpt}</p> : null}
        <Link className="hf-editorial-inline-link" to={`/blog/${post.slug}`}>
          <Trans message="Ler artigo em destaque" />
          <ArrowRightIcon aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

export function PublicBlogPostCard({post}: {post: BlogPost}) {
  return (
    <article className="hf-editorial-card">
      <Link to={`/blog/${post.slug}`} className="block h-full">
        <div className="hf-editorial-card-media">
          {post.featured_image ? (
            <img
              src={post.featured_image}
              alt=""
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="hf-editorial-card-placeholder">
              <NewspaperIcon aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="hf-editorial-card-copy">
          <BlogPostMeta post={post} />
          <h3>{post.title}</h3>
          {post.excerpt ? <p>{post.excerpt}</p> : null}
          <span className="hf-editorial-inline-link">
            <Trans message="Ler artigo" />
            <ArrowRightIcon aria-hidden="true" />
          </span>
        </div>
      </Link>
    </article>
  );
}

export function BlogPostMeta({post}: {post: BlogPost}) {
  return (
    <div className="hf-editorial-meta">
      {post.category ? (
        <span className="hf-editorial-category-label">
          {post.category.name}
        </span>
      ) : null}
      {post.published_at ? (
        <span>
          <FormattedDate date={post.published_at} />
        </span>
      ) : null}
      <span>
        <ClockIcon aria-hidden="true" />
        <Trans
          message="[one :count min de leitura|other :count min de leitura]"
          values={{count: post.reading_time_minutes}}
        />
      </span>
    </div>
  );
}
