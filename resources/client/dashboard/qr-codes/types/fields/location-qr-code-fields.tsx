import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Input} from '@shadcn/forms/input/input';
import {Trans} from '@ui/i18n/trans';

export function LocationQrCodeFields() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <HookForm.Field name="data.latitude">
          <Field.Label>
            <Trans message="Latitude" />
          </Field.Label>
          <Input
            data-qr-primary-field
            type="number"
            inputMode="decimal"
            step="any"
            min={-90}
            max={90}
            placeholder="-23.5505"
            required
          />
          <Field.Error />
        </HookForm.Field>
        <HookForm.Field name="data.longitude">
          <Field.Label>
            <Trans message="Longitude" />
          </Field.Label>
          <Input
            type="number"
            inputMode="decimal"
            step="any"
            min={-180}
            max={180}
            placeholder="-46.6333"
            required
          />
          <Field.Error />
        </HookForm.Field>
      </div>
      <HookForm.Field name="data.location_name">
        <Field.Label>
          <Trans message="Location name (optional)" />
        </Field.Label>
        <Input maxLength={190} />
        <Field.Error />
      </HookForm.Field>
    </>
  );
}
