import {BlogCategory} from '@app/gen/schemas/blog-category';
import {Button} from '@shadcn/button/button';
import {Trans} from '@ui/i18n/trans';
import {cn} from '@ui/utils/cn';
import {Link} from 'react-router';

type BlogCategoryNavProps = {
  categories: BlogCategory[];
  activeSlug?: string;
};

export function BlogCategoryNav({
  categories,
  activeSlug,
}: BlogCategoryNavProps) {
  if (!categories.length) {
    return null;
  }

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Categorias do blog">
      <Button
        variant={activeSlug ? 'outline' : 'default'}
        size="sm"
        nativeButton={false}
        render={<Link to="/blog" />}
      >
        <Trans message="Todos os artigos" />
      </Button>
      {categories.map(category => (
        <Button
          key={category.id}
          variant={activeSlug === category.slug ? 'default' : 'outline'}
          size="sm"
          nativeButton={false}
          className={cn(activeSlug !== category.slug && 'bg-background')}
          render={<Link to={`/blog/categoria/${category.slug}`} />}
        >
          {category.name}
        </Button>
      ))}
    </nav>
  );
}
