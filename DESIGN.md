# HospedFree Design Contract

## Status and authority

This document defines the target product experience. It does not claim that the inherited interface already follows these rules.

Authority order:

1. PRODUCT.md for product intent and scope.
2. docs/brand-hospedfree.md for brand identity.
3. DESIGN.md for system-wide experience rules.
4. docs/brand/ for detailed content, components and site structure.
5. Current code for actual implementation status.

## Experience model

HospedFree has three connected surfaces:

- Public site: explains free and paid hosting, removes uncertainty and leads to signup.
- Customer panel: helps customers publish, monitor and maintain their hosting.
- Admin/operations: manages plans, customers, provisioning, providers, support and incidents.

The public site is light-first and spacious. The customer panel is task-oriented and calm. A dark dashboard theme may exist, but it is optional and cannot replace the canonical light brand or reduce legibility.

## Visual foundation

### Color

Use the canonical HospedFree tokens:

| Role | Value |
| --- | --- |
| Primary | #5C5AA4 |
| Secondary | #766CAF |
| Soft lavender | #ACA9D4 |
| Ink | #202034 |
| Background | #F8F8FC |
| Surface | #FFFFFF |
| Muted | #F0EFF8 |
| Border | #DDDCEA |
| Muted text | #6F7083 |

Functional success, warning, error and information colors are defined in docs/brand-hospedfree.md. They communicate state and never become plan branding.

### Typography

- Interface and body: Inter, with Manrope and the system sans stack as fallbacks.
- Use 400 for body, 500 for labels/navigation, 600 for controls and subtitles, and 700–800 for display hierarchy.
- Keep reading lines near 65–75 characters.
- The logo is an image asset and must not be recreated with HTML text.

### Shape and spacing

- Use the existing Tailwind spacing scale.
- Controls and touch targets are at least 44 px.
- Interface cards generally use 12–16 px radii.
- Large marketing surfaces may use up to 24 px when the composition benefits.
- Pills are reserved for status, filters and compact labels.
- Use either a subtle border or a subtle shadow as the primary depth cue.

### Motion

- Functional transitions: 160–240 ms.
- Motion explains change; it never hides essential content.
- Respect prefers-reduced-motion.
- Loading work that can take seconds must show state, progress when possible and a safe exit.

## Brand assets

The approved source files are:

| Asset | Intended use |
| --- | --- |
| public/images/icon.png | Main isolated HF symbol |
| public/images/icon-150x150.png | Compact icon/favicon source |
| public/images/logo-white.png | Horizontal signature for light/neutral surfaces |
| public/images/logo-1.png | Horizontal signature with white Hosped lettering for dark/brand surfaces |

Preserve aspect ratio, clear space, colors and geometry. Never add Powered by AMVHost or expose a provider in the logo.

## Public site

The public experience should answer, in order:

1. What can I publish with HospedFree?
2. What does the free plan include?
3. How do I get from signup to a live site?
4. When and why would I choose paid hosting?
5. What limits, requirements and support paths apply?

Preferred home sequence:

1. Header with product, plans, help, blog/status when available, login and signup.
2. Hero with a specific publication outcome and one primary CTA.
3. Trust/proof strip using only verifiable facts.
4. How it works: account, hsite.top site, publish.
5. Free-hosting capability grid.
6. Honest free versus paid plan comparison.
7. Real panel preview or workflow explanation.
8. Knowledge/support entry points.
9. FAQ.
10. Final CTA and complete footer.

Do not use fake uptime, customer counts, reviews, logos, resource limits or screenshots. If data is unavailable, use a factual empty state or omit the claim.

## Customer panel

### Information architecture

The initial navigation model should prioritize:

- Overview
- Hosting accounts
- Domains
- Files and deployments
- Databases
- SSL and DNS
- Plans and billing
- Support
- Knowledge base
- Account and security

Only show modules that are implemented and allowed for the current user/plan.

### Hosting overview

The first screen should prioritize:

- site and account status;
- main domain or hsite.top address;
- next action;
- SSL and DNS state;
- resource/plan limits when available;
- recent deployments or operational events;
- support route.

Status combines label, icon and color. Provider-specific codes are translated into customer language, with technical detail available only when useful.

### Credentials

- Mask values by default.
- Reveal requires an explicit action and may require recent authentication.
- Copy actions announce success without exposing the value in logs or analytics.
- Reset/regenerate actions explain impact and require confirmation.
- Never send hosting passwords in routine email or notification bodies.

### Provisioning and long-running work

Hosting orders move through explicit states such as pending payment, payment confirmed, provisioning, active, failed, suspended and canceled. Exact state names may change during implementation, but payment and provisioning must remain separate.

Each long-running operation needs:

- current state;
- last update time;
- safe retry or support action when appropriate;
- idempotency protection;
- an audit reference that contains no secret.

## Plans and billing

- Free and paid plans share the same identity.
- Paid hosting may receive stronger hierarchy, not a separate gold/premium aesthetic.
- Show billing period, renewal behavior, limits and unavailable capabilities.
- Do not use the historical R$ 5,90 value.
- Upgrade and downgrade behavior must explain service impact before confirmation.
- A payment success screen must not claim the hosting is active until provisioning succeeds.

## Admin and operations

Admin screens should be dense, predictable and auditable:

- tables with useful filters, pagination and persistent context;
- clear customer/account/plan/provider relationships;
- status history and redacted request diagnostics;
- permission-protected actions;
- confirmation for suspend, delete, package change, credential reset and migration actions;
- no raw provider payloads or secrets in the browser.

Provider terminology may appear in restricted operational screens where necessary, but not in customer marketing.

## Core components

Detailed contracts live in docs/brand/components.md. The minimum reusable set is:

- HostingStatusCard
- DomainCard
- ResourceUsage
- ProvisioningTimeline
- CredentialField
- PlanCard and PlanComparison
- DeploymentCard
- SupportTicketCard
- KnowledgeArticleCard
- EmptyState
- InlineAlert and Toast
- ConfirmDialog

Components need loading, empty, error, disabled, permission-denied and plan-limited states where relevant.

## Responsive behavior

- Validate at 360, 430, 768 and 1440 px.
- Mobile keeps the semantic order and primary action.
- Tables collapse into meaningful records rather than horizontal data loss.
- Long domains, usernames, paths and error messages wrap or truncate with accessible access to the full value.
- No horizontal overflow in authentication, plan, hosting or support flows.

## Accessibility

- Target WCAG 2.2 AA.
- Full keyboard access and visible focus.
- Form errors associated with fields and summarized when useful.
- Status is never color-only.
- Dialogs manage focus and provide an escape route unless a critical transaction is actively committing.
- Charts and usage meters include textual values.
- External consoles, downloads and new tabs are labeled.

## Content

- Portuguese (Brazil) is the primary product language.
- Use concrete actions: Criar hospedagem, Abrir site, Configurar domínio, Ver detalhes.
- Explain necessary terms such as DNS, SSL, FTP and nameserver at the point of use.
- Avoid vague performance language, fear-based upgrade copy and claims like unlimited without an exact contract.
- Use the internal provider name only in restricted diagnostic/admin contexts.

## Anti-patterns

- Generic SaaS gradients as the main identity.
- A black or neon visual world across the whole product.
- Nested cards for every piece of content.
- Decorative server illustrations that displace real plan or workflow information.
- Fake terminal output, fake dashboards or fake metrics.
- Showing credentials by default.
- Conflating payment, provisioning and site availability.
- Treating free users as a degraded or neglected audience.

## Implementation discipline

Before changing UI:

1. Verify whether the capability is current, planned or reference-only.
2. Reuse shadcn and semantic tokens.
3. Use the official assets and Trans for visible copy.
4. Implement all material states.
5. Validate responsive behavior, keyboard access and contrast.
6. Update the relevant document when the product contract changes.
