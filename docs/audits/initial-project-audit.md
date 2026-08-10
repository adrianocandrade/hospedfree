# Initial Project Audit

> Registro histórico da estabilização da base anterior, antes da definição do HospedFree. Referências a MeuLinkBio, links e biolinks descrevem a origem do código e não o produto alvo. Não reescrever fatos históricos como se fossem implementação de hospedagem.

## Snapshot

- Stack: Laravel 12.58.0, PHP 8.4 locally, React 19, Vite 8, Tailwind CSS 4, TypeScript strict mode.
- Package managers: Composer and npm with existing lock files.
- Repository state: this directory is not currently a git repository, so change tracking was done by direct file inspection.
- Missing baseline files before this work: `README.md`, `.env.example`, `docs/`, and `.agents/`.
- Dependency state before this work: `node_modules` was absent and `vendor/bin/phpunit` / `vendor/bin/phpstan` were absent.

## Main Findings

- Legacy Envato/Vebto licensing existed through purchase-code API routes, admin License UI, generated API clients, `ENVATO_*` config, site alerts, remote update commands, and updater classes that downloaded and replaced app files.
- Billing and subscription routes were separate from licensing and remain part of the product.
- Password-protected link/folder/biolink policies compared `Hash::make(request('password'))` with stored hashes, which cannot work reliably because bcrypt hashes are salted.
- `phpunit.xml` referenced `bootstrap/autoload.php`, which does not exist in this Laravel 12 layout.
- Security posture needed explicit notes around CSRF kill switches, trusted proxies, custom HTML/SVG rendering, upload validation, and workspace scoping.

## Preserved Areas

- Billing plans, subscriptions, trials, invoices, Stripe, PayPal, and billing settings.
- Legal/package license metadata in `composer.json`, `package-lock.json`, and dependency comments.
- Local update actions via `update:run`, which execute in-repo update actions and do not download licensed packages.
