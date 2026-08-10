import {
  listPublicBlogCategories,
  listPublicBlogCategoryPosts,
  listPublicBlogPosts,
  retrievePublicBlogPost,
} from '@app/gen/blog';
import {BlogCategory} from '@app/gen/schemas/blog-category';
import {BlogPost} from '@app/gen/schemas/blog-post';
import {ListPublicBlogCategories200} from '@app/gen/schemas/list-public-blog-categories200';
import {ListPublicBlogCategoryPosts200} from '@app/gen/schemas/list-public-blog-category-posts200';
import {ListPublicBlogCategoryPostsParams} from '@app/gen/schemas/list-public-blog-category-posts-params';
import {ListPublicBlogPosts200} from '@app/gen/schemas/list-public-blog-posts200';
import {ListPublicBlogPostsParams} from '@app/gen/schemas/list-public-blog-posts-params';
import {queryOptions} from '@tanstack/react-query';
import {BootstrapData} from '@ui/bootstrap-data/bootstrap-data';
import {getBootstrapData} from '@ui/bootstrap-data/bootstrap-data-store';

export type BlogIndexData = {
  posts: ListPublicBlogPosts200;
  categories: ListPublicBlogCategories200;
};

export type BlogCategoryData = {
  category: BlogCategory;
  posts: ListPublicBlogCategoryPosts200;
  categories: ListPublicBlogCategories200;
};

export type BlogPostData = {
  post: BlogPost;
};

type BootstrapLoaders = Required<Required<BootstrapData>['loaders']>;

export const blogIndexQueryOptions = (params?: ListPublicBlogPostsParams) => {
  return queryOptions({
    queryKey: ['blog', 'index', params],
    queryFn: async (): Promise<BlogIndexData> => {
      const [posts, categories] = await Promise.all([
        listPublicBlogPosts(params),
        listPublicBlogCategories(),
      ]);
      return {posts, categories};
    },
    initialData: () => {
      const data = getBootstrapData().loaders?.blogIndex as
        | BootstrapLoaders['blogIndex']
        | undefined;
      if (data) {
        return data;
      }
    },
  });
};

export const blogCategoryQueryOptions = (
  categorySlug: string,
  params?: ListPublicBlogCategoryPostsParams,
) => {
  return queryOptions({
    queryKey: ['blog', 'category', categorySlug, params],
    queryFn: async (): Promise<BlogCategoryData> => {
      const [posts, categories] = await Promise.all([
        listPublicBlogCategoryPosts(categorySlug, params),
        listPublicBlogCategories(),
      ]);
      const category = categories.data.find(item => item.slug === categorySlug);
      if (!category) {
        throw new Error('Blog category not found');
      }
      return {category, posts, categories};
    },
    initialData: () => {
      const data = getBootstrapData().loaders?.blogCategory as
        | BootstrapLoaders['blogCategory']
        | undefined;
      if (data?.category.slug === categorySlug) {
        return data;
      }
    },
  });
};

export const blogPostQueryOptions = (postSlug: string) => {
  return queryOptions({
    queryKey: ['blog', 'post', postSlug],
    queryFn: async (): Promise<BlogPostData> => {
      const response = await retrievePublicBlogPost(postSlug);
      return {post: response.data};
    },
    initialData: () => {
      const data = getBootstrapData().loaders?.blogPost as
        | BootstrapLoaders['blogPost']
        | undefined;
      if (data?.post.slug === postSlug) {
        return data;
      }
    },
  });
};
