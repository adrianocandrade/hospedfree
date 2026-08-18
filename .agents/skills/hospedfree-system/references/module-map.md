# Module map reference

Read docs/system/module-map.md for the full map.

## Current layers

- app/ — inherited product backend.
- common/foundation/src/ — reusable foundation backend.
- resources/client/ — inherited product frontend.
- common/foundation/resources/client/ — shared frontend.
- routes/ and common/foundation/routes/ — web/API/webhook surfaces.
- resources/client/gen/ — generated API client.

## Reuse candidates

- auth/users;
- workspaces/permissions;
- billing/subscriptions/payments;
- settings;
- files/images;
- domains;
- notifications/localization/admin.

## Target modules

- architecture/UI convergence with current foundation admin, dashboard, billing, subscription, settings, support and knowledge patterns;
- catalog and hosting plans;
- hosting accounts/orders;
- provider contracts and MOFH adapter;
- provisioning;
- hsite.top/domains;
- DNS/SSL;
- files/deployments;
- VistaPanel/cPanel tool sessions;
- WebFTP/File Manager;
- custom domains and additional subdomains;
- MySQL management;
- SSL/ACME and Cloudflare/DNS automation;
- Site.Pro/Site Builder;
- statistics and quotas;
- support/knowledge;
- account access history and safe customer communication metadata;
- admin/operations/audit.

## Architecture constraint

Before adding new Bixa parity surfaces, normalize existing HospedFree admin/dashboard screens that diverge from the current foundation architecture. Hosting plans/packages adapt the existing billing products/prices/subscriptions model with provider package mapping. Admin settings must cover MOFH/VistaPanel, WebFTP/File Manager, Cloudflare, ACME/SSL, Site.Pro/Site Builder, allowed domains, tool enablement and health checks.

## Out of scope

Links, folders, biolinks, QR Codes, tracking pixels, link pages/overlays and their themes/widgets remain inherited until a safe removal plan.
# Current implementation note

Current HospedFree modules: `app/Hosting`, `app/Knowledge`, `app/Support`, `resources/client/hosting`, `resources/client/admin/hosting`, `config/hospedfree.php`, and additive `2026_08_10` hosting/support/billing migrations. Reused foundation: auth, users, personal workspaces, permissions, billing, settings, admin layout and shared UI. Hidden legacy remains links, folders, biolinks, QR Codes, tracking pixels, link pages/overlays and generated API files.
