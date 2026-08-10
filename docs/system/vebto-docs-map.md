# BeLink/Vebto — proveniência da base herdada

> Documento histórico. Não é referência funcional do HospedFree.

## Contexto

A base Laravel/React foi derivada de um sistema BeLink/Vebto antes de se tornar MeuLinkBio e agora HospedFree. Documentação Vebto ajuda apenas a explicar estruturas herdadas.

## Fontes históricas

- categoria BeLink;
- requisitos de servidor;
- instalação;
- cron;
- source code;
- custom domains;
- subscriptions;
- Stripe e PayPal;
- social login;
- roles e permissions;
- Nginx;
- e-mail;
- S3/Backblaze.

O mapa anterior registrava URLs da central support.vebto.com. Confirmar uma página diretamente antes de confiar nela, pois documentação externa pode mudar.

## Não aplicável

- purchase code;
- login Envato para validar compra;
- ativação de pacote;
- upload de archive distribuído pelo marketplace;
- updater remoto;
- rota web /update;
- substituição de diretórios baixados.

Essas superfícies foram removidas e não devem ser reintroduzidas.

## Ainda relevante como capacidade herdada

- billing e subscriptions;
- gateways;
- users/workspaces/permissions;
- uploads;
- localization;
- custom-domain foundation;
- instalação e operações Laravel.

O código local é a autoridade. A semântica deve ser adaptada a hosting, não preservada apenas porque aparece na documentação do fornecedor.

## Regra

Não copiar páginas completas de fornecedor para este repositório. Resumir somente o necessário, registrar data de revisão e comparar com o código atual.
