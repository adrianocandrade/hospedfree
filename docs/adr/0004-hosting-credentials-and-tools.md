# ADR-0004: Hosting credentials and tools

Status: accepted on 2026-08-10.

## Decision

Recoverable hosting secrets use Laravel encrypted casts and are hidden from normal serialization. Reveal requires an authenticated, verified user, ownership authorization and password confirmation. Reset is a separate confirmed provider operation.

The first release exposes authorization-gated external tool links. Links are allowlisted HTTPS URLs and never contain hosting credentials, API secrets or customer tokens.

## Consequences

- Passwords are never sent by routine e-mail or notification.
- Provider and audit logs store fingerprints, safe codes and redacted messages only.
- Native file management, ZIP and Git deploy are deferred.
