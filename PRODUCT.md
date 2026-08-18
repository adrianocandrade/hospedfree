# HospedFree Product

## Status

This document is the product truth for the new HospedFree base. The first conversion milestone is partially implemented in this repository: free hosting with hsite.top, provider-neutral provisioning, customer panel, admin operations, support and knowledge base.

The product target is now complete MOFH reseller hosting inside the HospedFree panel. Bixa is only the legacy codebase used to inventory workflows; it is not an integration, provider or product name. HospedFree must port the required behavior into the current Laravel/React, users/workspaces, permissions and billing architecture.

The implementation still keeps inherited MeuLinkBio modules in the codebase. Those modules are hidden from the HospedFree experience and must be removed only through a reviewed, reversible phase.

## Product

HospedFree helps a person create a hosting account, receive an hsite.top address or connect a custom domain, publish a PHP/MySQL site and manage hosting operations from a clear panel.

The product has two first-class offers:

- Free hosting as the main entry product.
- Paid recurring hosting plans for customers who need more capacity or features.

## Confirmed Decisions

- Up to two separate free hosting accounts per customer workspace.
- hsite.top is the default free domain zone. Custom domains are now part of the Bixa parity target and must be added through a safe HospedFree domain flow.
- Standard hsite.top names have 5 to 63 characters. Names with 3 or 4 characters are short premium addresses and only exist when an administrator publishes them for an active zone.
- A short premium address requires either an active annual subscription using an existing Billing product/price or an administrator grant, which may have an expiration date. Its price is never hardcoded.
- A short premium address is not a Premium hosting plan. The two future Premium plans backed by AndradeHost/KeyHelp remain a separate, target-only offer.
- The personal workspace remains the internal ownership boundary, but is hidden from customer UI.
- MOFH is allowed only behind a provider-neutral integration layer.
- MOFH and other provider names do not appear in public brand copy.
- Free and paid hosting share the same HospedFree identity.
- The initial paid offer is approved as `Hospedagem Pro`: R$ 9,90/month or R$ 99/year, with 10 GB disk, 150 GB monthly traffic, 5 domains, 10 MySQL databases and no ads. It maps internally to the MOFH `pro` package, but the provider name must not appear in public copy.
- Free remains R$ 0. Prices and package mappings are administered locally, and no offer becomes purchasable until its local price, enabled gateway and active remote package mapping are ready.
- Two future Premium plans backed by AndradeHost/KeyHelp are target-only. Their public names, prices, quotas and mappings remain open until real costs, secure adapters and authorized smoke tests are available.
- Payment success and hosting activation are separate states.
- Paid cancellation or delinquency downgrades to Free after tolerance; it does not delete the site automatically.
- Permanent hosting deletion is available only after deactivation succeeds and requires the customer to type an explicit confirmation phrase.
- New deletion requests are irreversible and start immediately. Legacy scheduled deletions remain cancellable until their existing due date.
- Base de conhecimento and support tickets are part of the target customer experience.
- Native File Manager/WebFTP, custom domains, additional subdomains, MySQL management, statistics, SSL/ACME, Cloudflare DNS automation, Site.Pro/Site Builder and Softaculous are mandatory Bixa parity capabilities, even when not yet implemented.

## Approved Commercial Catalog

| Offer             | Status                                                                                                              | Public price                | Capacity                                                                  | Internal delivery                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------- | -------------------------------------------- |
| Free              | Approved current offer                                                                                              | R$ 0                        | Current Free-package limits configured by admin                           | Current free provider package                |
| Hospedagem Pro    | Approved current offer; publication still requires a synchronized price, enabled gateway and active package mapping | R$ 9,90/month or R$ 99/year | 10 GB disk, 150 GB monthly traffic, 5 domains, 10 MySQL databases, no ads | MOFH `pro`, never exposed in public branding |
| Two Premium plans | Planned target; not purchasable                                                                                     | Open                        | Open until real KeyHelp costs and quotas are validated                    | AndradeHost/KeyHelp adapters still pending   |

The approved price is a product decision, not proof that a checkout or remote package is currently ready. Payment, entitlement and technical provisioning continue to have independent states.

## Current Capability Areas

| Capability                                 | Current state                                                          |
| ------------------------------------------ | ---------------------------------------------------------------------- |
| Authentication and verified customer areas | Reused foundation                                                      |
| Ownership                                  | Personal workspace plus buyer user recorded                            |
| Commercial catalog                         | Reused `products`, `prices`, `subscriptions`, invoices                 |
| Hosting plans                              | Implemented as hosting records associated to products                  |
| Provider packages                          | Implemented per hosting plan/provider                                  |
| Zones                                      | Implemented, seeded with hsite.top                                     |
| Orders and accounts                        | Implemented                                                            |
| Provider operations and events             | Implemented                                                            |
| Fake provider                              | Implemented for local development and tests                            |
| MOFH adapter                               | Implemented, pending real authorized smoke test                        |
| VistaPanel/cPanel tools                    | Partial; target parity pending                                         |
| WebFTP/File Manager                        | Planned for Bixa parity                                                |
| Primary hsite.top and short premium names  | Implemented; real provider check requires an authorized production IP  |
| Additional subdomains                      | Partial through the provider adapter                                   |
| Custom domain mutations                    | Partial; verified provider contract still pending                      |
| MySQL management                           | Planned for Bixa parity                                                |
| Statistics and quotas                      | Planned for Bixa parity                                                |
| SSL/ACME and Cloudflare DNS                | Partial; real issuance and installation-state tracking implemented     |
| Site.Pro/Site Builder                      | Partial tool entrypoint; target parity pending                         |
| Customer hosting panel                     | Implemented                                                            |
| Admin hosting operations                   | Implemented                                                            |
| Admin plan/package mapping                 | Implemented                                                            |
| Knowledge articles                         | Implemented                                                            |
| Support tickets                            | Implemented                                                            |
| Paid lifecycle                             | Implemented around existing subscriptions and provider package changes |

## Architecture and UI Constraints

- HospedFree must reuse the current foundation architecture for auth, users, workspaces, billing, subscriptions, settings, admin layout, dashboard layout, support and knowledge.
- Existing HospedFree screens that were implemented outside those patterns are technical debt and must be corrected before more Bixa parity features are layered on top.
- Hosting plans and packages are an adaptation of the existing product/price/subscription system with provider package mapping, not a separate commercial catalog.
- Customer hosting management must stay inside dashboard flows. Authenticated operational actions such as plan changes, domains, files, databases, SSL and tools must not send the customer to public marketing screens as the primary path.
- Admin configuration must include provider API and tool settings required to operate the system: MOFH/VistaPanel, WebFTP/File Manager, Cloudflare, ACME/SSL, Site.Pro/Site Builder, allowed domains, tool enablement and health checks.

## User Success

The customer should always be able to answer:

1. Is my hosting online?
2. What is my address?
3. What should I do next?
4. Which limit, payment state or provider issue needs attention?
5. How do I get help without exposing credentials?

## Open Premium Address Decisions

- An expired or cancelled annual address subscription marks linked hosting as `action_required` and preserves its data. Automatic remote suspension or removal is not approved yet.
- A payment confirmed after the temporary reservation expires is reconciled server-side. If the address is no longer available, the purchase becomes `action_required` and never takes the address from another customer; refund or reassignment remains an administrative decision.

## Non-Goals

- Publicly marketing MOFH, AMVHost, Bixa, Botble, BeLink or Vebto.
- Continuing short links, biolinks, QR Codes, tracking pixels, overlays or creator pages as HospedFree products.
- Copying code or data from the old HospedFree or Bixa.
- Migrating Bixa users, hosting accounts, tickets, credentials, `.env` values or provider payloads without a separate approved migration plan.
- Promising unlimited resources, uptime, instant provisioning or fixed support response times without an approved contract.
- Building a separate identity for paid hosting.

## Safety Rules

- Do not log or serialize hosting passwords, provider credentials, cookies, 2FA secrets, private keys or raw provider payloads.
- Use provider DTOs with safe codes/messages only.
- Use jobs with idempotency keys for provider operations.
- Keep webhooks authenticated, deduped and recoverable.
- Keep rollback application-level; remote provider state is recovered by reconciliation, not blind database rollback.
