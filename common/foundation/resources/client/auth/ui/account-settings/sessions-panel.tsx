import {UserSession} from '@app/gen/schemas/user-session';
import {
  listUserSessionsOptions,
  logoutOtherSessionsOptions,
} from '@common/auth/ui/account-settings/account-settings-queries';
import {AccountSettingsId} from '@common/auth/ui/account-settings/account-settings-sidenav';
import {usePasswordConfirmedAction} from '@common/auth/ui/confirm-password/use-password-confirmed-action';
import {showHttpErrorToast} from '@common/http/errors/show-http-error-toast';
import {Badge} from '@shadcn/badge/badge';
import {Button} from '@shadcn/button/button';
import {toast} from '@shadcn/toast/toast';
import {useMutation, useSuspenseQuery} from '@tanstack/react-query';
import {FormattedRelativeTime} from '@ui/i18n/formatted-relative-time';
import {Trans} from '@ui/i18n/trans';
import {
  ComputerIcon,
  KeyRoundIcon,
  SmartphoneIcon,
  TabletIcon,
} from 'lucide-react';
import {ReactNode} from 'react';
import {AccountSettingsPanel} from './account-settings-panel';

export function SessionsPanel() {
  const query = useSuspenseQuery(listUserSessionsOptions());
  const {withConfirmedPassword, isLoading: confirmingPassword} =
    usePasswordConfirmedAction();
  const logoutOther = useMutation({
    ...logoutOtherSessionsOptions(),
    onError: r => showHttpErrorToast(r),
  });

  const handleLogoutOtherSessions = () => {
    withConfirmedPassword(password => {
      logoutOther.mutate(
        {password},
        {
          onSuccess: () => {
            toast.success(<Trans message="Outras sessões encerradas." />);
          },
        },
      );
    });
  };

  return (
    <AccountSettingsPanel
      id={AccountSettingsId.Sessions}
      title={<Trans message="Acessos à conta" />}
    >
      <p className="max-w-3xl text-sm text-muted-foreground">
        <Trans message="Revise os dispositivos e tokens que acessaram sua conta. Se não reconhecer uma sessão, encerre os outros acessos e altere sua senha." />
      </p>
      <div className="my-6">
        <div className="max-h-100 divide-y overflow-y-auto overscroll-contain rounded-card border">
          {query.data.data.map(session => (
            <SessionItem key={session.id} session={session} />
          ))}
        </div>
      </div>
      <Button
        variant="outline"
        color="primary"
        disabled={confirmingPassword || logoutOther.isPending}
        onClick={() => handleLogoutOtherSessions()}
      >
        <Trans message="Encerrar outras sessões" />
      </Button>
    </AccountSettingsPanel>
  );
}

interface SessionItemProps {
  session: UserSession;
}
function SessionItem({session}: SessionItemProps) {
  return (
    <div className="flex min-w-0 items-start gap-3.5 p-4 text-sm">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-card bg-primary/10 text-primary [&_svg]:size-4">
        <DeviceIcon device={session.device} accessType={session.access_type} />
      </div>
      <div className="min-w-0 flex-auto">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-medium break-words">
            <ValueOrUnknown>{session.platform}</ValueOrUnknown> -{' '}
            <ValueOrUnknown>{session.browser}</ValueOrUnknown>
          </span>
          {session.is_current_device ? (
            <Badge variant="positive">
              <Trans message="Este dispositivo" />
            </Badge>
          ) : null}
          {session.access_type === 'api_token' ? (
            <Badge variant="secondary">
              <Trans message="Token de API" />
            </Badge>
          ) : null}
        </div>
        <div className="my-1 text-xs text-muted-foreground">
          <ValueOrUnknown>{session.city}</ValueOrUnknown>,{' '}
          <ValueOrUnknown>{session.country}</ValueOrUnknown>
        </div>
        <div className="text-xs break-all text-muted-foreground">
          <IpAddress session={session} /> - <LastActive session={session} />
        </div>
      </div>
    </div>
  );
}

interface DeviceIconProps {
  device: UserSession['device'];
  accessType: UserSession['access_type'];
}
function DeviceIcon({device, accessType}: DeviceIconProps) {
  if (accessType === 'api_token') {
    return <KeyRoundIcon />;
  }

  switch (device) {
    case 'mobile':
      return <SmartphoneIcon />;
    case 'tablet':
      return <TabletIcon />;
    default:
      return <ComputerIcon />;
  }
}

interface LastActiveProps {
  session: UserSession;
}
function LastActive({session}: LastActiveProps) {
  if (session.is_current_device) {
    return (
      <span className="text-positive">
        <Trans message="Ativo agora" />
      </span>
    );
  }

  return <FormattedRelativeTime date={session.updated_at} />;
}

interface IpAddressProps {
  session: UserSession;
}
function IpAddress({session}: IpAddressProps) {
  if (session.ip_address) {
    return <span>{session.ip_address}</span>;
  }
  return <Trans message="IP desconhecido" />;
}

interface ValueOrUnknownProps {
  children: ReactNode;
}
function ValueOrUnknown({children}: ValueOrUnknownProps) {
  return children ? <>{children}</> : <Trans message="Desconhecido" />;
}
