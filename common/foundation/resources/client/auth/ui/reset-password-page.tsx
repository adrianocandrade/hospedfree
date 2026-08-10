import {
  resetPasswordOptions,
  ResetPasswordPayload,
} from '@common/auth/auth-queries';
import {GuestRoute} from '@common/auth/guards/guest-route';
import {Button} from '@shadcn/button/button';
import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Input} from '@shadcn/forms/input/input';
import {toast} from '@shadcn/toast/toast';
import {useMutation} from '@tanstack/react-query';
import {LinkStyle} from '@ui/buttons/external-link';
import {Trans} from '@ui/i18n/trans';
import {useForm} from 'react-hook-form';
import {Link, useNavigate, useParams} from 'react-router';
import {StaticPageTitle} from '../../seo/static-page-title';
import {AuthHeading, AuthLayout} from './auth-layout/auth-layout';

export function Component() {
  const {token} = useParams();
  const navigate = useNavigate();
  const form = useForm<ResetPasswordPayload>({defaultValues: {token}});
  const resetPassword = useMutation(resetPasswordOptions());

  const handleResetPassword = (payload: ResetPasswordPayload) => {
    resetPassword.mutate(payload, {
      onSuccess: () => {
        navigate('/login', {replace: true});
        toast.success(<Trans message="Your password has been reset!" />);
      },
    });
  };

  const message = (
    <Trans
      values={{
        a: parts => (
          <Link className={LinkStyle} to="/login">
            {parts}
          </Link>
        ),
      }}
      message="Lembrou sua senha? <a>Volte para o login.</a>"
    />
  );

  return (
    <GuestRoute>
      <AuthLayout
        heading={
          <AuthHeading
            title={<Trans message="Crie uma nova senha" />}
            description={
              <Trans message="Use uma senha segura e diferente das anteriores." />
            }
          />
        }
        message={message}
      >
        <StaticPageTitle>
          <Trans message="Redefinir senha" />
        </StaticPageTitle>
        <HookForm.Root form={form} onSubmit={handleResetPassword}>
          <Field.Group>
            <HookForm.Field name="email">
              <Field.Label>
                <Trans message="Email" />
              </Field.Label>
              <Input type="email" autoComplete="email" required />
              <Field.Error />
            </HookForm.Field>

            <HookForm.Field name="password">
              <Field.Label>
                <Trans message="Nova senha" />
              </Field.Label>
              <Input type="password" autoComplete="new-password" required />
              <Field.Error />
            </HookForm.Field>

            <HookForm.Field name="password_confirmation">
              <Field.Label>
                <Trans message="Confirme a senha" />
              </Field.Label>
              <Input type="password" autoComplete="new-password" required />
              <Field.Error />
            </HookForm.Field>

            <Button
              className="w-full"
              type="submit"
              variant="default"
              color="primary"
              disabled={resetPassword.isPending}
            >
              <Trans message="Salvar nova senha" />
            </Button>
          </Field.Group>
        </HookForm.Root>
      </AuthLayout>
    </GuestRoute>
  );
}
