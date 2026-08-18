# Bixa parity tasks

Reviewed: 2026-08-12

## Working rules

- Treat every item as planned until implemented and validated.
- Port behavior from Bixa into HospedFree architecture; do not paste source, data or secrets.
- Prefer additive migrations and feature flags for risky surfaces.
- Follow foundation admin/dashboard UI patterns before creating custom layouts.
- Before adding new Bixa parity features, normalize previously created HospedFree screens that diverged from the current system architecture and UI patterns.
- Do not mark a task complete without recording the checks that actually ran.

## 0. Documentation and scope lock

- [x] Create the Bixa parity roadmap and task list.
- [x] Add ADR-0006 for Bixa parity and provider tools.
- [x] Update product/design/module/reference docs so custom domains, SSL/ACME, Cloudflare, WebFTP/File Manager, Site.Pro, MySQL and stats are target parity capabilities.
- [x] Search docs for stale "out of first milestone" language that contradicts Bixa parity.

Acceptance:

- Documents distinguish current, partial, missing and reference-only capabilities.
- Bixa is documented as functional reference, not source dependency.

## 1. Architecture and UI convergence for existing HospedFree work

- [x] Audit current customer dashboard pages created for HospedFree and compare them with the existing dashboard shell, billing, subscriptions, settings and support patterns.
- [x] Rework customer hosting overview into the standard dashboard structure, with tabs/sections for Hospedagem, Domínios, Arquivos, Bancos de dados, SSL, Ferramentas, Planos and Suporte.
- [x] Rework plan upgrade/plan management so authenticated customers stay in dashboard flows first, not confusing public pricing pages.
- [x] Rework admin "Planos e pacotes" to adapt the existing billing/products/subscriptions admin model instead of using a custom standalone layout.
- [ ] Rework admin hosting/account screens to use the same foundation table, filter, row action, dialog, empty, pagination and section patterns as the current admin system.
- [x] Add admin configuration surfaces required by the hosting system: provider API credentials, MOFH/VistaPanel, WebFTP/File Manager, Cloudflare, ACME/SSL, Site.Pro/Site Builder, allowed domains, tool availability and provider health tests.
- [ ] Ensure all new and existing HospedFree forms use translated labels/help/errors and never display raw enum/value labels to users.
- [ ] Document any deliberate UI deviation with a concrete HospedFree reason before keeping it.

Acceptance:

- "Planos e pacotes" behaves like an adaptation of the existing subscription/plan system, not a separate custom CRUD.
- Admin hosting screens feel native to the current admin architecture.
- Customer dashboard screens feel native to the current dashboard architecture and do not route operational actions to public marketing pages.
- Provider configuration exists in admin before dependent provider tools are exposed as active customer capabilities.

Progress recorded on 2026-08-12:

- Added the missing `/dashboard/hosting/plans` route already referenced by the database-backed dashboard menu.
- Added a dashboard-native plan comparison using the existing billing panel, billing-cycle and price components.
- Redirected dashboard upgrade entrypoints to the authenticated hosting plan flow.
- Changed hosting-plan creation in admin from a raw billing product ID field to selection from existing billing products, while keeping provider package mapping as the hosting-specific adaptation.
- Linked the hosting mapping screen back to the canonical admin products/prices screen.
- Replaced raw hosting account and provider operation status values in the admin table with translated product labels.
- Validation for this slice: focused Oxlint and `npx tsc --noEmit` passed.
- Added responsive account tabs for Hospedagem, Domínios, Arquivos, Bancos de dados, SSL, Ferramentas, Planos and Suporte.
- Connected the Ferramentas tab to the real server-authorized tool catalog and kept unavailable integrations explicitly disabled.
- Replaced request-only SSL tracking with a TLS-enforced ACME DNS-01 adapter, optional automatic Cloudflare TXT creation and encrypted certificate storage. Provider-neutral installation, renewal and reconciliation jobs are implemented; verified MOFH/VistaPanel installation and remote revocation remain pending.
- Replaced the route-navigation use of Foundation/Base UI tabs with accessible React Router links after browser validation exposed a composite-list update loop on nested hosting routes. The account selector and all customer sections remain available, with horizontal navigation on narrow screens.
- Added `/admin/settings/hosting` with configuration fields for provider/MOFH, VistaPanel, WebFTP/File Manager, Site.Pro, SSL, ACME, Cloudflare, allowed domains and provider timeouts/retries.
- Added a dedicated settings API that never returns API passwords or tokens; an empty secret field preserves the configured value.
- Added a rate-limited provider connectivity test that returns only normalized status/code fields and never returns provider messages or payloads.
- Corrected MOFH health semantics so a valid "domain unavailable" probe still proves provider connectivity.
- Validation for the settings/health slice: 7 focused tests passed with 34 assertions; PHP lint, TypeScript typecheck, focused Oxlint and route listing passed.

## 2. Provider, panel and domains

- [x] Introduce contracts for panel, domains, databases, files, SSL and site builder.
- [x] Add provider-neutral DTOs for panel sessions, domain checks, DNS instructions, database records, stats, files and tool sessions.
- [x] Implement fake providers for development/tests before real provider work.
- [ ] Implement MOFH/VistaPanel adapter methods needed for domain checks, panel login, Softaculous, stats, subdomains and CNAME. Server-only authentication, stats, CNAME verification instructions, the proven subdomain create/delete flow and safe installer access through the panel are complete; credential-free direct SSO and Addon Domains remain pending.
- [ ] Add customer domain own/add/verify/list/delete flows. Listing, ownership verification, CNAME propagation checks and additional subdomain create/delete are complete; custom-domain add/delete remains pending a verified Addon Domains contract.
- [x] Add admin settings for MOFH credentials, allowed domains and provider health tests.

Acceptance:

- Customer can add hsite.top and custom domains without leaking provider details.
- Admin can test provider connectivity without exposing raw payloads.
- Links to panel/Softaculous are generated server-side and contain no credentials.

Progress recorded on 2026-08-12:

- Added capability contracts independent from MOFH/VistaPanel response shapes.
- Added typed DTOs and a generic safe response envelope with no raw provider payload field.
- Added deterministic fake capability implementations for development/tests.
- Real drivers resolve to an explicit unavailable implementation until each adapter is completed; production never falls back to fake hosting data.
- Validation for the contract slice: 9 focused tests passed with 49 assertions, including binding and no-fake-fallback coverage.
- Added the first real MOFH domain adapter slice for server-side domain listing and ownership verification with TLS verification, bounded timeouts and normalized safe responses.
- Added ownership-scoped domain list/verification APIs and a responsive Foundation dashboard page. The locally known primary domain remains visible during a provider outage.
- Added a shared server-only VistaPanel client for authentication, cookies, request tokens and bounded same-origin option requests. The client requires HTTPS, never logs credentials/cookies/HTML and is reused by statistics and domain operations.
- Added customer creation and deletion of additional subdomains for configured zones, with reserved-name validation, ownership checks before deletion, per-domain concurrency locks, throttled APIs and confirmation UI.
- The Bixa subdomain request shape was ported as behavior only. Its disabled TLS checks and sensitive request logging were not copied.
- Added the MOFH `getCname` flow behind `HostingDomainProvider`: the API hash is converted into a normalized CNAME instruction and checked through server-side DNS resolution. The customer sees only record type/name/value/TTL, propagation state and a safe next action.
- Added the configurable CNAME verification target to the Foundation admin settings and `.env.example`; the default follows the provider documentation and can be changed without code.
- Custom-domain ownership verification remains available, but Addon Domains create/delete stays explicitly blocked: the inspected Bixa source has no corresponding automation and the remote form contract has not been verified. After CNAME propagation, the customer can open a server-authorized control-panel session to finish the provider-side addition.
- Validation for the CNAME/DNS slice: 11 focused tests passed with 48 assertions. The full PHP suite passed with 308 tests and 1379 assertions; PHP syntax checks, focused Oxlint, TypeScript typecheck, route listing and the production build also passed. The build retains the inherited legacy ads `eval` and large-chunk warnings, plus the existing Vite native-config advisory.
- Added server-only VistaPanel authentication for real disk, bandwidth and inode statistics. TLS verification, timeouts, bounded HTML parsing and same-origin requests are mandatory; cookies and credentials never enter API responses or logs.
- Direct panel/installer SSO remains explicitly unavailable. A live account test confirmed that VistaPanel's installer redirect contains the hosting password, matching the unsafe behavior used by Bixa. HospedFree blocks that URL, keeps credentials server-side and falls back to the current HTTPS hosting-panel URL so the customer can select the installer there.
- Tool availability now comes from current admin settings instead of stale per-account URLs. Native WebFTP is presented once as the File Manager, and panel, WebFTP and installer statuses no longer remain falsely unavailable after settings change.
- The live redacted smoke test for account `1` passed MOFH health, package catalog (`free` and `pro`), local Free mapping, Site.Pro health, account lookup, domain listing, WebFTP listing and the safe installer fallback. The command printed no credential, cookie, raw provider response or session URL.
- Validation for the latest domain/provider slice: the full PHP suite passed with 265 tests and 1164 assertions; PHP syntax, TypeScript typecheck, focused Oxlint, production build and the 19 hosting-account routes passed. The build retains inherited warnings for the legacy ads `eval` surface and large chunks.

## 2A. Customer dashboard home and account usage

Detailed plan: `docs/system/customer-dashboard-improvement-plan.md`.

- [x] Replace the `/dashboard` redirect with a real customer overview.
- [x] Add selected-account status, next action, plan, domain and technical summary.
- [x] Add provider-neutral resource usage with measured/stale/unavailable states.
- [x] Add quick actions driven by real tool availability.
- [x] Add recent account events and transactional notifications without duplicate systems. Hosting lifecycle, billing and support now reuse queued Foundation notifications and the global branded mail layout.
- [x] Add a data-driven paid upgrade card and compact resource summary to the expanded sidebar.
- [x] Relocate sidebar cards into the home on mobile/collapsed layouts.
- [x] Update database-backed dashboard menus through an idempotent migration, without a code fallback.
- [x] Validate light/dark themes, localization, accessibility and responsive layouts.

Visual validation on 2026-08-13:

- The customer overview and hosting detail were exercised while authenticated in light and dark themes at 1440 px and 375 px, for eight rendered combinations.
- The production bundle produced zero browser errors, zero horizontal overflow and zero unnamed interactive controls.
- Long hosting domains now wrap without isolating a final character on mobile, and the shared sidebar toggle exposes a translated accessible name without changing its visual treatment.
- The existing Foundation/HospedFree composition, cards, colors, responsive bottom navigation and desktop sidebar were preserved.

Notification delivery notes:

- Hosting activation, terminal provisioning failure, suspension, reactivation, password change, permanent deletion, legacy deletion cancellation/completion, downgrade, package change and action-required states now notify the customer from audited account events.
- Ticket creation, customer reply, public support reply and terminal status changes now notify the correct customer or permitted support staff.
- Payment failure and invoice messages use HospedFree billing language. Payment failure explains downgrade to Free instead of claiming the site will be deleted.
- All messages reuse the Foundation Markdown e-mail shell, configured branding and outgoing-mail pipeline. Passwords, provider names, raw messages, attachments and credentials are excluded.
- Retryable intermediate provider failures do not send repeated customer e-mails; notifications are queued after database commit.
- The Foundation admin test panel now lists only current HospedFree templates: mail setup, authentication, contact, billing, hosting lifecycle and support. Legacy link quota, webhook, booking and workspace samples were removed from this product-facing catalog without replacing the shared panel layout.
- Every selectable template renders with safe sample data and a `[TEST]` subject prefix. The password-reset sample restores Laravel's previous URL callback after sending so a test cannot alter later application mail.

Acceptance:

- The overview and hosting detail follow the visual hierarchy of the supplied references while remaining native to Foundation.
- No illustrative quota, graph, benefit, price, activity or status is shown as real data.
- Operational alerts take priority over upsell content.
- Free, paid, no-account, provisioning, partial-data and provider-failure states remain useful.
- The legacy link/biolink usage API is not reused for hosting resource cards.

## 3. WebFTP/File Manager

- [ ] Add file APIs for list, read, save, upload, download, mkdir, touch, rename, delete, chmod, zip, unzip, copy, cut and paste. All listed operations except exact chmod are implemented; the current FTPS contract does not expose reliable octal permission changes.
- [x] Enforce account ownership, workspace scope, root jail, path normalization and path traversal rejection.
- [x] Add size/type limits for read, edit, upload, archive and extraction.
- [ ] Add customer UI with responsive split view, toolbar, upload state, editor state and empty/error states. The responsive list, breadcrumbs, upload state, download, create dialogs, editor, rename/copy/move and ZIP controls are complete; richer upload progress and exact permission controls remain pending.
- [x] Add admin file access only through explicit permissions and audit events. Inspection and deletion require `hosting.operations`; inspection records the actor and deletion stores only a path hash in safe metadata.

Acceptance:

- A user cannot access another account's files.
- `../`, absolute paths and encoded traversal attempts are rejected.
- Credentials and FTP connection details never appear in browser responses, URLs or logs.

Progress recorded on 2026-08-12:

- Added a provider-neutral file contract backed by a real Flysystem FTPS adapter for the MOFH driver; fake and unavailable drivers remain explicit.
- Added server-only FTP configuration to the existing hosting settings panel. Secret account credentials are resolved only after ownership checks and are never serialized to the browser.
- Added account-scoped, throttled file endpoints for listing, reading, bounded upload/download, creating, updating, renaming, copying, moving and deleting.
- Added strict relative-path normalization that rejects absolute paths, traversal segments, separators in names, control bytes and overlong paths.
- Replaced the Arquivos capability placeholder with a responsive Foundation-native file browser, breadcrumbs, upload/download, file/folder creation, text editor, rename/copy/move actions and destructive-action confirmation.
- Unsupported or not-yet-safe operations return explicit capability codes instead of pretending success or falling back to insecure plain FTP.
- Validation for this slice: the full PHP suite passed with 277 tests and 1198 assertions; TypeScript typecheck, focused Oxlint, production build and desktop/mobile smoke tests passed.
- Added server-side ZIP creation and extraction through the existing account-scoped FTPS adapter. Archive entries, source bytes, resulting ZIP size, extracted entries and total uncompressed bytes all have configurable hard limits.
- Extraction performs a complete preflight before writing: absolute paths, drive paths, traversal, duplicate targets, existing-file conflicts and oversized archives are rejected without partial extraction. Archive creation also refuses to overwrite an existing destination.
- Added Foundation-native `Compactar em ZIP` and `Extrair aqui` actions plus admin fields for every archive/extraction limit. Focused ZIP and traversal tests passed; exact chmod remains blocked until a verified provider contract exists.
- Confirmed that the Bixa backend used PHP's native FTP extension directly; HospedFree keeps the safer Flysystem adapter and reuses the already installed Ace editor instead of copying the legacy controller and CDN assets.
- Added WebFTP enablement, external fallback, ZIP policy, editor theme, formatting, suggestions and autocomplete settings to the existing Foundation admin settings surface. ZIP policy is enforced server-side.
- Added a redacted WebFTP requirements check for FTP, Flysystem, ZipArchive, temporary storage and TLS, plus safe connection-failure classification.
- The authorized administrator-account smoke test reaches MOFH and the correct remote account but still identifies `file_manager_authentication_failed`. A password reset using the Bixa-compatible 16-character alphanumeric format was accepted and stored encrypted without displaying the value; both FTP and FTPS authentication remain rejected, so the account/provider state still requires recovery. No remote file was changed during diagnosis.
- MOFH reports `sdfdsfdsfds.hsite.top` as an active primary domain, while the public HTTP endpoint still returns the provider's “Domain not added” page. The dashboard must therefore distinguish provider registration from confirmed public serving and must not invent a healthy-site result.

## 4. MySQL and statistics

- [x] Add account-scoped database APIs for real list/create operations.
- [x] Add database quota/status synchronization. The provider supplies the current count while the local commercial plan remains authoritative for the customer limit.
- [x] Display host, database name, username and safe connection hints without passwords.
- [x] Verify database creation with a follow-up provider listing and keep raw HTML/provider payloads server-only.
- [ ] Add database deletion only after a supported remote contract is verified and covered by ownership/audit tests.
- [x] Add stats APIs for disk, bandwidth, inodes, domains, databases and recent sync time. The current VistaPanel dashboard-table format is parsed server-side; provider failures retain contractual plan limits with unknown usage instead of inventing consumption.
- [x] Add dashboard resource cards using existing UI components. Time-series charts remain absent until the system stores real measurements.

Acceptance:

- Provider timeout or invalid response produces a recoverable status.
- Customer sees clear limits and next action.

Progress recorded on 2026-08-12:

- Added `MofhHostingDatabaseProvider` behind `HostingDatabaseProvider`, using the shared TLS-enforced and bounded VistaPanel client.

Progress recorded on 2026-08-13:

- Confirmed against the authorized account that VistaPanel exposes usage on the authenticated dashboard rather than the legacy `option=domain` response. The normalized parser now reads disk, bandwidth, inodes, domain and database usage from that dashboard without exposing HTML, cookies or credentials.
- Home, sidebar and hosting overview share the same quota resolver. Free displays 5 GB disk, 50 GB traffic, 2 domains and 2 databases; Pro mappings display 10 GB, 150 GB, 5 domains and 10 databases. Actual usage replaces the pending state as soon as provider metrics arrive.
- Removed the illustrative traffic chart because no time-series measurements are persisted yet.
- Added throttled list/create routes with ownership policy enforcement, server-only credential resolution, conservative name validation and an account-scoped creation lock.
- Replaced the Bancos de dados placeholder with a responsive Foundation-native screen for listing, copying safe connection fields and creating a database.
- Focused provider and lifecycle tests cover normalized results, cross-account denial, invalid names and absence of credentials in browser-facing data and request URLs.

## 5. SSL, ACME and Cloudflare

- [x] Add admin settings for ACME and Cloudflare with encrypted token storage.
- [x] Add SSL request flow for account/domain.
- [x] Generate DNS/TXT validation instructions and optional Cloudflare automation.
- [ ] Add remote certificate installation, revoke, retry and status history operations. The provider-neutral installation job, idempotent retries and safe operation history are implemented; MOFH/VistaPanel remains `manual_required` until a verified remote installation contract exists. Remote revocation is still pending.
- [x] Add certificate lifecycle jobs with idempotency and redacted logs.

Acceptance:

- No private key, token or provider payload is serialized or logged.
- SSL failure keeps the hosting account intact and recoverable.

Progress recorded on 2026-08-12:

- Added a provider-neutral ACME adapter with an allowlisted HTTPS directory, bounded connections, DNS self-test and normalized safe errors.
- Added optional Cloudflare DNS automation. The API token is encrypted in `hosting_integration_secrets`; health responses never return the token or configured zone identifier.
- Request, DNS verification and certificate issuance now run server-side. Private key, CSR, leaf certificate and CA certificate are encrypted at rest and hidden from ordinary model/API serialization.
- Added a separate certificate-installation lifecycle with `queued`, `installing`, `installed`, `manual_required`, `action_required` and `failed` states. Installation attempts are recorded in `hosting_ssl_operations` with safe codes only.
- The fake provider completes installation for development and tests. The MOFH/VistaPanel adapter intentionally returns `panel_ssl_install_not_supported` because neither the Bixa implementation nor the currently documented panel contract proves server-side installation. The customer UI therefore distinguishes issued from installed and never sends the private key to the browser.
- Added scheduled reconciliation, renewal request and renewal completion jobs. The current certificate remains active while renewal is pending; encrypted material is replaced only after the new order is issued, then installation runs as a separate idempotent operation.
- Added the disabled-by-default `HOSPEDFREE_SSL_MAINTENANCE_ENABLED` feature flag plus admin controls for the renewal window and reconciliation interval. Production activation still requires an authorized disposable-domain smoke test.
- The customer SSL screen follows Foundation patterns, exposes manual/automatic DNS instructions, supports recovery attempts and is responsive without exposing provider names.
- Production smoke testing, a verified MOFH/VistaPanel installation adapter and actual remote revocation remain open; the UI does not claim unsupported operations succeeded locally.
- Validation for the renewal slice: 7 focused SSL tests passed with 65 assertions; the full suite passed with 290 tests and 1,295 assertions. TypeScript, focused Oxlint, API client generation, production build, 31 hosting routes, migrations and desktop/mobile browser checks passed with no console errors or horizontal overflow.

## 6. Site.Pro/Site Builder and tools

- [x] Add admin Site.Pro settings and health check.
- [x] Bind Site Builder sessions to a hosting account and its selected active domain.
- [x] Keep panel, WebFTP, File Manager, Softaculous, Site Builder, SSL, MySQL and stats as authorized server-side tool entries.

Acceptance:

- Tool URLs are HTTPS, allowed, short-lived where applicable and free of credentials.
- Disabled or unconfigured tools show translated unavailable states.

Progress recorded on 2026-08-12:

- Moved the Site.Pro HTTP integration out of the generic tools service into `SiteProHostingSiteBuilderProvider`, so the existing provider-neutral contract is now the real architecture boundary.
- The adapter ports the Bixa external-login payload behavior while enforcing HTTPS, bounded timeouts, server-only basic authentication and normalized errors. Raw responses, builder credentials and hosting credentials are never logged or serialized.
- Builder sessions are created for the owned hosting account and its active/primary domain. The FTP host is validated before it is sent to the builder.
- Returned session URLs must use the configured builder host and cannot contain userinfo or fragments. Ordinary query credentials/tokens are rejected. The provider-specific `login_hash` remains a documented security exception pending a server-side redirect broker, strict no-referrer/no-store handling and verification of its lifetime and one-time semantics.
- Added a throttled, permission-protected admin health check that uses a non-session `HEAD` request and returns only normalized safe fields.
- Focused validation: 5 Site Builder tests passed with 10 assertions, including account credentials remaining server-side, cross-host URL rejection, query-token rejection and safe health output. The final full suite passed with 294 tests and 1,303 assertions; TypeScript, focused Oxlint, API generation, admin settings routes and the production build also passed.

## 7. Knowledge, FAQ and support

- [x] Review Bixa knowledge categories/articles and recreate/import useful content only after sanitization.
- [x] Keep FAQ as public index plus article pages with title, meta description, canonical and share metadata.
- [x] Polish support labels/translations so visible text never shows raw enum/label values.
- [x] Ensure new ticket messages and attachments render immediately without page reload.
- [x] Validate mobile layouts for support and FAQ.

Acceptance:

- Each article has a dedicated SEO page.
- Tickets support attachments safely and update the active thread immediately.

Progress recorded on 2026-08-12:

- Audited the Bixa reference and the previous HospedFree database. Bixa contains the knowledge architecture but no published records; the previous HospedFree database contains 10 public categories and 20 reviewed articles, already recreated in the new database. No users, tickets, ratings or credentials were imported.
- Preserved the public FAQ as a simple header/content/footer experience without the customer dashboard sidebar. The index groups articles by category and every article remains a dedicated page rather than an accordion.
- Added server-rendered SEO for `/faq` and `/faq/{article}` with title, description, canonical, Open Graph, Twitter metadata and JSON-LD (`CollectionPage`/`TechArticle`). Real HTTP smoke checks returned 200 and confirmed title, canonical and structured data for the index and an article.
- Completed the support classification contract. Ticket type, department and priority are now validated, persisted and returned by the API; the admin UI shows translated values and the real customer identity instead of a ticket id presented as a user id.
- Ticket creation/reply uses the mutation response to update the active query immediately, including attachments, without requiring a reload. Attachment ownership, private storage, MIME/count/size limits and safe downloads remain enforced.
- Playwright validated FAQ index, FAQ article and customer ticket creation at 375 px with no horizontal overflow and zero browser console/page errors. The attachment control and immediate post-submit conversation rendering were exercised.

## 8. Admin operations and audit

- [x] Add admin pages for provider settings, domains, files, databases, SSL, Site.Pro, failed operations and retries. The hosting account table now opens a Foundation-native operational inspector with domain, file, database, SSL and audit tabs; provider settings, safe failures and retry remain in their existing admin surfaces.
- [x] Add confirmation dialogs for sensitive remote actions currently exposed in the admin UI. Suspend, reactivate, retry, file deletion and SSL revocation/cancellation use explicit confirmation; future destructive actions must use the same pattern before they are exposed.
- [x] Add audit records for suspend, reactivate, delete, password reset, package change, SSL revoke, file delete and admin file access. Every exposed sensitive action records the administrator and normalized safe metadata without credentials or raw provider payloads.

Acceptance:

- Admin can diagnose and retry failures without reading raw provider payloads.
- Sensitive actions are permission-gated and auditable.

Progress recorded on 2026-08-12:

- Account operations remain behind `hosting.operations`; the controller now records `admin_operation_requested` with the administrator id and normalized operation name, never provider payloads or credentials.
- Added Foundation confirmation dialogs around suspend, reactivate and retry. Reconciliation remains a non-destructive direct action.
- Added a focused regression test proving the administrative operation request is permission-checked and creates a safe actor-linked audit event.
- Added a permission-protected `/api/v1/admin/hosting/accounts/{account}/resources` diagnostic endpoint. It returns normalized domains, directory listings, databases, SSL status and safe account events without provider ids, credentials, raw payloads or certificate material.
- Added an account resource inspector to the existing Foundation hosting table. Row selection opens responsive tabs for domains, files, databases, SSL and audit; every inspection records `admin_resources_inspected`.
- Playwright exercised the real admin table, modal, all operational tabs and nested-folder navigation. Desktop and 375 px mobile passed with zero browser errors and no dialog/document overflow.
- Added permission-gated admin file deletion and SSL revocation/cancellation to the inspector. Both use destructive confirmation, refresh the affected resource immediately and create actor-linked audit events without raw paths, credentials, order ids, private keys or provider payloads.
- Focused security tests cover denied access, hashed file-path audit metadata and removal of local certificate material after revocation.
- Exposed password reset, package change and immediate account deletion in the existing Foundation account actions. The dialogs remain mounted outside the dropdown so they are stable after the menu closes and work at desktop and mobile widths.
- Package changes only accept active provider mappings. A paid destination is rejected unless the account already has a valid confirmed subscription for the same product; the admin operation cannot manufacture a commercial entitlement.
- Added dedicated audit events for suspend, reactivate, password reset, package change and deletion. Passwords, remote identifiers and provider payloads never enter event metadata.
- Full validation passed with 303 tests and 1,358 assertions, TypeScript, focused Oxlint and the production build. The mocked Playwright smoke sent exactly the three expected safe payloads, produced no browser errors and measured 375 px document width with no overflow.

## 9. Security hardening, live state and customer history

Detailed audit: `docs/audits/security-and-completion-audit-2026-08-13.md`.

- [x] Split self-service validation from administrative user updates using least-privilege runtime rules.
- [x] Require the dedicated current-password flow for password and e-mail changes. E-mail now uses pending state and a six-digit confirmation code.
- [x] Remove `email_is_verified`, roles and permissions from the self-service request.
- [x] Add scoped, expiring personal access tokens and deny bearer tokens on recent-authentication actions.
- [x] Add an HTTP IDOR matrix with an attacker token and browser session across hosting, domains, files, databases, SSL, tools and support. The matrix covers reads, mutations, attachments and recent-authentication actions and verifies that denied calls create no account events or provider operations.
- [x] Fix the admin user security tab so it never displays or mutates the administrator's own sessions while another user is selected.
- [x] Compose React Query mutation callbacks so File Manager and domain mutations render immediately without reload.
- [x] Persist domain lifecycle and stop automatic/manual sync prompts after the configured state is confirmed.
- [x] Add the first Site Builder management page by owned active domain, without inventing remote capabilities, plans or limits. Remote publication removal and builder-plan management remain dependent on a verified Site.Pro contract.
- [x] Expose customer-owned access history from Foundation sessions and a separate safe communication projection containing only subject/type/status/timestamps. The customer route requires a verified browser session and never returns recipient, body, headers, codes, links or notification class.
- [ ] Add explicit security events beyond sessions (login failure, password/2FA/token lifecycle) and restrict the technical MIME e-mail log with granular permissions and audited content access.
- [ ] Complete settings for domain sync policy, reserved domains, legacy deletion recovery, token policy, log retention and operational health.

Acceptance:

- A bearer token cannot change password/e-mail or use a sensitive route outside its declared abilities.
- An attacker token cannot read or mutate any resource of another customer and does not trigger provider calls/jobs/events.
- Every successful file/domain mutation updates the visible state without a page reload.
- Domain reconciliation stops and the sync CTA disappears when the domain is active/configured.
- Site Builder, e-mail history and access history are ownership-scoped, translated, responsive and free of secrets.
- Administrative reads/downloads of sensitive logs are permission-gated and audited.

## 10. Catálogo comercial e contratação de novas hospedagens

- [x] Criar uma página dedicada para adicionar hospedagem a partir de `Minhas hospedagens`.
- [x] Manter apenas uma vaga Free por workspace e permitir contas pagas adicionais conforme o limite configurado no plano.
- [x] Exibir somente planos realmente elegíveis: produto público, preço comprável, pacote remoto ativo, flag comercial e gateway habilitado.
- [x] Reservar e validar o subdomínio antes do checkout, com pedido local idempotente e prazo de pagamento finito.
- [x] Correlacionar pedido, tentativa remota, assinatura e conta de hospedagem por referência exata.
- [x] Preservar a reserva quando o estado remoto for incerto, pago ou exigir intervenção; nunca liberar domínio por um `404` sem contexto comprovado.
- [x] Cancelar tentativas concorrentes no gateway antes de marcá-las como substituídas.
- [x] Impedir provisionamento para Stripe `past_due`, `unpaid` ou `paused` e PayPal `SUSPENDED`.
- [x] Adicionar rate limit às escritas de billing e rejeitar reutilização da mesma chave idempotente com payload diferente.
- [x] Criar gestão de Site.pro por domínio ativo, com busca, estados reais e abertura por sessão autorizada pelo servidor.
- [x] Criar gestão de SSL com filtros, contadores, paginação, solicitação por domínio ativo e ações condicionadas ao estado real.
- [x] Melhorar domínios com pesquisa local, subdomínio gratuito e domínio próprio por verificação DNS.
- [x] Mostrar registro e transferência como indisponíveis até existir adapter ResellerClub com disponibilidade e preço verificáveis.
- [ ] Implementar `DomainRegistrarProvider`/ResellerClub e liberar registro, transferência e renovação somente após smoke test autorizado.
- [ ] Publicar produtos comerciais de certificado, Site.pro, KeyHelp e backup somente depois de custos, direitos, quotas e provisionamento reais estarem configurados.

Acceptance:

- O botão de adicionar hospedagem nunca conduz a um plano ou checkout indisponível.
- Uma assinatura só pode cumprir o pedido exato do mesmo cliente, produto e preço.
- Pagamentos tardios ou estados remotos duvidosos permanecem recuperáveis sem perder domínio nem criar outra conta silenciosamente.
- Nenhuma opção futura parece comprável e nenhum preço, limite ou entitlement é inventado.

Progress recorded on 2026-08-16:

- A experiência de contratação usa o catálogo atual e separa claramente Free, plano pago, ciclo, endereço e resumo do pedido.
- Pedidos pendentes aparecem em `Minhas hospedagens`, podem ser retomados ou cancelados quando for seguro e exibem erro recuperável sem desaparecer silenciosamente.
- Stripe e PayPal validam ownership, customer/payer, preço, intenção e referência remota antes de persistir ou provisionar.
- `hosting_checkout_attempts` recebeu reconciliação finita, carência, códigos seguros e proteção contra liberação prematura. A reconciliação ainda roda sincronamente no maintenance; mover cada tentativa para job único com backoff permanece dívida operacional antes de escala maior.
- Site.pro, SSL e domínios seguem o padrão Foundation do dashboard, com responsividade, estados vazios/erro e sem credenciais em URL ou serialização comum.
- Validação focada: 61 testes de lifecycle passaram com 389 asserções; 11 testes de polling, SSL e settings passaram com 38 asserções; TypeScript, Prettier focado, Oxlint focado, API client, 34 rotas de hospedagem, migration pretend e build de produção passaram.
- O build mantém apenas os avisos herdados de configuração futura do Vite e chunks grandes.

## Validation checklist per block

- [x] Focused PHP tests.
- [x] Focused frontend typecheck/lint where applicable.
- [x] `composer test:php` when backend security or lifecycle behavior changes.
- [x] `npm run typecheck` when frontend/API types change.
- [x] `npm run build` before UI handoff.
- [x] `php artisan route:list` when routes change.
- [x] API client regeneration when route/schema generation changes.
- [x] Docs updated with current paths and known limitations.

Latest validation on 2026-08-12:

- full PHP suite: 301 tests passed with 1343 assertions.
- `npx tsc --noEmit`: passed.
- focused Oxlint for hosting files, knowledge, customer/admin support, admin resource inspection, queries and API types: passed.
- `npm run build`: passed; inherited warnings remain for direct `eval` in the legacy ads host and bundles over 500 kB.
- admin hosting route listing: account resources, audited file deletion and audited SSL revocation/cancellation routes are registered alongside account operations.
- support route listing: 6 customer ticket routes registered; public FAQ index/article routes are registered separately.
- admin resource Playwright smoke: desktop tabs, nested file navigation, file deletion confirmation, SSL revocation confirmation and the 375 px modal passed with zero browser errors or horizontal overflow.
- `composer api-docs`: OpenAPI documents and Orval client regenerated successfully.
- mobile FAQ index/article and customer support smoke test: passed at 375 px with zero browser console errors, no horizontal overflow, an attachment selected and the created conversation rendered without reload.
- admin hosting resource inspector smoke test: all tabs and nested-folder navigation passed on desktop; the 375 px dialog stayed at 311 px client/scroll width with zero browser errors.

Latest security/tooling validation on 2026-08-13:

- full PHP suite: 368 tests passed with 1677 assertions;
- hosting lifecycle: 40 tests passed with 233 assertions;
- MOFH/VistaPanel panel adapter: 10 tests passed with 50 assertions;
- account security focused tests passed, including session-only sensitive routes and token abilities;
- the expanded HTTP ownership matrix passed for attacker tokens and browser sessions across every current ownership-bound customer surface, with no new account events/provider operations after denied attempts;
- the customer communication projection passed safe-metadata and ownership tests, including routed pending-email confirmation without storing the e-mail address or OTP;
- `composer api-docs`, TypeScript, focused Oxlint and production build passed;
- production build still reports the inherited direct-`eval` warning in the legacy ads host and oversized legacy bundles;
- additive migrations `2026_08_13_120000_create_hosting_domains_table`, `2026_08_13_121000_add_pending_email_change_to_users_table` and `2026_08_13_122000_create_customer_communications_table` were applied to the local development database after verified SQL backups;
- panel auto-login by opaque `id` is not fabricated because the inspected public MOFH contract does not expose its issuer. Softaculous uses the VistaPanel `option=installer` handoff, consumed server-side, with an allowlisted final HTTPS host.
