import {UpdateUserBody} from '@app/gen/schemas/update-user-body';
import {User} from '@app/gen/schemas/user';
import {UploadType} from '@app/site-config';
import {
  cancelEmailChangeOptions,
  confirmEmailChangeOptions,
  requestEmailChangeOptions,
  updateDetailsOptions,
} from '@common/auth/ui/account-settings/account-settings-queries';
import {AccountSettingsId} from '@common/auth/ui/account-settings/account-settings-sidenav';
import {onFormQueryError} from '@common/http/errors/on-form-query-error';
import {ImageSelector} from '@common/uploads/components/image-selector';
import {FileUploadProvider} from '@common/uploads/uploader/file-upload-provider';
import {Button} from '@shadcn/button/button';
import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Input} from '@shadcn/forms/input/input';
import {toast} from '@shadcn/toast/toast';
import {useMutation} from '@tanstack/react-query';
import {Avatar} from '@ui/avatar/avatar';
import {Trans} from '@ui/i18n/trans';
import {AtSignIcon, LoaderCircleIcon, MailCheckIcon} from 'lucide-react';
import {useId, useState} from 'react';
import {useForm} from 'react-hook-form';
import {AccountSettingsPanel} from './account-settings-panel';

interface Props {
  user: User;
}
export function BasicInfoPanel({user}: Props) {
  const formId = useId();
  const form = useForm<UpdateUserBody>({
    defaultValues: {
      name: user.name || '',
      image: user.image,
    },
  });
  const updateDetails = useMutation(updateDetailsOptions(user.id));

  const handleUpdateDetails = (value: UpdateUserBody) => {
    updateDetails.mutate(value, {
      onSuccess: () => {
        form.reset({
          ...form.getValues(),
          ...value,
        });
        toast.success(<Trans message="Updated account details" />);
      },
      onError: r => onFormQueryError(r, form),
    });
  };

  return (
    <div className="space-y-6">
      <AccountSettingsPanel
        id={AccountSettingsId.AccountDetails}
        title={<Trans message="Update name and profile image" />}
        actions={
          <Button
            type="submit"
            variant="default"
            color="primary"
            size="sm"
            form={formId}
            disabled={
              updateDetails.isPending ||
              !form.formState.isValid ||
              !form.formState.isDirty
            }
          >
            <Trans message="Save changes" />
          </Button>
        }
      >
        <HookForm.Root
          form={form}
          className="flex flex-col items-center gap-10 md:flex-row md:gap-15"
          onSubmit={handleUpdateDetails}
          id={formId}
        >
          <FileUploadProvider>
            <AvatarSelector user={user} />
          </FileUploadProvider>
          <div className="w-full flex-auto">
            <div className="mb-4 flex items-center gap-1 text-muted-foreground">
              <AtSignIcon className="size-5" />
              {user.email}
            </div>
            <HookForm.Field name="name">
              <Field.Label>
                <Trans message="Name" />
              </Field.Label>
              <Input />
              <Field.Error />
            </HookForm.Field>
          </div>
        </HookForm.Root>
      </AccountSettingsPanel>
      <EmailChangePanel user={user} />
    </div>
  );
}

function EmailChangePanel({user}: Props) {
  const [email, setEmail] = useState(user.pending_email ?? '');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const requestChange = useMutation({
    ...requestEmailChangeOptions(),
    onSuccess: response => {
      setEmail(response.data.pending_email);
      setPassword('');
      toast.success(<Trans message="Código enviado para o novo e-mail." />);
    },
  });
  const confirm = useMutation({
    ...confirmEmailChangeOptions(),
    onSuccess: () => {
      setCode('');
      setEmail('');
      toast.success(<Trans message="E-mail alterado e confirmado." />);
    },
  });
  const cancel = useMutation({
    ...cancelEmailChangeOptions(),
    onSuccess: () => {
      setEmail('');
      setCode('');
      toast.success(<Trans message="Alteração de e-mail cancelada." />);
    },
  });
  const pendingEmail =
    requestChange.data?.data.pending_email ?? user.pending_email;

  return (
    <AccountSettingsPanel
      id="email-change"
      title={<Trans message="Alterar e-mail com confirmação" />}
    >
      {pendingEmail ? (
        <div className="max-w-xl space-y-4">
          <div className="flex gap-3 rounded-card-sm bg-primary/5 p-4 text-sm">
            <MailCheckIcon className="mt-0.5 size-5 shrink-0 text-primary" />
            <p>
              <Trans
                message="Enviamos um código de seis dígitos para :email. O endereço atual continuará válido até a confirmação."
                values={{email: pendingEmail}}
              />
            </p>
          </div>
          <div>
            <label htmlFor="email-change-code" className="text-sm font-medium">
              <Trans message="Código de confirmação" />
            </label>
            <Input
              id="email-change-code"
              className="mt-2"
              value={code}
              onChange={event =>
                setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
              }
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => confirm.mutate(code)}
              disabled={confirm.isPending || code.length !== 6}
            >
              {confirm.isPending && (
                <LoaderCircleIcon className="animate-spin" />
              )}
              <Trans message="Confirmar novo e-mail" />
            </Button>
            <Button
              variant="outline"
              onClick={() => cancel.mutate()}
              disabled={cancel.isPending}
            >
              <Trans message="Cancelar alteração" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid max-w-xl gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="new-account-email" className="text-sm font-medium">
              <Trans message="Novo e-mail" />
            </label>
            <Input
              id="new-account-email"
              className="mt-2"
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <label
              htmlFor="email-current-password"
              className="text-sm font-medium"
            >
              <Trans message="Senha atual" />
            </label>
            <Input
              id="email-current-password"
              className="mt-2"
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div className="sm:col-span-2">
            <Button
              onClick={() =>
                requestChange.mutate({
                  email: email.trim().toLowerCase(),
                  current_password: password,
                })
              }
              disabled={requestChange.isPending || !email.trim() || !password}
            >
              {requestChange.isPending && (
                <LoaderCircleIcon className="animate-spin" />
              )}
              <Trans message="Enviar código de confirmação" />
            </Button>
          </div>
        </div>
      )}
    </AccountSettingsPanel>
  );
}

interface AvatarManagerProps {
  user: {
    id: User['id'];
    image?: User['image'];
    name: User['name'];
  };
}
function AvatarSelector({user}: AvatarManagerProps) {
  const [value, setValue] = useState(user.image);
  const updateAvatar = useMutation(updateDetailsOptions(user.id));
  return (
    <FileUploadProvider>
      <ImageSelector.Avatar
        value={value ?? null}
        uploadType={UploadType.avatars}
        className="size-22.5"
        placeholderIcon={
          <Avatar label={user.name} size="size-full text-2xl" circle />
        }
        onChange={(_, entry) => {
          setValue(entry?.url);
          updateAvatar.mutate({
            image: entry?.url ?? null,
            image_entry_id: entry?.id ?? null,
          });
        }}
      />
    </FileUploadProvider>
  );
}
