# HospedFree

HospedFree is the new Laravel/React base for a hosting product with up to two separate free hsite.top hosting accounts per customer and recurring paid hosting plans.

This repository is isolated from the old HospedFree and MeuLinkBio projects. The old projects are reference-only. Do not copy their code, database records, secrets or provider payloads into this base.

## Current Status

| Area                                                                   | Status                                                                                                                |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Laravel 12 / React 19 foundation                                       | Current                                                                                                               |
| Authentication, users, personal workspace, admin, billing and invoices | Preserved foundation capability                                                                                       |
| HospedFree branding, default menus and landing                         | Implemented in this base                                                                                              |
| Free hosting order and provisioning                                    | Implemented with fake provider by default                                                                             |
| hsite.top validation and reserved words                                | Implemented                                                                                                           |
| Provider contract and MOFH adapter                                     | Implemented, real use requires configured credentials and authorized smoke test                                       |
| Customer hosting panel                                                 | Implemented for onboarding, status, credentials, tools, password reset, deactivation and confirmed permanent deletion |
| Admin hosting operations                                               | Implemented for accounts, operations, retries and provider actions                                                    |
| Admin hosting plans/packages                                           | Implemented at `/admin/hosting/plans`                                                                                 |
| Knowledge base and support tickets                                     | Implemented for customer/admin first milestone                                                                        |
| Paid hosting lifecycle                                                 | Implemented around existing products, prices, subscriptions and gateway settings                                      |
| Links, biolinks and QR Codes                                           | Inherited code, hidden from HospedFree navigation, not removed yet                                                    |
| Custom domains, Cloudflare, ACME, File Manager, ZIP/Git deploy         | Out of first milestone                                                                                                |

## Requirements

- PHP 8.2 or newer
- Composer 2
- Node.js 22 or newer
- npm 10 or newer
- MySQL or MariaDB
- Queue worker or scheduler for asynchronous provider operations

On Windows, the inherited Horizon dependency declares `pcntl` and `posix`, which are unavailable. For local non-Horizon development:

```bash
composer install --no-interaction --prefer-dist --ignore-platform-req=ext-pcntl --ignore-platform-req=ext-posix
```

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

Use an isolated database such as `hospedfreebase`. Never point this project at the old HospedFree database.

## Hosting Flags

```env
HOSPEDFREE_HOSTING_ENABLED=true
HOSPEDFREE_PAID_ENABLED=false
HOSPEDFREE_LEGACY_UI_ENABLED=false
HOSPEDFREE_PROVIDER=fake
HOSPEDFREE_BASE_DOMAIN=hsite.top
```

Use `HOSPEDFREE_PROVIDER=mofh` only after configuring MOFH credentials in a protected environment and approving a disposable smoke-test account/domain.

## Documentation

- Product: `PRODUCT.md`
- Design: `DESIGN.md`
- Brand: `docs/brand-hospedfree.md`
- Docs index: `docs/README.md`
- Architecture map: `docs/system/module-map.md`
- Operations: `docs/system/operations.md`
- ADRs: `docs/adr/`
- Baseline audit: `docs/audits/hosting-conversion-baseline.md`

## Validation

Preferred checks after code changes:

```bash
composer test:php
npm run lint
npm run typecheck
npm run format:check
npm run build
php artisan route:list
```

Regenerate the API client when routes or schemas change. Do not claim a check passed unless it was run.
