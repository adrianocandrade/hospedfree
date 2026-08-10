import {CrupdateBlogPostBody} from '@app/gen/schemas/crupdate-blog-post-body';
import {CrupdateBlogPostBodyStatus} from '@app/gen/schemas/crupdate-blog-post-body-status';

export type BlogPostFormValues = Omit<
  CrupdateBlogPostBody,
  'blog_category_id'
> & {
  blog_category_id?: number | string;
};

export function slugifyBlogValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 220);
}

export function normalizeBlogPostPayload(
  values: BlogPostFormValues,
): CrupdateBlogPostBody {
  return {
    blog_category_id: Number(values.blog_category_id),
    title: values.title,
    slug: slugifyBlogValue(values.slug || values.title),
    excerpt: values.excerpt || null,
    body: values.body,
    featured_image: values.featured_image || null,
    seo_title: values.seo_title || null,
    seo_description: values.seo_description || null,
    status: values.status || CrupdateBlogPostBodyStatus.draft,
    published_at: values.published_at || null,
  };
}
