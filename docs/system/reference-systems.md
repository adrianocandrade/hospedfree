# Sistemas de referência — HospedFree

> Inventário documental de 10 de agosto de 2026. Nenhum código ou dado foi copiado.

## Política

Os sistemas abaixo foram lidos para entender domínio, fluxos e experiências:

- HospedFree antigo: D:\ARQUIVOS\PROJETOS\2025\SITES\hospedfree
- Plugins antigos: D:\ARQUIVOS\PROJETOS\2025\SITES\hospedfree\platform\plugins
- Bixa: D:\ARQUIVOS\PROJETOS\2025\SITES\hospedfree\bixa-2.0.1

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

Bixa é uma aplicação Laravel 11 de gerenciamento de hospedagem usada como referência funcional.

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
| Softaculous/Site.Pro | ambos | integração pendente |
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
