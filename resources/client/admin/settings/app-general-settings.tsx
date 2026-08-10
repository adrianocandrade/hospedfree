import {SettingsPanel} from '@common/admin/settings/layout/settings-panel';
import {Component as CommonGeneralSettings} from '@common/admin/settings/pages/general-settings';
import {useAdminSettings} from '@common/admin/settings/use-admin-settings';
import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Select} from '@shadcn/forms/select/select';
import {Switch} from '@shadcn/forms/switch/switch';
import {Trans} from '@ui/i18n/trans';

export function Component() {
  const {data} = useAdminSettings();
  return (
    <CommonGeneralSettings
      slotOne={
        <>
          <DashboardHomeSection />
          <PwaSection />
        </>
      }
      defaultValues={{
        client: {
          dashboard: {
            homepage: data.client.dashboard?.homepage ?? 'links',
          },
          pwa: {
            install_prompt_enabled:
              data.client.pwa?.install_prompt_enabled ?? true,
          },
        },
      }}
    />
  );
}

function PwaSection() {
  return (
    <SettingsPanel
      title={<Trans message="Progressive web app" />}
      description={
        <Trans message="Let compatible browsers offer an optional home-screen installation. Private pages and API responses are never stored by the service worker." />
      }
    >
      <HookForm.Field name="client.pwa.install_prompt_enabled">
        <Field.Label>
          <Switch />
          <Trans message="Show the installation prompt" />
        </Field.Label>
      </HookForm.Field>
    </SettingsPanel>
  );
}

const homepageOptions = [
  {value: 'links', label: <Trans message="Links" />},
  {value: 'qr-codes', label: <Trans message="QR codes" />},
  {value: 'biolinks', label: <Trans message="Link in bio" />},
  {value: 'analytics', label: <Trans message="Analytics" />},
] as const;

function DashboardHomeSection() {
  return (
    <SettingsPanel
      title={<Trans message="Dashboard home" />}
      description={
        <div>
          <Trans message="Select the page that should be the homepage for the dashboard." />
        </div>
      }
    >
      <HookForm.Field name="client.dashboard.homepage">
        <Field.Label>
          <Trans message="Homepage" />
        </Field.Label>
        <Select.Root items={homepageOptions}>
          <Select.Trigger className="w-full">
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            {homepageOptions.map(option => (
              <Select.Item key={option.value} value={option.value}>
                {option.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
        <Field.Error />
      </HookForm.Field>
    </SettingsPanel>
  );
}
