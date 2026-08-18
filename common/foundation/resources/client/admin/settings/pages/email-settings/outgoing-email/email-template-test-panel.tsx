import {TestEmailTemplate} from '@app/gen/schemas/test-email-template';
import {useAuth} from '@common/auth/use-auth';
import {SettingsPanel} from '@common/admin/settings/layout/settings-panel';
import {sendTestEmailOptions} from '@common/admin/settings/settings-queries';
import {showHttpErrorToast} from '@common/http/errors/show-http-error-toast';
import {Alert} from '@shadcn/alert/alert';
import {Button} from '@shadcn/button/button';
import {Field} from '@shadcn/forms/field';
import {Input} from '@shadcn/forms/input/input';
import {Select} from '@shadcn/forms/select/select';
import {Spinner} from '@shadcn/spinner/spinner';
import {toast} from '@shadcn/toast/toast';
import {useMutation} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {isEmail} from '@ui/utils/string/is-email';
import {InfoIcon, SendIcon} from 'lucide-react';
import {useState} from 'react';

const templateOptions = [
  {
    value: TestEmailTemplate.mail_setup,
    label: <Trans message="Mail configuration" />,
  },
  {
    value: TestEmailTemplate.email_verification,
    label: <Trans message="Email verification code" />,
  },
  {
    value: TestEmailTemplate.password_reset,
    label: <Trans message="Password reset" />,
  },
  {
    value: TestEmailTemplate.contact_message,
    label: <Trans message="Contact page message" />,
  },
  {
    value: TestEmailTemplate.payment_failed,
    label: <Trans message="Payment failed" />,
  },
  {
    value: TestEmailTemplate.invoice_available,
    label: <Trans message="Invoice available" />,
  },
  {
    value: TestEmailTemplate.hosting_ready,
    label: <Trans message="Hosting account ready" />,
  },
  {
    value: TestEmailTemplate.hosting_suspended,
    label: <Trans message="Hosting account suspended" />,
  },
  {
    value: TestEmailTemplate.hosting_reactivated,
    label: <Trans message="Hosting account reactivated" />,
  },
  {
    value: TestEmailTemplate.hosting_password_changed,
    label: <Trans message="Hosting password changed" />,
  },
  {
    value: TestEmailTemplate.hosting_action_required,
    label: <Trans message="Hosting action required" />,
  },
  {
    value: TestEmailTemplate.ticket_created,
    label: <Trans message="Support ticket created" />,
  },
  {
    value: TestEmailTemplate.ticket_reply,
    label: <Trans message="Support reply" />,
  },
  {
    value: TestEmailTemplate.ticket_status_changed,
    label: <Trans message="Support ticket resolved" />,
  },
  {
    value: TestEmailTemplate.ticket_staff_activity,
    label: <Trans message="Support staff alert" />,
  },
] as const;

export function EmailTemplateTestPanel() {
  const {user} = useAuth();
  const [recipient, setRecipient] = useState(user?.email ?? '');
  const [template, setTemplate] = useState<TestEmailTemplate>(
    TestEmailTemplate.mail_setup,
  );
  const sendTest = useMutation({
    ...sendTestEmailOptions(),
    onSuccess: () => {
      toast.success(
        <Trans
          message="Test email sent to :email"
          values={{email: recipient}}
        />,
      );
    },
    onError: error => {
      showHttpErrorToast(
        error,
        <Trans message="Could not send the test email. Check the saved outgoing mail configuration." />,
        'email_test',
      );
    },
  });

  const trimmedRecipient = recipient.trim();
  const recipientIsValid =
    trimmedRecipient.length <= 254 && isEmail(trimmedRecipient);
  const recipientIsInvalid = !!trimmedRecipient && !recipientIsValid;

  return (
    <SettingsPanel
      title={<Trans message="Test email template" />}
      description={
        <Trans message="Send a real application email template populated with safe sample data." />
      }
    >
      <Field.Group>
        <Field.Root name="test_email_template">
          <Field.Label>
            <Trans message="Template" />
          </Field.Label>
          <Select.Root
            items={templateOptions}
            value={template}
            onValueChange={value => {
              if (value) setTemplate(value);
            }}
          >
            <Select.Trigger className="w-full">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              {templateOptions.map(option => (
                <Select.Item key={option.value} value={option.value}>
                  {option.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Field.Root>

        <Field.Root name="test_email_recipient" invalid={recipientIsInvalid}>
          <Field.Label>
            <Trans message="Recipient" />
          </Field.Label>
          <Input
            bindToHookForm={false}
            type="email"
            value={recipient}
            onChange={event => setRecipient(event.target.value)}
            placeholder="name@example.com"
            autoComplete="email"
          />
          <Field.Description>
            <Trans message="Only this address will receive the test message." />
          </Field.Description>
          {recipientIsInvalid ? (
            <Field.Error>
              <Trans message="Please enter a valid email address." />
            </Field.Error>
          ) : null}
        </Field.Root>

        <div className="flex flex-col items-start gap-3">
          <Button
            type="button"
            size="sm"
            disabled={sendTest.isPending || !recipientIsValid}
            onClick={() => {
              sendTest.mutate({recipient: trimmedRecipient, template});
            }}
          >
            {sendTest.isPending ? <Spinner /> : <SendIcon />}
            <Trans
              message={
                sendTest.isPending ? 'Sending test...' : 'Send test email'
              }
            />
          </Button>
          <div className="text-xs text-muted-foreground">
            <Trans message='The subject is prefixed with "[TEST]" so sample notifications are easy to identify.' />
          </div>
        </div>
      </Field.Group>

      <Alert.Root className="mt-5" fillStyle="subtleFill">
        <InfoIcon />
        <Alert.Description className="text-xs">
          <Trans message="The test uses the currently saved outgoing mail configuration. Save any pending changes before sending." />
        </Alert.Description>
      </Alert.Root>
    </SettingsPanel>
  );
}
