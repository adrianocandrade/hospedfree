import {retrieveUserOptions} from '@common/admin/users/users-queries';
import {
  resendVerificationEmailOptions,
  validateEmailVerificationOtpOptions,
} from '@common/auth/auth-queries';
import {useLogout} from '@common/auth/requests/use-logout';
import {AuthHeading, AuthLayout} from '@common/auth/ui/auth-layout/auth-layout';
import {auth} from '@common/auth/use-auth';
import {onFormQueryError} from '@common/http/errors/on-form-query-error';
import {showHttpErrorToast} from '@common/http/errors/show-http-error-toast';
import {Button} from '@shadcn/button/button';
import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Input} from '@shadcn/forms/input/input';
import {toast} from '@shadcn/toast/toast';
import {useMutation, useSuspenseQuery} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {LogOutIcon} from 'lucide-react';
import {useForm} from 'react-hook-form';

export function Component() {
  const {trans} = useTrans();
  const {data} = useSuspenseQuery(retrieveUserOptions(auth.user!.id));
  const user = data.data;
  const logout = useLogout();
  const form = useForm<{code: string}>();

  const validateOtp = useMutation(validateEmailVerificationOtpOptions());
  const resendEmail = useMutation(resendVerificationEmailOptions());

  return (
    <AuthLayout
      heading={
        <AuthHeading
          title={<Trans message="Verifique seu e-mail" />}
          description={
            <Trans
              message="Digite o código de seis dígitos enviado para :email."
              values={{email: maskEmailAddress(user.email)}}
            />
          }
        />
      }
    >
      <HookForm.Root
        form={form}
        onSubmit={values => {
          validateOtp.mutate(values, {
            onSuccess: () => window.location.reload(),
            onError: error => onFormQueryError(error, form),
          });
        }}
      >
        <HookForm.Field name="code">
          <Field.Label>
            <Trans message="Código de verificação" />
          </Field.Label>
          <Input
            type="text"
            placeholder={trans(message('Digite o código recebido'))}
            autoFocus
            autoComplete="one-time-code"
            autoCorrect="off"
            autoCapitalize="off"
            maxLength={6}
            inputMode="numeric"
            required
          />
          <Field.Error />
        </HookForm.Field>
        <Button
          type="submit"
          className="mt-6 w-full"
          disabled={validateOtp.isPending}
        >
          <Trans message="Verificar e continuar" />
        </Button>
      </HookForm.Root>

      <p className="mt-6 text-sm leading-6 text-muted-foreground">
        <Trans
          message="Não encontrou o e-mail? Verifique o spam ou <button>solicite um novo código</button>."
          values={{
            button: text => (
              <button
                className="font-medium text-primary hover:underline disabled:opacity-50"
                disabled={resendEmail.isPending || !user.email}
                onClick={() =>
                  resendEmail.mutate(
                    {email: user.email},
                    {
                      onSuccess: () =>
                        toast.success(<Trans message="E-mail enviado" />),
                      onError: error => showHttpErrorToast(error),
                    },
                  )
                }
              >
                {text}
              </button>
            ),
          }}
        />
      </p>

      <Button
        variant="ghost"
        className="mt-6 -ml-3"
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
      >
        <LogOutIcon />
        <Trans message="Sair da conta" />
      </Button>
    </AuthLayout>
  );
}

function maskEmailAddress(email: string | undefined) {
  if (!email) return '*******************';
  const [username = '', domain] = email.split('@');
  return `${username.slice(0, 2)}****@${domain}`;
}
