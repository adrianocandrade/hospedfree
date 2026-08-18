# Sistemas de referência — HospedFree

> Inventário documental de 10 de agosto de 2026. Nenhum código ou dado foi copiado.

## Política

Os sistemas abaixo foram lidos para entender domínio, fluxos e experiências:

- HospedFree antigo: D:\ARQUIVOS\PROJETOS\2025\SITES\hospedfree
- Plugins antigos: D:\ARQUIVOS\PROJETOS\2025\SITES\hospedfree\platform\plugins
- Bixa: D:\ARQUIVOS\PROJETOS\2025\SITES\bixa

Eles são read-only e não são dependências do hospedfree-base.

Permitido:

- identificar responsabilidades de módulos;
- aprender vocabulário e sequência de tarefas;
- registrar casos de uso, lacunas e riscos;
- criar uma implementação nova adequada à arquitetura atual.

Proibido:

- copiar PHP, JavaScript, views, migrations ou configuração;
- importar banco, usuários, tickets, artigos ou contas;
- copiar .env, tokens, cookies, chaves ou provider payloads;
- tratar regras antigas como contrato atual;
- reproduzir padrões inseguros;
- usar assets sem origem/licença confirmada.

## HospedFree antigo

### Arquitetura observada

Aplicação baseada em Botble com:

- painel administrativo;
- autenticação separada de membros/clientes;
- tema público HospedFree;
- plugins centrais e plugins customizados;
- integrações de hosting acopladas ao ecossistema do projeto antigo.

No projeto antigo, admins usam users e clientes usam members/auth member; hosting usa member_id. Essa decisão não deve ser copiada. A base nova usa users/workspaces até ADR próprio.

### Produto documentado

- público iniciante, estudantes, criadores, freelancers e projetos pequenos;
- hospedagem sem cartão;
- endereço hsite.top;
- PHP, MySQL, SSL e caminho de instalação;
- painel em português;
- suporte e base de conhecimento;
- evolução posterior para plano pago.

Esses pontos orientaram PRODUCT.md, mas limites e garantias precisam ser aprovados.

## Plugins personalizados antigos

### hospedfree-hosting

Responsabilidade observada:

- pacotes de hospedagem;
- contas e domínios;
- pedidos;
- configuração administrativa;
- API logs;
- fake provider e provider MOFH;
- provisionamento;
- vínculo com pagamentos;
- entry points para painel externo/File Manager/WebFTP/Softaculous;
- repositórios Git e deployments;
- Site.Pro.

Entidades/artefatos observados:

- packages;
- hosting accounts;
- domains;
- hosting orders;
- provider API logs;
- Git repositories;
- deployments.

Contrato de provider observado como referência:

- verificar domínio;
- criar;
- suspender;
- reativar;
- excluir;
- alterar senha;
- alterar pacote.

Fluxo de pedido observado:

    plano -> endereço -> disponibilidade -> revisão -> pagamento quando necessário -> provisionamento

Estados históricos de pedido:

- pending_payment;
- payment_pending;
- provisioning;
- completed;
- failed;
- canceled.

Esses nomes não são obrigatórios. O requisito preservado é separar cobrança e provisionamento.

Regra histórica encontrada:

- uma migration atribuía R$ 5,90/mês ao pacote Pro quando o preço era zero.

Esse valor é apenas resíduo histórico e não pode entrar no catálogo novo.

Pontos para reimplementar:

- provider adapter;
- idempotência;
- limite por plano;
- subdomínios reservados;
- unicidade e disponibilidade;
- estados independentes de pagamento/provisionamento;
- redaction de logs;
- fake/sandbox.

### hospedfree-ssl

Responsabilidade observada:

- registros de certificados;
- telas de cliente/admin;
- status e operações SSL.

Reimplementar apenas após definir ownership, emissão, armazenamento de metadados, renovação e segredo. Chave privada nunca deve ser persistida ou logada sem desenho criptográfico explícito.

### hospedfree-cloudflare

Responsabilidade observada:

- token criptografado;
- modo sandbox/teste;
- zonas;
- registros DNS;
- logs;
- ação ligada ao fluxo SSL.

Reimplementar com token de escopo mínimo, criptografia, logs redigidos e separação por conta/domínio.

### hospedfree-tools

Ferramentas observadas:

- Base64;
- transformação de caixa;
- beautifier de código;
- seletor de cor;
- CSS Grid;
- WHOIS.

Essas ferramentas são secundárias. Não devem preceder o núcleo de hospedagem e segurança. WHOIS deve respeitar disponibilidade, rate limit e privacidade da fonte.

### hospedfree-knowledge

Responsabilidade observada:

- categorias;
- artigos;
- busca pública;
- avaliações;
- administração;
- ordenação/popularidade;
- conteúdo inicial.

O projeto antigo tinha cerca de 20 artigos iniciais. Conteúdo não deve ser copiado automaticamente; novos artigos precisam refletir a nova interface.

### hospedfree-migration

Responsabilidade observada:

- conexão legada;
- análise/dry-run;
- runs e items;
- execução;
- placeholder seguro;
- guardas de rollback.

Migração deve ser um projeto separado, auditável e reversível. Nunca apontar uma ferramenta de desenvolvimento para produção sem autorização, backup e dry-run.

### fob-ticksify modificado

Responsabilidade observada:

- suporte rebatizado;
- tickets e mensagens;
- categorias;
- vínculo com hospedagem;
- telas cliente/admin;
- contador e atalhos.

Na base nova, implementar suporte de acordo com ownership local. Não copiar modificações do plugin.

## Plugins genéricos observados

O diretório antigo também continha plugins comuns do ecossistema Botble:

- 2FA;
- ads;
- analytics;
- announcement;
- audit-log;
- backup;
- block;
- blog;
- captcha;
- contact;
- cookie-consent;
- custom-field;
- FAQ;
- comments;
- gallery;
- language/language-advanced;
- member;
- newsletter;
- payment;
- PayPal;
- Paystack;
- Razorpay;
- request-log;
- RSS;
- social login;
- SSLCommerz;
- Stripe;
- testimonial;
- translation;
- ativação/licenciamento do pacote.

Essa lista é inventário, não roadmap. A base Laravel/React atual deve oferecer ou selecionar capacidades equivalentes de acordo com o produto. Ativadores/licenciamento de pacote não devem retornar.

## Tema público antigo

O tema platform/themes/hospedfree oferecia shortcodes ou seções para:

- hero;
- recursos;
- planos;
- FAQ;
- CTA;
- blog;
- comparações;
- contato;
- passos de criação;
- páginas legais.

Ele ajudou a identificar a arquitetura de conteúdo, mas não deve ser copiado. O visual alvo está em docs/brand-hospedfree.md e docs/brand/site-structure.md.

## Direção de painel observada

Documentos antigos exploravam:

- Plus Jakarta Sans/Inter;
- roxo #605FA6 e lavanda #AEAAD4;
- sidebar de aproximadamente 280 px;
- tema escuro e claro;
- cards de hosting;
- status;
- credenciais mascaradas.

A nova decisão é light-first com a paleta canônica #5C5AA4/#766CAF/#ACA9D4. Escuro é opcional no painel.

## Pendências registradas no projeto antigo

- custom domains;
- callbacks e sincronização real do MOFH;
- camada segura de WebFTP/File Manager;
- comunicação/newsletter;
- execução real de migração Bixa;
- testes de produção MOFH/ACME/Cloudflare;
- amadurecimento do fluxo de deploy.

Elas continuam pendências de referência, não tarefas automaticamente aprovadas.

## Bixa 2.0.1

### Papel

Bixa é uma aplicação Laravel de gerenciamento de hospedagem usada como referência funcional para integração MOFH reseller, VistaPanel/WebFTP, SSL, tickets e base de conhecimento.

Capacidades observadas:

- hospedagem MOFH;
- criação e gerenciamento de contas;
- VistaPanel/cPanel entry points;
- Softaculous;
- WebFTP;
- SSL/ACME;
- tickets;
- base de conhecimento;
- perfil e 2FA;
- notificações;
- WHOIS e ferramentas;
- administração de usuários, hosting, suporte, conteúdo, e-mail, anúncios, domínios e migração;
- integrações com IconCaptcha, Site.Pro e SMTP.

Uma afirmação histórica do Bixa menciona até três hospedagens; isso não define o limite HospedFree.

### Padrões proibidos encontrados

- verificação TLS desabilitada em integração VistaPanel;
- callback registrado de forma bruta;
- e-mails contendo senha de hospedagem.

A nova implementação deve fazer o oposto:

- verificar TLS;
- autenticar callback e redigir payload;
- nunca enviar senha em e-mail;
- armazenar credencial somente se necessário e criptografada;
- usar autenticação recente para revelação/reset.

### Uso correto

Usar Bixa para perguntar quais casos de uso existem, nunca para responder como implementá-los. A arquitetura, os modelos, as políticas, a segurança e os testes serão definidos na base nova.

### Mapeamento MOFH extraído

O Bixa usa `infinityfree/mofh-client` e não chamadas HTTP genéricas com sufixo `.php`. A base nova adotou essa dependência no provider MOFH, mantendo o contrato interno `HostingProvider`.

Fluxos reaproveitados como comportamento:

- `checkavailable`: disponibilidade remota de domínio;
- `createacct`: cria conta com username MOFH curto, senha gerada, e-mail, domínio e pacote;
- `getuserdomains`: reconcilia estado da conta;
- `suspendacct`: suspende conta;
- `unsuspendacct`: reativa conta;
- `passwd`: redefine senha.

Diferença crítica preservada:

- username curto enviado ao MOFH fica em `hosting_accounts.provider_account_id`;
- username VistaPanel retornado pelo provider fica em `hosting_accounts.username`;
- operações remotas usam `provider_account_id`, não o usuário VistaPanel.

O Bixa também tinha callback MOFH sem prova de autenticação forte. A base nova não depende disso para ativar contas; usa reconciliação periódica. Se callback for adicionado depois, ele deve ter token/assinatura, rate limit, auditoria e payload redigido.

### Mapeamento VistaPanel/WebFTP extraído

O Bixa implementa integração por scraping/session para:

- login VistaPanel;
- token `ttt`;
- link Softaculous;
- estatísticas de disco/banda/inodes;
- quota e criação/listagem de bancos MySQL;
- subdomínios;
- CNAME;
- WebFTP próprio por FTP.

Essas capacidades entram no backlog técnico, mas não devem ser copiadas literalmente porque foram encontrados padrões incompatíveis com as regras atuais:

- TLS desabilitado em chamadas cURL;
- logs com resposta bruta;
- risco de expor sessão/cookie/credencial;
- File Manager externo com credenciais na URL.

Implementação correta futura:

1. criar contrato provider-neutral para ferramentas VistaPanel;
2. exigir TLS;
3. redigir logs;
4. validar paths e ownership;
5. não serializar senha;
6. não enviar credenciais por query string;
7. testar com conta descartável autorizada.

O fluxo de verificação de domínio próprio agora usa o endpoint MOFH `getCname` através da biblioteca já instalada, não o scraping inseguro do Bixa. O hash normalizado forma o host de validação (`<hash>.<domínio>`), o destino CNAME é configurável pelo admin e a propagação é consultada no servidor. A automação de Addon Domains continua separada porque o projeto de referência não contém um contrato de formulário verificável para criar ou remover esse domínio.

## Matriz de adoção

| Capacidade | Fonte de inspiração | Decisão |
| --- | --- | --- |
| hsite.top | HospedFree antigo | alvo confirmado |
| MOFH | antigo + Bixa | alvo confirmado atrás de adapter |
| Free + Pago | antigo + base billing | produto confirmado |
| Provider fake/sandbox | plugin antigo | requisito de desenvolvimento |
| SSL/Cloudflare | plugins antigos + Bixa | alvo, desenho pendente |
| Suporte/KB | plugins antigos + Bixa | alvo |
| Git deploy | plugin antigo | alvo opcional com regras seguras |
| File Manager/WebFTP | ambos | experiência e segurança pendentes |
| Softaculous/Site.Pro | ambos | Site.Pro integrado; Softaculous acessível pelo painel porque o redirecionamento direto do VistaPanel expõe a senha e é bloqueado |
| Migração de legado | plugin antigo | projeto separado |
| Links/biolinks/QR | base atual | fora do escopo |

## Critério para transformar referência em código

1. Confirmar necessidade no PRODUCT.
2. Definir contrato e threat model.
3. Verificar capacidades reutilizáveis na base atual.
4. Projetar modelos e ownership.
5. Implementar do zero na arquitetura local.
6. Testar com fake/sandbox.
7. Executar integração real somente em ambiente autorizado.
8. Atualizar module-map.md com caminhos reais.

## Atualizacao 2026-08-12: Bixa parity

Bixa passa a ser a referencia funcional principal para a paridade de hospedagem do novo HospedFree. A meta nao e copiar o Bixa, mas entregar no painel HospedFree as mesmas capacidades centrais de operacao de hospedagem, usando a arquitetura atual.

Capacidades Bixa agora classificadas como alvo principal da conversao:

- MOFH reseller account lifecycle;
- VistaPanel/cPanel entrypoints;
- Softaculous;
- WebFTP e File Manager nativo;
- Site.Pro/Site Builder;
- SSL/ACME;
- Cloudflare/DNS para validacao e certificados;
- dominio proprio;
- subdominios adicionais;
- bancos MySQL;
- estatisticas e quotas;
- tickets de suporte;
- base de conhecimento e FAQ publica.

Regras mantidas:

- Bixa define quais casos de uso precisam existir, nao como o codigo deve ser copiado;
- users, workspaces, billing e permissoes da base atual continuam sendo a fonte de verdade;
- dados sensiveis, contas, usuarios, tickets, credenciais, `.env`, cookies e provider payloads do Bixa nao sao migrados;
- knowledge pode ser recriado ou importado apenas apos sanitizacao e revisao;
- integracoes com MOFH, VistaPanel, WebFTP, Cloudflare, ACME e Site.Pro devem ficar atras de contratos internos;
- credenciais, cookies, callbacks brutos e respostas cruas do provider nao podem chegar ao frontend, logs comuns, notificacoes ou URLs.
