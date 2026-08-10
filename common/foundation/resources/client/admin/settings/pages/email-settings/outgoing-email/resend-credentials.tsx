import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Input} from '@shadcn/forms/input/input';
import {Trans} from '@ui/i18n/trans';

export interface ResendCredentialsProps {
  isInvalid: boolean;
}

export function ResendCredentials({isInvalid}: ResendCredentialsProps) {
  return (
    <HookForm.Field invalid={isInvalid} name="server.resend_api_key">
      <Field.Label>
        <Trans message="Resend API key" />
      </Field.Label>
      <Input
        type="password"
        required
        autoComplete="off"
        placeholder="re_xxxxxxxxx"
      />
      <Field.Description>
        <Trans message="Replace `re_xxxxxxxxx` with your real API key. For production delivery, use a sender address from a domain verified in Resend." />{' '}
        <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer">
          <Trans message="Create an API key" />
        </a>
      </Field.Description>
      <Field.Error />
    </HookForm.Field>
  );
}
