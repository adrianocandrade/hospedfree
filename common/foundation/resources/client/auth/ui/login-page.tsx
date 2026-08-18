import {LoginPayload} from '@common/auth/auth-queries';
import {Button} from '@shadcn/button/button';
import {Checkbox} from '@shadcn/forms/checkbox/checkbox';
import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Input} from '@shadcn/forms/input/input';
import {LinkStyle} from '@ui/buttons/external-link';
import {Trans} from '@ui/i18n/trans';
import {useSettings} from '@ui/settings/use-settings';
import {LoaderCircleIcon} from 'lucide-react';
import {ReactNode, useContext} from 'react';
import {useForm} from 'react-hook-form';
import {Link, useLocation, useSearchParams} from 'react-router';
import {
  SiteConfigContext,
  SiteConfigContextValue,
} from '../../core/settings/site-config-context';
import {StaticPageTitle} from '../../seo/static-page-title';
import {useLogin} from '../requests/use-login';
import {AuthHeading, AuthLayout} from './auth-layout/auth-layout';
import {SocialAuthSection} from './social-auth-section';

interface Props {
  onTwoFactorChallenge: () => void;
  bottomMessages?: ReactNode;
  children?: ReactNode;
}
export function LoginPage({
  onTwoFactorChallenge,
  bottomMessages,
  children,
}: Props) {
  const [searchParams] = useSearchParams();
  const {pathname} = useLocation();

  const isWorkspaceLogin = pathname.includes('workspace');
  const searchParamsEmail = searchParams.get('email') || undefined;

  const {branding, registration, site, social} = useSettings();
  const registrationEnabled = !registration?.disable;
  const siteConfig = useContext(SiteConfigContext);

  const demoDefaults =
    site.demo && !searchParamsEmail ? getDemoFormDefaults(siteConfig) : {};
  const form = useForm<LoginPayload>({
    defaultValues: {remember: true, email: searchParamsEmail, ...demoDefaults},
  });
  const login = useLogin(form);
  const clearCredentialErrors = () => form.clearErrors(['email', 'password']);

  const heading = isWorkspaceLogin ? (
    <AuthHeading
      title={<Trans message="Bem-vindo de volta" />}
      description={
        <Trans
          values={{siteName: branding?.site_name}}
          message="Entre em :siteName para continuar"
        />
      }
    />
  ) : (
    <AuthHeading
      title={<Trans message="Bem-vindo de volta" />}
      description={
        <Trans message="Acesse sua hospedagem, seus domínios e o suporte em um só lugar." />
      }
    />
  );

  const messages = (registrationEnabled || bottomMessages) && (
    <div className="flex flex-col gap-2">
      {registrationEnabled && (
        <div>
          <Trans
            message="Ainda não tem uma conta? <a>Comece gratuitamente.</a>"
            values={{
              a: parts => (
                <Link className={LinkStyle} to="/register">
                  {parts}
                </Link>
              ),
            }}
          />
        </div>
      )}
      {bottomMessages}
    </div>
  );

  const isInvalid = !!Object.keys(form.formState.errors).length;

  return (
    <AuthLayout heading={heading} message={messages}>
      <StaticPageTitle>
        <Trans message="Login" />
      </StaticPageTitle>

      {children}

      <HookForm.Root
        form={form}
        onSubmit={payload => {
          login.mutate(payload, {
            onSuccess: response => {
              if (response.two_factor) {
                onTwoFactorChallenge();
              }
            },
          });
        }}
      >
        <Field.Group>
          <HookForm.Field
            name="email"
            invalid={isInvalid ? true : undefined}
            disabled={!!searchParamsEmail}
          >
            <Field.Label>
              <Trans message="E-mail" />
            </Field.Label>
            <Input
              className="h-12"
              type="email"
              autoComplete="email"
              autoFocus={!searchParamsEmail}
              onChange={clearCredentialErrors}
              required
            />
            {form.formState.errors.email?.message ? (
              <Field.Error>
                <InvalidCredentialsMessage />
              </Field.Error>
            ) : (
              <Field.Error />
            )}
          </HookForm.Field>

          <HookForm.Field
            name="password"
            invalid={isInvalid ? true : undefined}
          >
            <div className="flex items-center justify-between gap-4">
              <Field.Label>
                <Trans message="Senha" />
              </Field.Label>
              <Link
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                to="/forgot-password"
              >
                <Trans message="Esqueceu sua senha?" />
              </Link>
            </div>
            <Input
              className="h-12"
              type="password"
              autoComplete="current-password"
              autoFocus={!!searchParamsEmail}
              onChange={clearCredentialErrors}
              required
            />
            <Field.Error />
          </HookForm.Field>

          <HookForm.Field name="remember">
            <Field.Label>
              <Checkbox />
              <Trans message="Manter conectado por 30 dias" />
            </Field.Label>
          </HookForm.Field>

          <Button
            className="mt-3 h-12 w-full font-semibold"
            type="submit"
            variant="default"
            color="primary"
            disabled={login.isPending}
            aria-busy={login.isPending}
          >
            {login.isPending ? (
              <>
                <LoaderCircleIcon className="animate-spin" />
                <Trans message="Entrando..." />
              </>
            ) : (
              <Trans message="Entrar" />
            )}
          </Button>
        </Field.Group>
      </HookForm.Root>
      <SocialAuthSection
        dividerMessage={
          social?.compact_buttons ? (
            <Trans message="Ou entre com" />
          ) : (
            <Trans message="OU" />
          )
        }
      />
    </AuthLayout>
  );
}

function InvalidCredentialsMessage() {
  return (
    <Trans
      message="E-mail ou senha incorretos. Tente novamente ou <a>recupere sua senha</a>."
      values={{
        a: text => (
          <Link className="font-semibold underline" to="/forgot-password">
            {text}
          </Link>
        ),
      }}
    />
  );
}

function getDemoFormDefaults(siteConfig: SiteConfigContextValue) {
  return {
    email: siteConfig.demo?.email ?? 'admin@admin.com',
    password: siteConfig.demo?.password ?? 'admin',
  };
}
