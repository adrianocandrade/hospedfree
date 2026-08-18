# HospedFree Design Contract

## Status

This file describes the HospedFree experience contract after the first conversion pass and the updated Bixa parity target. It is grounded in the implemented landing, customer hosting dashboard, support/knowledge pages and admin hosting operations, while marking unfinished parity capabilities as target work.

PRODUCT.md owns product scope. docs/brand-hospedfree.md owns logo, colors and identity rules.

## Visual Foundation

Use the official HospedFree assets:

| Asset                            | Use                                        |
| -------------------------------- | ------------------------------------------ |
| `public/images/icon.png`         | Main isolated icon                         |
| `public/images/icon-150x150.png` | Compact icon/favicon source                |
| `public/images/logo-white.png`   | Horizontal logo for dark/brand surfaces    |
| `public/images/logo-1.png`       | Horizontal logo for light/neutral surfaces |

The UI uses semantic Tailwind tokens and the existing shadcn/foundation components. Public and app surfaces should feel like a practical hosting system: clear, restrained, status-led and Portuguese-first.

The authenticated application and admin use the same Product Eclipse color roles as the landing in dark mode: near-black navy canvas, restrained blue-violet surfaces, low-contrast cool borders, clear off-white text and HospedFree violet for primary actions and selection. This alignment is implemented through the global semantic theme tokens, never by copying landing-only selectors into operational screens. Success, warning, error and information colors keep their semantic roles. The light theme remains independently composed.

## Current Surfaces

| Surface                | Route                               | State                                                      |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------- |
| Public landing         | `/`                                 | Implemented with HospedFree copy and dynamic hosting plans |
| Public hosting plans   | `/planos`                           | Implemented as the public plan comparison                  |
| Public site builder    | `/construtor-de-sites`              | Implemented as the public builder presentation             |
| Login/register         | `/login`, `/register`               | Rebranded for hosting                                      |
| Customer hosting       | `/dashboard/hosting`                | Implemented                                                |
| New hosting/address    | `/dashboard/hosting/new`            | Implemented, including short premium address states        |
| Customer domains       | `/dashboard/hosting` tabs           | Bixa parity target                                         |
| Customer files/WebFTP  | `/dashboard/hosting` tabs           | Bixa parity target                                         |
| Customer databases     | `/dashboard/hosting` tabs           | Bixa parity target                                         |
| Customer SSL           | `/dashboard/hosting` tabs           | Partial; Bixa parity target                                |
| Customer tools/stats   | `/dashboard/hosting` tabs           | Partial; Bixa parity target                                |
| Customer support       | `/dashboard/support`                | Implemented                                                |
| Public FAQ/knowledge   | `/faq` and `/knowledge`             | Implemented as public help surface                         |
| Admin operations       | `/admin/hosting`                    | Implemented                                                |
| Admin hosting plans    | `/admin/hosting/plans`              | Implemented                                                |
| Admin premium names    | `/admin/hosting/premium-subdomains` | Implemented                                                |
| Admin support          | `/admin/support`                    | Implemented                                                |
| Admin knowledge        | `/admin/knowledge`                  | Implemented                                                |
| Legacy link/biolink UI | former dashboard/admin routes       | Hidden from navigation and public fallback                 |

## Customer Panel

The customer panel is task-first:

- `/dashboard` is the planned customer home and must become a real overview instead of a redirect. It summarizes the selected hosting account, operational attention, real resource usage, plan, quick actions, recent activity and help. See `docs/system/customer-dashboard-improvement-plan.md`.
- The dashboard references supplied on 2026-08-12 guide hierarchy and composition only: the overview reference owns the home direction and the domain reference owns hosting/domain detail. Illustrative numbers, benefits, dark colors, icons and 3D assets are not product truth.
- The expanded desktop sidebar may contain a contextual paid-plan card and compact resource summary. Both are data-driven, disappear or relocate responsively, and must not compete with operational alerts.
- Upgrade content is shown only when an eligible paid product has a configured price, remote package and enabled gateway. Benefits come from the product/plan configuration, not frontend constants.
- Resource UI must use hosting statistics and quotas, never the inherited links/biolinks usage payload. Unknown limits are shown as unknown, not unlimited.

- Show hosting status, domain and next action before secondary data.
- Organize account management into real dashboard tabs: Hospedagem, Domínios, Arquivos, Bancos de dados, SSL, Ferramentas, Planos and Suporte.
- Keep credentials masked by default.
- Require password confirmation for credential reveal.
- Auto-hide revealed credentials.
- Open external tools only through authorized server-side links.
- Require successful deactivation, password confirmation and an explicit typed phrase before permanent deletion. Keep only legacy scheduled deletions reversible until their existing due date.
- Show provider failures as recoverable states, not generic crashes.
- In the new-hosting flow, standard addresses use 5 to 63 characters. Short addresses with 3 or 4 characters must clearly show their annual price or granted entitlement.
- Keep unlisted, reserved, unavailable and provider-failure address states distinct. A reservation or successful checkout never means that hosting was provisioned.
- After a short-address checkout returns, reconfirm both provider availability and the customer's entitlement before enabling hosting creation.
- In SSL surfaces, show certificate issuance and remote installation as separate states. Never label HTTPS as active from issuance alone, and never expose private keys in the browser to compensate for a missing panel installation API.
- Customer hosting and support pages still live inside the standard dashboard shell. Use existing dashboard content containers, headers, empty states and form controls; only introduce custom layout when the hosting task cannot be expressed with the existing dashboard patterns.
- FAQ/knowledge for customers is a public read surface at `/faq`: simple header, no dashboard sidebar, no marketing navigation menu, searchable article groups and a footer. The index links to individual article pages such as `/faq/:slug`; full answers must not be hidden in accordions. Each article page needs its own title, meta description, canonical URL and share metadata. `/dashboard/knowledge` exists only as a redirect/compatibility path.
- Customer plan comparison and upgrade entrypoints inside the dashboard must stay inside dashboard routes first. Public pricing is a marketing surface for visitors and must not be the primary destination for an authenticated customer trying to manage hosting.
- Domain, file, database, SSL, statistics and Site Builder management surfaces must stay in the customer dashboard shell. They should feel like one hosting control panel, not disconnected public pages. `/construtor-de-sites` is the public marketing explanation of the builder and never replaces the authenticated management flow.
- New customer screens must reuse the current dashboard layout, section hierarchy, tabs, form controls, empty states, responsive behavior and translation patterns. If an existing HospedFree customer screen does not follow that architecture, refactor it before adding new capability to it.

The personal workspace is internal. Do not expose workspace selectors or workspace management in customer navigation unless a future identity migration explicitly changes this.

## Admin UI

Admin screens should be dense and operational:

- Accounts and operations prioritize status, domain, plan and safe action.
- Provider terminology may appear only in restricted admin screens.
- Plan/package mapping lives in `/admin/hosting/plans`.
- Billing products, prices, subscriptions and invoices remain in the foundation billing area.
- Knowledge articles and ticket replies use plain controls and safe content handling.
- Actions that affect remote hosting must be auditable and idempotent.
- Admin CRUD/list pages must reuse the same shell and components as the existing foundation admin: section content headers, table search, sortable tables, pagination, empty states, dropdown row actions and dialogs/crupdate flows. Avoid standalone centered form cards unless the matching legacy admin pattern does the same.
- Hosting plan and package screens should visually and behaviorally align with existing subscription plan screens. Support and knowledge admin screens should behave like operational tables with explicit row actions, not isolated custom workspaces.
- Admin settings for MOFH, VistaPanel, WebFTP, Site.Pro, Cloudflare, ACME and allowed domains must follow foundation admin settings/table/dialog patterns. Provider terminology is acceptable here, but raw payloads and secrets are not.
- "Planos e pacotes" must be an adaptation layer over the existing product/plan/subscription model, with hosting-specific package mapping added in context. It must not behave like an unrelated custom product catalog.
- The premium-name catalog uses the operational states draft, for sale, reserved, granted, active subscription, expired subscription and inactive. It reuses annual Billing prices and must not be presented as a hosting-plan catalog.
- Admin hosting and provider configuration must expose the operational settings required by the system: provider API credentials, MOFH/VistaPanel, WebFTP/File Manager, Cloudflare, ACME/SSL, Site.Pro/Site Builder, allowed domains, tool enablement and health checks.

## Public Site

The landing page must not invent prices, quotas, uptime, testimonials or provider claims. Active paid plans remain visible in comparison so the upgrade path is understandable; when price, gateway or provider package is incomplete, the card explicitly says the commercial configuration is pending and does not expose a checkout action.

The marketing home uses the Product Eclipse editorial dark composition grounded in real HospedFree dashboard and site-editor images from `public/images`. Wide, deliberate chapters alternate concrete copy with a single product visual. Desktop display headings must use the available horizontal space and stay within two lines. Avoid narrow headline columns, repeated generic card grids, decorative statistics and abstract AI-style imagery. Motion is restrained and respects reduced-motion preferences.

Plan cards and help content are data-driven. Plan names, prices, quotas and benefits come from the hosting catalog, while help links open exactly one public SEO article page through normal document navigation. Do not restore inherited LinkBio marketing blocks, fake counters, anonymous testimonials or FAQ accordions.

The public story follows the customer journey: choose an address, publish files or an application, use the visual builder when appropriate, compare Free and paid hosting, find a specific help article, then create the account. Free and eligible paid plans must appear in the same comparison; asynchronous catalog content must remain visible after loading and must not depend on a reveal observer registered before the data exists.

The first viewport must make the offer clear:

- free hsite.top hosting;
- upgrade path without changing product;
- one obvious account creation action.

The public website-builder page lives at `/construtor-de-sites` and follows the same Product Eclipse shell and editorial rhythm as the home and pricing pages. Its public brand is HospedFree. Site.pro may appear only as a factual technology attribution or as the source of the approved official demonstration video; it must not replace the HospedFree product name, expose provider configuration or reveal credentials, session tokens or direct authenticated editor URLs.

The builder story may communicate the capabilities confirmed for the product direction: visual no-code editing, more than 200 templates, responsive layouts, multilingual sites, existing-site import, virtual-store creation, design freedom and SEO tooling. These capabilities must be described as editor features, not as unconditional guarantees for every account. The page must always include the availability note: models and advanced features vary according to the editor version enabled for the account, and upgrades, when available, appear inside the editor.

The approved builder demonstration is `https://www.youtube.com/watch?v=jzbqVK8s6jI`. Interactive pages may embed the privacy-enhanced YouTube player without autoplay. Prerendered and crawler-oriented output should use an accessible external link instead of loading a heavy iframe.

## Content Rules

- Primary language is Portuguese (Brazil).
- Use concrete action labels: Criar hospedagem, Abrir painel, Revelar credenciais, Redefinir senha, Solicitar exclusao.
- Explain hosting terms where needed.
- Never use MOFH in public brand copy.
- Never put credentials in URLs, logs, notifications or ordinary API serializations.

## Interaction States

Every hosting surface needs loading, empty, error, disabled and permission-denied states where relevant. Long-running provider work should show one of the normalized states:

- account: `pending`, `provisioning`, `active`, `suspended`, `pending_downgrade`, `pending_deletion`, `deleting`, `deleted`, `failed`, `action_required`
- order: `requested`, `awaiting_payment`, `paid`, `provisioning`, `fulfilled`, `failed`, `cancelled`
- operation: `queued`, `running`, `succeeded`, `retryable_failed`, `permanent_failed`

## Accessibility

Target WCAG 2.2 AA:

- visible keyboard focus;
- status not color-only;
- long domains wrap or truncate safely;
- dialogs manage focus;
- buttons have accessible names;
- mobile layouts keep the same task order;
- touch targets are at least 44 px where practical.

## Bixa Parity Targets

The design may show these capabilities only when the corresponding backend/API is implemented or when a disabled target state is explicit:

- custom domains and additional subdomains;
- Cloudflare or managed DNS;
- SSL/ACME automation;
- native WebFTP/File Manager;
- ZIP upload and archive extraction;
- MySQL database management;
- account statistics and quotas;
- Site.Pro/Site Builder;
- Softaculous and panel tools;
- ticket attachments and full support flow.

Git deploy and automatic inactivity suspension remain separate decisions and are not required for Bixa parity unless approved later.
