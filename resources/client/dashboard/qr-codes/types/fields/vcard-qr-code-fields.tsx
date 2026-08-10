import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Input} from '@shadcn/forms/input/input';
import {Textarea} from '@shadcn/forms/textarea/textarea';
import {Trans} from '@ui/i18n/trans';

export function VCardQrCodeFields() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <HookForm.Field name="data.first_name">
          <Field.Label>
            <Trans message="First name" />
          </Field.Label>
          <Input data-qr-primary-field maxLength={100} required />
          <Field.Error />
        </HookForm.Field>
        <HookForm.Field name="data.last_name">
          <Field.Label>
            <Trans message="Last name (optional)" />
          </Field.Label>
          <Input maxLength={100} />
          <Field.Error />
        </HookForm.Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <HookForm.Field name="data.company">
          <Field.Label>
            <Trans message="Company (optional)" />
          </Field.Label>
          <Input maxLength={150} autoComplete="organization" />
          <Field.Error />
        </HookForm.Field>
        <HookForm.Field name="data.job_title">
          <Field.Label>
            <Trans message="Job title (optional)" />
          </Field.Label>
          <Input maxLength={150} autoComplete="organization-title" />
          <Field.Error />
        </HookForm.Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <HookForm.Field name="data.phone">
          <Field.Label>
            <Trans message="Phone (optional)" />
          </Field.Label>
          <Input type="tel" autoComplete="tel" />
          <Field.Error />
        </HookForm.Field>
        <HookForm.Field name="data.email">
          <Field.Label>
            <Trans message="Email (optional)" />
          </Field.Label>
          <Input type="email" autoComplete="email" />
          <Field.Error />
        </HookForm.Field>
      </div>
      <HookForm.Field name="data.website">
        <Field.Label>
          <Trans message="Website (optional)" />
        </Field.Label>
        <Input
          type="url"
          autoComplete="url"
          placeholder="https://example.com"
        />
        <Field.Error />
      </HookForm.Field>
      <HookForm.Field name="data.address">
        <Field.Label>
          <Trans message="Address (optional)" />
        </Field.Label>
        <Input maxLength={300} autoComplete="street-address" />
        <Field.Error />
      </HookForm.Field>
      <HookForm.Field name="data.notes">
        <Field.Label>
          <Trans message="Notes (optional)" />
        </Field.Label>
        <Textarea rows={3} maxLength={500} />
        <Field.Error />
      </HookForm.Field>
    </>
  );
}
