import {HostingAccount} from '@app/hosting/hosting-types';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {Alert} from '@shadcn/alert/alert';
import {LinkButton} from '@shadcn/button/button';
import {Card} from '@shadcn/card/card';
import {Trans} from '@ui/i18n/trans';
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  Clock3Icon,
  Globe2Icon,
  ListIcon,
  ServerIcon,
} from 'lucide-react';
import {useOutletContext} from 'react-router';

export function Component() {
  const {account} = useOutletContext<{account: HostingAccount}>();
  const isActive = account.status === 'active';

  return (
    <div className="mx-auto w-full max-w-3xl py-2 sm:py-6">
      <StaticPageTitle>
        <Trans message="Hospedagem adicionada" />
      </StaticPageTitle>

      <Card.Root className="overflow-hidden shadow-sm ring-border/80">
        <Card.Content className="p-6 sm:p-8">
          <div className="flex size-12 items-center justify-center rounded-card bg-positive/10 text-positive">
            <CheckCircle2Icon className="size-6" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-[-0.025em] text-balance sm:text-3xl">
            <Trans message="Sua hospedagem foi adicionada" />
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            <Trans
              message=":domain agora aparece na sua conta. A preparação acontece em segundo plano e o status será atualizado automaticamente."
              values={{domain: account.fqdn}}
            />
          </p>

          <Alert.Root
            variant={isActive ? 'positive' : 'default'}
            fillStyle={isActive ? 'subtleFill' : 'border'}
            className="mt-6"
          >
            {isActive ? <CheckCircle2Icon /> : <Clock3Icon />}
            <Alert.Title>
              {isActive ? (
                <Trans message="Hospedagem ativa" />
              ) : (
                <Trans message="Preparação em andamento" />
              )}
            </Alert.Title>
            <Alert.Description>
              {isActive ? (
                <Trans message="A conta técnica já está pronta. A propagação do endereço ainda pode levar alguns minutos." />
              ) : (
                <Trans message="Você pode sair desta tela. O painel continuará acompanhando a ativação sem criar outra solicitação." />
              )}
            </Alert.Description>
          </Alert.Root>

          <div className="mt-7 border-t pt-6">
            <h2 className="text-sm font-semibold">
              <Trans message="Próximos passos" />
            </h2>
            <ul className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <li className="flex min-w-0 gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-card-xs bg-primary/10 text-primary">
                  <ServerIcon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="font-medium">
                    <Trans message="Acompanhe o status" />
                  </p>
                  <p className="mt-1 leading-5 text-muted-foreground">
                    <Trans message="O painel mostra quando a hospedagem e as ferramentas estiverem prontas." />
                  </p>
                </div>
              </li>
              <li className="flex min-w-0 gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-card-xs bg-primary/10 text-primary">
                  <Globe2Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="font-medium break-all">{account.fqdn}</p>
                  <p className="mt-1 leading-5 text-muted-foreground">
                    <Trans message="Este é o endereço principal reservado para a nova hospedagem." />
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <LinkButton
              variant="outline"
              to="/dashboard/hosting"
              className="min-h-11"
            >
              <ListIcon />
              <Trans message="Minhas hospedagens" />
            </LinkButton>
            <LinkButton
              to={`/dashboard/hosting/${account.id}`}
              className="min-h-11"
            >
              <Trans message="Acompanhar hospedagem" />
              <ArrowRightIcon />
            </LinkButton>
          </div>
        </Card.Content>
      </Card.Root>
    </div>
  );
}
