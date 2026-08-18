import {AdminDocsUrls} from '@app/admin/admin-config';
import {AdminSettings} from '@common/admin/settings/admin-settings';
import {SettingsErrorGroup} from '@common/admin/settings/layout/settings-error-group';
import {AdminSettingsLayout} from '@common/admin/settings/layout/settings-layout';
import {DocsLink} from '@common/admin/settings/layout/settings-links';
import {SettingsPanel} from '@common/admin/settings/layout/settings-panel';
import {useAdminSettings} from '@common/admin/settings/use-admin-settings';
import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Input} from '@shadcn/forms/input/input';
import {ExternalLink} from '@ui/buttons/external-link';
import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import {Trans} from '@ui/i18n/trans';
import {ReactElement} from 'react';
import {useForm} from 'react-hook-form';

interface Props {
  tabs: ReactElement;
  title: ReactElement<MessageDescriptor>;
}
export function LoggingSettings({tabs, title}: Props) {
  const {data} = useAdminSettings();
  const form = useForm<AdminSettings>({
    defaultValues: {
      server: {
        sentry_dsn: data.server.sentry_dsn ?? '',
        outgoing_email_log_retention_days:
          data.server.outgoing_email_log_retention_days ?? 7,
        customer_communication_retention_days:
          data.server.customer_communication_retention_days ?? 365,
        customer_security_event_retention_days:
          data.server.customer_security_event_retention_days ?? 365,
        administrative_security_audit_retention_days:
          data.server.administrative_security_audit_retention_days ?? 365,
        user_session_retention_days:
          data.server.user_session_retention_days ?? 90,
      },
    },
  });
  return (
    <AdminSettingsLayout form={form} title={title} tabs={tabs}>
      <SentryPanel />
      <RetentionPanel />
    </AdminSettingsLayout>
  );
}

function RetentionPanel() {
  return (
    <SettingsPanel
      title={<Trans message="Retenção dos históricos de segurança" />}
      description={
        <Trans message="Defina por quantos dias os históricos técnicos e da conta serão preservados. A limpeza ocorre diariamente e não altera e-mails, contas ou hospedagens." />
      }
    >
      <SettingsErrorGroup
        separatorTop={false}
        separatorBottom={false}
        name="retention_group"
      >
        {isInvalid => (
          <div className="grid gap-5 md:grid-cols-2">
            <RetentionField
              invalid={isInvalid}
              name="server.outgoing_email_log_retention_days"
              label={<Trans message="Log técnico de e-mails" />}
              description={
                <Trans message="Contém MIME completo e deve permanecer pelo menor período operacional necessário." />
              }
            />
            <RetentionField
              invalid={isInvalid}
              name="server.customer_communication_retention_days"
              label={<Trans message="E-mails exibidos ao cliente" />}
              description={
                <Trans message="Armazena somente assunto seguro, status e datas." />
              }
            />
            <RetentionField
              invalid={isInvalid}
              name="server.customer_security_event_retention_days"
              label={<Trans message="Eventos de segurança do cliente" />}
              description={
                <Trans message="Inclui acessos e alterações importantes com IP mascarado." />
              }
            />
            <RetentionField
              invalid={isInvalid}
              name="server.administrative_security_audit_retention_days"
              label={<Trans message="Auditoria administrativa" />}
              description={
                <Trans message="Registra acessos administrativos a conteúdo técnico protegido." />
              }
            />
            <RetentionField
              invalid={isInvalid}
              name="server.user_session_retention_days"
              label={<Trans message="Sessões e dispositivos" />}
              description={
                <Trans message="Mantém o histórico recente de navegadores e tokens usados na conta." />
              }
            />
          </div>
        )}
      </SettingsErrorGroup>
    </SettingsPanel>
  );
}

type RetentionFieldProps = {
  invalid: boolean;
  name:
    | 'server.outgoing_email_log_retention_days'
    | 'server.customer_communication_retention_days'
    | 'server.customer_security_event_retention_days'
    | 'server.administrative_security_audit_retention_days'
    | 'server.user_session_retention_days';
  label: ReactElement;
  description: ReactElement;
};

function RetentionField({
  invalid,
  name,
  label,
  description,
}: RetentionFieldProps) {
  return (
    <HookForm.Field invalid={invalid} name={name}>
      <Field.Label>{label}</Field.Label>
      <Input type="number" min={1} max={3650} inputMode="numeric" />
      <Field.Description>{description}</Field.Description>
      <Field.Error />
    </HookForm.Field>
  );
}

function SentryPanel() {
  return (
    <SettingsPanel
      title={<Trans message="Sentry Integration" />}
      description={
        <Trans
          values={{
            a: parts => (
              <ExternalLink href="https://sentry.io">{parts}</ExternalLink>
            ),
          }}
          message="<a>Sentry</a> integration provides real-time error tracking and helps identify and fix issues when site is in production."
        />
      }
      link={
        AdminDocsUrls.settings.logging ? (
          <DocsLink link={AdminDocsUrls.settings.logging} />
        ) : null
      }
    >
      <SettingsErrorGroup
        separatorTop={false}
        separatorBottom={false}
        name="logging_group"
      >
        {isInvalid => (
          <HookForm.Field invalid={isInvalid} name="server.sentry_dsn">
            <Field.Label>
              <Trans message="Sentry DSN" />
            </Field.Label>
            <Input type="url" minLength={30} />
            <Field.Error />
          </HookForm.Field>
        )}
      </SettingsErrorGroup>
    </SettingsPanel>
  );
}
