# ADR-0006: Bixa parity and provider tools

Date: 2026-08-12

## Status

Accepted.

## Context

The earlier HospedFree conversion plan treated Bixa as a workflow reference and prioritized a small free-hosting milestone. The product direction is now broader: HospedFree must provide functional parity with the hosting capabilities available in Bixa, but inside the new Laravel/React panel and current ownership, billing and permission architecture.

Bixa includes useful hosting workflows for MOFH reseller operations, VistaPanel/cPanel, WebFTP/File Manager, Site.Pro, SSL/ACME, Cloudflare DNS, custom domains, subdomains, MySQL databases, statistics, support and knowledge. Some implementation patterns observed in reference systems are not acceptable for this codebase, including disabled TLS, raw payload logs, credentials in URLs and password e-mails.

## Decision

Bixa is the required functional reference for HospedFree hosting parity. HospedFree will port capabilities, not source code or data.

The current HospedFree foundation remains the required architecture and interaction model. Bixa parity work must adapt existing billing, subscription, admin, settings, dashboard, support and knowledge patterns instead of creating unrelated custom screens.

Provider-specific features must be implemented behind internal contracts:

- `HostingProvider`
- `HostingPanelProvider`
- `HostingFileManagerProvider`
- `HostingDomainProvider`
- `HostingDatabaseProvider`
- `HostingSslProvider`
- `HostingSiteBuilderProvider`

MOFH, VistaPanel, WebFTP, Site.Pro, ACME and Cloudflare may appear in restricted admin configuration and diagnostic surfaces, but they must not appear in public brand copy.

Credentials, cookies, callback payloads, private keys and raw provider responses must never be returned to the frontend, placed in URLs, logged without redaction or included in notifications.

## Consequences

- The product roadmap now includes custom domains, WebFTP/File Manager, SSL/ACME, Cloudflare, Site.Pro, MySQL and statistics as target parity capabilities.
- Earlier documentation that marked those capabilities as later evolution must be updated.
- Existing HospedFree admin/customer screens that diverged from foundation architecture must be refactored before new Bixa parity layers depend on them.
- `Planos e pacotes` must align with the existing product/price/subscription system and add provider package mapping in that context.
- Admin settings must cover MOFH/VistaPanel, WebFTP/File Manager, Cloudflare, ACME/SSL, Site.Pro/Site Builder, allowed domains, tool enablement and health checks.
- Each provider-facing subsystem needs fake/test adapters before real integration work.
- File, domain, SSL and database operations require ownership, permission and redaction tests.
- Bixa database records, user accounts, hosting accounts, tickets and credentials are not migrated by this ADR. Knowledge content may be recreated or imported only through a sanitized, reviewed process.
