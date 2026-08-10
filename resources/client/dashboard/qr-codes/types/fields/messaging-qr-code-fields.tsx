import {QrCodeType} from '@app/dashboard/qr-codes/types/qr-code-types';
import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Input} from '@shadcn/forms/input/input';
import {Textarea} from '@shadcn/forms/textarea/textarea';
import {Trans} from '@ui/i18n/trans';

export function MessagingQrCodeFields({type}: {type: QrCodeType}) {
  if (type === 'email') return <EmailQrCodeFields />;

  const isWhatsapp = type === 'whatsapp';
  const isSms = type === 'sms';

  return (
    <>
      <HookForm.Field name="data.phone">
        <Field.Label>
          {isWhatsapp ? (
            <Trans message="WhatsApp number" />
          ) : isSms ? (
            <Trans message="SMS phone number" />
          ) : (
            <Trans message="Phone number" />
          )}
        </Field.Label>
        <Input
          data-qr-primary-field
          type="tel"
          inputMode="tel"
          placeholder="+55 11 99999-9999"
          autoComplete="tel"
          required
        />
        <Field.Description>
          <Trans message="Include the country code and area code." />
        </Field.Description>
        <Field.Error />
      </HookForm.Field>
      {isWhatsapp || isSms ? (
        <HookForm.Field name="data.message">
          <Field.Label>
            <Trans message="Initial message (optional)" />
          </Field.Label>
          <Textarea rows={3} maxLength={500} />
          <Field.Error />
        </HookForm.Field>
      ) : null}
    </>
  );
}

function EmailQrCodeFields() {
  return (
    <>
      <HookForm.Field name="data.email">
        <Field.Label>
          <Trans message="Recipient email" />
        </Field.Label>
        <Input
          data-qr-primary-field
          type="email"
          autoComplete="email"
          required
        />
        <Field.Error />
      </HookForm.Field>
      <HookForm.Field name="data.subject">
        <Field.Label>
          <Trans message="Subject (optional)" />
        </Field.Label>
        <Input maxLength={190} />
        <Field.Error />
      </HookForm.Field>
      <HookForm.Field name="data.message">
        <Field.Label>
          <Trans message="Message (optional)" />
        </Field.Label>
        <Textarea rows={3} maxLength={500} />
        <Field.Error />
      </HookForm.Field>
    </>
  );
}
