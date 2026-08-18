# HospedFree Operations

Reviewed: 2026-08-10

## Local Setup

```bash
composer install
npm install
copy .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve --port=8011
npm run dev
```

Use an isolated database. The current local database is `hospedfreebase`.

On Windows, local install may need:

```bash
composer install --no-interaction --prefer-dist --ignore-platform-req=ext-pcntl --ignore-platform-req=ext-posix
```

## Hosting Flags

```env
HOSPEDFREE_HOSTING_ENABLED=true
HOSPEDFREE_PAID_ENABLED=false
HOSPEDFREE_LEGACY_UI_ENABLED=false
HOSPEDFREE_PROVIDER=fake
HOSPEDFREE_BASE_DOMAIN=hsite.top
HOSPEDFREE_PREMIUM_RESERVATION_MINUTES=30
HOSPEDFREE_CHECKOUT_ATTEMPT_GRACE_MINUTES=60
```

Use `fake` locally unless testing MOFH with authorized disposable resources.

### Short premium addresses

Before publishing a 3-4 character address for sale, create a dedicated active paid product with an annual price in Billing and configure that price for an enabled gateway. A hosting-plan product/price cannot be reused for a premium address. The premium-name admin can instead grant the address to an existing user, with or without an expiration date. The initial reservation duration is controlled by `HOSPEDFREE_PREMIUM_RESERVATION_MINUTES`; after Stripe or PayPal creates a verified attempt, the purchase and name reservation are extended together using `HOSPEDFREE_CHECKOUT_ATTEMPT_GRACE_MINUTES`.

Each purchase has its own UUID checkout reference persisted at the payment provider. Webhook synchronization binds a valid subscription to that exact name even if the browser does not return. A late payment never replaces another customer's reservation or entitlement: it is recorded as `action_required` for administrative resolution. An ended annual subscription preserves the site and also moves the linked hosting to operational review; no automatic remote deletion occurs.

Production deployment must apply the premium-address schema and navigation migrations with `php artisan migrate --force` before the new route is used.

## GitHub FTPS deployment

The manual `Build and deploy production` workflow builds a clean Linux artifact, runs the PHP and TypeScript checks, compiles `public/build`, installs Composer dependencies without development packages and publishes the resulting package by explicit FTPS. It is manual by design: run it first with `dry-run`, review the file plan and then run it with `deploy`.

Create a protected GitHub environment named `production` and configure these environment secrets:

- `FTP_SERVER`
- `FTP_USERNAME`
- `FTP_PASSWORD`

Configure `FTP_SERVER_DIR` as an environment variable with the FTP-visible project root, ending in `/` (for example `/www/hospedfree.com/` only when that is the path shown by the KeyHelp FTP account). `FTP_PORT` is optional and defaults to `21`. The workflow requires explicit FTPS with certificate verification; it does not fall back to unencrypted FTP.

The deployment never uploads `.env`, local databases, backups, logs, tests, `node_modules` or environment-specific Laravel caches. Before a real publish it removes only the known remote cache files `bootstrap/cache/config.php`, `bootstrap/cache/events.php` and `bootstrap/cache/routes-v7.php`. This prevents a package built locally from forcing a development `APP_URL` in production. Keep the production `.env` on KeyHelp and use `APP_URL=https://www.hospedfree.com` without a trailing slash.

FTP cannot run database migrations or restart workers. After a deployment containing migrations, run `php artisan migrate --force` using the KeyHelp CLI or an authenticated operational mechanism, then restart the queue worker. Do not expose a public migration endpoint.

## Production build on KeyHelp/Linux

KeyHelp can host the application when the selected web and CLI runtimes both use
PHP 8.2 or newer and satisfy `composer.lock`. The frontend build requires Node.js
20.19+, 22.12+ or a newer Vite-compatible version. Point the domain document root
to the project's `public` directory, never to the repository root.

KeyHelp disables process execution functions such as `proc_open` by default, so
the production artifact should be built on a trusted local machine instead of
through a public PHP endpoint. Use the committed lockfiles and run:

```bash
composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction
npm ci --no-audit --no-fund
npm run typecheck
npm run build
php artisan optimize:clear
```

When building on Windows, Composer can ignore only `ext-pcntl` because that
extension is unavailable there. The KeyHelp Linux CLI used by Horizon and queue
workers must still provide `pcntl` in production. Upload the application code,
`vendor` and `public/build`; do not upload `node_modules`, `.git`, the local `.env`,
database dumps or provider credentials. Configure the production `.env` directly
on KeyHelp and clear/regenerate Laravel caches after the database is available.

## Queues and Scheduler

Provisioning, password reset, reconciliation, suspension, reactivation, deletion and package changes run through jobs and provider operations.

Run a worker when the queue connection is not sync:

```bash
php artisan queue:work
```

Run the scheduler every minute in production. The hosting maintenance command reconciles accounts and safely completes only legacy deletion requests that already have a scheduled due date. New customer deletions start immediately after successful deactivation and explicit confirmation.

```bash
php artisan schedule:run
```

### Security history retention

The scheduler runs `security-history:prune` every day at 03:20. Retention can be changed in **Admin > Settings > Logs** or through the matching environment values:

```env
OUTGOING_EMAIL_LOG_RETENTION_DAYS=7
CUSTOMER_COMMUNICATION_RETENTION_DAYS=365
CUSTOMER_SECURITY_EVENT_RETENTION_DAYS=365
ADMINISTRATIVE_SECURITY_AUDIT_RETENTION_DAYS=365
USER_SESSION_RETENTION_DAYS=90
```

Values must be whole days between 1 and 3650. Customer history never contains message bodies, recipients, headers, OTPs, signed URLs or tokens. Technical MIME access remains administrative and requires independent permissions for metadata, content and download.

## Billing

Paid hosting uses existing products, prices, subscriptions and invoices. Gateways are not hardcoded; availability follows existing Stripe/PayPal settings.

Operational rules:

- payment confirmed does not mean hosting active;
- upgrade changes remote package only after local subscription validates;
- failed package change moves the account to `action_required`;
- cancellation/delinquency downgrades to Free after tolerance;
- invoices and subscription history are preserved.

## MOFH

MOFH is internal infrastructure.

Required before real use:

- protected `HOSPEDFREE_MOFH_*` environment values;
- TLS enabled;
- disposable smoke-test account/domain;
- timeout and retry limits left enabled;
- logs reviewed for redaction;
- no callback dependency unless callback authentication is proven.

Never expose raw MOFH payloads or credentials to API responses, frontend, tickets or logs.

### Safe integration smoke test

Use the local-only diagnostic command with an explicitly authorized account:

```bash
php artisan hosting:smoke-test --user=<id-or-username> --account=<id-or-uuid> --installer --site-builder
```

The account option is optional when that user owns exactly one hosting account. The command checks MOFH connectivity, the normalized remote package catalog, local package mappings, account/domain lookup, WebFTP, installer access and Site.Pro. It never prints credentials, cookies, raw provider payloads or tool session URLs. If VistaPanel returns an installer URL containing the hosting password, the command confirms that the unsafe URL was blocked and that the configured HTTPS hosting panel is available as the safe fallback.

The command does not switch `HOSPEDFREE_PROVIDER`, provision a remote account or convert an account created by the `fake` provider.

### WebFTP/File Manager

The native file manager connects server-side with the VistaPanel username and the encrypted hosting password. Keep explicit FTPS and passive mode enabled; never solve connectivity errors by disabling TLS or by placing credentials in an external URL.

MOFH's `ftpupload.net:21` endpoint can temporarily refuse TCP connections or an account password can still be propagating after a reset. Read-only operations create a fresh connection and use the bounded provider retry setting. Mutating operations are never retried automatically because the remote mutation might already have completed.

Use the safe smoke test to distinguish application errors from provider reachability. If the result is `file_manager_connection_failed` and a TCP check to port 21 also fails, the provider endpoint is unavailable from the application host. Configure an HTTPS external fallback without credentials so the customer still has a recovery path; the native manager remains the primary path.

For one explicitly authorized local test account, validate the controlled promotion separately:

```bash
php artisan hosting:promote-fake-account <account-id>
```

Only after the validation confirms the MOFH package mapping and remote domain availability, repeat with `--confirm`. The command reuses the existing local Free slot, records an idempotent provider operation, stores the returned VistaPanel username and hosting password server-side with encryption, and never prints credentials. This is an explicit operational migration for selected test data, not an automatic fallback or a provider callback.

Site.Pro may return an HTTPS editor URL on a separate regional host with an opaque `login_hash`. Configure each exact regional host in the Site Builder admin settings. The adapter accepts only that parameter on an allowlisted host; user names, FTP passwords, API credentials, fragments and additional query parameters remain blocked.

## SSL, ACME and Cloudflare

Use the ACME staging directory until a disposable authorized domain completes the entire flow. Only HTTPS directory hosts listed in `HOSPEDFREE_ACME_ALLOWED_DIRECTORY_HOSTS` are accepted.

The Cloudflare token entered in admin settings is stored encrypted in `hosting_integration_secrets`. An environment token can remain as a deployment fallback, but it is never returned by the settings or health APIs.

Required before production issuance:

- apply all additive hosting migrations;
- configure an ACME account e-mail and an allowlisted directory;
- use a least-privilege Cloudflare token restricted to the configured zone when automatic DNS is enabled;
- complete request, TXT propagation, issuance and cleanup using a disposable authorized domain;
- keep `HOSPEDFREE_SSL_MAINTENANCE_ENABLED=false` until staging request, renewal, replacement installation and reconciliation complete with an authorized disposable domain;
- treat certificate issuance and installation as separate states;
- do not advertise remote certificate installation or revocation until the panel adapter confirms those operations;
- keep `hosting_ssl_operations` free of certificate material, credentials and raw external responses.

The MOFH API documentation states that the public API is limited and does not document direct VPanel calls. Historical VistaPanel operator guidance also states that certificate upload was not available through a programmatic API. Accordingly, the current MOFH adapter returns `manual_required` instead of simulating installation. Sources reviewed on 2026-08-12: [MOFH API limitations](https://api.myownfreehost.net/limitations) and [VistaPanel automatic renewal/install limitation](https://forum.infinityfree.com/t/auto-renew-ssl/29871).

When maintenance is enabled, `hosting:maintain` reconciles issued orders after the configured interval and starts renewal inside the configured expiration window. A pending renewal never clears the current certificate. Replacement material is written only after successful ACME issuance, and installation is queued with a new idempotency key.

## Validation

Useful commands:

```bash
php artisan test tests/Feature/Hosting/HostingLifecycleTest.php
composer test:php
npm run typecheck
npm run lint
npm run format:check
npm run build
php artisan route:list
```

Run `composer test:php` before public release. Current inherited failures are tracked in `docs/audits/hosting-conversion-baseline.md`.
