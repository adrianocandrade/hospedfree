# Widgets de biolink — inventário herdado

## Estado

Widgets, blocos comerciais, embeds, mídia, pagamentos e QR relacionados à página de biolink são funcionalidades herdadas e fora do escopo HospedFree.

Eles permanecem no código por segurança da conversão, não por decisão de produto.

## Não reutilizar por nome

- link cards;
- perfis e redes;
- produtos/serviços de biolink;
- coleções, carrosséis e embeds;
- badges;
- QR de página;
- temas e aparência pública;
- analytics de página.

Algumas capacidades técnicas, como upload, payments, layouts ou analytics, podem ser candidatas a infraestrutura somente após separar ownership, dados e semântica.

## Regras

- não adicionar novos widgets;
- não apresentar recursos na landing HospedFree;
- não apagar tabelas ou uploads sem inventário;
- não reutilizar modelos comerciais como planos de hospedagem;
- não transportar dados de páginas para contas de hosting;
- não confundir pagamento de widget/produto com assinatura de hospedagem.

## Checklist para remoção

- rotas públicas e API;
- models, migrations e relations;
- policies e workspace scope;
- jobs/events/webhooks;
- uploads;
- OpenAPI/cliente gerado;
- templates/seeders;
- traduções;
- billing/restrictions;
- testes;
- documentação e assets.
