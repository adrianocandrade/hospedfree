# Operações — HospedFree

> Revisado em 10 de agosto de 2026

## Estado

As instruções locais abaixo refletem a base atual. A operação de produção HospedFree ainda depende de decisões de infraestrutura, provider, banco, filas, e-mail, DNS, SSL e pagamentos.

## Requisitos

- PHP 8.2 ou superior;
- Composer 2;
- Node.js 22 ou superior;
- npm 10 ou superior;
- MySQL/MariaDB em implantação normal;
- SQLite somente para desenvolvimento/teste isolado;
- extensões Laravel e PDO adequadas;
- Redis/Horizon, busca, realtime e storage conforme recursos habilitados.

## Instalação local

    composer install
    npm install
    copy .env.example .env
    php artisan key:generate
    php artisan migrate
    npm run dev

No Windows, pcntl e posix não existem. Para desenvolvimento local sem Horizon:

    composer install --no-interaction --prefer-dist --ignore-platform-req=ext-pcntl --ignore-platform-req=ext-posix

Isso não é recomendação de produção. Produção Linux deve satisfazer os requisitos reais.

## Ambiente isolado

- Não copiar .env, banco ou storage do projeto antigo.
- Usar banco próprio do hospedfree-base.
- Não registrar credenciais reais em documentação.
- APP_URL deve corresponder ao host local usado.
- O web root de implantação aponta para public.

Para execução local:

    php artisan serve --port=8011

## Build e implantação

- instalar dependências com lock files;
- revisar e executar migrations de forma controlada;
- gerar assets com npm run build;
- configurar cache de Laravel conforme o ambiente;
- iniciar scheduler e workers quando usados;
- não usar updater web ou download remoto de pacote;
- manter rollback de release e backup de banco.

## Scheduler e filas

A base possui tarefas herdadas. Antes de ativar produção:

- inventariar tarefas que ainda pertencem a links/biolinks;
- desabilitar somente por mudança revisada;
- criar filas próprias para provider/provisionamento;
- definir retry, timeout, backoff e idempotência;
- não repetir operações de criação sem chave idempotente;
- redigir falhas antes de persistir ou enviar ao observability.

O scheduler Laravel normalmente é acionado a cada minuto. Workers/Horizon são necessários quando queue não é sync.

## Billing

Billing atual fica em common/foundation/src/Billing e é candidato a reaproveitamento para hospedagem paga.

Antes de oferecer um plano:

- aprovar pacote, preço, moeda, período e limites;
- mapear produto comercial para pacote técnico;
- validar webhooks;
- separar pagamento confirmado de provisionamento concluído;
- definir reembolso, cancelamento e falha de ativação;
- testar upgrade/downgrade e renovação.

## MOFH

MOFH é provider interno, nunca identidade pública.

Operação planejada:

- adapter com interface estável;
- secrets somente em ambiente/configuração protegida;
- sandbox/fake para desenvolvimento;
- timeout e retry limitados;
- logs redigidos;
- callback autenticado/validado;
- reconciliação periódica sem sobrescrever estado local cegamente;
- identificador de correlação seguro.

Nunca enviar payload bruto, senha ou chave em e-mail, frontend, ticket ou log.

## hsite.top

- disponibilidade precisa ser validada pelo domínio local e pelo provider;
- lista de subdomínios reservados deve ser configurável;
- normalização e unicidade ocorrem antes do provisionamento;
- não prometer reserva antes de confirmação;
- mudanças de DNS e SSL devem mostrar estado de propagação.

## DNS, Cloudflare e SSL

Cloudflare e ACME são integrações alvo, não dependências confirmadas.

- criptografar tokens;
- restringir escopos;
- manter zona/domínio vinculados ao proprietário;
- nunca logar chave privada;
- validar domínio antes de emissão;
- usar jobs idempotentes;
- testar apenas com domínios descartáveis autorizados;
- não desativar verificação TLS.

## Arquivos e deploy

- validar tamanho, MIME e conteúdo;
- impedir path traversal e symlink escape;
- bloquear .env, .git, .github, node_modules, chaves privadas e backups;
- não apagar conteúdo remoto inteiro sem modo explícito e recuperação;
- uma implantação concorrente por conta é o padrão inicial;
- Git v1 aceita somente repositório público;
- logs mostram etapas, não conteúdo sensível.

## Observabilidade

Registrar:

- evento e estado;
- IDs internos/correlação;
- duração;
- resultado seguro;
- retry;
- operador/ator quando aplicável.

Não registrar:

- senha;
- token;
- cookie;
- 2FA;
- chave privada;
- corpo bruto do provider;
- dados de pagamento;
- conteúdo de arquivo do cliente.

## Matriz de ambientes

| Ambiente | Provider | Pagamento | DNS/SSL | Dados |
| --- | --- | --- | --- | --- |
| Teste unitário | fake | fake | fake | factories |
| Local | fake/sandbox | sandbox | fake | banco isolado |
| Staging público | conta descartável | sandbox | domínio descartável | sintéticos |
| Produção | real | real | real | mínimos necessários |

Testes reais de MOFH, callback, Cloudflare ou ACME nunca devem rodar contra contas/domínios de clientes.

## Validação

Checks usuais:

    composer test:php
    npm run lint
    npm run typecheck
    npm run format:check
    npm run build
    php artisan route:list

Gerar API somente quando rotas/schemas mudarem:

    composer api-docs

Há dívida global herdada de lint e formatação registrada em divergences-and-known-issues.md. Não afirmar sucesso sem executar.
