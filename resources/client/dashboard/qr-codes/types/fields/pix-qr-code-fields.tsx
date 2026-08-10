import {Field} from '@shadcn/forms/field';
import {pixKeyIsValid} from '@app/dashboard/qr-codes/types/build-qr-code-payload';
import {QrCodeFormValues} from '@app/dashboard/qr-codes/types/qr-code-types';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Input} from '@shadcn/forms/input/input';
import {Select} from '@shadcn/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import {message} from '@ui/i18n/message';
import {useTrans} from '@ui/i18n/use-trans';
import {useFormContext, useWatch} from 'react-hook-form';

const pixKeyTypes = [
  {value: 'cpf', label: <Trans message="CPF" />},
  {value: 'cnpj', label: <Trans message="CNPJ" />},
  {value: 'phone', label: <Trans message="Phone" />},
  {value: 'email', label: <Trans message="Email" />},
  {value: 'random', label: <Trans message="Random key" />},
];

export function PixQrCodeFields() {
  const {trans} = useTrans();
  const form = useFormContext<QrCodeFormValues>();
  const keyType = useWatch({name: 'data.key_type', control: form.control});

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
        <HookForm.Field name="data.key_type">
          <Field.Label>
            <Trans message="Pix key type" />
          </Field.Label>
          <Select.Root items={pixKeyTypes}>
            <Select.Trigger className="w-full" data-qr-primary-field>
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              {pixKeyTypes.map(item => (
                <Select.Item key={item.value} value={item.value}>
                  {item.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
          <Field.Error />
        </HookForm.Field>
        <HookForm.Field name="data.key">
          <Field.Label>
            <Trans message="Pix key" />
          </Field.Label>
          <Input
            autoComplete="off"
            maxLength={77}
            required
            onBlur={event => {
              const key = event.currentTarget.value;
              if (key && !pixKeyIsValid(keyType ?? '', key)) {
                form.setError('data.key', {
                  type: 'validate',
                  message: trans(
                    message('Enter a valid Pix key for the selected type.'),
                  ),
                });
              } else {
                form.clearErrors('data.key');
              }
            }}
          />
          <Field.Error />
        </HookForm.Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <HookForm.Field name="data.receiver_name">
          <Field.Label>
            <Trans message="Recipient name" />
          </Field.Label>
          <Input maxLength={80} required />
          <Field.Error />
        </HookForm.Field>
        <HookForm.Field name="data.receiver_city">
          <Field.Label>
            <Trans message="Recipient city" />
          </Field.Label>
          <Input maxLength={80} required />
          <Field.Error />
        </HookForm.Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <HookForm.Field name="data.amount">
          <Field.Label>
            <Trans message="Amount (optional)" />
          </Field.Label>
          <Input
            inputMode="decimal"
            placeholder="0,00"
            pattern="[0-9]{1,10}([.,][0-9]{1,2})?"
            autoComplete="off"
          />
          <Field.Error />
        </HookForm.Field>
        <HookForm.Field name="data.txid">
          <Field.Label>
            <Trans message="Transaction ID / TxID (optional)" />
          </Field.Label>
          <Input
            maxLength={25}
            pattern="[A-Za-z0-9*]{1,25}"
            placeholder="***"
            autoComplete="off"
          />
          <Field.Error />
        </HookForm.Field>
      </div>
      <HookForm.Field name="data.description">
        <Field.Label>
          <Trans message="Pix description (optional)" />
        </Field.Label>
        <Input maxLength={72} />
        <Field.Description>
          <Trans message="The bank app confirms the key and recipient when the code is scanned." />
        </Field.Description>
        <Field.Error />
      </HookForm.Field>
    </>
  );
}
