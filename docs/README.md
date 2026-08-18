# HospedFree Docs

This directory separates current implementation, target product decisions and historical references.

## Authority Order

1. `../PRODUCT.md` for product scope.
2. `brand-hospedfree.md` for official brand.
3. `../DESIGN.md` for implemented experience rules.
4. `system/` for architecture, operations and module status.
5. `security/` for invariants and known risks.
6. Local code for final implementation truth.

## Current Implementation Docs

- `system/module-map.md` - current modules and legacy boundaries.
- `system/bixa-parity-roadmap.md` - Bixa capability parity matrix and target boundaries.
- `system/bixa-parity-tasks.md` - executable backlog for provider, domains, files, SSL, MySQL, tools, support and admin parity.
- `system/commercial-expansion-plan.md` - catálogo, integrações e etapas para hospedagens adicionais, domínios, backup e serviços pagos.
- `system/customer-dashboard-improvement-plan.md` - visual direction, information architecture and executable tasks for the customer home, hosting usage and contextual upgrade sidebar.
- `system/operations.md` - local setup, jobs, provider, billing and validation.
- `adr/` - accepted architecture decisions.
- `audits/hosting-conversion-baseline.md` - baseline from the inherited project before hosting migrations.
- `audits/security-and-completion-audit-2026-08-13.md` - current authenticated API, WebFTP, domain sync, Site.Pro, e-mail/access history and settings audit.
- `security/security-audit.md` - security baseline and required invariants.

## Brand and Experience

- `brand-hospedfree.md` - official colors, logo and usage rules.
- `../DESIGN.md` - current UI/UX contract.
- `design-references/hospedfree-dashboard/README.md` - reference-only manifest for the attached dashboard concepts.
- `brand/` - older detailed brand work. Treat it as supporting context and verify against `brand-hospedfree.md`.

## Historical Reference Material

These folders are not active HospedFree product docs:

- `66biolinks (47 - 69)/`
- `themes/linkbio/`
- `imagensExemplo/`
- old MeuLinkBio brand assets in `brand/assets/`

They remain for audit and future decommission planning. Do not use them as source for new HospedFree UI, pricing, claims or provider implementation.

## Documentation States

- Current: implemented and verified locally.
- Planned: approved scope but not implemented yet.
- Reference-only: useful for understanding old workflows, never copied directly.
- Open: requires business, provider or security decision.

Docs must not contain secrets, provider credentials, customer passwords, cookies, private payloads or real payment data.
