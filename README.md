# HospedFree

HospedFree is being built as a simple hosting platform for people who want to publish a website without unnecessary technical complexity. The product has two first-class offers: free hosting with an hsite.top subdomain and recurring paid hosting plans.

This directory is an isolated working base copied from the former MeuLinkBio codebase. The application code is still largely inherited; the root documents and docs directory describe the HospedFree target and clearly identify what has not been implemented yet.

## Current status

| Area | Status |
| --- | --- |
| Laravel 12 / React 19 foundation | Current inherited code |
| Authentication, workspaces, admin and billing | Reuse candidates already present |
| Links, biolinks and QR Codes | Inherited, outside HospedFree scope |
| Hosting accounts, hsite.top, MOFH adapter | Target; implementation must be verified |
| Paid hosting plans | Confirmed product; prices and limits open |
| SSL, DNS, deployments, support and knowledge base | Planned from documented references |

No source code was copied from the old HospedFree or Bixa projects. They are documented as read-only references in docs/system/reference-systems.md.

## Requirements

- PHP 8.2 or newer
- Composer 2
- Node.js 22 or newer
- npm 10 or newer
- MySQL or MariaDB for normal deployments
- SQLite may be used for isolated local development
- Optional Redis, Horizon, search, realtime and object-storage services according to enabled features

On Windows, the inherited Horizon dependency declares pcntl and posix, which are unavailable. Composer can install for local non-Horizon development with:

    composer install --no-interaction --prefer-dist --ignore-platform-req=ext-pcntl --ignore-platform-req=ext-posix

On Linux or production, install the required extensions and run the normal command:

    composer install --no-dev --optimize-autoloader

## Local setup

    composer install
    npm install
    copy .env.example .env
    php artisan key:generate
    php artisan migrate
    npm run dev

Use an isolated database. Never reuse the database or environment file of the old project.

Run the local server:

    php artisan serve --port=8011

## Documentation

- Product definition: PRODUCT.md
- Target design contract: DESIGN.md
- Canonical brand guide: docs/brand-hospedfree.md
- Documentation index: docs/README.md
- Current and target module map: docs/system/module-map.md
- Old HospedFree, plugins and Bixa reference map: docs/system/reference-systems.md
- Security baseline: docs/security/security-audit.md
- Operations: docs/system/operations.md
- Agent rules: AGENTS.md and .agents/

## Safety

- MOFH is an internal provider integration, not the public brand.
- Prices, quotas and provider capabilities must come from approved configuration, never documentation guesses.
- Provider credentials and customer hosting passwords must never appear in docs, logs or frontend payloads.
- The old HospedFree and Bixa directories are reference-only and must remain untouched.
- Inherited link/biolink code will be removed or adapted only through a separate, reversible plan.

## Validation

For code changes, select the checks that prove the behavior:

    composer test:php
    npm run lint
    npm run typecheck
    npm run format:check
    npm run build
    php artisan route:list

For documentation-only changes, validate internal paths, secret patterns, source classification and stale active-brand claims.
