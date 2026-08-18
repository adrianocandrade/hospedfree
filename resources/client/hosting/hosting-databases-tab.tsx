import {
  createHostingDatabaseOptions,
  hostingDatabasesOptions,
} from '@app/hosting/hosting-queries';
import {HostingAccount, HostingDatabase} from '@app/hosting/hosting-types';
import {showHttpErrorToast} from '@common/http/errors/show-http-error-toast';
import {Button} from '@shadcn/button/button';
import {Card} from '@shadcn/card/card';
import {Dialog} from '@shadcn/dialog/dialog';
import {Input} from '@shadcn/forms/input/input';
import {Skeleton} from '@shadcn/skeleton/skeleton';
import {toast} from '@shadcn/toast/toast';
import {useMutation, useQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import useClipboard from '@ui/utils/hooks/use-clipboard';
import {
  CheckIcon,
  CircleAlertIcon,
  CopyIcon,
  DatabaseIcon,
  LoaderCircleIcon,
  PlusIcon,
  RefreshCwIcon,
  ServerIcon,
  UserIcon,
} from 'lucide-react';
import {FormEvent, ReactNode, useState} from 'react';
import {useOutletContext} from 'react-router';

export function Component() {
  const {account} = useOutletContext<{account: HostingAccount}>();
  const [createOpen, setCreateOpen] = useState(false);
  const databases = useQuery(hostingDatabasesOptions(account.id));
  const response = databases.data;
  const available = response?.availability === 'available';

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold">
            <Trans message="Bancos de dados" />
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            <Trans message="Crie e consulte bancos MySQL desta hospedagem sem expor senhas no navegador." />
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => databases.refetch()}
            disabled={databases.isFetching}
          >
            <RefreshCwIcon
              className={databases.isFetching ? 'animate-spin' : undefined}
            />
            <Trans message="Atualizar" />
          </Button>
          <Button onClick={() => setCreateOpen(true)} disabled={!available}>
            <PlusIcon />
            <Trans message="Criar banco" />
          </Button>
        </div>
      </div>

      <Card.Root>
        <Card.Header>
          <Card.Title>
            <Trans message="Bancos disponíveis" />
          </Card.Title>
          <Card.Description>
            <Trans message="O nome final pode receber um prefixo automático do painel de hospedagem." />
          </Card.Description>
        </Card.Header>
        <Card.Content className="px-0 pb-0">
          {databases.isLoading ? (
            <div className="space-y-2 px-6 pb-6">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : databases.isError || response?.availability !== 'available' ? (
            <UnavailableDatabases onRetry={() => databases.refetch()} />
          ) : response.data.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 pb-6 text-center">
              <DatabaseIcon className="size-9 text-muted-foreground" />
              <h2 className="mt-3 font-medium">
                <Trans message="Nenhum banco criado" />
              </h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                <Trans message="Crie um banco quando seu site precisar armazenar dados, como em uma instalação do WordPress." />
              </p>
            </div>
          ) : (
            <div className="divide-y border-t">
              {response.data.map(database => (
                <DatabaseRow database={database} key={database.name} />
              ))}
            </div>
          )}
        </Card.Content>
      </Card.Root>

      <div className="rounded-card border bg-muted/25 px-5 py-4 text-sm sm:px-6">
        <div className="flex items-start gap-3">
          <CircleAlertIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          <div>
            <h2 className="font-medium">
              <Trans message="Acesso protegido" />
            </h2>
            <p className="mt-1 max-w-3xl text-muted-foreground">
              <Trans message="Use as credenciais protegidas da hospedagem para conectar seu site. Senhas não são exibidas nem copiadas nesta página." />
            </p>
          </div>
        </div>
      </div>

      <CreateDatabaseDialog
        accountId={account.id}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}

function UnavailableDatabases({onRetry}: {onRetry: () => void}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 pb-6 text-center">
      <CircleAlertIcon className="size-8 text-warning" />
      <h2 className="mt-3 font-medium">
        <Trans message="Bancos de dados indisponíveis" />
      </h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        <Trans message="O painel de hospedagem não respondeu. Tente novamente sem alterar sua conta." />
      </p>
      <Button className="mt-4" variant="outline" onClick={onRetry}>
        <RefreshCwIcon />
        <Trans message="Tentar novamente" />
      </Button>
    </div>
  );
}

function DatabaseRow({database}: {database: HostingDatabase}) {
  return (
    <div className="grid gap-4 px-4 py-4 sm:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)] sm:px-6">
      <CopyValue
        icon={<DatabaseIcon />}
        label={<Trans message="Banco" />}
        value={database.name}
        copyLabel="Copiar nome do banco"
      />
      <CopyValue
        icon={<ServerIcon />}
        label={<Trans message="Servidor" />}
        value={database.host}
        copyLabel="Copiar servidor do banco"
      />
      <CopyValue
        icon={<UserIcon />}
        label={<Trans message="Usuário" />}
        value={database.username ?? ''}
        copyLabel="Copiar usuário do banco"
      />
    </div>
  );
}

function CopyValue({
  icon,
  label,
  value,
  copyLabel,
}: {
  icon: ReactNode;
  label: ReactNode;
  value: string;
  copyLabel: string;
}) {
  const [copied, copy] = useClipboard(value);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-button bg-primary/10 text-primary [&>svg]:size-4">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="mt-0.5 truncate font-medium">
          {value || <Trans message="Aguardando sincronização" />}
        </div>
      </div>
      {value && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={copyLabel}
          onClick={copy}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </Button>
      )}
    </div>
  );
}

function CreateDatabaseDialog({
  accountId,
  open,
  onOpenChange,
}: {
  accountId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState('');
  const create = useMutation({
    ...createHostingDatabaseOptions(accountId),
    onSuccess: () => {
      setName('');
      onOpenChange(false);
      toast.success(<Trans message="Banco de dados criado com sucesso." />);
    },
    onError: error => showHttpErrorToast(error),
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate(name.trim());
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>
              <DatabaseIcon />
              <Trans message="Criar banco de dados" />
            </Dialog.Title>
            <Dialog.Description>
              <Trans message="Escolha um nome curto. O painel pode adicionar automaticamente o usuário como prefixo." />
            </Dialog.Description>
          </Dialog.Header>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="database-name" className="text-sm font-medium">
                <Trans message="Nome do banco" />
              </label>
              <Input
                id="database-name"
                className="mt-2"
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="wordpress"
                autoComplete="off"
                minLength={1}
                maxLength={32}
                pattern="[A-Za-z][A-Za-z0-9_]*"
                required
              />
              <p className="mt-2 text-xs text-muted-foreground">
                <Trans message="Comece com uma letra e use somente letras, números ou sublinhado." />
              </p>
            </div>
            <Dialog.Footer>
              <Dialog.CloseButton disabled={create.isPending}>
                <Trans message="Cancelar" />
              </Dialog.CloseButton>
              <Button type="submit" disabled={create.isPending || !name.trim()}>
                {create.isPending && <LoaderCircleIcon className="animate-spin" />}
                <Trans message="Criar banco" />
              </Button>
            </Dialog.Footer>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
