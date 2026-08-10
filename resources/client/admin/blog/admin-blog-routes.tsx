import {
  listBlogCategoriesOptions,
  listBlogPostsOptions,
  retrieveBlogPostOptions,
} from '@app/admin/blog/blog-queries';
import {authGuard} from '@common/auth/guards/auth-route';
import {queryClient} from '@common/http/query-client';
import {searchParamsFromUrl} from '@ui/utils/urls/search-params-from-url';
import {RouteObject} from 'react-router';

export const adminBlogRoutes: Record<string, RouteObject> = {
  index: {
    path: 'blog',
    lazy: () => import('@app/admin/blog/blog-posts-page'),
    shouldRevalidate: () => false,
    loader: async ({request}) => {
      const redirect = authGuard({permission: 'blog.update'});
      if (redirect) return redirect;

      await Promise.all([
        queryClient.ensureQueryData(
          listBlogPostsOptions(searchParamsFromUrl(request.url)),
        ),
        queryClient.ensureQueryData(
          listBlogCategoriesOptions({per_page: 100}),
        ),
      ]);
    },
  },
  categories: {
    path: 'blog/categories',
    lazy: () => import('@app/admin/blog/blog-categories-page'),
    shouldRevalidate: () => false,
    loader: async ({request}) => {
      const redirect = authGuard({permission: 'blog.update'});
      if (redirect) return redirect;

      await queryClient.ensureQueryData(
        listBlogCategoriesOptions(searchParamsFromUrl(request.url)),
      );
    },
  },
  create: {
    path: 'blog/new',
    loader: async () => {
      const redirect = authGuard({permission: 'blog.update'});
      if (redirect) return redirect;

      await queryClient.ensureQueryData(
        listBlogCategoriesOptions({per_page: 100}),
      );
    },
    lazy: () => import('@app/admin/blog/create-blog-post-page'),
  },
  update: {
    path: 'blog/:postId/edit',
    lazy: () => import('@app/admin/blog/edit-blog-post-page'),
    loader: async ({params}) => {
      const redirect = authGuard({permission: 'blog.update'});
      if (redirect) return redirect;

      await Promise.all([
        queryClient.ensureQueryData(retrieveBlogPostOptions(params.postId!)),
        queryClient.ensureQueryData(
          listBlogCategoriesOptions({per_page: 100}),
        ),
      ]);
    },
  },
};
