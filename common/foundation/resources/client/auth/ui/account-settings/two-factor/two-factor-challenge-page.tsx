import {completeTwoFactorChallengeOptions} from '@common/auth/auth-queries';
import {useHandleLoginSuccess} from '@common/auth/requests/use-login';
import {AuthHeading, AuthLayout} from '@common/auth/ui/auth-layout/auth-layout';
import {onFormQueryError} from '@common/http/errors/on-form-query-error';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {Button} from '@shadcn/button/button';
import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Input} from '@shadcn/forms/input/input';
import {useMutation} from '@tanstack/react-query';
import {Form} from '@ui/forms/form';
import {Trans} from '@ui/i18n/trans';
import {useState} from 'react';
import {useForm} from 'react-hook-form';

type FormValue = {
  code?: string;
  recovery_code?: string;
};

export function TwoFactorChallengePage() {
  const [usingRecoveryCode, setUsingRecoveryCode] = useState(false);

  const form = useForm<FormValue>();
  const completeChallenge = useMutation(completeTwoFactorChallengeOptions());

  const handleLoginSuccess = useHandleLoginSuccess();
  const handleCompleteChallenge = (payload: FormValue) => {
    completeChallenge.mutate(payload, {
      onSuccess: response => handleLoginSuccess(response),
      onError: r => onFormQueryError(r, form),
    });
  };

  return (
    <AuthLayout
      heading={
        <AuthHeading
          title={<Trans message="Confirme seu acesso" />}
          description={
            <Trans message="Digite o código do seu aplicativo autenticador para continuar." />
          }
        />
      }
    >
      <StaticPageTitle>
        <Trans message="Autenticação em dois fatores" />
      </StaticPageTitle>
      <Form form={form} onSubmit={handleCompleteChallenge}>
        <div className="mb-1">
          {usingRecoveryCode ? (
            <HookForm.Field name="recovery_code">
              <Field.Label>
                <Trans message="Código de recuperação" />
              </Field.Label>
              <Input
                minLength={21}
                maxLength={21}
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                autoFocus
                required
              />
              <Field.Error />
            </HookForm.Field>
          ) : (
            <HookForm.Field name="code">
              <Field.Label>
                <Trans message="Código" />
              </Field.Label>
              <Input
                minLength={6}
                maxLength={6}
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                autoFocus
                required
              />
              <Field.Error />
            </HookForm.Field>
          )}
        </div>
        <div className="mb-6">
          <Button
            variant="ghost"
            color="primary"
            size="sm"
            className="-ml-2"
            onClick={() => setUsingRecoveryCode(!usingRecoveryCode)}
          >
            <Trans message="Usar código de recuperação" />
          </Button>
        </div>
        <Button
          className="block w-full"
          type="submit"
          variant="default"
          color="primary"
          disabled={completeChallenge.isPending}
        >
          <Trans message="Confirmar acesso" />
        </Button>
      </Form>
    </AuthLayout>
  );
}
