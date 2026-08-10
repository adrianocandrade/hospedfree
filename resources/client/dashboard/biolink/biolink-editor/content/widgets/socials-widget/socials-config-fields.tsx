import {
  SocialsList,
  SocialsType,
} from '@app/dashboard/biolink/biolink-editor/content/widgets/socials-widget/socials-list';
import {VisualOptionGrid} from '@app/dashboard/biolink/biolink-editor/visual-option-card';
import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Input} from '@shadcn/forms/input/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@shadcn/forms/input-group/input-group';
import {Trans} from '@ui/i18n/trans';
import {message} from '@ui/i18n/message';
import {useTrans} from '@ui/i18n/use-trans';
import {cn} from '@ui/utils/cn';
import {SearchIcon, XIcon} from 'lucide-react';
import {useMemo, useState} from 'react';
import {UseFormReturn, useWatch} from 'react-hook-form';

type SocialsConfigSection = 'style' | 'colors' | 'placements' | 'networks';

export function SocialsConfigFields({
  form,
  initialType,
  showPlacements = false,
  sections,
}: {
  form: UseFormReturn<any>;
  initialType?: SocialsType;
  showPlacements?: boolean;
  sections?: SocialsConfigSection[];
}) {
  const {trans} = useTrans();
  const [selectedType, setSelectedType] = useState<SocialsType>(
    initialType ?? SocialsType.Instagram,
  );
  const [networkQuery, setNetworkQuery] = useState('');
  const values = useWatch({control: form.control});
  const selectedStyle = (values?.style as string) ?? 'icons';
  const selectedColorMode = (values?.colorMode as string) ?? 'theme';
  const selectedSocial = SocialsList[selectedType];
  const visibleSections =
    sections ??
    (showPlacements
      ? ['style', 'colors', 'placements', 'networks']
      : ['style', 'colors', 'networks']);
  const configuredSocials = useMemo(
    () =>
      Object.entries(values ?? {}).filter(
        ([type, value]) =>
          Object.hasOwn(SocialsList, type) &&
          typeof value === 'string' &&
          !!value,
      ) as [SocialsType, string][],
    [values],
  );

  return (
    <>
      {visibleSections.includes('style') ? (
        <HookForm.Field name="style">
          <Field.Label>
            <Trans message="Style" />
          </Field.Label>
          <VisualOptionGrid
            ariaLabel={trans(message('Social link style'))}
            columns="grid-cols-3"
            value={selectedStyle}
            onChange={value =>
              form.setValue('style', value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            items={[
              {
                value: 'icons',
                label: <Trans message="Icons" />,
                preview: <SocialStylePreview style="icons" />,
              },
              {
                value: 'buttons',
                label: <Trans message="Buttons" />,
                preview: <SocialStylePreview style="buttons" />,
              },
              {
                value: 'pills',
                label: <Trans message="Pills" />,
                preview: <SocialStylePreview style="pills" />,
              },
            ]}
          />
          <Field.Error />
        </HookForm.Field>
      ) : null}

      {visibleSections.includes('colors') ? (
        <HookForm.Field name="colorMode">
          <Field.Label>
            <Trans message="Network colors" />
          </Field.Label>
          <VisualOptionGrid
            ariaLabel={trans(message('Network color mode'))}
            columns="grid-cols-3"
            value={selectedColorMode}
            onChange={value =>
              form.setValue('colorMode', value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            items={[
              {
                value: 'theme',
                label: <Trans message="Theme" />,
                preview: <ColorModePreview mode="theme" />,
              },
              {
                value: 'brand',
                label: <Trans message="Brand colors" />,
                preview: <ColorModePreview mode="brand" />,
              },
              {
                value: 'monochrome',
                label: <Trans message="Monochrome" />,
                preview: <ColorModePreview mode="monochrome" />,
              },
            ]}
          />
          <Field.Description>
            <Trans message="The same color mode is reused in the header, social blocks and footer." />
          </Field.Description>
          <Field.Error />
        </HookForm.Field>
      ) : null}

      {visibleSections.includes('placements') ? (
        <div className="flex flex-col gap-6">
          <HookForm.Field name="mobilePlacement">
            <Field.Label>
              <Trans message="Mobile placement" />
            </Field.Label>
            <VisualOptionGrid
              ariaLabel={trans(message('Mobile placement'))}
              columns="grid-cols-3"
              value={(values?.mobilePlacement as string) ?? 'header'}
              onChange={value =>
                form.setValue('mobilePlacement', value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              items={[
                {
                  value: 'header',
                  label: <Trans message="Below header" />,
                  preview: <PlacementPreview placement="header" />,
                },
                {
                  value: 'footer',
                  label: <Trans message="Footer" />,
                  preview: <PlacementPreview placement="footer" />,
                },
                {
                  value: 'hidden',
                  label: <Trans message="Disabled" />,
                  preview: <PlacementPreview placement="hidden" />,
                },
              ]}
            />
          </HookForm.Field>

          <HookForm.Field name="desktopPlacement">
            <Field.Label>
              <Trans message="Desktop placement" />
            </Field.Label>
            <VisualOptionGrid
              ariaLabel={trans(message('Desktop placement'))}
              columns="grid-cols-3"
              value={(values?.desktopPlacement as string) ?? 'badge'}
              onChange={value =>
                form.setValue('desktopPlacement', value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              items={[
                {
                  value: 'badge',
                  label: <Trans message="Below badges" />,
                  preview: <PlacementPreview placement="badge" />,
                },
                {
                  value: 'footer',
                  label: <Trans message="Footer" />,
                  preview: <PlacementPreview placement="footer" />,
                },
                {
                  value: 'hidden',
                  label: <Trans message="Disabled" />,
                  preview: <PlacementPreview placement="hidden" />,
                },
              ]}
            />
          </HookForm.Field>
        </div>
      ) : null}

      {visibleSections.includes('networks') ? (
        <>
          <div>
            <Field.Title className="mb-2">
              <Trans message="Network" />
            </Field.Title>
            <div className="space-y-3">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  bindToHookForm={false}
                  value={networkQuery}
                  onChange={event => setNetworkQuery(event.target.value)}
                  className="pl-9"
                  placeholder={trans(message('Search social network'))}
                />
              </div>
              <VisualOptionGrid
                ariaLabel={trans(message('Social network'))}
                columns="grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10"
                value={selectedType}
                onChange={value => setSelectedType(value as SocialsType)}
                items={Object.entries(SocialsList)
                  .filter(([type]) =>
                    type.includes(networkQuery.trim().toLowerCase()),
                  )
                  .map(([type, social]) => {
                    const isConfigured = configuredSocials.some(
                      ([configuredType]) => configuredType === type,
                    );
                    return {
                      value: type,
                      // Omite o label para manter apenas o ícone
                      label: null,
                      preview: (
                        <div
                          title={trans(social.name)}
                          className={cn(
                            'transition-all duration-300 ease-in-out',
                            isConfigured
                              ? 'scale-125'
                              : 'text-muted-foreground hover:text-foreground scale-100',
                          )}
                          style={
                            isConfigured && social.brandStyle?.color
                              ? {color: social.brandStyle.color}
                              : undefined
                          }
                        >
                          {social.icon}
                        </div>
                      ),
                    };
                  })}
              />
            </div>
          </div>

          <HookForm.Field name={selectedType} key={selectedType}>
            <Field.Label>
              <Trans {...selectedSocial.name} />
            </Field.Label>
            <InputGroup>
              <InputGroupInput
                autoFocus
                type={selectedSocial.inputType}
                placeholder={selectedSocial.placeholder}
                pattern={selectedSocial.pattern}
                autoComplete="off"
              />
              {selectedSocial.icon ? (
                <InputGroupAddon align="inline-start">
                  {selectedSocial.icon}
                </InputGroupAddon>
              ) : null}
            </InputGroup>
            <Field.Error />
          </HookForm.Field>

          {configuredSocials.length ? (
            <div>
              <Field.Title className="mb-2">
                <Trans message="Configured networks" />
              </Field.Title>
              <div className="mt-3 flex flex-col gap-2">
                {configuredSocials.map(([type]) => {
                  const social = SocialsList[type];
                  return (
                    <div
                      key={type}
                      className={cn(
                        'group flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors',
                        selectedType === type
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border bg-card hover:bg-muted/50',
                      )}
                      onClick={() => setSelectedType(type)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex size-10 items-center justify-center rounded-full bg-black/5 dark:bg-white/5"
                          style={{color: social.brandStyle?.color}}
                        >
                          {social.icon}
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-medium">
                            <Trans {...social.name} />
                          </span>
                          <span className="text-xs text-muted-foreground line-clamp-1 max-w-[200px] sm:max-w-[300px]">
                            {values[type]}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        title={trans(message('Remove'))}
                        onClick={event => {
                          event.stopPropagation();
                          form.setValue(type, '', {shouldDirty: true});
                        }}
                      >
                        <XIcon className="size-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </>
  );
}

function SocialStylePreview({style}: {style: 'icons' | 'buttons' | 'pills'}) {
  return (
    <span className="flex items-center gap-1 text-primary">
      <span
        className={cn(
          'flex size-6 items-center justify-center border border-current',
          style === 'icons' && 'rounded-full',
          style === 'buttons' && 'rounded-card-sm bg-primary/15',
          style === 'pills' && 'w-14 rounded-full bg-primary/15',
        )}
      >
        <span className="size-2 rounded-full bg-current" />
      </span>
      {style !== 'icons' ? (
        <span className="h-1.5 w-8 rounded bg-current/50" />
      ) : null}
    </span>
  );
}

function ColorModePreview({mode}: {mode: 'theme' | 'brand' | 'monochrome'}) {
  return (
    <span className="flex items-center gap-1.5">
      {[0, 1, 2].map(index => (
        <span
          key={index}
          className={cn(
            'size-5 rounded-full border',
            mode === 'theme' && 'border-primary bg-primary text-primary',
            mode === 'brand' &&
              (index === 0
                ? 'border-[#1877f2] bg-[#1877f2]'
                : index === 1
                  ? 'border-[#ff0000] bg-[#ff0000]'
                  : 'border-[#25d366] bg-[#25d366]'),
            mode === 'monochrome' &&
              'border-current bg-transparent text-primary',
          )}
        />
      ))}
    </span>
  );
}

function PlacementPreview({
  placement,
}: {
  placement: 'header' | 'badge' | 'footer' | 'hidden';
}) {
  return (
    <span className="relative flex h-8 w-14 flex-col justify-between rounded border border-current/30 p-1 text-primary">
      <span className="h-1 w-6 rounded bg-current/45" />
      <span
        className={cn(
          'h-1 w-10 rounded bg-current',
          placement === 'footer' && 'order-3',
          placement === 'hidden' && 'opacity-0',
        )}
      />
      <span className="h-1 w-8 self-end rounded bg-current/45" />
    </span>
  );
}
