# Testing reference

## Documentation-only

- check referenced paths;
- search for secrets/private payload examples;
- audit active MeuLinkBio claims;
- verify current/target/reference labels;
- validate skill frontmatter and routing;
- confirm old reference directories were not modified.

## Backend

- composer test:php;
- focused feature/unit tests;
- php artisan route:list when routes change;
- composer api-docs when API changes.

Hosting tests should cover ownership, idempotency, provider failure, callback auth, payment/provisioning separation, credential redaction, domain uniqueness, SSL/DNS authorization and deploy traversal.

## Frontend

- npm run typecheck;
- npm run build;
- npm run lint where relevant;
- accessible browser smoke in an isolated environment.

Cover keyboard/mobile/error/loading/permission/plan-limited states and ensure credentials do not enter DOM/logs before reveal.

## Production integrations

MOFH, Cloudflare, ACME and payment end-to-end tests require approved staging/production with disposable accounts/domains. Never run them against customer data.

Do not claim a global check passed unless it was run and green.
