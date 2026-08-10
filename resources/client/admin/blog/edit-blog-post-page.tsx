import {
  retrieveBlogPostOptions,
  updateBlogPostOptions,
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
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {Breadcrumb} from '@shadcn/breadcrumb/breadcrumb';
import {Button} from '@shadcn/button/button';
import {toast} from '@shadcn/toast/toast';
import {useMutation, useSuspenseQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {FormProvider, useForm} from 'react-hook-form';

export function Component() {
  const {postId} = useRequiredParams(['postId']);
  const query = useSuspenseQuery(retrieveBlogPostOptions(postId));
  const post = query.data.data;

  const navigate = useNavigate();
  const updatePost = useMutation(updateBlogPostOptions(Number(postId)));
  const form = useForm<BlogPostFormValues>({
    defaultValues: {
      title: post.title ?? '',
      slug: post.slug ?? '',
      excerpt: post.excerpt ?? '',
      body: post.body ?? '',
      featured_image: post.featured_image ?? '',
      seo_title: post.seo_title ?? '',
      seo_description: post.seo_description ?? '',
      status:
        post.status === CrupdateBlogPostBodyStatus.published
          ? CrupdateBlogPostBodyStatus.published
          : CrupdateBlogPostBodyStatus.draft,
      published_at: post.published_at ?? null,
      blog_category_id: post.blog_category_id ? `${post.blog_category_id}` : '',
    },
  });

  const handleSave = () => {
    updatePost.mutate(normalizeBlogPostPayload(form.getValues()), {
      onSuccess: () => {
        toast.success(<Trans message="Post updated" />);
        navigate('../..', {relative: 'path'});
      },
      onError: err => onFormQueryError(err, form, [], true),
    });
  };

  const saveButton = (
    <Button
      color="primary"
      size="sm"
      onClick={handleSave}
      disabled={updatePost.isPending}
    >
      <Trans message="Save" />
    </Button>
  );

  const breadCrumb = (
    <Breadcrumb.Root className="text-xl">
      <Breadcrumb.Item>
        <Breadcrumb.Link to="../.." relative="path">
          <Trans message="Blog" />
        </Breadcrumb.Link>
      </Breadcrumb.Item>
      <Breadcrumb.Separator />
      <Breadcrumb.Item>
        <Breadcrumb.Page>
          <Trans message="Edit" />
        </Breadcrumb.Page>
      </Breadcrumb.Item>
    </Breadcrumb.Root>
  );

  return (
    <>
      <StaticPageTitle>{post.title}</StaticPageTitle>
      <FormProvider {...form}>
        <ArticleEditor
          title={breadCrumb}
          saveButton={saveButton}
          imageUploadType={UploadType.articleImages}
          initialContent={post.body}
          rightSidebar={<BlogPostEditorSidebar originalSlug={post.slug} />}
          onChange={value => {
            form.setValue('body', value, {shouldDirty: true});
          }}
        />
      </FormProvider>
    </>
  );
}
