# Bixa parity roadmap

Reviewed: 2026-08-12

## Purpose

This document replaces the earlier MVP-only interpretation of HospedFree. The target is a complete MOFH reseller integration delivered inside the new HospedFree Laravel/React panel. `D:\ARQUIVOS\PROJETOS\2025\SITES\bixa` is only the legacy codebase used to inventory expected workflows; Bixa is not the provider or integration name.

Bixa is a functional reference, not a source dependency. Port behavior and supported workflows into the current architecture. Do not copy code, database records, credentials, `.env` values, provider payloads, cookies, sessions, e-mail templates with secrets, or unsafe integration patterns.

## Parity matrix

| Capability             | Bixa reference                                           | HospedFree state | Target outcome                                                                                                                                                                                                                                                                                              |
| ---------------------- | -------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MOFH account lifecycle | `MofhService`, user/admin hosting controllers            | Partial          | Admin-configurable provider operations for create, status, suspend, reactivate, password change, package change and safe callback/reconciliation logs.                                                                                                                                                      |
| VistaPanel/cPanel      | `VistapanelApi`, hosting panel routes                    | Partial          | Server-only authentication and real resource statistics are connected safely. The current Softaculous redirect returned by VistaPanel contains the account password, so HospedFree blocks it and opens the configured hosting panel as the safe installer entrypoint. Direct SSO remains blocked until the provider offers a credential-free contract.                    |
| WebFTP/File Manager    | `User\WebFtpController`, admin WebFTP routes/views       | Partial          | Native dashboard file manager supports secure listing, text editing, upload/download, file/folder creation, rename, delete, copy/move and bounded ZIP create/extract through a server-only FTPS adapter. Admin has an audited read-only inspector; exact chmod and richer transfer progress remain pending. |
| Site Builder/Site.Pro  | SitePro settings and builder routes                      | Current          | Admin settings and safe health check plus a customer tool entrypoint bound to the owned account and active domain through server-side session handling.                                                                                                                                                     |
| SSL/ACME               | `SSLController`, certificate models/settings             | Partial          | Real DNS-01 issuance, separate installation state and idempotent renewal/reconciliation jobs are implemented. Scheduled maintenance is disabled by default pending an authorized smoke test. MOFH/VistaPanel installation and remote revocation still lack a verified contract.                             |
| Cloudflare DNS         | `CloudflareService`, Cloudflare config controller        | Partial          | Admin-managed TXT automation and redacted health check use an encrypted token. Provider-issued CNAME instructions and public DNS propagation checks are complete; general managed CNAME creation and production smoke testing remain pending.                                                               |
| Custom domains         | allowed domains/domain controllers                       | Partial          | Listing, ownership verification, provider-issued CNAME instructions and DNS propagation checks are connected through safe adapters. Add/delete remains blocked until an Addon Domains form contract is verified; that automation does not exist in the inspected Bixa source. hsite.top remains the free default. |
| Additional subdomains  | VistaPanel subdomain methods                             | Partial          | Create and delete now use a server-only VistaPanel session with allowed-zone, reserved-name, ownership, throttling and concurrency guards. Remote listing is normalized through MOFH; plan quota enforcement remains pending.                                                                               |
| MySQL databases        | VistaPanel database methods                              | Partial          | Real create/list operations now run through a server-only VistaPanel adapter and expose only database name, host and username. Quota/status synchronization is pending; deletion is not advertised because no verified provider contract was found in the inspected reference.                              |
| Statistics             | VistaPanel detailed stats/chart routes                   | Partial          | Real disk, bandwidth and inode values are normalized into the customer dashboard; history, domain/database counts and admin diagnostics remain pending.                                                                                                                                                     |
| Admin settings         | MOFH, WebFTP, SitePro, ACME, Cloudflare, domain settings | Partial          | Dedicated admin settings pages following foundation admin patterns.                                                                                                                                                                                                                                         |
| Knowledge/FAQ          | public knowledge routes/views                            | Partial          | Public FAQ index plus SEO article pages; useful Bixa content recreated/imported only after review.                                                                                                                                                                                                          |
| Support tickets        | tickets/messages/admin support                           | Partial          | Responsive customer/admin ticket flow with translated labels, attachments, immediate message updates and hosting context.                                                                                                                                                                                   |
| Utility tools          | WHOIS and developer tools                                | Reference-only   | Secondary backlog after hosting parity unless needed for domain verification/support.                                                                                                                                                                                                                       |

## Required boundaries

- Public brand copy must say HospedFree, not MOFH, VistaPanel, Bixa, Botble, BeLink or Vebto.
- Provider-specific language is allowed only in restricted admin settings and operational logs.
- Current users, personal workspaces, permissions, billing products, prices, subscriptions and invoices remain the local ownership/commercial source of truth.
- Existing foundation patterns for admin, dashboard, billing, subscriptions, settings, support and knowledge are architectural constraints. New hosting screens must adapt those patterns instead of inventing standalone screens.
- Previously created HospedFree screens that diverged from the system pattern must be corrected before more provider-facing features are layered on top.
- Provider integrations must be hidden behind contracts/adapters and return safe DTOs.
- Credentials, cookies, private keys, callback payloads and raw provider responses must be encrypted/redacted or excluded from storage and serialization.
- Customer tools must open through server authorization. Credentials must not appear in query strings, browser-visible payloads, notifications or ordinary logs.

## Security risks found in references

The following Bixa-style patterns are explicitly prohibited in HospedFree:

- disabled TLS verification;
- raw callback payload logging;
- e-mails containing hosting passwords;
- file-manager or panel URLs containing credentials;
- controllers depending directly on provider response shapes;
- file operations without path traversal and account ownership checks.

## Implementation order

1. Architecture/UI convergence for existing HospedFree admin and dashboard work.
2. Customer dashboard home shell, honest local states and data contracts.
3. Provider, panel and domain contracts.
4. Domain and VistaPanel account verification, including real statistics.
5. WebFTP/File Manager.
6. MySQL and statistics.
7. SSL/ACME/Cloudflare.
8. Site.Pro/Site Builder and tool sessions.
9. Knowledge import/rewrite and support polish. Completed with reviewed public content, server-rendered FAQ SEO, persisted ticket classification and responsive no-reload support flows.
10. Admin operational recovery screens and audit tightening.

## Done criteria

Parity is not complete until a customer can manage the same core hosting tasks from HospedFree that Bixa exposed: account, domains, files, databases, SSL, tools, support and knowledge. Each area must have ownership tests, redaction checks and a recoverable failure state before it is marked complete.

## Latest File Manager slice

The first File Manager slice is connected to the customer dashboard and keeps FTP credentials exclusively on the server. It includes a root-jailed path value object, ownership-scoped and rate-limited APIs, FTPS enforcement, bounded file editing and normalized recoverable errors.

Implemented operations: list, read, save, bounded upload/download, create file, create directory, rename, delete, copy, move, ZIP creation and safe ZIP extraction. Archive processing enforces entry/byte limits, performs a full preflight before extraction and rejects traversal, encryption, duplicates and destination conflicts. Admin resource inspection and file deletion are permission-gated and audited; deletion requires explicit confirmation and records a path hash instead of the raw path. Exact chmod and richer transfer progress stay pending and must not be represented as available until implemented.

The customer editor now uses the foundation Ace integration with lazy loading, syntax modes, configurable theme, formatting, suggestions and autocomplete. Admin WebFTP settings include a safe server-requirements diagnostic and an optional authorized external fallback. The Bixa native `ftp_*` controller remains reference-only; no legacy logging or credential handling was copied.

## Latest MySQL slice

The customer dashboard now lists and creates MySQL databases through a provider-neutral contract backed by a real server-only VistaPanel adapter. Account credentials are decrypted only after ownership checks and never enter URLs, logs or ordinary API responses.

- Database creation is locked per hosting account and validates a conservative provider-safe name.
- Creation is verified with a follow-up remote listing instead of trusting generic HTML success text.
- The browser receives only the normalized database name, server and username; passwords and raw provider payloads remain excluded.
- The Foundation-native screen includes loading, empty, unavailable, success and validation states, responsive rows and explicit copy actions.
- Database deletion remains unavailable until its remote contract is verified rather than inferred.
- Quota and remote status synchronization remain pending.
