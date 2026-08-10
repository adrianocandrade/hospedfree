import {BiolinkAssetPickerDialog} from '@app/dashboard/biolink/biolink-editor/assets/biolink-asset-picker-dialog';
import {useBiolinkEditorStore} from '@app/dashboard/biolink/biolink-editor/biolink-editor-store';
import {updateBiolinkLinkOptions} from '@app/dashboard/biolink/biolinks-queries';
import {BiolinkLink} from '@app/gen/schemas/biolink-link';
import {CrupdateBiolinkLinkBody} from '@app/gen/schemas/crupdate-biolink-link-body';
import {UploadType} from '@app/site-config';
import {showHttpErrorToast} from '@common/http/errors/show-http-error-toast';
import {ImageSelector} from '@common/uploads/components/image-selector';
import {FileUploadProvider} from '@common/uploads/uploader/file-upload-provider';
import {useControlledState} from '@react-stately/utils';
import {Button} from '@shadcn/button/button';
import {Dialog} from '@shadcn/dialog/dialog';
import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {toast} from '@shadcn/toast/toast';
import {ColorField} from '@ui/color-picker/color-field';
import {useMutation} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {cn} from '@ui/utils/cn';
import {ImageIcon, PaletteIcon, SparklesIcon, XIcon} from 'lucide-react';
import {ReactNode} from 'react';
import {useForm, useWatch} from 'react-hook-form';

type LinkDesignStyle = {
  backgroundColor?: string | null;
  textColor?: string | null;
  borderColor?: string | null;
  iconColor?: string | null;
};

type LinkDesignForm = CrupdateBiolinkLinkBody & {
  thumbnail_type?: 'image' | 'asset' | 'none' | null;
  thumbnail_asset?: string | null;
  style?: LinkDesignStyle | null;
};

type DesignedBiolinkLink = BiolinkLink & {
  thumbnail_type?: 'image' | 'asset' | 'none' | null;
  thumbnail_asset?: string | null;
  style?: LinkDesignStyle | null;
};

type Props = {
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  link: DesignedBiolinkLink;
};

export function LinkThumbnailDialog({
  children,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  link,
}: Props) {
  const [open, setOpen] = useControlledState(openProp, false, onOpenChangeProp);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {children}
      <Dialog.Portal>
        <Dialog.Backdrop />
        <DialogContent link={link} onClose={() => setOpen(false)} />
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DialogContent({
  link,
  onClose,
}: {
  link: DesignedBiolinkLink;
  onClose: () => void;
}) {
  const biolink = useBiolinkEditorStore(s => s.biolink);
  const overrideContent = useBiolinkEditorStore(s => s.overrideContent);
  const form = useForm<LinkDesignForm>({
    defaultValues: {
      image: link.image,
      thumbnail_type:
        link.thumbnail_type ?? (link.thumbnail_asset ? 'asset' : 'image'),
      thumbnail_asset: link.thumbnail_asset,
      style: link.style ?? {},
    },
  });
  const imageValue = useWatch({control: form.control, name: 'image'}) ?? '';
  const thumbnailType =
    useWatch({control: form.control, name: 'thumbnail_type'}) ?? 'image';
  const thumbnailAsset = useWatch({
    control: form.control,
    name: 'thumbnail_asset',
  });
  const style = useWatch({control: form.control, name: 'style'});
  const updateLink = useMutation(updateBiolinkLinkOptions(biolink.id, link.id));

  const handleSubmit = (values: LinkDesignForm) => {
    const payload: LinkDesignForm = {
      ...values,
      thumbnail_asset:
        values.thumbnail_type === 'asset' ? values.thumbnail_asset : null,
      style: normalizeStyle(values.style),
    };

    updateLink.mutate(payload as CrupdateBiolinkLinkBody, {
      onSuccess: response => {
        overrideContent(response.data.content);
        toast.success(<Trans message="Button design updated" />);
        onClose();
      },
      onError: err => showHttpErrorToast(err),
    });
  };

  return (
    <FileUploadProvider>
      <HookForm.Root form={form} onSubmit={handleSubmit}>
        <Dialog.Content className="sm:max-w-2xl">
          <Dialog.Header>
            <Dialog.Title>
              <PaletteIcon />
              <Trans message="Button design" />
            </Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <Field.Group>
              <div>
                <Field.Title>
                  <Trans message="Button media" />
                </Field.Title>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <ThumbnailTypeButton
                    active={thumbnailType === 'image'}
                    onClick={() =>
                      form.setValue('thumbnail_type', 'image', {
                        shouldDirty: true,
                      })
                    }
                  >
                    <ImageIcon />
                    <Trans message="Image" />
                  </ThumbnailTypeButton>
                  <ThumbnailTypeButton
                    active={thumbnailType === 'asset'}
                    onClick={() =>
                      form.setValue('thumbnail_type', 'asset', {
                        shouldDirty: true,
                      })
                    }
                  >
                    <SparklesIcon />
                    <Trans message="Asset" />
                  </ThumbnailTypeButton>
                  <ThumbnailTypeButton
                    active={thumbnailType === 'none'}
                    onClick={() =>
                      form.setValue('thumbnail_type', 'none', {
                        shouldDirty: true,
                      })
                    }
                  >
                    <XIcon />
                    <Trans message="None" />
                  </ThumbnailTypeButton>
                </div>
              </div>

              {thumbnailType === 'image' ? (
                <ImageSelector.Square
                  className="w-full"
                  cropDimensions={{width: 800, height: 500}}
                  placeholderVariant="dropzone"
                  uploadType={UploadType.linkImages}
                  value={imageValue}
                  onChange={value => {
                    form.setValue('image', value, {
                      shouldDirty: true,
                    });
                  }}
                />
              ) : null}

              {thumbnailType === 'asset' ? (
                <div>
                  <Field.Title>
                    <Trans message="Selected asset" />
                  </Field.Title>
                  <div className="mt-2 flex items-center gap-3">
                    <BiolinkAssetPickerDialog
                      value={thumbnailAsset}
                      categories={['icons', 'emoji', 'threeD']}
                      title={<Trans message="Choose button asset" />}
                      onSelect={path => {
                        form.setValue('thumbnail_asset', path, {
                          shouldDirty: true,
                        });
                      }}
                    >
                      <Dialog.Trigger render={<Button variant="outline" />}>
                        <SparklesIcon />
                        {thumbnailAsset ? (
                          <Trans message="Change asset" />
                        ) : (
                          <Trans message="Choose asset" />
                        )}
                      </Dialog.Trigger>
                    </BiolinkAssetPickerDialog>
                    {thumbnailAsset ? (
                      <div className="flex size-14 items-center justify-center rounded-card-sm border bg-accent p-2">
                        <img
                          src={thumbnailAsset}
                          alt=""
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <Field.Title>
                    <Trans message="Color overrides" />
                  </Field.Title>
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    onClick={() =>
                      form.setValue('style', {}, {shouldDirty: true})
                    }
                  >
                    <Trans message="Use theme" />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <ColorField
                    label={<Trans message="Background" />}
                    value={style?.backgroundColor || '#111111'}
                    onChange={value => setStyleValue('backgroundColor', value)}
                  />
                  <ColorField
                    label={<Trans message="Text" />}
                    value={style?.textColor || '#ffffff'}
                    onChange={value => setStyleValue('textColor', value)}
                  />
                  <ColorField
                    label={<Trans message="Border" />}
                    value={style?.borderColor || '#111111'}
                    onChange={value => setStyleValue('borderColor', value)}
                  />
                  <ColorField
                    label={<Trans message="Icon" />}
                    value={style?.iconColor || '#111111'}
                    onChange={value => setStyleValue('iconColor', value)}
                  />
                </div>
              </div>
            </Field.Group>
          </Dialog.Body>
          <Dialog.Footer>
            <Dialog.CloseButton>
              <Trans message="Cancel" />
            </Dialog.CloseButton>
            <Button
              type="submit"
              disabled={updateLink.isPending || !form.formState.isDirty}
            >
              <Trans message="Save" />
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </HookForm.Root>
    </FileUploadProvider>
  );

  function setStyleValue(key: keyof LinkDesignStyle, value: string) {
    form.setValue(
      'style',
      {
        ...(style ?? {}),
        [key]: value,
      },
      {shouldDirty: true},
    );
  }
}

function ThumbnailTypeButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex h-16 flex-col items-center justify-center gap-1 rounded-card-sm border bg-card text-xs outline-offset-2 outline-primary focus-visible:outline-2',
        active ? 'border-primary ring-2 ring-primary/20' : 'border-border',
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function normalizeStyle(
  style?: LinkDesignStyle | null,
): LinkDesignStyle | null {
  if (!style) {
    return null;
  }

  const next = Object.fromEntries(
    Object.entries(style).filter(([, value]) => value),
  ) as LinkDesignStyle;

  return Object.keys(next).length ? next : null;
}
