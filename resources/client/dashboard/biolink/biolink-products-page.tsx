import {
  biolinkProductsDestroy,
  biolinkProductsIndex,
  biolinkProductsStore,
  biolinkProductsUpdate,
} from '@app/gen/biolink-products';
import {previewBiolinkProductImport} from '@app/gen/biolinks';
import type {BiolinkProduct} from '@app/gen/schemas/biolink-product';
import type {CrupdateBiolinkProductRequest} from '@app/gen/schemas/crupdate-biolink-product-request';
import type {PreviewBiolinkProductImport200} from '@app/gen/schemas/preview-biolink-product-import200';
import {UploadType} from '@app/site-config';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {ImageSelector} from '@common/uploads/components/image-selector';
import {FileUploadProvider} from '@common/uploads/uploader/file-upload-provider';
import {Accordion} from '@shadcn/accordion/accordion';
import {Alert} from '@shadcn/alert/alert';
import {Button} from '@shadcn/button/button';
import {Dialog} from '@shadcn/dialog/dialog';
import {Checkbox} from '@shadcn/forms/checkbox/checkbox';
import {Input} from '@shadcn/forms/input/input';
import {Textarea} from '@shadcn/forms/textarea/textarea';
import {Skeleton} from '@shadcn/skeleton/skeleton';
import {Tabs} from '@shadcn/tabs/tabs';
import {toast} from '@shadcn/toast/toast';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  AlertTriangleIcon,
  ImageIcon,
  LinkIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  ShoppingBagIcon,
  Trash2Icon,
} from 'lucide-react';
import {FormEvent, useState} from 'react';

type ProductForm = CrupdateBiolinkProductRequest;
type CreationMethod = 'import' | 'manual';
type DialogStep = 'choose' | 'form';

const emptyProduct: ProductForm = {
  name: '',
  description: '',
  image: '',
  price: null,
  compare_price: null,
  currency: 'BRL',
  badge: '',
  rating: null,
  stock_label: '',
  url: '',
  active: true,
  position: 0,
};

export function Component() {
  const {trans} = useTrans();
  const {biolinkId} = useRequiredParams(['biolinkId']);
  const id = Number(biolinkId);
  const client = useQueryClient();
  const products = useQuery({
    queryKey: ['biolink-products', id],
    queryFn: () => biolinkProductsIndex(id),
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BiolinkProduct | null>(null);
  const [form, setForm] = useState<ProductForm>({...emptyProduct});
  const [step, setStep] = useState<DialogStep>('choose');
  const [creationMethod, setCreationMethod] =
    useState<CreationMethod>('import');
  const [importUrl, setImportUrl] = useState('');
  const [importPreview, setImportPreview] =
    useState<PreviewBiolinkProductImport200 | null>(null);

  const invalidate = () =>
    client.invalidateQueries({queryKey: ['biolink-products', id]});
  const save = useMutation({
    mutationFn: () =>
      editing
        ? biolinkProductsUpdate(id, Number(editing.id), form)
        : biolinkProductsStore(id, form),
    onSuccess: () => {
      invalidate();
      closeEditor();
      toast.success(<Trans message="Product saved" />);
    },
    onError: () =>
      toast.error(
        <Trans message="Could not save the product. Check the fields and try again." />,
      ),
  });
  const remove = useMutation({
    mutationFn: (productId: number) => biolinkProductsDestroy(id, productId),
    onSuccess: () => {
      invalidate();
      toast.success(<Trans message="Product removed" />);
    },
  });
  const importProduct = useMutation({
    mutationFn: () => previewBiolinkProductImport(id, {url: importUrl.trim()}),
    onSuccess: preview => {
      const product = preview.product;
      setImportPreview(preview);
      setForm({
        ...emptyProduct,
        name: product.name ?? '',
        description: product.description ?? '',
        image: product.image ?? '',
        price: product.price,
        compare_price: product.compare_price,
        currency: product.currency ?? 'BRL',
        rating: product.rating,
        stock_label: product.stock_label ?? '',
        url: product.url,
      });
      setStep('form');
    },
    onError: () => {
      toast.error(
        <Trans message="Could not read this product link. Check the URL or continue manually." />,
      );
    },
  });

  const closeEditor = () => {
    setOpen(false);
    setEditing(null);
    setForm({...emptyProduct});
    setImportUrl('');
    setImportPreview(null);
    setStep('choose');
    setCreationMethod('import');
  };
  const startCreate = () => {
    setEditing(null);
    setForm({...emptyProduct});
    setImportUrl('');
    setImportPreview(null);
    setCreationMethod('import');
    setStep('choose');
    setOpen(true);
  };
  const startManual = () => {
    setForm({
      ...emptyProduct,
      url: importUrl.trim(),
    });
    setImportPreview(null);
    setStep('form');
  };
  const startEdit = (product: BiolinkProduct) => {
    setEditing(product);
    setImportPreview(null);
    setForm({
      name: product.name,
      description: product.description || '',
      image: product.image || '',
      price: product.price ? Number(product.price) : null,
      compare_price: product.compare_price
        ? Number(product.compare_price)
        : null,
      currency: product.currency || 'BRL',
      badge: product.badge || '',
      rating: product.rating ? Number(product.rating) : null,
      stock_label: product.stock_label || '',
      url: product.url || '',
      active: product.active !== false,
      position: Number(product.position) || 0,
    });
    setStep('form');
    setOpen(true);
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    save.mutate();
  };

  return (
    <FileUploadProvider>
      <>
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">
                <Trans message="Products" />
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                <Trans message="Manage the products available to your page and reuse them in commerce widgets." />
              </p>
            </div>
            <Button onClick={startCreate}>
              <PlusIcon />
              <Trans message="Add product" />
            </Button>
          </header>

          <div className="grid gap-3">
            {products.isLoading ? <ProductListSkeleton /> : null}
            {(products.data?.data ?? []).map(product => (
              <article
                key={product.id}
                className="flex items-center gap-4 rounded-card border bg-card p-4"
              >
                <ProductImage
                  src={product.image}
                  alt=""
                  className="size-16 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-medium">{product.name}</h2>
                    {product.badge ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {product.badge}
                      </span>
                    ) : null}
                    {product.active === false ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        <Trans message="Inactive" />
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {product.description || <Trans message="No description" />}
                  </p>
                  <p className="mt-2 text-sm font-medium">
                    {product.compare_price &&
                    product.price &&
                    Number(product.compare_price) > Number(product.price) ? (
                      <span className="mr-2 text-xs font-normal text-muted-foreground line-through">
                        {formatPrice(product.compare_price, product.currency)}
                      </span>
                    ) : null}
                    {formatPrice(product.price, product.currency)}
                  </p>
                  {product.stock_label || product.rating ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[
                        product.stock_label,
                        product.rating && `${product.rating}/5`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label={trans({message: 'Edit product'})}
                    onClick={() => startEdit(product)}
                  >
                    <PencilIcon />
                  </Button>
                  <Button
                    variant="outline"
                    color="danger"
                    size="icon-sm"
                    aria-label={trans({message: 'Remove product'})}
                    onClick={() => remove.mutate(Number(product.id))}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </article>
            ))}
            {!products.isLoading && (products.data?.data ?? []).length === 0 ? (
              <div className="rounded-card border border-dashed p-12 text-center text-sm text-muted-foreground">
                <ShoppingBagIcon className="mx-auto mb-3 size-7" />
                <Trans message="No products created yet. Add a product to reuse it in your page widgets." />
              </div>
            ) : null}
          </div>
        </div>

        <Dialog.Root
          open={open}
          onOpenChange={isOpen => {
            if (!isOpen) closeEditor();
          }}
        >
          <Dialog.Portal>
            <Dialog.Backdrop />
            <Dialog.Content className="sm:max-w-2xl">
              <Dialog.Header>
                <Dialog.Title>
                  <ShoppingBagIcon />
                  {editing ? (
                    <Trans message="Edit product" />
                  ) : step === 'form' && importPreview ? (
                    <Trans message="Review imported product" />
                  ) : (
                    <Trans message="Add product" />
                  )}
                </Dialog.Title>
                <Dialog.Description>
                  {step === 'choose' ? (
                    <Trans message="Import the public details from a product link or start with an empty form." />
                  ) : (
                    <Trans message="Review the essential fields now. Optional details can be completed later." />
                  )}
                </Dialog.Description>
              </Dialog.Header>

              {step === 'choose' ? (
                <ProductCreationChooser
                  method={creationMethod}
                  onMethodChange={setCreationMethod}
                  importUrl={importUrl}
                  onImportUrlChange={setImportUrl}
                  isImporting={importProduct.isPending}
                  onImport={() => importProduct.mutate()}
                  onManual={startManual}
                />
              ) : (
                <form onSubmit={submit} className="contents">
                  <Dialog.Body className="grid gap-4">
                    {importPreview ? (
                      <ImportedProductSummary preview={importPreview} />
                    ) : null}
                    <ProductFormFields
                      form={form}
                      onChange={setForm}
                      missingFields={importPreview?.missing_fields ?? []}
                      imported={!!importPreview}
                    />
                  </Dialog.Body>
                  <Dialog.Footer>
                    <Dialog.CloseButton>
                      <Trans message="Cancel" />
                    </Dialog.CloseButton>
                    <Button
                      type="submit"
                      disabled={save.isPending || !form.name.trim()}
                    >
                      <Trans message="Save product" />
                    </Button>
                  </Dialog.Footer>
                </form>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </>
    </FileUploadProvider>
  );
}

interface ProductCreationChooserProps {
  method: CreationMethod;
  onMethodChange: (method: CreationMethod) => void;
  importUrl: string;
  onImportUrlChange: (value: string) => void;
  isImporting: boolean;
  onImport: () => void;
  onManual: () => void;
}

function ProductCreationChooser({
  method,
  onMethodChange,
  importUrl,
  onImportUrlChange,
  isImporting,
  onImport,
  onManual,
}: ProductCreationChooserProps) {
  const {trans} = useTrans();

  return (
    <>
      <Dialog.Body className="grid gap-5">
        <Tabs.Root
          value={method}
          onValueChange={value => onMethodChange(value as CreationMethod)}
        >
          <Tabs.List className="w-full">
            <Tabs.Tab value="import" className="flex-1">
              <LinkIcon />
              <Trans message="Import from link" />
            </Tabs.Tab>
            <Tabs.Tab value="manual" className="flex-1">
              <PencilIcon />
              <Trans message="Create manually" />
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="import" className="pt-4">
            <form
              className="grid gap-4"
              onSubmit={event => {
                event.preventDefault();
                onImport();
              }}
            >
              <label className="grid gap-1.5 text-sm font-medium">
                <Trans message="Product URL" />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    type="url"
                    value={importUrl}
                    onChange={event => onImportUrlChange(event.target.value)}
                    placeholder={trans({
                      message:
                        'Paste a product link from a marketplace or store',
                    })}
                    className="flex-1"
                    autoFocus
                  />
                  <Button
                    type="submit"
                    disabled={isImporting || !importUrl.trim()}
                  >
                    <SearchIcon />
                    <Trans message="Find product" />
                  </Button>
                </div>
              </label>
              <p className="text-xs text-muted-foreground">
                <Trans message="We read public structured metadata only. The product is not saved until you review and confirm it." />
              </p>
              {isImporting ? <ProductImportSkeleton /> : null}
            </form>
          </Tabs.Panel>
          <Tabs.Panel value="manual" className="pt-4">
            <div className="flex flex-col items-start gap-4 rounded-card border bg-muted/30 p-4">
              <div>
                <h3 className="font-medium">
                  <Trans message="Start with the essential fields" />
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  <Trans message="Add the image, name, price and link first. Extra commercial details stay collapsed." />
                </p>
              </div>
              <Button type="button" variant="outline" onClick={onManual}>
                <PencilIcon />
                <Trans message="Open manual form" />
              </Button>
            </div>
          </Tabs.Panel>
        </Tabs.Root>
      </Dialog.Body>
      <Dialog.Footer>
        <Dialog.CloseButton>
          <Trans message="Cancel" />
        </Dialog.CloseButton>
      </Dialog.Footer>
    </>
  );
}

function ProductImportSkeleton() {
  return (
    <div
      className="flex items-center gap-3 rounded-card border p-3"
      aria-live="polite"
    >
      <Skeleton className="size-16 shrink-0" />
      <div className="grid flex-1 gap-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <span className="sr-only">
        <Trans message="Looking up product details" />
      </span>
    </div>
  );
}

function ImportedProductSummary({
  preview,
}: {
  preview: PreviewBiolinkProductImport200;
}) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-3 rounded-card border bg-muted/20 p-3">
        <ProductImage
          src={preview.product.image}
          alt=""
          className="size-16 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">
            {preview.product.name || <Trans message="Name not found" />}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {preview.domain}
          </p>
          <p className="mt-1 text-sm font-medium">
            {formatPrice(preview.product.price, preview.product.currency)}
          </p>
        </div>
      </div>
      {preview.warnings.length ? (
        <Alert.Root variant="warning" fillStyle="subtleFill">
          <AlertTriangleIcon />
          <Alert.Title>
            <Trans message="Some details need your attention" />
          </Alert.Title>
          <Alert.Description>
            <ul className="list-disc space-y-1 pl-4">
              {preview.warnings.map(warning => (
                <li key={warning.code}>
                  <ProductImportWarning code={warning.code} />
                </li>
              ))}
            </ul>
          </Alert.Description>
        </Alert.Root>
      ) : null}
      <Alert.Root>
        <AlertTriangleIcon />
        <Alert.Title>
          <Trans message="Check before saving" />
        </Alert.Title>
        <Alert.Description>
          <Trans message="Price and availability are a one-time snapshot and will not update automatically." />
        </Alert.Description>
      </Alert.Root>
    </div>
  );
}

interface ProductFormFieldsProps {
  form: ProductForm;
  onChange: (form: ProductForm) => void;
  missingFields: string[];
  imported: boolean;
}

function ProductFormFields({
  form,
  onChange,
  missingFields,
  imported,
}: ProductFormFieldsProps) {
  const isMissing = (field: string) => missingFields.includes(field);

  return (
    <>
      <section className="grid gap-4">
        <div>
          <h3 className="font-medium">
            <Trans message="Essential information" />
          </h3>
          <p className="text-xs text-muted-foreground">
            <Trans message="Complete these fields to create a useful product card." />
          </p>
        </div>

        <div className="grid items-start gap-4 sm:grid-cols-[160px_1fr]">
          <div className="grid gap-2 text-sm font-medium">
            <Trans message="Product image" />
            <ImageSelector.Square
              value={form.image}
              uploadType={UploadType.biolinkMedia}
              cropDimensions={{width: 800, height: 800}}
              placeholderVariant="icon"
              onChange={image => onChange({...form, image})}
            />
          </div>
          <div className="grid gap-3">
            <label className="grid gap-1.5 text-sm font-medium">
              <Trans message="Image URL" />
              <Input
                type="url"
                value={form.image ?? ''}
                aria-invalid={isMissing('image') || undefined}
                onChange={event =>
                  onChange({...form, image: event.target.value})
                }
                placeholder="https://..."
              />
              <span className="text-xs font-normal text-muted-foreground">
                {imported ? (
                  <Trans message="The external image is used as-is. Upload a replacement if you want to store your own copy." />
                ) : (
                  <Trans message="Upload an image or paste a public image URL." />
                )}
              </span>
            </label>
          </div>
        </div>

        <label className="grid gap-1.5 text-sm font-medium">
          <Trans message="Name" />
          <Input
            required
            value={form.name}
            aria-invalid={isMissing('name') || undefined}
            onChange={event => onChange({...form, name: event.target.value})}
          />
          {isMissing('name') ? (
            <span className="text-xs font-normal text-destructive">
              <Trans message="Add a product name before saving." />
            </span>
          ) : null}
        </label>

        <div className="grid grid-cols-[1fr_100px] gap-3">
          <label className="grid gap-1.5 text-sm font-medium">
            <Trans message="Price" />
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.price ?? ''}
              aria-invalid={isMissing('price') || undefined}
              onChange={event =>
                onChange({
                  ...form,
                  price:
                    event.target.value === ''
                      ? null
                      : Number(event.target.value),
                })
              }
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            <Trans message="Currency" />
            <Input
              maxLength={3}
              value={form.currency ?? ''}
              aria-invalid={isMissing('currency') || undefined}
              onChange={event =>
                onChange({
                  ...form,
                  currency: event.target.value.toUpperCase(),
                })
              }
            />
          </label>
        </div>

        <label className="grid gap-1.5 text-sm font-medium">
          <Trans message="Product link" />
          <Input
            type="url"
            value={form.url ?? ''}
            onChange={event => onChange({...form, url: event.target.value})}
            placeholder="https://..."
          />
          <span className="text-xs font-normal text-muted-foreground">
            <Trans message="Affiliate parameters are kept in the destination link." />
          </span>
        </label>
      </section>

      <Accordion.Root variant="bordered">
        <Accordion.Item value="optional-details">
          <Accordion.Trigger>
            <span className="grid gap-0.5">
              <span>
                <Trans message="Optional details" />
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                <Trans message="Description, promotion, rating, availability and publishing settings." />
              </span>
            </span>
          </Accordion.Trigger>
          <Accordion.Content className="grid gap-4">
            <label className="grid gap-1.5 text-sm font-medium">
              <Trans message="Description" />
              <Textarea
                value={form.description ?? ''}
                onChange={event =>
                  onChange({...form, description: event.target.value})
                }
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-medium">
                <Trans message="Previous price" />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.compare_price ?? ''}
                  onChange={event =>
                    onChange({
                      ...form,
                      compare_price:
                        event.target.value === ''
                          ? null
                          : Number(event.target.value),
                    })
                  }
                />
                <span className="text-xs font-normal text-muted-foreground">
                  <Trans message="Shown only when greater than the current price." />
                </span>
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                <Trans message="Rating" />
                <Input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={form.rating ?? ''}
                  onChange={event =>
                    onChange({
                      ...form,
                      rating:
                        event.target.value === ''
                          ? null
                          : Number(event.target.value),
                    })
                  }
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                <Trans message="Badge" />
                <Input
                  maxLength={40}
                  value={form.badge ?? ''}
                  onChange={event =>
                    onChange({...form, badge: event.target.value})
                  }
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                <Trans message="Availability label" />
                <Input
                  maxLength={80}
                  value={form.stock_label ?? ''}
                  onChange={event =>
                    onChange({...form, stock_label: event.target.value})
                  }
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center justify-between gap-3 rounded-card-sm border px-3 py-2 text-sm font-medium">
                <Trans message="Product active" />
                <Checkbox
                  bindToHookForm={false}
                  checked={form.active !== false}
                  onCheckedChange={active =>
                    onChange({...form, active: !!active})
                  }
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                <Trans message="Display order" />
                <Input
                  type="number"
                  min="0"
                  value={form.position ?? 0}
                  onChange={event =>
                    onChange({...form, position: Number(event.target.value)})
                  }
                />
              </label>
            </div>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </>
  );
}

function ProductListSkeleton() {
  return (
    <>
      {[0, 1, 2].map(item => (
        <div
          key={item}
          className="flex items-center gap-4 rounded-card border p-4"
        >
          <Skeleton className="size-16 shrink-0" />
          <div className="grid flex-1 gap-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </>
  );
}

function ProductImage({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-card-sm bg-muted ${className}`}
    >
      {src && failedSrc !== src ? (
        <img
          src={src}
          alt={alt}
          className="size-full object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <ImageIcon className="size-6 text-muted-foreground" />
      )}
    </div>
  );
}

function ProductImportWarning({
  code,
}: {
  code: PreviewBiolinkProductImport200['warnings'][number]['code'];
}) {
  switch (code) {
    case 'partial_data':
      return (
        <Trans message="Some product details were not published by this website." />
      );
    case 'price_missing':
      return <Trans message="The website did not publish a product price." />;
    case 'image_missing':
      return <Trans message="The website did not publish a product image." />;
    case 'bot_protected':
      return (
        <Trans message="This website blocked the preview request. Continue with manual registration." />
      );
    default:
      return (
        <Trans message="Product metadata is not available. Continue with manual registration." />
      );
  }
}

function formatPrice(
  value: string | number | null | undefined,
  currency: string | null | undefined,
): string {
  if (value === null || value === undefined || value === '') return '-';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'BRL',
    }).format(Number(value));
  } catch {
    return `${currency || ''} ${value}`.trim();
  }
}
