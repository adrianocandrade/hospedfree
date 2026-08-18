import {
  hostingToolsOptions,
  openHostingToolOptions,
} from '@app/hosting/hosting-queries';
import {
  HostingAccount,
  HostingTool,
  HostingToolKey,
} from '@app/hosting/hosting-types';
import {showHttpErrorToast} from '@common/http/errors/show-http-error-toast';
import {Badge} from '@shadcn/badge/badge';
import {Button, LinkButton} from '@shadcn/button/button';
import {Empty} from '@shadcn/empty/empty';
import {Skeleton} from '@shadcn/skeleton/skeleton';
import {useMutation, useQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {
  BlocksIcon,
  DatabaseIcon,
  ExternalLinkIcon,
  FileCode2Icon,
  FolderOpenIcon,
  GaugeIcon,
  KeyRoundIcon,
  PanelTopIcon,
  ShieldCheckIcon,
  WrenchIcon,
} from 'lucide-react';
import {useOutletContext} from 'react-router';

const toolPresentation: Record<
  HostingToolKey,
  {label: string; description: string; icon: typeof WrenchIcon}
> = {
  'control-panel': {
    label: 'Painel de hospedagem',
    description: 'Administre os recursos fornecidos para esta conta.',
    icon: PanelTopIcon,
  },
  webftp: {
    label: 'Gerenciador de arquivos (WebFTP)',
    description: 'Envie, edite e organize os arquivos da sua hospedagem.',
    icon: FolderOpenIcon,
  },
  installer: {
    label: 'Instalador de aplicativos',
    description:
      'Acesse o catálogo com segurança; quando necessário, selecione o instalador dentro do painel.',
    icon: BlocksIcon,
  },
  'file-manager': {
    label: 'Gerenciador de arquivos',
    description: 'Abra o gerenciador externo configurado pelo administrador.',
    icon: FileCode2Icon,
  },
  'site-builder': {
    label: 'Construtor de site',
    description: 'Edite o site usando uma sessão autorizada pelo servidor.',
    icon: PanelTopIcon,
  },
  ssl: {
    label: 'HTTPS e SSL',
    description: 'Acompanhe solicitações e validações de certificado.',
    icon: ShieldCheckIcon,
  },
  mysql: {
    label: 'Bancos MySQL',
    description: 'Crie e acompanhe bancos quando a integração estiver ativa.',
    icon: DatabaseIcon,
  },
  stats: {
    label: 'Estatísticas e limites',
    description: 'Consulte uso e quotas sincronizadas da conta.',
    icon: GaugeIcon,
  },
};

const internalRoutes: Partial<Record<HostingToolKey, string>> = {
  'file-manager': 'files',
  ssl: 'ssl',
  mysql: 'databases',
  stats: '',
  'site-builder': 'site-builder',
};

export function Component() {
  const {account} = useOutletContext<{account: HostingAccount}>();
  const tools = useQuery(hostingToolsOptions(account.id));
  const openTool = useMutation({
    ...openHostingToolOptions(account.id),
    onSuccess: data => window.open(data.url, '_blank', 'noopener,noreferrer'),
    onError: error => showHttpErrorToast(error),
  });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <section className="overflow-hidden rounded-card border bg-card">
        <div className="border-b px-5 py-4 sm:px-6">
          <h1 className="text-lg font-semibold">
            <Trans message="Ferramentas da hospedagem" />
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            <Trans message="Somente ferramentas configuradas e autorizadas pelo servidor podem ser abertas. Credenciais nunca são adicionadas à URL." />
          </p>
        </div>

        {tools.isLoading ? (
          <div className="space-y-2 p-5 sm:p-6">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : tools.isError ? (
          <Empty.Root className="min-h-72">
            <Empty.Header>
              <Empty.Media variant="icon">
                <WrenchIcon />
              </Empty.Media>
              <Empty.Title>
                <Trans message="Não foi possível carregar as ferramentas" />
              </Empty.Title>
              <Empty.Description>
                <Trans message="Verifique sua conexão e tente carregar novamente." />
              </Empty.Description>
            </Empty.Header>
            <Button variant="outline" onClick={() => tools.refetch()}>
              <Trans message="Tentar novamente" />
            </Button>
          </Empty.Root>
        ) : tools.data?.length ? (
          <div className="divide-y">
            {tools.data.map(tool => (
              <ToolRow
                key={tool.key}
                account={account}
                tool={tool}
                opening={openTool.isPending && openTool.variables === tool.key}
                onOpen={() => openTool.mutate(tool.key)}
              />
            ))}
          </div>
        ) : (
          <Empty.Root className="min-h-72">
            <Empty.Header>
              <Empty.Media variant="icon">
                <WrenchIcon />
              </Empty.Media>
              <Empty.Title>
                <Trans message="Nenhuma ferramenta configurada" />
              </Empty.Title>
              <Empty.Description>
                <Trans message="O administrador ainda precisa configurar as integrações desta hospedagem." />
              </Empty.Description>
            </Empty.Header>
          </Empty.Root>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-card border bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="font-semibold">
            <Trans message="Credenciais da conta" />
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            <Trans message="Revele dados protegidos ou solicite uma nova senha em uma tela dedicada." />
          </p>
        </div>
        <LinkButton
          to={`/dashboard/hosting/${account.id}/credentials`}
          variant="outline"
        >
          <KeyRoundIcon />
          <Trans message="Gerenciar credenciais" />
        </LinkButton>
      </section>
    </div>
  );
}

function ToolRow({
  account,
  tool,
  opening,
  onOpen,
}: {
  account: HostingAccount;
  tool: HostingTool;
  opening: boolean;
  onOpen: () => void;
}) {
  const presentation = toolPresentation[tool.key];
  const Icon = presentation.icon;
  const internalRoute =
    tool.key === 'webftp' && account.tools.file_manager
      ? 'files'
      : internalRoutes[tool.key];
  const enabled = tool.available && account.status === 'active';
  const availabilityLabel = !tool.available
    ? 'Não configurado'
    : account.status === 'active'
      ? 'Disponível'
      : 'Aguardando ativação';

  return (
    <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-medium">
              <Trans message={presentation.label} />
            </h2>
            <Badge variant={enabled ? 'positive' : 'secondary'}>
              <Trans message={availabilityLabel} />
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <Trans message={presentation.description} />
          </p>
        </div>
      </div>

      {internalRoute !== undefined ? (
        enabled ? (
          <LinkButton
            to={`/dashboard/hosting/${account.id}${internalRoute ? `/${internalRoute}` : ''}`}
            variant="outline"
          >
            <Trans message="Abrir" />
          </LinkButton>
        ) : (
          <Button variant="outline" disabled>
            <Trans message="Abrir" />
          </Button>
        )
      ) : (
        <Button
          variant="outline"
          disabled={!enabled || opening}
          onClick={onOpen}
        >
          <Trans message={opening ? 'Abrindo...' : 'Abrir'} />
          <ExternalLinkIcon />
        </Button>
      )}
    </div>
  );
}
