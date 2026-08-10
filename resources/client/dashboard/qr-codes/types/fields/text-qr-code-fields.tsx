import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Textarea} from '@shadcn/forms/textarea/textarea';
import {Trans} from '@ui/i18n/trans';
import {useWatch} from 'react-hook-form';

const maxLength = 1500;

export function TextQrCodeFields() {
  const content = useWatch({name: 'data.content'}) ?? '';

  return (
    <HookForm.Field name="data.content">
      <Field.Label>
        <Trans message="Content" />
      </Field.Label>
      <Textarea data-qr-primary-field rows={6} maxLength={maxLength} required />
      <Field.Description className="flex items-start justify-between gap-4">
        <span>
          {content.length > 800 ? (
            <Trans message="Long content creates a denser QR code and can be harder to scan." />
          ) : (
            <Trans message="Keep the content concise for faster scanning." />
          )}
        </span>
        <span className="shrink-0 tabular-nums">
          {content.length}/{maxLength}
        </span>
      </Field.Description>
      <Field.Error />
    </HookForm.Field>
  );
}
