import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@shadcn/forms/input-group/input-group';
import {Input} from '@shadcn/forms/input/input';
import {Select} from '@shadcn/forms/select/select';
import {Switch} from '@shadcn/forms/switch/switch';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {EyeIcon, EyeOffIcon} from 'lucide-react';
import {useEffect, useState} from 'react';
import {useFormContext, useWatch} from 'react-hook-form';

const securityOptions = [
  {value: 'WPA', label: <Trans message="WPA / WPA2 / WPA3" />},
  {value: 'WEP', label: <Trans message="WEP" />},
  {value: 'nopass', label: <Trans message="No password" />},
];

export function WifiQrCodeFields() {
  const {trans} = useTrans();
  const form = useFormContext();
  const [showPassword, setShowPassword] = useState(false);
  const security = useWatch({name: 'data.security'});

  useEffect(() => {
    if (security === 'nopass' && form.getValues('data.password')) {
      form.setValue('data.password', '', {shouldDirty: true});
    }
  }, [form, security]);

  return (
    <>
      <HookForm.Field name="data.ssid">
        <Field.Label>
          <Trans message="Network name / SSID" />
        </Field.Label>
        <Input
          data-qr-primary-field
          maxLength={32}
          autoComplete="off"
          required
        />
        <Field.Error />
      </HookForm.Field>
      <HookForm.Field name="data.security">
        <Field.Label>
          <Trans message="Security" />
        </Field.Label>
        <Select.Root items={securityOptions}>
          <Select.Trigger className="w-full">
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            {securityOptions.map(item => (
              <Select.Item key={item.value} value={item.value}>
                {item.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
        <Field.Error />
      </HookForm.Field>
      {security !== 'nopass' ? (
        <HookForm.Field name="data.password">
          <Field.Label>
            <Trans message="Network password" />
          </Field.Label>
          <InputGroup>
            <InputGroupInput
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              maxLength={63}
              required
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                type="button"
                aria-label={
                  showPassword
                    ? trans(message('Hide password'))
                    : trans(message('Show password'))
                }
                onClick={() => setShowPassword(value => !value)}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <Field.Description>
            <Trans message="The network password is encrypted when this QR code is saved." />
          </Field.Description>
          <Field.Error />
        </HookForm.Field>
      ) : null}
      <HookForm.Field name="data.hidden" orientation="horizontal">
        <Switch />
        <Field.Label>
          <Trans message="Hidden network" />
        </Field.Label>
      </HookForm.Field>
    </>
  );
}
