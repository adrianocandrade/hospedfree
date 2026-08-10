import {useBiolinkEditorStore} from '@app/dashboard/biolink/biolink-editor/biolink-editor-store';
import {SocialsConfigFields} from '@app/dashboard/biolink/biolink-editor/content/widgets/socials-widget/socials-config-fields';
import {SocialConfig} from '@app/dashboard/biolink/biolink-editor/content/widgets/socials-widget/socials-config';
import {
  SocialsList,
  SocialsType,
} from '@app/dashboard/biolink/biolink-editor/content/widgets/socials-widget/socials-list';
import {updateBiolinkAppearanceOptions} from '@app/dashboard/biolink/biolinks-queries';
import {onFormQueryError} from '@common/http/errors/on-form-query-error';
import {Button} from '@shadcn/button/button';
import {Dialog} from '@shadcn/dialog/dialog';
import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {Trans} from '@ui/i18n/trans';
import {removeEmptyValuesFromObject} from '@ui/utils/objects/remove-empty-values-from-object';
import {MonitorSmartphoneIcon, PaletteIcon, Share2Icon} from 'lucide-react';
import {useForm} from 'react-hook-form';
import {useMutation} from '@tanstack/react-query';

type FixedSocialForm = Record<string, unknown> & {
  enabled: boolean;
  style: 'icons' | 'buttons' | 'pills';
  colorMode: 'theme' | 'brand' | 'monochrome';
  mobilePlacement: 'header' | 'footer' | 'hidden';
  desktopPlacement: 'badge' | 'footer' | 'hidden';
};

export type FixedSocialsDialogMode = 'content' | 'design' | 'placement';

export function FixedSocialsDialog({
  open,
  onOpenChange,
  mode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: FixedSocialsDialogMode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {open ? (
        <Dialog.Portal>
          <Dialog.Backdrop />
          <FixedSocialsDialogContent
            mode={mode}
            onClose={() => onOpenChange(false)}
          />
        </Dialog.Portal>
      ) : null}
    </Dialog.Root>
  );
}

function FixedSocialsDialogContent({
  mode,
  onClose,
}: {
  mode: FixedSocialsDialogMode;
  onClose: () => void;
}) {
  const appearance = useBiolinkEditorStore(s => s.appearance);
  const getState = useBiolinkEditorStore(s => s.getState);
  const updateAppearance = useBiolinkEditorStore(s => s.updateAppearance);
  const setAppearanceIsDirty = useBiolinkEditorStore(
    s => s.setAppearanceIsDirty,
  );
  const biolink = useBiolinkEditorStore(s => s.biolink);
  const previousSocialConfig = appearance.socialConfig;
  const initialType = Object.keys(previousSocialConfig?.links ?? {}).find(
    type => Object.hasOwn(SocialsList, type),
  ) as SocialsType | undefined;
  const form = useForm<FixedSocialForm>({
    defaultValues: {
      enabled: previousSocialConfig?.enabled ?? true,
      style: previousSocialConfig?.style ?? 'icons',
      colorMode:
        (previousSocialConfig as SocialConfig | undefined)?.colorMode ??
        'theme',
      mobilePlacement: previousSocialConfig?.mobilePlacement ?? 'header',
      desktopPlacement: previousSocialConfig?.desktopPlacement ?? 'badge',
      ...(previousSocialConfig?.links ?? {}),
    },
  });
  const saveAppearance = useMutation(
    updateBiolinkAppearanceOptions(biolink.id),
  );

  const handleSubmit = (values: FixedSocialForm) => {
    const {
      enabled,
      style,
      colorMode,
      mobilePlacement,
      desktopPlacement,
      ...rawLinks
    } = values;
    const links = removeEmptyValuesFromObject(rawLinks) as Partial<
      Record<SocialsType, string>
    >;
    const socialConfig: SocialConfig = {
      enabled,
      style,
      colorMode,
      mobilePlacement,
      desktopPlacement,
      links,
    };
    updateAppearance({socialConfig} as never);

    saveAppearance.mutate(
      {config: getState().appearance},
      {
        onSuccess: () => {
          setAppearanceIsDirty(false);
          onClose();
        },
        onError: error => {
          updateAppearance({socialConfig: previousSocialConfig} as never);
          onFormQueryError(error, form);
        },
      },
    );
  };

  return (
    <HookForm.Root form={form} onSubmit={handleSubmit}>
      <Dialog.Content
        className={mode === 'content' ? 'md:max-w-3xl' : 'sm:max-w-2xl'}
      >
        <Dialog.Header>
          <Dialog.Title>
            <FixedSocialsDialogIcon mode={mode} />
            <FixedSocialsDialogTitle mode={mode} />
          </Dialog.Title>
          {mode === 'content' ? (
            <Dialog.Description>
              <Trans message="These links are independent from social blocks." />
            </Dialog.Description>
          ) : null}
        </Dialog.Header>
        <Dialog.Body>
          <Field.Group>
            {mode === 'content' ? (
              <>
                <div className="flex items-center justify-between gap-4 rounded-card-sm border bg-muted/20 p-3">
                  <Field.Title>
                    <Trans message="Show fixed social links" />
                  </Field.Title>
                  <FormSwitch name="enabled" />
                </div>
                <SocialsConfigFields
                  form={form}
                  initialType={initialType}
                  sections={['networks']}
                />
              </>
            ) : null}
            {mode === 'design' ? (
              <SocialsConfigFields form={form} sections={['style', 'colors']} />
            ) : null}
            {mode === 'placement' ? (
              <SocialsConfigFields form={form} sections={['placements']} />
            ) : null}
          </Field.Group>
        </Dialog.Body>
        <Dialog.Footer>
          <Dialog.CloseButton>
            <Trans message="Cancel" />
          </Dialog.CloseButton>
          <Button type="submit" disabled={saveAppearance.isPending}>
            <Trans message="Save" />
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </HookForm.Root>
  );
}

function FixedSocialsDialogIcon({mode}: {mode: FixedSocialsDialogMode}) {
  if (mode === 'design') return <PaletteIcon />;
  if (mode === 'placement') return <MonitorSmartphoneIcon />;
  return <Share2Icon />;
}

function FixedSocialsDialogTitle({mode}: {mode: FixedSocialsDialogMode}) {
  if (mode === 'design') return <Trans message="Appearance" />;
  if (mode === 'placement') return <Trans message="Position" />;
  return <Trans message="Fixed social links" />;
}
