import {requestHostingDeletionOptions} from '@app/hosting/hosting-queries';
import {HostingAccount} from '@app/hosting/hosting-types';
import {usePasswordConfirmedAction} from '@common/auth/ui/confirm-password/use-password-confirmed-action';
import {showHttpErrorToast} from '@common/http/errors/show-http-error-toast';
import {AlertDialog} from '@shadcn/alert-dialog/alert-dialog';
import {Button} from '@shadcn/button/button';
import {Field} from '@shadcn/forms/field';
import {Input} from '@shadcn/forms/input/input';
import {toast} from '@shadcn/toast/toast';
import {useMutation} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {LoaderCircleIcon, Trash2Icon} from 'lucide-react';
import {useState} from 'react';

interface Props {
  account: HostingAccount;
  variant?: 'ghost' | 'outline';
  className?: string;
}

export function HostingDeleteDialog({
  account,
  variant = 'ghost',
  className,
}: Props) {
  const {withConfirmedPassword} = usePasswordConfirmedAction();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const expectedConfirmation = `EXCLUIR ${account.fqdn}`;
  const deletion = useMutation({
    ...requestHostingDeletionOptions(account.id),
    onError: error => showHttpErrorToast(error),
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setConfirmation('');
  };

  return (
    <AlertDialog.Root open={open} onOpenChange={handleOpenChange}>
      <AlertDialog.Trigger
        render={
          <Button variant={variant} color="danger" className={className} />
        }
      >
        <Trash2Icon />
        <Trans message="Excluir definitivamente" />
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop />
        <AlertDialog.Content className="max-w-md!">
          <AlertDialog.Header>
            <AlertDialog.Media className="bg-destructive/10 text-destructive">
              <Trash2Icon />
            </AlertDialog.Media>
            <AlertDialog.Title>
              <Trans message="Excluir esta hospedagem definitivamente?" />
            </AlertDialog.Title>
            <AlertDialog.Description>
              <Trans message="Esta ação é irreversível. A hospedagem, os arquivos, bancos de dados, domínios e configurações serão removidos permanentemente." />
            </AlertDialog.Description>
          </AlertDialog.Header>

          <Field.Root>
            <Field.Label htmlFor={`delete-hosting-${account.id}`}>
              <Trans message="Confirmação de exclusão" />
            </Field.Label>
            <Field.Description>
              <Trans message="Digite exatamente a frase abaixo para continuar:" />
            </Field.Description>
            <code className="rounded-card-xs bg-muted px-2 py-1 text-sm font-semibold break-all text-foreground">
              {expectedConfirmation}
            </code>
            <Input
              id={`delete-hosting-${account.id}`}
              bindToHookForm={false}
              value={confirmation}
              onChange={event => setConfirmation(event.target.value)}
              placeholder={expectedConfirmation}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              disabled={deletion.isPending}
            />
          </Field.Root>

          <AlertDialog.Footer className="sm:flex-row sm:justify-end">
            <AlertDialog.Cancel
              className="min-h-11 sm:min-w-28"
              disabled={deletion.isPending}
            >
              <Trans message="Cancelar" />
            </AlertDialog.Cancel>
            <AlertDialog.Action
              color="danger"
              className="min-h-11 min-w-fit px-5 text-primary-foreground"
              disabled={
                deletion.isPending || confirmation !== expectedConfirmation
              }
              aria-busy={deletion.isPending}
              onClick={() =>
                withConfirmedPassword(() =>
                  deletion.mutate(confirmation, {
                    onSuccess: () => {
                      handleOpenChange(false);
                      toast.success(
                        <Trans message="Exclusão iniciada. A hospedagem será removida permanentemente." />,
                      );
                    },
                  }),
                )
              }
            >
              {deletion.isPending && (
                <LoaderCircleIcon className="animate-spin" />
              )}
              <Trans message="Excluir definitivamente" />
            </AlertDialog.Action>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
