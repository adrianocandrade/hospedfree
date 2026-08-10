import {useLogout} from '@common/auth/requests/use-logout';
import {AuthHeading, AuthLayout} from '@common/auth/ui/auth-layout/auth-layout';
import {Button} from '@shadcn/button/button';
import {Trans} from '@ui/i18n/trans';
import {useSettings} from '@ui/settings/use-settings';
import {LogOutIcon} from 'lucide-react';

export function Component() {
  const {branding} = useSettings();
  const logout = useLogout();

  return (
    <AuthLayout
      heading={
        <AuthHeading
          title={<Trans message="Sua conta está suspensa" />}
          description={
            <Trans
              message="O acesso ao :siteName está temporariamente indisponível para esta conta. Entre em contato com a administração para solicitar a reativação."
              values={{siteName: branding.site_name}}
            />
          }
        />
      }
    >
      <Button
        variant="outline"
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
      >
        <LogOutIcon />
        <Trans message="Sair da conta" />
      </Button>
    </AuthLayout>
  );
}
