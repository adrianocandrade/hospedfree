import {
  resetHostingPasswordOptions,
  revealCredentialsOptions,
} from '@app/hosting/hosting-queries';
import {HostingAccount} from '@app/hosting/hosting-types';
import {usePasswordConfirmedAction} from '@common/auth/ui/confirm-password/use-password-confirmed-action';
import {showHttpErrorToast} from '@common/http/errors/show-http-error-toast';
import {Button} from '@shadcn/button/button';
import {toast} from '@shadcn/toast/toast';
import {useMutation} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {CopyIcon, EyeIcon, KeyRoundIcon, ShieldAlertIcon} from 'lucide-react';
import {useEffect} from 'react';
import {useOutletContext} from 'react-router';

export function Component() {
  const {account} = useOutletContext<{account: HostingAccount}>();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-card bg-card p-5 shadow-sm sm:p-6 border">
        <Credentials account={account} />
      </section>

      <section className="rounded-card border bg-card p-5 shadow-sm sm:p-6">
         <div className="flex items-start gap-4">
            <div className="shrink-0 flex items-center justify-center size-10 rounded-full bg-primary/10 text-primary">
               <ShieldAlertIcon className="size-5" />
            </div>
            <div>
               <h3 className="font-semibold text-base"><Trans message="Proteja seus dados" /></h3>
               <p className="mt-1 text-sm text-muted-foreground">
                 <Trans message="Sua senha de hospedagem permite o acesso total aos arquivos e banco de dados via WebFTP. Nós não enviamos a senha por e-mail e não recomendamos o compartilhamento." />
               </p>
            </div>
         </div>
      </section>
    </div>
  );
}

function Credentials({account}: {account: HostingAccount}) {
  const {withConfirmedPassword, isLoading} = usePasswordConfirmedAction();
  const reveal = useMutation({
    ...revealCredentialsOptions(account.id),
    onError: error => showHttpErrorToast(error),
  });
  const revealedCredentials = reveal.data;
  const resetReveal = reveal.reset;
  const reset = useMutation({
    ...resetHostingPasswordOptions(account.id),
    onSuccess: () =>
      toast.success(
        <Trans message="Redefinição de senha enviada para processamento." />,
      ),
    onError: error => showHttpErrorToast(error),
  });

  useEffect(() => {
    if (!revealedCredentials) return;
    const timeout = window.setTimeout(() => resetReveal(), 60_000);
    return () => window.clearTimeout(timeout);
  }, [revealedCredentials, resetReveal]);

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-semibold">
            <Trans message="Credenciais de Acesso" />
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {reveal.data ? (
              <Trans message="Esses dados serão ocultados novamente em um minuto." />
            ) : (
              (account.username_masked ?? '••••••••')
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={!account.has_credentials || isLoading || reveal.isPending}
            onClick={() => withConfirmedPassword(() => reveal.mutate())}
          >
            <EyeIcon />
            <Trans message="Revelar senha" />
          </Button>
          <Button
            variant="outline"
            disabled={account.status !== 'active' || reset.isPending}
            onClick={() => withConfirmedPassword(() => reset.mutate())}
          >
            <KeyRoundIcon />
            <Trans message="Redefinir" />
          </Button>
        </div>
      </div>
      {reveal.data && (
        <dl className="mt-5 grid gap-3 rounded-card-sm bg-muted p-4 text-sm">
          <SecretValue label="Usuário FTP/Painel" value={reveal.data.username} />
          <SecretValue label="Senha" value={reveal.data.password} />
        </dl>
      )}
    </div>
  );
}

function SecretValue({label, value}: {label: string; value: string}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-muted-foreground">
        <Trans message={label} />
      </dt>
      <dd className="mt-1 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded bg-background px-2 py-1.5 font-mono text-sm border shadow-sm">
          {value}
        </code>
        <Button
          size="icon-sm"
          variant="outline"
          aria-label={`Copiar ${label}`}
          onClick={() => navigator.clipboard.writeText(value)}
        >
          <CopyIcon />
        </Button>
      </dd>
    </div>
  );
}
