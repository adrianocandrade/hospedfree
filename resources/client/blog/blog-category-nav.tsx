import {BlogCategory} from '@app/gen/schemas/blog-category';
import {PublicCategoryIcon} from '@app/landing/public-category-icon';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {BookOpenTextIcon} from 'lucide-react';
import {Link} from 'react-router';

type BlogCategoryNavProps = {
  categories: BlogCategory[];
  activeSlug?: string;
};

export function BlogCategoryNav({
  categories,
  activeSlug,
}: BlogCategoryNavProps) {
  const {trans} = useTrans();

  if (!categories.length) {
    return null;
  }

  return (
    <nav
      className="hf-editorial-category-nav"
      aria-label={trans({message: 'Categorias do blog'})}
    >
      <Link
        to="/blog"
        className="hf-editorial-category-link"
        aria-current={activeSlug ? undefined : 'page'}
      >
        <BookOpenTextIcon aria-hidden="true" />
        <Trans message="Todos os artigos" />
      </Link>
      {categories.map(category => {
        const count =
          category.published_posts_count ?? category.posts_count ?? undefined;

        return (
          <Link
            key={category.id}
            to={`/blog/categoria/${category.slug}`}
            className="hf-editorial-category-link"
            aria-current={activeSlug === category.slug ? 'page' : undefined}
          >
            <PublicCategoryIcon name={category.name} />
            <span>{category.name}</span>
            {count !== undefined ? (
              <span className="hf-editorial-count">{count}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
