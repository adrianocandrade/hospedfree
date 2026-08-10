# Baseline de segurança — HospedFree

> Revisado em 10 de agosto de 2026. Combina riscos atuais da base e requisitos do produto alvo.

## Invariantes P0

- Não logar ou expor senhas, tokens, cookies, segredos de 2FA, chaves privadas, credenciais de storage/pagamento ou payloads privados.
- Todo recurso de cliente precisa de autenticação, autorização e escopo de proprietário/workspace.
- Toda ação administrativa precisa de permissão explícita e auditoria.
- Provider fica atrás de adapter; callbacks/webhooks são autenticados.
- TLS nunca é desabilitado.
- Credenciais recuperáveis são criptografadas em repouso quando armazenamento for inevitável.
- Ações de provisionamento são idempotentes.
- Falha de provisionamento após pagamento precisa de recuperação visível e operacional.
- Upload/deploy bloqueia path traversal, arquivos sensíveis e substituição destrutiva não autorizada.
- Testes reais usam contas e domínios descartáveis autorizados.

Violação P0 bloqueia release.

## Identidade e ownership

- A base atual usa users/workspaces; manter essa verdade até ADR.
- Não copiar members/member_id do Botble antigo.
- Não aceitar IDs do cliente sem resolver a relação pelo usuário autenticado.
- Admin global e cliente possuem políticas separadas.
- Listagem, export, busca e contadores também precisam de escopo.
- workspace_id=all nunca pode ampliar acesso sem permissão global.

## Credenciais

- mascaradas por padrão;
- reveal explícito e, quando apropriado, autenticação recente;
- copy não persiste o conteúdo;
- reset exige confirmação e explica impacto;
- nunca em e-mail/ticket/notificação;
- nunca em query string;
- nunca em analytics;
- campos sensíveis usam casts/serviços de criptografia e hidden serialization;
- rotação e revogação devem ser possíveis.

## Provider MOFH

- segredo apenas no servidor;
- timeout, retries e backoff limitados;
- proteção contra duplicidade;
- validação de certificado TLS;
- validação/redação de resposta;
- erro interno convertido em mensagem segura;
- API log com metadados mínimos;
- callback com assinatura, segredo, allowlist ou mecanismo comprovado;
- replay protection quando possível;
- reconciliação não confia cegamente em estado remoto.

## Pedidos, pagamentos e provisionamento

- validar pacote ativo e preço no servidor;
- nunca confiar em price/package vindo do browser;
- webhook de pagamento autenticado e idempotente;
- pagamento completed não define hosting active;
- registrar transições permitidas;
- bloquear transições impossíveis e duplo provisionamento;
- definir compensação, suporte, reembolso e retry;
- não expor gateway/provider payload.

## Domínios, DNS e SSL

- normalizar e validar hostname;
- bloquear subdomínios reservados;
- confirmar ownership antes de ação de DNS/custom domain;
- tokens Cloudflare com escopo mínimo e criptografados;
- chave privada ACME nunca em log;
- não emitir para domínio não validado;
- proteger contra SSRF em verificações remotas;
- rate limit em disponibilidade e emissão;
- separar estado DNS, validação e certificado.

## Uploads, ZIP e Git

- limites de tamanho e quantidade;
- MIME/assinatura, não apenas extensão;
- path traversal e symlink escape;
- negar .env, .git, .github, node_modules, private keys, dumps e backups;
- Git v1 somente público;
- não armazenar token Git até desenho próprio;
- sandbox de processamento;
- uma operação concorrente por conta como padrão;
- deploy não destrutivo por padrão;
- logs redigidos e retenção limitada.

## Suporte e conhecimento

- ticket ligado somente à conta autorizada;
- anexos seguem regras de upload;
- admin vê dados conforme permissão;
- mensagens e notificações não incluem senha;
- rich text sanitizado;
- busca não vaza artigo restrito;
- avaliação protegida contra abuso.

## Abuso e LGPD

- rate limiting em login, cadastro, disponibilidade, provider, tickets e ferramentas;
- captcha conforme risco;
- e-mail verificado quando configurado;
- coletar somente nome, e-mail, credencial própria e dados operacionais necessários;
- CPF, telefone, endereço e documento não são obrigatórios no MVP sem justificativa;
- definir retenção, exclusão, exportação e resposta a incidentes;
- política de uso aceitável é obrigatória antes de produção pública;
- moderação/suspensão deve ser auditável.

## Riscos atuais herdados

- DISABLE_CSRF deve ficar false fora de debug local excepcional;
- TRUSTED_PROXIES somente para infraestrutura conhecida;
- HTML, SVG e anúncios são superfícies privilegiadas;
- uploads/S3/TUS exigem revisão;
- Stripe/PayPal webhooks exigem testes;
- custom domains e host resolution exigem revisão;
- o build herdado já sinalizou eval em host de anúncios;
- módulos de links/biolinks têm policies e dados que não podem ser removidos parcialmente.

## Referência Bixa: padrões rejeitados

Foram observados:

- TLS verification desabilitada;
- raw callback logging;
- senha de hosting em e-mail.

Esses padrões são explicitamente proibidos.

## Testes mínimos

- IDOR entre dois clientes;
- permissão admin;
- callbacks/webhooks inválidos e replay;
- criação repetida/idempotência;
- pagamento aprovado com provisionamento falho;
- redaction de logs/exceptions;
- criptografia/serialização de credenciais;
- ZIP traversal e arquivo sensível;
- Git privado rejeitado sem token;
- domínio reservado/duplicado;
- DNS/SSL sem ownership;
- XSS em ticket/artigo/provider message;
- CSRF e rate limit;
- suspensão, reativação e exclusão;
- upgrade/downgrade e mudança de pacote.

## Baseline herdado preservado

A estabilização anterior:

- corrigiu checagem de passwords de recursos;
- adicionou regressão de workspace_id=all;
- adicionou headers de segurança;
- configurou trusted proxies por env;
- removeu purchase-code/updater;
- atualizou dependências Composer auditadas na época.

Isso é registro histórico, não substitui nova auditoria após a conversão.
