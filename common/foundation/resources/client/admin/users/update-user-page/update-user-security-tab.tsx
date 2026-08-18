import {User} from '@app/gen/schemas/user';
import {Card} from '@shadcn/card/card';
import {Badge} from '@shadcn/badge/badge';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {Trans} from '@ui/i18n/trans';
import {
  KeyRoundIcon,
  MonitorSmartphoneIcon,
  ShieldCheckIcon,
} from 'lucide-react';
import {ReactNode} from 'react';
import {useOutletContext} from 'react-router';

export function Component() {
  const user = useOutletContext() as User;
  const session = user.latest_user_session;

  return (
    <div className="grid gap-6 p-6 lg:grid-cols-2">
      <Card.Root>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <ShieldCheckIcon className="size-5" />
            <Trans message="Segurança do usuário" />
          </Card.Title>
          <Card.Description>
            <Trans message="Esta visão é somente informativa. Ações da conta do administrador não são reutilizadas aqui." />
          </Card.Description>
        </Card.Header>
        <Card.Content className="space-y-4 text-sm">
          <SecurityLine
            label={<Trans message="E-mail" />}
            value={
              user.email_verified_at ? (
                <Badge variant="outline" color="positive">
                  <Trans message="Verificado" />
                </Badge>
              ) : (
                <Badge variant="outline" color="warning">
                  <Trans message="Pendente" />
                </Badge>
              )
            }
          />
          <SecurityLine
            label={<Trans message="Autenticação em duas etapas" />}
            value={
              user.two_factor_confirmed_at ? (
                <Badge variant="outline" color="positive">
                  <Trans message="Ativa" />
                </Badge>
              ) : (
                <Badge variant="outline">
                  <Trans message="Não configurada" />
                </Badge>
              )
            }
          />
          <SecurityLine
            label={<Trans message="Tokens pessoais ativos" />}
            value={`${user.tokens?.length ?? 0}`}
          />
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <MonitorSmartphoneIcon className="size-5" />
            <Trans message="Acesso mais recente" />
          </Card.Title>
          <Card.Description>
            <Trans message="Resumo seguro da atividade conhecida para o usuário selecionado." />
          </Card.Description>
        </Card.Header>
        <Card.Content className="space-y-4 text-sm">
          {session ? (
            <>
              <SecurityLine
                label={<Trans message="Dispositivo" />}
                value={`${session.device} · ${session.platform}`}
              />
              <SecurityLine
                label={<Trans message="Navegador" />}
                value={session.browser}
              />
              <SecurityLine
                label={<Trans message="Última atividade" />}
                value={
                  session.updated_at ? (
                    <FormattedDate date={session.updated_at} />
                  ) : (
                    <Trans message="Não informada" />
                  )
                }
              />
            </>
          ) : (
            <div className="flex items-start gap-3 rounded-card-sm bg-muted/50 p-4 text-muted-foreground">
              <KeyRoundIcon className="mt-0.5 size-5 shrink-0" />
              <Trans message="Nenhuma sessão recente foi carregada para este usuário." />
            </div>
          )}
        </Card.Content>
      </Card.Root>
    </div>
  );
}

function SecurityLine({label, value}: {label: ReactNode; value: ReactNode}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-4 border-b pb-4 last:border-b-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 text-end font-medium">{value}</span>
    </div>
  );
}
