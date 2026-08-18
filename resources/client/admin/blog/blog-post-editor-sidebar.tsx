import {listBlogCategoriesOptions} from '@app/admin/blog/blog-queries';
import {
  BlogPostFormValues,
  slugifyBlogValue,
} from '@app/admin/blog/blog-post-form';
import {CrupdateBlogPostBodyStatus} from '@app/gen/schemas/crupdate-blog-post-body-status';
import {UploadType} from '@app/site-config';
import {ImageSelector} from '@common/uploads/components/image-selector';
import {DashboardLayout} from '@common/ui/dashboard/dashboard-layout';
import {Sidebar} from '@common/ui/dashboard/sidebar';
import {Button} from '@shadcn/button/button';
import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Input} from '@shadcn/forms/input/input';
import {Select} from '@shadcn/forms/select/select';
import {Badge} from '@shadcn/badge/badge';
import {useSuspenseQuery} from '@tanstack/react-query';
import {FormDatePicker} from '@ui/forms/input-field/date/date-picker/date-picker';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Trans} from '@ui/i18n/trans';
import {FolderTreeIcon, TriangleAlertIcon} from 'lucide-react';
import {useEffect, useRef} from 'react';
import {useFormContext, useWatch} from 'react-hook-form';
import {Link} from 'react-router';

type BlogPostEditorSidebarProps = {
  originalSlug?: string;
};

export function BlogPostEditorSidebar({
  originalSlug,
}: BlogPostEditorSidebarProps) {
  const form = useFormContext<BlogPostFormValues>();
  const categoriesQuery = useSuspenseQuery(
    listBlogCategoriesOptions({per_page: 100}),
  );
  const categories = categoriesQuery.data.data ?? [];
  const title = useWatch({control: form.control, name: 'title'}) ?? '';
  const slug = useWatch({control: form.control, name: 'slug'}) ?? '';
  const status = useWatch({control: form.control, name: 'status'});
  const imageValue =
    useWatch({control: form.control, name: 'featured_image'}) ?? '';
  const lastAutoSlug = useRef('');

  useEffect(() => {
    const nextSlug = slugifyBlogValue(title);
    if (!nextSlug) {
      return;
    }

    if (!slug || slug === lastAutoSlug.current) {
      form.setValue('slug', nextSlug, {shouldDirty: true});
      lastAutoSlug.current = nextSlug;
    }
  }, [form, slug, title]);

  const slugChangedAfterPublish =
    originalSlug &&
    slug &&
    originalSlug !== slug &&
    status === CrupdateBlogPostBodyStatus.published;

  return (
    <Sidebar.Root side="right" width="w-84" className="border-s">
      <DashboardLayout.SectionHeader className="px-4">
        <DashboardLayout.SectionTitle className="text-base">
          <Trans message="Post settings" />
        </DashboardLayout.SectionTitle>
        <DashboardLayout.SidebarToggle sidebar="right" />
      </DashboardLayout.SectionHeader>
      <Sidebar.Content className="p-4">
        <Field.Group>
          <HookForm.Field name="status">
            <Field.Label>
              <Trans message="Status" />
            </Field.Label>
            <Select.Root>
              <Select.Trigger className="w-full">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value={CrupdateBlogPostBodyStatus.draft}>
                  <Trans message="Draft" />
                </Select.Item>
                <Select.Item value={CrupdateBlogPostBodyStatus.published}>
                  <Trans message="Published" />
                </Select.Item>
              </Select.Content>
            </Select.Root>
            <Field.Error />
          </HookForm.Field>

          <HookForm.Field name="blog_category_id">
            <Field.Label>
              <Trans message="Category" />
            </Field.Label>
            <Select.Root disabled={!categories.length}>
              <Select.Trigger className="w-full">
                <Select.Value
                  placeholder={<Trans message="Select category" />}
                />
              </Select.Trigger>
              <Select.Content>
                {categories.map(category => (
                  <Select.Item key={category.id} value={`${category.id}`}>
                    {category.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
            {!categories.length ? (
              <div className="flex flex-col gap-2 rounded-card-sm border bg-muted/40 p-3">
                <Field.Description>
                  <Trans message="Create a category before saving posts." />
                </Field.Description>
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<Link to="/admin/blog/categories" />}
                >
                  <FolderTreeIcon />
                  <Trans message="Create category" />
                </Button>
              </div>
            ) : null}
            <Field.Error />
          </HookForm.Field>

          <HookForm.Field name="slug">
            <Field.Label>
              <Trans message="Slug" />
            </Field.Label>
            <Input required />
            <Field.Description>/blog/{slug || 'post-slug'}</Field.Description>
            <Field.Error />
          </HookForm.Field>

          {slugChangedAfterPublish && (
            <div className="flex gap-2 rounded-card-sm border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
              <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
              <Trans message="Changing the slug of a published post changes its public URL. Redirect history is not available in this version." />
            </div>
          )}

          <FormDatePicker
            name="published_at"
            granularity="minute"
            label={<Trans message="Publish date" />}
            showCalendarFooter
          />

          <Field.Root name="featured_image">
            <Field.Label>
              <Trans message="Featured image" />
            </Field.Label>
            <ImageSelector.Square
              className="h-40 w-full"
              placeholderVariant="dropzone"
              uploadType={UploadType.articleImages}
              value={imageValue}
              onChange={value => {
                form.setValue('featured_image', value, {shouldDirty: true});
              }}
            />
            <Field.Error>
              {form.formState.errors.featured_image?.message}
            </Field.Error>
          </Field.Root>

          <Field.Separator>
            <Badge variant="outline">
              <Trans message="SEO" />
            </Badge>
          </Field.Separator>

          <FormTextField
            name="seo_title"
            label={<Trans message="SEO title" />}
            maxLength={160}
          />
          <FormTextField
            name="seo_description"
            inputElementType="textarea"
            rows={3}
            label={<Trans message="SEO description" />}
            maxLength={320}
          />
          <FormTextField
            name="excerpt"
            inputElementType="textarea"
            rows={4}
            label={<Trans message="Excerpt" />}
            maxLength={1000}
          />
        </Field.Group>
      </Sidebar.Content>
    </Sidebar.Root>
  );
}
