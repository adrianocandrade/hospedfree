# Remove Legacy License System

> Histórico da base anterior. Continua válido como guardrail: licenciamento por purchase code e updater remoto não pertencem ao HospedFree. Billing de planos pagos de hospedagem é produto e permanece separado desse licenciamento.

## Removed

- Purchase-code activation API: `license/register-purchase-code`.
- Admin License and Updates tabs under System settings.
- Generated TypeScript client and schemas for purchase-code activation.
- Envato OAuth login and purchase validation.
- Envato/Vebto service configuration and `ENVATO_*` environment variables.
- Remote updater routes, commands, scheduler entry, UI, and updater classes that called Vebto support endpoints or replaced application directories.
- License/update site alerts.

## Preserved

- Billing, subscriptions, trials, products, invoices, Stripe, PayPal, and related settings.
- `composer.json` package license metadata and dependency license comments.
- `update:run`, because it executes local update actions and does not require a purchase code.

## Operational Notes

- Existing deployments should remove any `ENVATO_*`, `ENVATO_PURCHASE_CODE`, and `DISABLE_UPDATE_AUTH` values from environment management.
- Do not add a migration that deletes users, plans, subscriptions, invoices, or payment data.
- If old database settings contain social Envato keys, leave them inert or clean them with a targeted, reversible admin-data cleanup after backup.
