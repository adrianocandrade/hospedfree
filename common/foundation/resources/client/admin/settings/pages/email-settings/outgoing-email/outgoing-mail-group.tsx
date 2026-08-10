import {AdminSettings} from '@common/admin/settings/admin-settings';
import {SettingsErrorGroup} from '@common/admin/settings/layout/settings-error-group';
import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Select} from '@shadcn/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import {ComponentType} from 'react';
import {useFormContext} from 'react-hook-form';
import {ConnectGmailPanel} from './connect-gmail-panel';
import {MailgunCredentials} from './mailgun-credentials';
import {PostmarkCredentials} from './postmark-credentials';
import {ResendCredentials} from './resend-credentials';
import {SesCredentials} from './ses-credentials';
import {SmtpCredentials} from './smtp-credentials';

const mailMethodOptions = [
  {value: 'resend', label: 'Resend'},
  {value: 'mailgun', label: 'Mailgun'},
  {value: 'gmailApi', label: 'Gmail API'},
  {value: 'smtp', label: 'SMTP'},
  {value: 'postmark', label: 'Postmark'},
  {value: 'ses', label: <Trans message="Ses (Amazon Simple Email Service)" />},
  {value: 'sendmail', label: 'SendMail'},
  {
    value: 'log',
    label: (
      <Trans message="Log (Email will be saved to log file instead of sending)" />
    ),
  },
] as const;

type MailMethod = (typeof mailMethodOptions)[number]['value'];
type CredentialsForm = ComponentType<{isInvalid: boolean}>;

const credentialForms: Partial<Record<MailMethod, CredentialsForm>> = {
  resend: ResendCredentials,
  mailgun: MailgunCredentials,
  smtp: SmtpCredentials,
  ses: SesCredentials,
  postmark: PostmarkCredentials,
  gmailApi: ConnectGmailPanel,
};

export function OutgoingMailGroup() {
  const {watch, clearErrors, getValues, setValue} =
    useFormContext<AdminSettings>();

  const selectedDriver = watch('server.mail_mailer') as MailMethod | undefined;
  const fallbackDriver = watch('server.mail_fallback_mailer') as
    | MailMethod
    | undefined;
  const fallbackOptions = [
    {value: '', label: <Trans message="No fallback" />},
    ...mailMethodOptions.filter(option => option.value !== selectedDriver),
  ];

  return (
    <SettingsErrorGroup
      separatorTop={false}
      separatorBottom={false}
      name="mail_group"
    >
      {isInvalid => (
        <Field.Group>
          <HookForm.Field invalid={isInvalid} name="server.mail_mailer">
            <Field.Label>
              <Trans message="Outgoing mail method" />
            </Field.Label>
            <Select.Root
              items={mailMethodOptions}
              onValueChange={value => {
                if (getValues('server.mail_fallback_mailer') === value) {
                  setValue('server.mail_fallback_mailer', '', {
                    shouldDirty: true,
                  });
                }
                clearErrors();
              }}
            >
              <Select.Trigger className="w-full">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                {mailMethodOptions.map(option => (
                  <Select.Item key={option.value} value={option.value}>
                    {option.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
            <Field.Error />
          </HookForm.Field>
          <MailerCredentials mailer={selectedDriver} isInvalid={isInvalid} />

          <Field.Separator>
            <Trans message="Delivery fallback" />
          </Field.Separator>

          <HookForm.Field
            invalid={isInvalid}
            name="server.mail_fallback_mailer"
          >
            <Field.Label>
              <Trans message="Backup mail method" />
            </Field.Label>
            <Select.Root
              items={fallbackOptions}
              onValueChange={() => clearErrors()}
            >
              <Select.Trigger className="w-full">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                {fallbackOptions.map(option => (
                  <Select.Item key={option.value} value={option.value}>
                    {option.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
            <Field.Description>
              <Trans message="Optional. This provider is used only when the primary mail transport reports a delivery failure." />
            </Field.Description>
            <Field.Error />
          </HookForm.Field>
          <MailerCredentials mailer={fallbackDriver} isInvalid={isInvalid} />
        </Field.Group>
      )}
    </SettingsErrorGroup>
  );
}

function MailerCredentials({
  mailer,
  isInvalid,
}: {
  mailer?: MailMethod;
  isInvalid: boolean;
}) {
  const Credentials = mailer ? credentialForms[mailer] : undefined;

  return Credentials ? <Credentials isInvalid={isInvalid} /> : null;
}
