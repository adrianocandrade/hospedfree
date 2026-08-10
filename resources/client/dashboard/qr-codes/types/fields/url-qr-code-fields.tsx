import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Input} from '@shadcn/forms/input/input';
import {Trans} from '@ui/i18n/trans';

export function UrlQrCodeFields() {
  return (
    <HookForm.Field name="long_url">
      <Field.Label>
        <Trans message="Destination URL" />
      </Field.Label>
      <Input
        data-qr-primary-field
        placeholder="https://example.com"
        autoComplete="url"
        spellCheck={false}
        required
      />
      <Field.Error />
    </HookForm.Field>
  );
}
