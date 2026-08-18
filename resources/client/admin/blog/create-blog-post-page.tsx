import {
  createBlogPostOptions,
  listBlogCategoriesOptions,
} from '@app/admin/blog/blog-queries';
import {BlogPostEditorSidebar} from '@app/admin/blog/blog-post-editor-sidebar';
import {
  BlogPostFormValues,
  normalizeBlogPostPayload,
} from '@app/admin/blog/blog-post-form';
import {CrupdateBlogPostBodyStatus} from '@app/gen/schemas/crupdate-blog-post-body-status';
import {UploadType} from '@app/site-config';
import {ArticleEditor} from '@common/article-editor/article-editor-page';
import {onFormQueryError} from '@common/http/errors/on-form-query-error';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {Breadcrumb} from '@shadcn/breadcrumb/breadcrumb';
import {Button} from '@shadcn/button/button';
import {toast} from '@shadcn/toast/toast';
import {useMutation, useSuspenseQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {FolderTreeIcon} from 'lucide-react';
import {FormProvider, useForm} from 'react-hook-form';
import {Link} from 'react-router';

export function Component() {
  const navigate = useNavigate();
  const categoriesQuery = useSuspenseQuery(
    listBlogCategoriesOptions({per_page: 100}),
  );
  const categories = categoriesQuery.data.data ?? [];
  const createPost = useMutation(createBlogPostOptions());
  const form = useForm<BlogPostFormValues>({
    defaultValues: {
      title: '',
      slug: '',
      excerpt: '',
      body: '',
      featured_image: '',
      seo_title: '',
      seo_description: '',
      status: CrupdateBlogPostBodyStatus.draft,
      published_at: null,
      blog_category_id: categories[0]?.id ? `${categories[0].id}` : '',
    },
  });

  const handleSave = () => {
    createPost.mutate(normalizeBlogPostPayload(form.getValues()), {
      onSuccess: post => {
        toast.success(<Trans message="Post created" />);
        navigate(`../${post.data.id}/edit`, {relative: 'path'});
      },
      onError: err => onFormQueryError(err, form, [], true),
    });
  };

  const saveButton = categories.length ? (
    <Button
      color="primary"
      size="sm"
      onClick={handleSave}
      disabled={createPost.isPending}
    >
      {createPost.isPending ? (
        <Trans message="Creating..." />
      ) : (
        <Trans message="Create" />
      )}
    </Button>
  ) : (
    <Button
      variant="outline"
      size="sm"
      nativeButton={false}
      render={<Link to="/admin/blog/categories" />}
    >
      <FolderTreeIcon />
      <Trans message="Create category" />
    </Button>
  );

  const breadCrumb = (
    <Breadcrumb.Root className="text-xl">
      <Breadcrumb.Item>
        <Breadcrumb.Link to=".." relative="path">
          <Trans message="Blog" />
        </Breadcrumb.Link>
      </Breadcrumb.Item>
      <Breadcrumb.Separator />
      <Breadcrumb.Item>
        <Breadcrumb.Page>
          <Trans message="New post" />
        </Breadcrumb.Page>
      </Breadcrumb.Item>
    </Breadcrumb.Root>
  );

  return (
    <>
      <StaticPageTitle>
        <Trans message="New blog post" />
      </StaticPageTitle>
      <FormProvider {...form}>
        <ArticleEditor
          imageUploadType={UploadType.articleImages}
          saveButton={saveButton}
          title={breadCrumb}
          rightSidebar={<BlogPostEditorSidebar />}
          onChange={value => {
            form.setValue('body', value, {shouldDirty: true});
          }}
        />
      </FormProvider>
    </>
  );
}
