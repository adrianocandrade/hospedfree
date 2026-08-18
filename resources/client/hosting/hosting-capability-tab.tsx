import {HostingAccount} from '@app/hosting/hosting-types';
import {LinkButton} from '@shadcn/button/button';
import {Empty} from '@shadcn/empty/empty';
import {Trans} from '@ui/i18n/trans';
import {DatabaseIcon, FilesIcon, Globe2Icon, WrenchIcon} from 'lucide-react';
import {useLocation, useOutletContext} from 'react-router';

const capabilityConfig = {
  domains: {
    icon: Globe2Icon,
    title: 'Gerenciamento de domínios ainda não conectado',
    description:
      'Seu domínio principal continua ativo. Domínios próprios, subdomínios adicionais e validação DNS serão liberados quando o contrato de domínios estiver conectado ao provider.',
    detailLabel: 'Domínio principal',
  },
  files: {
    icon: FilesIcon,
    title: 'Gerenciador de arquivos nativo ainda não conectado',
    description:
      'Enquanto as APIs seguras de arquivos estão sendo implementadas, use somente as ferramentas externas que aparecerem como disponíveis na conta.',
    detailLabel: 'Diretório de publicação',
  },
  databases: {
    icon: DatabaseIcon,
    title: 'Gerenciamento de MySQL ainda não conectado',
    description:
      'A criação e listagem de bancos serão habilitadas depois da integração segura com o painel da hospedagem. Nenhuma senha será exibida nesta tela.',
    detailLabel: 'Servidor SQL',
  },
} as const;

export function Component() {
  const {pathname} = useLocation();
  const {account} = useOutletContext<{account: HostingAccount}>();
  const key = pathname.endsWith('/domains')
    ? 'domains'
    : pathname.endsWith('/files')
      ? 'files'
      : 'databases';
  const config = capabilityConfig[key];
  const Icon = config.icon;
  const detail =
    key === 'domains'
      ? account.fqdn
      : key === 'files'
        ? '/htdocs'
        : account.technical.sql_host;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <section className="overflow-hidden rounded-card border bg-card">
        <div className="border-b px-5 py-4 sm:px-6">
          <h1 className="text-lg font-semibold">
            <Trans
              message={
                key === 'domains'
                  ? 'Domínios'
                  : key === 'files'
                    ? 'Arquivos'
                    : 'Bancos de dados'
              }
            />
          </h1>
        </div>

        <Empty.Root className="min-h-80 px-5 py-10">
          <Empty.Header>
            <Empty.Media variant="icon">
              <Icon />
            </Empty.Media>
            <Empty.Title>
              <Trans message={config.title} />
            </Empty.Title>
            <Empty.Description>
              <Trans message={config.description} />
            </Empty.Description>
          </Empty.Header>
          <Empty.Content className="w-full max-w-md">
            <dl className="mb-5 grid gap-1 rounded-input border bg-muted/30 px-4 py-3 text-left">
              <dt className="text-xs font-medium text-muted-foreground">
                <Trans message={config.detailLabel} />
              </dt>
              <dd className="text-sm font-medium break-all">
                {detail ?? <Trans message="Aguardando sincronização" />}
              </dd>
            </dl>
            <LinkButton
              to={`/dashboard/hosting/${account.id}/tools`}
              variant="outline"
            >
              <WrenchIcon />
              <Trans message="Ver ferramentas disponíveis" />
            </LinkButton>
          </Empty.Content>
        </Empty.Root>
      </section>
    </div>
  );
}
