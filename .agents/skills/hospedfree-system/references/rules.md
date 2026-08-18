# Rules reference

Read AGENTS.md, PRODUCT.md and docs/system/ai-rules.md.

## Preserve

- authentication, users/workspaces and permissions until an ADR changes ownership;
- billing, plans, subscriptions, payments and invoices;
- data and routes of inherited modules until safe migration/removal;
- generated Impeccable files.

## Build

- free and paid hosting as the core product;
- hsite.top flow;
- provider-neutral hosting contracts with MOFH adapter;
- explicit payment/provisioning states;
- safe credentials, domains, SSL, deploy, support and admin.
- architecture/UI convergence with existing foundation admin, dashboard, billing, subscription, settings, support and knowledge patterns before adding more provider-facing surfaces.

## Never

- invent price, quota, status, uptime or testimonials;
- expose MOFH as public brand;
- copy old HospedFree/Bixa code, secrets or data;
- adopt Botble member architecture automatically;
- send passwords by e-mail;
- disable TLS;
- log raw callbacks;
- build standalone hosting admin/dashboard screens when an existing foundation pattern already covers the job;
- reintroduce purchase-code/updater;
- market links, biolinks or QR Codes as HospedFree.

## Live state

- Compose React Query lifecycle callbacks; never replace an options-factory invalidation callback with a page-level toast callback.
- File, domain, ticket and provider mutations must update the visible state without a reload.
- Domain reconciliation runs only while state is pending/recoverable and stops once configured/active is confirmed.

## Customer security history

- Keep customer communication history separate from the technical outgoing e-mail log.
- Customer history may expose only allowlisted type, safe subject, delivery status and timestamps.
- Never store or return recipients, MIME, bodies, headers, OTPs, signed links, reset tokens or provider payloads in that projection.
- Ownership-bound customer routes need HTTP owner/attacker coverage whenever they are added or changed.
