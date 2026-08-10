# Divergências e questões conhecidas

> Revisado em 10 de agosto de 2026

## Produto alvo versus base atual

| Tema | Base atual | HospedFree alvo | Tratamento |
| --- | --- | --- | --- |
| Produto | links, biolinks, QR e analytics | hospedagem gratuita e paga | conversão em fases |
| Identidade | referências MeuLinkBio no código | marca HospedFree | docs concluídos; código pendente |
| Conta | users/workspaces | conta HospedFree | preservar até decisão arquitetural |
| Billing | foundation genérica | planos pagos de hosting | adaptar sem destruir |
| Hospedagem | não confirmada nesta base | accounts/packages/orders | implementar localmente |
| Provider | nenhum adapter HospedFree confirmado | MOFH atrás de contrato | planejar e testar |
| Domínio gratuito | ausente | hsite.top | implementar |
| SSL/DNS | fundação parcial/domínios | workflow de hosting | integrar com segurança |
| Suporte/KB | capacidades precisam de inventário | suporte ligado à conta | implementar/adaptar |

## Referências versus produto

| Referência | Pode orientar | Não pode definir |
| --- | --- | --- |
| HospedFree antigo | módulos, fluxos, vocabulário e pendências | código, identidade atual, segurança ou preço |
| Plugins Botble antigos | responsabilidades de domínio | arquitetura Laravel/React da nova base |
| Bixa | lista de capacidades e casos de uso | segurança, implementação ou dados |
| BeLink/Vebto | proveniência da base herdada | produto HospedFree ou updater/licença |

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
