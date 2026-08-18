# Hosting conversion baseline

Recorded on 2026-08-10 before the first hosting migration.

## Recovery

- Independent Git repository initialized on `main`.
- Baseline commit: `ed74d51` (`chore: capture HospedFree conversion baseline`).
- MySQL dump stored under the ignored `storage/app/backups` directory and verified with SHA-256.
- The original HospedFree reference project was not modified.

## Checks

- `npm run typecheck`: passed.
- `composer test:php`: 233 passed and 2 inherited failures (Portuguese locale key parity and configured e-mail logo embedding).
- `npm run lint`: inherited global failures in foundation and biolink files; no hosting code existed yet.

This is a historical baseline, not the acceptance status of the hosting implementation.
