import {createBiolinkOptions} from '@app/dashboard/biolink/biolinks-queries';
import {useSelectedBiolinkId} from '@app/dashboard/biolink/use-selected-biolink-id';
import {ShortUrlField} from '@app/dashboard/links/forms/short-url-field';
import {useDatatableRouteType} from '@app/dashboard/use-datatable-route-type';
import {CrupdateBiolinkBody} from '@app/gen/schemas/crupdate-biolink-body';
import type {BiolinkTheme} from '@app/gen/schemas/biolink-theme';
import {listBiolinkThemes} from '@app/gen/biolink-themes';
import {onFormQueryError} from '@common/http/errors/on-form-query-error';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {useControlledState} from '@react-stately/utils';
import {Button} from '@shadcn/button/button';
import {Dialog} from '@shadcn/dialog/dialog';
import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Input} from '@shadcn/forms/input/input';
import {toast} from '@shadcn/toast/toast';
import {useMutation, useQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {useSettings} from '@ui/settings/use-settings';
import {nanoid} from 'nanoid';
import {ArrowLeftIcon, CheckIcon, LayoutTemplateIcon} from 'lucide-react';
import {ReactElement, useState} from 'react';
import {useForm} from 'react-hook-form';

type Props = {
  children?: ReactElement<typeof Dialog.Trigger>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function CreateBiolinkDialog({
  children,
  open: propsOpen,
  onOpenChange: propsOnOpenChange,
}: Props) {
  const [open, setOpen] = useControlledState(
    propsOpen,
    false,
    propsOnOpenChange,
  );
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {children}
      <Dialog.Portal>
        <Dialog.Backdrop />
        <DialogContent onClose={() => setOpen(false)} />
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DialogContent({onClose}: {onClose: () => void}) {
  const {custom_domains} = useSettings();
  const navigate = useNavigate();
  const {routeType} = useDatatableRouteType();
  const [, setSelectedBiolinkId] = useSelectedBiolinkId();
  const [step, setStep] = useState<'model' | 'details'>('model');
  const form = useForm<CrupdateBiolinkBody & {model_id?: number}>({
    defaultValues: {
      name: '',
      back_half: nanoid(6),
      domain_id: custom_domains?.allow_all_option ? undefined : 0,
    },
  });
  const createBiolink = useMutation(createBiolinkOptions());
  const modelsQuery = useQuery({
    queryKey: ['biolink-models', 'create'],
    queryFn: () => listBiolinkThemes({models_only: true, device: 'both'}),
    staleTime: 60_000,
  });
  const models = (modelsQuery.data?.data ?? []).filter(
    model =>
      (
        model.metadata as
          | {contentBlueprint?: {version?: number}}
          | null
          | undefined
      )?.contentBlueprint?.version === 1,
  );
  const selectedModelId = form.watch('model_id');

  const handleSubmit = (values: CrupdateBiolinkBody & {model_id?: number}) => {
    createBiolink.mutate(values, {
      onSuccess: response => {
        toast.success(<Trans message="Link in bio created" />);
        if (routeType === 'dashboard') {
          setSelectedBiolinkId(response.data.id);
        }
        navigate(`/${routeType}/biolinks/${response.data.id}`);
        onClose();
      },
      onError: err => onFormQueryError(err, form),
    });
  };

  return (
    <HookForm.Root form={form} onSubmit={handleSubmit}>
      <Dialog.Content className="md:max-w-xl">
        <Dialog.Header>
          <Dialog.Title>
            {step === 'model' ? (
              <Trans message="Choose a starting point" />
            ) : (
              <Trans message="Create new link in bio" />
            )}
          </Dialog.Title>
          <Dialog.Description>
            {step === 'model' ? (
              <Trans message="Start blank or use a complete model. Model content stays inactive until you review it." />
            ) : (
              <Trans message="Choose the name and public address for this page." />
            )}
          </Dialog.Description>
        </Dialog.Header>

        <Dialog.Body>
          {step === 'model' ? (
            <ModelPicker
              models={models}
              selectedModelId={selectedModelId}
              isLoading={modelsQuery.isLoading}
              onSelect={modelId =>
                form.setValue('model_id', modelId, {shouldDirty: true})
              }
            />
          ) : (
            <Field.Group>
              <HookForm.Field name="name">
                <Field.Label>
                  <Trans message="Name" />
                </Field.Label>
                <Input autoFocus required minLength={3} maxLength={160} />
                <Field.Error />
              </HookForm.Field>

              <ShortUrlField
                domainLabel={<Trans message="Domain" />}
                domainName="domain_id"
                backHalfName="back_half"
              />
            </Field.Group>
          )}
        </Dialog.Body>

        <Dialog.Footer>
          {step === 'model' ? (
            <>
              <Dialog.CloseButton>
                <Trans message="Cancel" />
              </Dialog.CloseButton>
              <Button type="button" onClick={() => setStep('details')}>
                <Trans message="Continue" />
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('model')}
              >
                <ArrowLeftIcon data-icon="inline-start" />
                <Trans message="Back" />
              </Button>
              <Button type="submit" disabled={createBiolink.isPending}>
                <Trans message="Create" />
              </Button>
            </>
          )}
        </Dialog.Footer>
      </Dialog.Content>
    </HookForm.Root>
  );
}

function ModelPicker({
  isLoading,
  models,
  onSelect,
  selectedModelId,
}: {
  isLoading: boolean;
  models: BiolinkTheme[];
  onSelect: (modelId: number | undefined) => void;
  selectedModelId?: number;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <ModelChoice
        title={<Trans message="Blank page" />}
        description={
          <Trans message="Use the current starter content and build from scratch." />
        }
        selected={!selectedModelId}
        onClick={() => onSelect(undefined)}
      />
      {isLoading ? (
        <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
          <Trans message="Loading models..." />
        </div>
      ) : null}
      {models.map(model => (
        <ModelChoice
          key={model.id}
          title={model.name}
          description={
            model.metadata?.tags?.length ? (
              model.metadata.tags.join(' · ')
            ) : (
              <Trans message="Complete model" />
            )
          }
          previewImage={model.metadata?.previewImage}
          color={
            model.config.bgConfig?.backgroundColor ??
            model.config.btnConfig?.color
          }
          selected={selectedModelId === model.id}
          onClick={() => onSelect(model.id)}
        />
      ))}
    </div>
  );
}

function ModelChoice({
  color,
  description,
  onClick,
  previewImage,
  selected,
  title,
}: {
  color?: string;
  description: ReactElement | string;
  onClick: () => void;
  previewImage?: string;
  selected: boolean;
  title: ReactElement | string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className="relative flex min-h-32 items-start gap-4 overflow-hidden rounded-xl border bg-card p-4 text-left transition-colors hover:bg-accent/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      onClick={onClick}
    >
      {previewImage ? (
        <img
          src={previewImage}
          alt=""
          className="h-20 w-24 shrink-0 rounded-lg border object-cover"
          loading="lazy"
          draggable={false}
        />
      ) : (
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-lg border"
          style={{backgroundColor: color}}
        >
          <LayoutTemplateIcon className="size-5" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block font-semibold">{title}</span>
        <span className="mt-1 block text-sm text-muted-foreground">
          {description}
        </span>
      </span>
      {selected ? (
        <span className="absolute top-3 right-3 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <CheckIcon className="size-4" />
        </span>
      ) : null}
    </button>
  );
}
