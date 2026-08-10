import {
  createBlogCategory,
  createBlogPost,
  deleteBlogCategory,
  deleteBlogPost,
  listBlogCategories,
  listBlogPosts,
  retrieveBlogCategory,
  retrieveBlogPost,
  updateBlogCategory,
  updateBlogPost,
} from '@app/gen/blog';
import {ListBlogCategoriesParams} from '@app/gen/schemas/list-blog-categories-params';
import {ListBlogPostsParams} from '@app/gen/schemas/list-blog-posts-params';
import {queryClient} from '@common/http/query-client';
import {mutationOptions, queryOptions} from '@tanstack/react-query';
import {FirstParam, SecondParam} from '@ui/utils/ts/extract-params';

export const blogPostsBaseKey = ['blog', 'posts'];
export const blogCategoriesBaseKey = ['blog', 'categories'];

export const listBlogPostsOptions = (params?: ListBlogPostsParams) => {
  return queryOptions({
    queryKey: [...blogPostsBaseKey, params],
    queryFn: () => listBlogPosts(params),
  });
};

export const retrieveBlogPostOptions = (id: number | string) => {
  return queryOptions({
    queryKey: [...blogPostsBaseKey, `${id}`],
    queryFn: () => retrieveBlogPost(Number(id)),
  });
};

export const createBlogPostOptions = () => {
  return mutationOptions({
    mutationFn: (body: FirstParam<typeof createBlogPost>) =>
      createBlogPost(body),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: blogPostsBaseKey});
      queryClient.invalidateQueries({queryKey: blogCategoriesBaseKey});
    },
  });
};

export const updateBlogPostOptions = (id: number) => {
  return mutationOptions({
    mutationFn: (body: SecondParam<typeof updateBlogPost>) =>
      updateBlogPost(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: blogPostsBaseKey});
      queryClient.invalidateQueries({queryKey: blogCategoriesBaseKey});
    },
  });
};

export const deleteBlogPostOptions = () => {
  return mutationOptions({
    mutationFn: (id: number) => deleteBlogPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: blogPostsBaseKey});
      queryClient.invalidateQueries({queryKey: blogCategoriesBaseKey});
    },
  });
};

export const listBlogCategoriesOptions = (
  params?: ListBlogCategoriesParams,
) => {
  return queryOptions({
    queryKey: [...blogCategoriesBaseKey, params],
    queryFn: () => listBlogCategories(params),
  });
};

export const retrieveBlogCategoryOptions = (id: number | string) => {
  return queryOptions({
    queryKey: [...blogCategoriesBaseKey, `${id}`],
    queryFn: () => retrieveBlogCategory(Number(id)),
  });
};

export const createBlogCategoryOptions = () => {
  return mutationOptions({
    mutationFn: (body: FirstParam<typeof createBlogCategory>) =>
      createBlogCategory(body),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: blogCategoriesBaseKey});
    },
  });
};

export const updateBlogCategoryOptions = (id: number) => {
  return mutationOptions({
    mutationFn: (body: SecondParam<typeof updateBlogCategory>) =>
      updateBlogCategory(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: blogCategoriesBaseKey});
      queryClient.invalidateQueries({queryKey: blogPostsBaseKey});
    },
  });
};

export const deleteBlogCategoryOptions = () => {
  return mutationOptions({
    mutationFn: (id: number) => deleteBlogCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: blogCategoriesBaseKey});
    },
  });
};
