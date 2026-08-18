# Auditoria de segurança e conclusão — 13 de agosto de 2026

## Escopo

Esta auditoria cobre as APIs autenticadas, ownership das hospedagens, tokens pessoais, alteração de perfil, WebFTP/File Manager, sincronização de domínios, Site.Pro, histórico de e-mails e acessos e a cobertura das configurações administrativas.

O objetivo deste documento é registrar causas e tarefas. Nenhuma conclusão abaixo substitui teste HTTP com dois usuários e tokens reais antes do lançamento.

## Resumo executivo

O isolamento principal das hospedagens está corretamente baseado no usuário autenticado: os controllers de conta, domínio, arquivo, banco, SSL, estatísticas e suporte resolvem o recurso por ownership antes de executar a integração remota. Os testes focados atuais também cobrem traversal, redaction, permissões administrativas e alguns cenários entre clientes.

Os blocos de identidade e histórico seguro foram implementados em 13 de agosto de 2026. A matriz HTTP IDOR cobre token atacante e sessão de navegador nas superfícies de hospedagem e suporte. O endereço anterior agora é avisado após a troca de e-mail, eventos explícitos aparecem com IP mascarado, a retenção é configurável e o MIME administrativo usa permissões granulares com auditoria persistida. Permanecem como bloqueadores os smoke tests autorizados das integrações externas e a remoção/auditoria final das superfícies herdadas. A lista abaixo registra os achados originais que motivaram o bloco:

1. A rota genérica de atualização de usuário mistura edição administrativa e autoatendimento. Um usuário verificado, ou um token pessoal roubado, pode alterar a senha sem informar a senha atual. A mesma rota permite trocar o e-mail sem um fluxo de verificação próprio e recebe `email_is_verified`.
2. Tokens pessoais são criados sem abilities específicas e sem expiração definida no contrato da aplicação. O token herda toda a autoridade do usuário nas APIs que aceitam Sanctum.
3. A tela de segurança de um usuário dentro do admin reutiliza componentes da conta autenticada. Ela pode mostrar sessões e executar ações da conta do próprio administrador enquanto aparenta estar administrando o usuário selecionado.
4. O File Manager conclui operações remotas, mas vários componentes substituem o `onSuccess` que invalidaria o cache. Por isso upload, exclusão, rename, move, ZIP e outras operações só aparecem depois de atualização manual.
5. O estado de domínio não possui um ciclo local persistido completo. A interface sempre mostra sincronização da conta, mesmo quando conta e domínio estão ativos, e a query de domínios não possui polling condicional.
6. O Site.Pro possui apenas abertura de sessão para um domínio. Ainda não existe gestão de sites/domínios atribuídos, plano do builder e ciclo criar/abrir/remover semelhante à referência visual.
7. O log de e-mail existente armazena o MIME completo por sete dias e é acessível a qualquer usuário considerado admin. Isso pode incluir links de recuperação e outros tokens presentes no corpo da mensagem. Falta permissão granular, auditoria de leitura e uma visão segura por usuário.

Implementado neste bloco:

- o autoatendimento genérico não aceita e-mail, senha, verificação, roles ou permissões;
- troca de e-mail usa senha atual, estado pendente, código com hash e expiração de 30 minutos;
- tokens pessoais têm abilities, TTL, limite de quantidade e são negados em rotas de autenticação recente;
- a segurança administrativa ficou somente leitura para o usuário selecionado e não reutiliza ações da conta do administrador;
- WebFTP e domínios invalidam consultas em `onSettled`;
- `hosting_domains` persiste estado, DNS, falhas e próxima reconciliação; polling e job param no estado ativo;
- ferramentas externas usam ticket interno de uso único, `no-store` e `no-referrer`;
- o salto intermediário com credenciais do Softaculous é consumido no servidor;
- Site.Pro possui página por domínios ativos pertencentes à hospedagem e revalida ownership antes de abrir a sessão.
- a matriz HTTP owner/attacker cobre conta, domínios, arquivos, bancos, SSL, ferramentas, chamados e ações protegidas por confirmação recente; nega acesso antes de criar eventos ou operações;
- a mudança de plano agora resolve ownership antes de validar payload comercial, evitando que uma conta alheia revele diferenças de validação;
- a área “Atividade” separa sessões/tokens e histórico de e-mails da tela de senha/2FA;
- `customer_communications` guarda somente metadados allowlisted e nunca MIME, destinatário, corpo, cabeçalhos, OTP, link ou classe interna.
- o e-mail anterior recebe um aviso seguro depois da confirmação da troca, sem revelar o novo endereço, OTP, link assinado ou token;
- login, falha, logout, senha, e-mail, 2FA, tokens e encerramento de sessões geram eventos explícitos com IP mascarado;
- retenção de comunicações, eventos, auditoria administrativa, sessões e MIME pode ser configurada entre 1 e 3650 dias;
- metadados, conteúdo e download do log MIME exigem permissões independentes; leitura e exportação geram auditoria administrativa persistida.

## Classificação dos achados

### P0 — bloqueia lançamento

#### SEC-01 — atualização de conta permite mudança de senha fora do fluxo seguro

Status: corrigido e coberto pela matriz HTTP de regressão para token e sessão de navegador.

Evidência:

- `common/foundation/src/Users/Requests/UpdateUserRequest.php` aceita `password` com mínimo de três caracteres.
- `common/foundation/src/Users/Controllers/UsersController.php` usa esse request também para o próprio usuário.
- `common/foundation/src/Core/Policies/UserPolicy.php` autoriza o usuário a atualizar o próprio registro.
- `common/foundation/src/Auth/Fortify/UpdateUserPassword.php` já contém o fluxo correto com `current_password`, mas pode ser contornado pela rota genérica.

Impacto: um token pessoal roubado de um usuário verificado pode trocar a senha e consolidar o comprometimento da conta.

Correção requerida:

- separar `UpdateOwnProfileRequest` de `AdminUpdateUserRequest`;
- remover `password`, `roles`, `permissions` e `email_is_verified` do autoatendimento genérico;
- permitir senha somente pelo controller Fortify que exige senha atual;
- invalidar/revogar sessões e tokens conforme a política definida após troca de senha;
- adicionar testes HTTP com cookie e bearer token.

#### SEC-02 — troca de e-mail não possui verificação dedicada

Status: corrigido. Fluxo pendente + OTP, senha atual e aviso seguro ao endereço anterior estão implementados e cobertos por teste.

Evidência:

- `UpdateUserRequest` aceita `email` e `email_is_verified` na mesma superfície.
- `UpdateUser` altera `email_verified_at`, mas não implementa um fluxo dedicado de confirmação do novo endereço.
- A rota é protegida por `verified`, portanto um usuário ainda não verificado não consegue simplesmente se verificar. Porém um usuário já verificado pode trocar o endereço sem comprovar ownership do novo e-mail e preservar/forçar estado de verificação na mesma superfície.

Correção requerida:

- mudança de e-mail exige senha atual;
- gravar novo e-mail como pendente, enviar confirmação e só promover após token válido;
- `email_is_verified` deve existir somente no request administrativo com permissão explícita e auditoria;
- notificar o endereço antigo sobre a alteração.

#### SEC-03 — tokens pessoais sem escopo operacional

Status: corrigido com abilities, TTL, limite e middleware de sessão/ability.

Evidência:

- `AccessTokenController::store` usa `createToken($tokenName)` sem abilities ou validade informada.
- a role padrão de usuário contém `api.access`;
- `VerifyApiAccessMiddleware` valida apenas a permissão geral e não uma ability por rota.

Correção requerida:

- feature flag para habilitar tokens pessoais;
- abilities mínimas: leitura de hospedagem, arquivos, domínios, bancos e suporte separadamente;
- TTL obrigatório, limite de tokens, `last_used_at`, criação com confirmação de senha e revogação visível;
- negar bearer token em troca de senha/e-mail, 2FA, reveal de credenciais, exclusão de conta e outras ações que exigem autenticação recente;
- matriz automatizada rota × ability × owner/attacker.

### P1 — alta prioridade

#### SEC-04 — cobertura IDOR no transporte HTTP

Status: corrigido para as rotas atuais de cliente.

O padrão `whereKey($id)->where('user_id', $request->user()->id)->firstOrFail()` está presente nos controllers de hospedagem. Os testes atuais confirmam vários cenários entre clientes, mas parte deles chama controllers diretamente.

A suíte HTTP usa usuários distintos, token Sanctum atacante com todas as abilities de cliente e sessão de navegador atacante. Ela cobre:

- conta: show, reveal, reset, reconcile, change plan, tools, delete e cancel delete;
- domínio: list, verify, create e delete;
- arquivos: list, read, download, create, upload, update e delete;
- bancos: list e create;
- SSL: list, create, verify e delete;
- tickets: list, show, reply, attachment e close.

Aceite validado: o usuário B nunca lê nem altera recursos do usuário A; a resposta é 404/403, e as contagens de eventos/operações permanecem inalteradas. As rotas de autenticação recente também rejeitam bearer tokens em teste dedicado.

#### SEC-05 — painel admin de segurança atua sobre a conta errada

Status: corrigido removendo ações ambíguas e exibindo somente dados do usuário selecionado.

`common/foundation/resources/client/admin/users/update-user-page/update-user-security-tab.tsx` recebe o usuário selecionado, porém reutiliza `ChangePasswordPanel` e `SessionsPanel`, que operam sobre o usuário autenticado.

Correção requerida:

- remover esses painéis da edição administrativa até existirem endpoints próprios;
- ou criar APIs administrativas explícitas, permissionadas e auditadas para sessões/reset;
- nunca apresentar uma ação como sendo do cliente quando ela atua sobre o administrador.

#### SEC-06 — Site.Pro devolve token de sessão ao navegador

Status: corrigido com redirect broker interno descartável. A sessão externa só é criada após o consumo do ticket.

`SiteProHostingSiteBuilderProvider` rejeita credenciais comuns na query, mas aceita `login_hash` e devolve a URL completa para o frontend. Esse hash é um bearer de sessão e pode alcançar histórico, logs do navegador e referrer.

Correção requerida:

- preferir redirect broker server-side de uso único;
- resposta `no-store` e `Referrer-Policy: no-referrer`;
- registrar somente domínio/resultado, nunca URL ou hash;
- validar TTL e uso único conforme contrato oficial do Site.Pro;
- documentar a exceção se o provider obrigar token na URL e bloquear lançamento até os controles compensatórios serem validados.

#### SEC-07 — log de e-mail guarda conteúdo sensível com permissão ampla

Status: corrigido. A projeção segura do cliente é isolada do MIME; metadados, conteúdo e download possuem permissões separadas, retenção configurável e auditoria persistida.

O subscriber grava o MIME completo e o job limpa registros depois de sete dias. O controller exige apenas `isAdmin`, permite visualizar corpo/headers e baixar `.eml`.

Correção requerida:

- criar `mail.logs.view` e `mail.logs.view_content` separadas;
- auditar leitura e download;
- armazenar por padrão metadados, template, destinatário, status e timestamps;
- redigir tokens de recuperação, links assinados, cookies e anexos sensíveis;
- nome de download deve ser sanitizado;
- retenção configurável com limite seguro.

Controle compensatório já entregue: `customer_communications` é uma tabela separada e allowlisted, vinculada ao usuário. Ela guarda somente tipo funcional, assunto seguro, canal, status e horários. A API é restrita ao próprio usuário, e-mail verificado e sessão de navegador; não serializa classe da notificação nem conteúdo técnico.

### P2 — produto e confiabilidade

#### UX-01 — File Manager não atualiza após mutações

Status: corrigido com invalidação `onSettled` nas factories de arquivos e domínios.

Causa confirmada: as factories em `resources/client/hosting/hosting-queries.ts` invalidam o prefixo da query de arquivos. Em `hosting-files-tab.tsx`, cada `useMutation` adiciona outro `onSuccess`, substituindo a invalidação original.

Operações afetadas: upload, create, write, rename, copy, move, archive, extract e delete.

Correção requerida:

- compor callbacks em vez de sobrescrever;
- atualizar o cache imediatamente para create/delete/rename quando seguro;
- sempre invalidar o prefixo da conta no `onSettled` como reconciliação;
- manter estado de progresso e bloquear duplo envio;
- testar que a lista muda sem reload após cada operação.

O mesmo padrão aparece em `hosting-domains-tab.tsx` para verify, create e delete.

#### UX-02 — sincronização de domínio não encerra no estado saudável

Status: persistência, backoff, polling condicional e remoção da CTA saudável implementados. Falta smoke test com DNS real autorizado.

Hoje `hostingDomainsOptions` não faz polling e o overview sempre exibe “Sincronizar”. A sincronização acionada é da conta inteira, não um ciclo específico do domínio.

Correção requerida:

- persistir domínios em `hosting_domains` com tipo, status local/remoto, document root, DNS, `verified_at`, `last_checked_at`, `next_check_at` e erro seguro;
- job idempotente de reconciliação com backoff enquanto o domínio estiver pendente;
- parar polling/job quando o domínio estiver `active/configured`;
- esconder o botão quando conta e domínio estiverem saudáveis;
- exibir ação manual somente em estado pendente, recuperável ou desatualizado;
- atualizar o cache assim que `next_action` for `none`.

#### PROD-01 — gestão do construtor de site está incompleta

Status: página por domínio ativo e abertura segura implementadas. Plano remoto, publicação/removal e incidentes dependem de contrato oficial ainda não comprovado e não são simulados.

O contrato atual oferece apenas `createSession()` e `healthCheck()`. A experiência alvo precisa de uma página própria, usando as imagens anexadas apenas como direção visual:

- lista de sites por domínio pertencente à hospedagem;
- domínio atribuído/não atribuído;
- plano da hospedagem e plano real do builder;
- criar/atribuir, abrir, remover/desatribuir e pesquisar;
- estados indisponível, pendente, ativo e incidente;
- nenhum upgrade, preço ou limite inventado.

Antes de implementar, confirmar no contrato oficial do Site.Pro quais operações remotas existem. O que não existir deve ser persistido localmente sem fingir estado remoto.

#### PROD-02 — histórico de acessos e comunicações precisa ser produto, não log técnico

Status: corrigido no escopo atual. Sessões, tokens, comunicações e eventos explícitos estão disponíveis; IP é mascarado e a retenção é configurável no admin.

Já existem `user_sessions` e uma tela de sessões para o próprio usuário. Falta um histórico de segurança orientado ao cliente:

- login/logout, nova sessão, falha relevante, troca de senha/e-mail, 2FA, token criado/revogado e ação sensível;
- IP mascarável, dispositivo, localização aproximada, horário e opção de encerrar sessões;
- retenção e privacidade configuráveis.

Para e-mails, a projeção `customer_communications` foi criada sem MIME e ligada ao `user_id`. A administração do log técnico ainda precisa de permissões granulares, auditoria e retenção configurável.

## Cobertura de configurações

### Já existe no admin

- driver MOFH/fake, URL, usuário, segredo e host FTP;
- timeouts, connect timeout e retries;
- CNAME, zonas permitidas, painel, WebFTP, instalador e fallback;
- File Manager, FTPS, modo passivo, raiz, ZIP, limites e editor;
- VistaPanel;
- Site.Pro, credenciais, endpoint, hosts permitidos e health check;
- SSL, manutenção, ACME, Cloudflare e health checks.

### Ainda precisa de decisão/tela

- domínio base, subdomínios reservados e carência de exclusão;
- UTF-8 do FTP, limite de download, limite de edição e extensões editáveis;
- política de sincronização de domínio: intervalo, backoff, expiração e máximo de tentativas;
- política de tokens: habilitação, abilities, TTL, quantidade e revogação;
- retenção de sessões, eventos de segurança e e-mails;
- permissões granulares para logs e administração de sessões;
- catálogo/plano do Site Builder, quando suportado pelo contrato;
- saúde de queue/cron, último job executado e alertas operacionais;
- status/incidentes exibíveis ao cliente sem expor nomes internos do provider.

Alguns valores de alto risco, como allowlist de diretórios ACME e configuração OpenSSL, podem permanecer somente em ambiente/deploy. O admin deve mostrar que estão configurados, sem permitir uma alteração ampla e insegura pelo navegador.

## Auditoria de interface

| Dimensão | Nota | Observação |
|---|---:|---|
| Acessibilidade | 7/10 | Os fluxos novos usam componentes Foundation e labels; faltam testes de foco/announcement após mutações e revisão completa das telas herdadas em inglês. |
| Performance | 7/10 | Queries são segmentadas e o ciclo de domínios está persistido, mas o build ainda possui chunks legados grandes. |
| Responsividade | 8/10 | Dashboard e hospedagem foram validados em 375 px; a nova área de atividade segue componentes Foundation, mas ainda requer smoke visual autenticado. |
| Theming | 8/10 | Tokens semânticos e shell HospedFree estão consistentes nas telas novas. |
| Integridade | 8/10 | Mutações invalidam o estado visível, sincronização saudável encerra e a segurança administrativa não executa ações ambíguas. Continuam pendentes validações externas autorizadas. |

## Ordem recomendada

1. Corrigir SEC-01, SEC-02, SEC-03 e SEC-05 antes de ampliar funcionalidades.
2. Manter a matriz HTTP IDOR/token atualizada sempre que uma rota de cliente for adicionada.
3. Corrigir invalidação/atualização otimista do File Manager e domínios.
4. Persistir o ciclo de domínio e encerrar sincronização automaticamente no estado saudável.
5. Endurecer o redirect Site.Pro e criar a gestão de sites por domínio.
6. Ampliar acessos para eventos de segurança e tornar o log MIME uma ferramenta granular e auditada.
7. Completar configurações operacionais e executar smoke tests autorizados.

## Validação executada nesta auditoria

- `php artisan test tests/Feature/Hosting/HostingLifecycleTest.php tests/Feature/Hosting/AdminHostingSettingsControllerTest.php`
  - 47 testes passaram;
  - 249 asserções passaram.
- `php artisan route:list` foi executado para hosting, users, access tokens e outgoing e-mail.
- detector estático do Impeccable foi executado nos módulos de hosting, admin hosting e account settings, sem achados automáticos adicionais. Os problemas de estado descritos acima foram confirmados por inspeção do fluxo React Query.

Esses checks registram o baseline que antecedeu a matriz HTTP. A validação posterior abaixo cobre a matriz atual; ainda não autoriza lançamento público sem os smoke tests externos e pendências P0/P1 restantes.

Validação após as correções de segurança e integração:

- suíte PHP completa: 368 testes e 1677 asserções passaram;
- conjunto focado de hosting e segurança: 49 testes e 306 asserções passaram; a matriz owner/attacker isolada passou com 41 asserções;
- `npx tsc --noEmit`, Oxlint focado, geração do cliente OpenAPI e build de produção passaram;
- as migrations aditivas de ciclo de domínios, troca segura de e-mail e comunicação segura do cliente foram aplicadas somente após backups SQL verificados;
- o build mantém apenas os avisos herdados de `eval` no módulo antigo de anúncios e bundles grandes.
