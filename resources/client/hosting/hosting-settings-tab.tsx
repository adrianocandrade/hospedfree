import {cancelHostingDeletionOptions} from '@app/hosting/hosting-queries';
import {HostingAccount} from '@app/hosting/hosting-types';
import {showHttpErrorToast} from '@common/http/errors/show-http-error-toast';
import {Button} from '@shadcn/button/button';
import {toast} from '@shadcn/toast/toast';
import {useMutation} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {LoaderCircleIcon, PauseCircleIcon} from 'lucide-react';
import {useOutletContext} from 'react-router';
import {formatHostingDate} from './format-hosting-date';
import {HostingDeleteDialog} from './hosting-delete-dialog';

export function Component() {
  const {account} = useOutletContext<{account: HostingAccount}>();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <DeletionPanel account={account} />
    </div>
  );
}

function DeletionPanel({account}: {account: HostingAccount}) {
  const cancelDeletion = useMutation({
    ...cancelHostingDeletionOptions(account.id),
    onError: error => showHttpErrorToast(error),
  });

  if (account.status === 'pending_deletion') {
    return (
      <section className="rounded-card border border-warning/20 bg-warning/10 p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div>
          <h2 className="font-semibold text-warning">
            <Trans message="Exclusão programada" />
          </h2>
          <p className="mt-1 text-sm text-warning/80">
            <Trans
              message="A conta será excluída em :date. Até lá, você pode cancelar esta solicitação."
              values={{date: formatHostingDate(account.deletes_at)}}
            />
          </p>
        </div>
        <Button
          className="mt-4 bg-background sm:mt-0"
          variant="outline"
          disabled={!account.can_cancel_deletion || cancelDeletion.isPending}
          onClick={() =>
            cancelDeletion.mutate(undefined, {
              onSuccess: () =>
                toast.success(<Trans message="Exclusão cancelada." />),
            })
          }
        >
          <Trans message="Cancelar exclusão" />
        </Button>
      </section>
    );
  }

  if (account.status !== 'suspended') {
    return (
      <section className="rounded-card border bg-card p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            <PauseCircleIcon className="size-4 text-warning" />
            <Trans message="Desative antes de excluir" />
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            <Trans message="A remoção definitiva exige que a hospedagem esteja desativada. Faça isso na visão geral e volte aqui para excluir definitivamente." />
          </p>
        </div>
      </section>
    );
  }

  if (account.desired_status === 'deleted') {
    return (
      <section className="rounded-card border border-destructive/30 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div>
          <h2 className="font-semibold text-destructive">
            <Trans message="Exclusão em andamento" />
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            <Trans message="A remoção definitiva foi iniciada. O status será atualizado automaticamente." />
          </p>
        </div>
        <LoaderCircleIcon className="mt-4 size-5 animate-spin text-destructive sm:mt-0" />
      </section>
    );
  }

  return (
    <section className="rounded-card border border-destructive/30 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
      <div>
        <h2 className="font-semibold text-destructive">
          <Trans message="Excluir hospedagem" />
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          <Trans message="Depois da confirmação, todos os arquivos, bancos de dados, domínios e configurações serão removidos permanentemente. Esta ação não pode ser desfeita." />
        </p>
      </div>
      <HostingDeleteDialog
        account={account}
        variant="outline"
        className="mt-4 sm:mt-0"
      />
    </section>
  );
}
