import {deleteBlogPostOptions} from '@app/admin/blog/blog-queries';
import {BlogPost} from '@app/gen/schemas/blog-post';
import {showHttpErrorToast} from '@common/http/errors/show-http-error-toast';
import {AlertDialog} from '@shadcn/alert-dialog/alert-dialog';
import {Badge} from '@shadcn/badge/badge';
import {Button} from '@shadcn/button/button';
import {Dropdown} from '@shadcn/dropdown/dropdown';
import {Item} from '@shadcn/item/item';
import {toast} from '@shadcn/toast/toast';
import {useMutation} from '@tanstack/react-query';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {Trans} from '@ui/i18n/trans';
import {DeleteIcon} from '@ui/icons/material/Delete';
import {EditIcon} from '@ui/icons/material/Edit';
import {useSettings} from '@ui/settings/use-settings';
import {
  CalendarClockIcon,
  EllipsisIcon,
  EyeIcon,
  NewspaperIcon,
} from 'lucide-react';
import {useState} from 'react';
import {Link} from 'react-router';

export function BlogPostCard({post}: {post: BlogPost}) {
  const {base_url} = useSettings();
  const isPublished = post.status === 'published';

  return (
    <Item.Root variant="outline">
      <Item.Media align="center" className="size-12 overflow-hidden rounded-sm">
        {post.featured_image ? (
          <img
            src={post.featured_image}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center rounded-sm border bg-muted">
            <NewspaperIcon className="size-5 text-muted-foreground" />
          </div>
        )}
      </Item.Media>
      <Item.Content>
        <Item.Title>
          {isPublished ? (
            <a
              className="hover:underline"
              target="_blank"
              href={`${base_url}/blog/${post.slug}`}
            >
              {post.title}
            </a>
          ) : (
            post.title
          )}
        </Item.Title>
        <Item.Description className="flex flex-wrap items-center gap-2">
          <StatusBadge status={post.status} />
          {post.category?.name ? <span>{post.category.name}</span> : null}
          {post.published_at ? (
            <span className="inline-flex items-center gap-1">
              <CalendarClockIcon className="size-3.5" />
              <FormattedDate date={post.published_at} />
            </span>
          ) : null}
        </Item.Description>
      </Item.Content>
      <Item.Actions>
        <BlogPostActionsButton post={post} />
      </Item.Actions>
    </Item.Root>
  );
}

function StatusBadge({status}: {status: string}) {
  return (
    <Badge variant={status === 'published' ? 'positive' : 'secondary'}>
      {status === 'published' ? (
        <Trans message="Published" />
      ) : (
        <Trans message="Draft" />
      )}
    </Badge>
  );
}

function BlogPostActionsButton({post}: {post: BlogPost}) {
  const {base_url} = useSettings();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const isPublished = post.status === 'published';

  return (
    <>
      <DeleteBlogPostDialog
        postId={Number(post.id)}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
      <Dropdown.Root>
        <Dropdown.Trigger render={<Button variant="ghost" size="icon" />}>
          <EllipsisIcon />
        </Dropdown.Trigger>
        <Dropdown.Content align="end">
          {isPublished ? (
            <Dropdown.LinkItem
              href={`${base_url}/blog/${post.slug}`}
              target="_blank"
            >
              <EyeIcon />
              <Trans message="Preview" />
            </Dropdown.LinkItem>
          ) : null}
          <Dropdown.LinkItem render={<Link to={`${post.id}/edit`} />}>
            <EditIcon />
            <Trans message="Edit" />
          </Dropdown.LinkItem>
          <Dropdown.Item
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <DeleteIcon />
            <Trans message="Delete" />
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Root>
    </>
  );
}

type DeleteBlogPostDialogProps = {
  postId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function DeleteBlogPostDialog({
  postId,
  open,
  onOpenChange,
}: DeleteBlogPostDialogProps) {
  const deletePost = useMutation(deleteBlogPostOptions());

  const handleDelete = () => {
    deletePost.mutate(postId, {
      onSuccess: () => {
        toast.success(<Trans message="Post deleted" />);
        onOpenChange(false);
      },
      onError: err => showHttpErrorToast(err),
    });
  };

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop />
        <AlertDialog.Content size="sm">
          <AlertDialog.Header>
            <AlertDialog.Title>
              <Trans message="Delete post" />
            </AlertDialog.Title>
            <AlertDialog.Description>
              <Trans message="Are you sure you want to delete this post?" />
            </AlertDialog.Description>
          </AlertDialog.Header>
          <AlertDialog.Footer>
            <AlertDialog.Cancel disabled={deletePost.isPending}>
              <Trans message="Cancel" />
            </AlertDialog.Cancel>
            <AlertDialog.Action
              color="danger"
              disabled={deletePost.isPending}
              onClick={handleDelete}
            >
              <Trans message="Delete" />
            </AlertDialog.Action>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
