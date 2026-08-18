# Divergências e questões conhecidas

> Revisado em 10 de agosto de 2026

## Produto alvo versus base atual

| Tema             | Base atual                           | HospedFree alvo            | Tratamento                         |
| ---------------- | ------------------------------------ | -------------------------- | ---------------------------------- |
| Produto          | links, biolinks, QR e analytics      | hospedagem gratuita e paga | conversão em fases                 |
| Identidade       | referências MeuLinkBio no código     | marca HospedFree           | docs concluídos; código pendente   |
| Conta            | users/workspaces                     | conta HospedFree           | preservar até decisão arquitetural |
| Billing          | foundation genérica                  | planos pagos de hosting    | adaptar sem destruir               |
| Hospedagem       | não confirmada nesta base            | accounts/packages/orders   | implementar localmente             |
| Provider         | nenhum adapter HospedFree confirmado | MOFH atrás de contrato     | planejar e testar                  |
| Domínio gratuito | ausente                              | hsite.top                  | implementar                        |
| SSL/DNS          | fundação parcial/domínios            | workflow de hosting        | integrar com segurança             |
| Suporte/KB       | capacidades precisam de inventário   | suporte ligado à conta     | implementar/adaptar                |

## Referências versus produto

| Referência             | Pode orientar                             | Não pode definir                             |
| ---------------------- | ----------------------------------------- | -------------------------------------------- |
| HospedFree antigo      | módulos, fluxos, vocabulário e pendências | código, identidade atual, segurança ou preço |
| Plugins Botble antigos | responsabilidades de domínio              | arquitetura Laravel/React da nova base       |
| Bixa                   | lista de capacidades e casos de uso       | segurança, implementação ou dados            |
| BeLink/Vebto           | proveniência da base herdada              | produto HospedFree ou updater/licença        |

## Decisões abertas

- preços, moeda final e períodos dos planos pagos;
- quotas e diferenciais Free/Pago;
- número de contas por usuário;
- catálogo de aplicações/Softaculous;
- experiência de File Manager/WebFTP;
- custom domains;
- Cloudflare como recurso obrigatório ou opcional;
- ACME/SSL e responsabilidades de renovação;
- política de inatividade/suspensão do gratuito;
- uso aceitável, retenção, backup e recuperação;
- SLA, suporte e comunicação de incidentes;
- migração de clientes/dados do projeto antigo;
- remoção técnica dos módulos herdados de links.

## Riscos da base herdada

- nomes, traduções, manifests e assets MeuLinkBio ainda existem no código;
- links/biolinks/QR continuam conectados a rotas, banco, políticas e frontend;
- lint global possui dívida anterior;
- format check global possui muitos arquivos importados;
- build já apresentou aviso de eval em host privilegiado de anúncios;
- uploads, HTML/SVG, webhooks, billing e custom domains são superfícies sensíveis;
- a base local não possui repositório Git próprio nesta cópia, reduzindo rastreabilidade.

## Resíduo histórico de licenciamento

A base anterior removeu purchase-code Envato/Vebto e updater remoto. Uma migration histórica contém o nome de uma classe PurchaseCode numa lista de normalização. Isso não ativa licenciamento.

Não editar migrations históricas ou reintroduzir endpoints de licença.

## Dívida documental resolvida nesta fase

- PRODUCT, DESIGN, README e AGENTS agora definem HospedFree;
- marca canônica e logos foram identificados;
- referências antigas foram separadas de implementação;
- planos gratuito e pago foram confirmados;
- MOFH e hsite.top foram confirmados como alvo;
- links/biolinks/QR foram classificados fora do escopo;
- plugins antigos e Bixa foram mapeados sem cópia.

## Próximos documentos antes de código sensível

- ADR de identidade/ownership;
- ADR do catálogo e ciclo de pedidos;
- contrato do provider MOFH;
- modelo de estados de provisionamento;
- política de credenciais;
- política de uso aceitável e retenção;
- matriz de planos aprovada;
- plano de remoção/adaptação dos módulos herdados.

# HospedFree current status note

Updated: 2026-08-10

The hosting core now exists in this base: `app/Hosting`, `app/Knowledge`, `app/Support`, `/api/v1/hosting` APIs, customer hosting UI, admin operations, admin plan/package mapping, support and knowledge base.

Remaining divergences: legacy links/biolinks/QR code remains in code but is hidden from HospedFree navigation and public fallback; MOFH requires authorized disposable smoke testing; paid plans require admin-configured prices, quotas, packages and gateways; legal pages and acceptable-use policy remain required before public launch.

# Bixa parity status note

Updated: 2026-08-12

Custom domains, additional subdomains, WebFTP/File Manager, SSL/ACME, Cloudflare/DNS automation, Site.Pro/Site Builder, MySQL management, statistics, Softaculous, support and knowledge are no longer treated as distant optional evolutions. They are now target capabilities for Bixa functional parity inside the HospedFree panel.

Open decisions are limited to plan limits, operational policy, provider smoke testing, exact UI sequencing and rollout safety. They are not permission to omit those capabilities from the roadmap.

# Architecture/UI convergence note

Updated: 2026-08-12

Some early HospedFree admin and customer screens were implemented with custom layouts that do not fully match the current foundation admin/dashboard architecture. That is now tracked as a blocking convergence task before additional Bixa parity features are layered on top.

Specific corrections required:

- "Planos e pacotes" must adapt the existing billing/products/subscriptions flow with hosting provider package mapping;
- admin hosting screens must use standard foundation admin tables, filters, row actions, dialogs, settings and empty states;
- customer hosting screens must stay inside standard dashboard flows and not send operational actions primarily to public marketing/pricing pages;
- admin settings must expose provider/tool configuration for MOFH/VistaPanel, WebFTP/File Manager, Cloudflare, ACME/SSL, Site.Pro/Site Builder, allowed domains, tool enablement and health checks.
