import {IconPickerDialogContent} from '@common/ui/icon-picker/icon-picker-dialog-content';
import {Button} from '@shadcn/button/button';
import {Dialog} from '@shadcn/dialog/dialog';
import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Checkbox} from '@shadcn/forms/checkbox/checkbox';
import {Input} from '@shadcn/forms/input/input';
import {Trans} from '@ui/i18n/trans';
import * as LucideIcons from 'lucide-react';
import {createElement, useState} from 'react';
import {useFormContext, useWatch} from 'react-hook-form';

export function BiolinkSectionFields({
  prefix = '',
  showPresentation = true,
}: {
  prefix?: '' | 'config.';
  showPresentation?: boolean;
}) {
  const name = (field: string) => `${prefix}section.${field}`;
  const form = useFormContext();
  const showTitleName = name('showTitle');
  const presentationName = name('presentation');
  const showTitle = useWatch({control: form.control, name: showTitleName}) as
    | boolean
    | undefined;
  const presentation = useWatch({
    control: form.control,
    name: presentationName,
  }) as 'contained' | 'open' | undefined;

  return (
    <div className="grid gap-4 border-t pt-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <h3 className="text-sm font-semibold">
          <Trans message="Section" />
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {showPresentation ? (
            <Trans message="Control the section surface and its header navigation details." />
          ) : (
            <Trans message="Control the section navigation and optional header action." />
          )}
        </p>
      </div>
      <HookForm.Field name={showTitleName} className="sm:col-span-2">
        <label className="flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-card-sm border bg-card px-3 py-2.5 text-sm">
          <span className="min-w-0">
            <span className="block font-medium">
              <Trans message="Show widget title" />
            </span>
          </span>
          <Checkbox
            bindToHookForm={false}
            checked={showTitle !== false}
            onCheckedChange={checked =>
              form.setValue(showTitleName, checked === true, {
                shouldDirty: true,
                shouldTouch: true,
              })
            }
          />
        </label>
        <Field.Error />
      </HookForm.Field>
      {showPresentation ? (
        <HookForm.Field name={presentationName} className="sm:col-span-2">
          <label className="flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-card-sm border bg-card px-3 py-2.5 text-sm">
            <span className="min-w-0">
              <span className="block font-medium">
                <Trans message="Show box around widget" />
              </span>
              <span className="mt-0.5 block text-xs leading-4 text-muted-foreground">
                <Trans message="Turn off to blend the widget into the page background." />
              </span>
            </span>
            <Checkbox
              bindToHookForm={false}
              checked={presentation !== 'open'}
              onCheckedChange={checked =>
                form.setValue(
                  presentationName,
                  checked === true ? 'contained' : 'open',
                  {shouldDirty: true, shouldTouch: true},
                )
              }
            />
          </label>
          <Field.Error />
        </HookForm.Field>
      ) : null}
      <SectionIconPicker fieldName={name('icon')} />
      <HookForm.Field name={name('anchorLabel')}>
        <Field.Label>
          <Trans message="Navigation label" />
        </Field.Label>
        <Input />
        <Field.Description>
          <Trans message="Used by header and footer widget links." />
        </Field.Description>
        <Field.Error />
      </HookForm.Field>
      <HookForm.Field name={name('actionLabel')}>
        <Field.Label>
          <Trans message="View all label (optional)" />
        </Field.Label>
        <Input />
        <Field.Error />
      </HookForm.Field>
      <HookForm.Field name={name('actionUrl')}>
        <Field.Label>
          <Trans message="View all URL (optional)" />
        </Field.Label>
        <Input type="url" />
        <Field.Error />
      </HookForm.Field>
    </div>
  );
}

function SectionIconPicker({fieldName}: {fieldName: string}) {
  const form = useFormContext();
  const value = useWatch({control: form.control, name: fieldName}) as
    | string
    | undefined;
  const [open, setOpen] = useState(false);
  const candidate = value
    ? (LucideIcons as Record<string, unknown>)[value]
    : undefined;
  const Icon =
    typeof candidate === 'object' || typeof candidate === 'function'
      ? (candidate as LucideIcons.LucideIcon)
      : undefined;

  return (
    <HookForm.Field name={fieldName}>
      <Field.Label>
        <Trans message="Icon" />
      </Field.Label>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger
          render={
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
            />
          }
        >
          {Icon ? createElement(Icon, {className: 'size-4'}) : null}
          <Trans message="Select icon" />
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <IconPickerDialogContent
            libraries={['lucide']}
            onIconNameSelected={iconName => {
              form.setValue(fieldName, iconName ?? '', {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
              });
              setOpen(false);
            }}
          />
        </Dialog.Portal>
      </Dialog.Root>
      <Field.Error />
    </HookForm.Field>
  );
}
