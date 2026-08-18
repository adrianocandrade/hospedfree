# HospedFree Module Map

Reviewed: 2026-08-12

## Current Core

| Area                         | Path                                                                | State   |
| ---------------------------- | ------------------------------------------------------------------- | ------- |
| Hosting domain               | `app/Hosting/`                                                      | Current |
| Knowledge base               | `app/Knowledge/`                                                    | Current |
| Support tickets              | `app/Support/`                                                      | Current |
| API routes                   | `routes/api.php`                                                    | Current |
| Scheduler command            | `routes/console.php`, `app/Hosting/Console/`                        | Current |
| Customer hosting UI          | `resources/client/hosting/`                                         | Current |
| Public FAQ/knowledge UI      | `resources/client/hosting/knowledge-page.tsx`, `/faq`, `/faq/:slug` | Current |
| Admin hosting UI             | `resources/client/admin/hosting/`                                   | Current |
| Admin hosting settings       | `/admin/settings/hosting`, `AdminHostingSettingsController`         | Partial |
| Branding/default menus       | `resources/defaults/default-settings.php`                           | Current |
| Hosting config               | `config/hospedfree.php`                                             | Current |
| Hosting tools                | `app/Hosting/Services/HostingToolsService.php`                      | Current |
| Hosting SSL requests         | `app/Hosting/Models/HostingSslCertificate.php`                      | Current |
| Bixa parity roadmap          | `docs/system/bixa-parity-roadmap.md`                                | Target  |
| Bixa parity tasks            | `docs/system/bixa-parity-tasks.md`                                  | Target  |
| Customer dashboard plan      | `docs/system/customer-dashboard-improvement-plan.md`                | Target  |
| Billing foundation           | `common/foundation/src/Billing/`                                    | Reused  |
| Users/workspaces/permissions | `common/foundation/src/`                                            | Reused  |

## Hosting Models

| Model                      | Purpose                                          |
| -------------------------- | ------------------------------------------------ |
| `HostingPlan`              | HospedFree plan mapped to a commercial product   |
| `HostingProviderPackage`   | Remote package mapping per provider              |
| `HostingZone`              | Allowed domain zone, initially `hsite.top`       |
| `HostingPremiumSubdomain`  | Short-name catalog, reservation and entitlement  |
| `HostingPremiumSubdomainPurchase` | Checkout reference and payment reconciliation for one short name |
| `HostingOrder`             | Customer provisioning order                      |
| `HostingAccount`           | Local hosting account and state                  |
| `HostingProviderOperation` | Idempotent remote operation record               |
| `HostingAccountEvent`      | Safe state and audit history                     |
| `HostingSslCertificate`    | SSL request, validation and certificate metadata |

## Provider Boundary

`App\Hosting\Contracts\HostingProvider` owns the account-lifecycle integration contract. Current implementations:

- `FakeHostingProvider` for development and tests.
- `MofhHostingProvider` for MOFH, requiring protected credentials and authorized smoke testing.

Controllers and jobs must not depend on MOFH-specific payloads.

`HostingPremiumSubdomainService` owns the 3-4 character catalog rule, temporary purchase reservations, administrator grants and annual-subscription entitlement. `HostingPremiumSubdomainPurchase` supplies a UUID checkout reference so Stripe/PayPal webhooks can reconcile the exact name without depending on a browser return. The premium record belongs to a `HostingZone` and can link to a Billing `Price`, `Subscription`, customer, `HostingOrder` and `HostingAccount`. A premium-address subscription pays for the address; it does not change the hosting plan, and hosting-plan prices cannot be reused for this catalog.

The Bixa parity boundary now also includes `HostingPanelProvider`, `HostingDomainProvider`, `HostingFileManagerProvider`, `HostingDatabaseProvider`, `HostingSslProvider` and `HostingSiteBuilderProvider`. Provider-neutral DTOs cover panel sessions, files, domains, DNS instructions, databases, statistics, SSL orders and builder sessions.

`FakeHostingCapabilitiesProvider` supports development and contract tests. Real MOFH drivers currently exist for domain listing/verification, additional subdomain mutations, VistaPanel statistics, MySQL database list/create operations and the FTPS File Manager slice. Other incomplete capabilities resolve explicitly as unavailable; production must never silently return fake hosting data.

## Hosting Tools

`HostingToolsService` exposes tool availability and safe opening behavior for:

- control panel;
- WebFTP;
- installer/Softaculous;
- File Manager;
- Site Builder/Site.pro;
- SSL;
- MySQL;
- statistics.

The native File Manager uses a server-only FTPS adapter with a root jail and normalized relative paths. It supports list/read/save/bounded upload/download/create/rename/delete/copy/move and bounded ZIP creation/extraction. ZIP extraction preflights every entry and rejects traversal, duplicate paths, conflicts, entry-count excess and uncompressed-size excess before writing. Exact chmod and richer transfer progress remain pending. External tools must return only validated HTTPS URLs without embedded credentials. Current admin settings take precedence over stale tool URLs persisted on older accounts. VistaPanel's current Softaculous redirect contains the hosting password, so the direct URL is rejected and the installer entry opens the configured HTTPS hosting panel instead. `SiteProHostingSiteBuilderProvider` creates the Site Builder session server-side for the owned account and active domain. The returned URL is restricted to the configured host and cannot contain userinfo, a query string or fragment; credentials never reach the frontend or logs.

## SSL

`HostingSslCertificate` stores SSL request metadata, encrypted certificate material, a separate installation state and an isolated renewal state. The current API supports real ACME DNS-01 request, verification and issuance. Cloudflare can create and clean up validation TXT records using a database-encrypted token. `InstallHostingSslCertificate`, `RequestHostingSslRenewal`, `CompleteHostingSslRenewal` and `ReconcileHostingSslCertificate` record idempotent, redacted attempts in `hosting_ssl_operations`. Renewal preserves the current certificate until replacement issuance and then re-runs installation. The fake provider installs in tests while MOFH/VistaPanel truthfully remains `manual_required` because no verified remote installation contract exists. Customer resources exclude provider names, raw payloads and all certificate material. Scheduled maintenance is feature-flagged off until an authorized smoke test; remote installation and revocation remain pending.

## Bixa Parity Target Modules

| Area                        | Target responsibility                                                                                                                                |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI architecture convergence | normalize current HospedFree admin/dashboard screens to foundation billing, subscription, settings, table, dialog, form, tab and responsive patterns |
| Customer dashboard home     | real `/dashboard` overview, selected-account status, resource usage, actions, activity, contextual upgrade and responsive sidebar summaries          |
| Panel provider              | VistaPanel/cPanel login, account verification, Softaculous links and safe tool sessions                                                              |
| Domain provider             | custom domains, additional subdomains, CNAME/DNS instructions and remote domain status                                                               |
| File manager provider       | WebFTP/File Manager operations with root jail, path validation and audit                                                                             |
| Database provider           | MySQL create/list without exposing passwords; quota/status and verified deletion remain pending                                                      |
| SSL provider                | ACME/DNS challenge, certificate status, verification, revoke and retry                                                                               |
| DNS provider                | Cloudflare TXT/CNAME automation with encrypted admin token                                                                                           |
| Site Builder provider       | Site.Pro configuration and server-side builder session                                                                                               |
| Stats provider              | disk, bandwidth, inode, database and sync statistics                                                                                                 |
| Admin settings              | MOFH, VistaPanel, WebFTP, Site.Pro, Cloudflare, ACME and allowed-domain fields plus a redacted provider health check are present                     |
| Notifications               | queued hosting, billing and support e-mails plus database notifications using the existing Foundation mail branding and secure event payloads        |
| Account activity            | Foundation session/token history plus customer-owned communication metadata; message bodies, recipients, OTPs, links, headers and MIME stay excluded |

## First Milestone Flow

1. Customer registers and verifies email.
2. Customer opens `/dashboard/hosting`.
3. Customer chooses Free and an hsite.top subdomain.
4. A 5-63 character name follows the standard flow. A 3-4 character name must be present in the premium catalog and requires an annual subscription or administrator grant.
5. API validates hostname, entitlement, reservation, local uniqueness and provider availability.
6. Order and account are created under the personal workspace.
7. Provisioning job creates the remote account through the provider contract.
8. Customer sees status, technical data, masked credentials and safe tool shortcuts.
9. Support is available from the customer panel.
10. FAQ/knowledge is available publicly at `/faq`; each article has a page at `/faq/:slug` with SEO metadata, while `/dashboard/knowledge` is kept as a compatibility redirect.

## Paid Hosting Flow

Paid hosting reuses foundation products, prices, subscriptions and invoices. Public paid plans appear only when:

- HospedFree paid feature flag is enabled;
- product is not free and not hidden;
- at least one enabled gateway has a configured price id;
- provider package exists for the current provider.

Remote package changes happen only after the local subscription/product/price state is valid.

Short premium addresses also reuse foundation products, annual prices, subscriptions and invoices. Their subscription is a separate entitlement for one address and is not a hosting upgrade.

## Legacy Modules Hidden from HospedFree

| Area                          | Main path                             | Current treatment                                                                           |
| ----------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------- |
| Short links                   | `app/Links`, dashboard link routes    | Hidden from HospedFree navigation                                                           |
| Biolinks                      | `app/Biolinks`                        | Hidden from HospedFree navigation                                                           |
| QR Codes                      | `app/QrCodes`                         | Hidden from HospedFree navigation                                                           |
| Link pages and overlays       | `app/LinkPages`, `app/LinkOverlays`   | Public fallback disabled                                                                    |
| Tracking pixels and analytics | `app/TrackingPixels`, `app/Analytics` | Not part of HospedFree product                                                              |
| Custom domains                | `common/foundation/src/Domains`       | Legacy link-domain module is not reused; hosting-domain flow is pending under `app/Hosting` |

Do not delete legacy tables/data in the first milestone. Removal requires a dedicated ADR and backup plan.

## Pending Bixa Parity Work

- refactor existing HospedFree admin/dashboard screens that diverge from foundation architecture;
- align "Planos e pacotes" with existing billing/products/subscriptions patterns plus hosting package mapping;
- add module-specific diagnostics beyond the completed provider connectivity test;
- custom-domain Addon Domains mutations after a verified remote form contract; CNAME instructions and propagation checks are complete;
- Cloudflare DNS management beyond ACME TXT automation;
- SSL remote installation and remote revocation;
- File Manager exact chmod and richer upload progress; admin inspection and deletion are permission-gated, confirmed and audited;
- MySQL quota/status synchronization and deletion only after a verified remote contract;
- historical VistaPanel statistics and remaining quota/count synchronization;
- production smoke testing of Site.Pro/Site Builder sessions with authorized disposable credentials;
- remaining destructive admin account actions such as password/package changes, with dedicated confirmation, permission and audit handling;
- knowledge content expansion beyond the 10 reviewed categories and 20 public articles already recreated from the previous HospedFree database.

Git deploy, automatic inactivity suspension and migration of customers/data from old projects remain separate decisions outside the current Bixa parity requirement.

The current MySQL slice is exposed through account-scoped list/create routes and a Foundation-native customer screen. Provider authentication, HTML parsing and creation verification remain server-side; only normalized database name, host and username are serialized.
