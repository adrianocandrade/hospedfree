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

- catalog and hosting plans;
- hosting accounts/orders;
- provider contracts and MOFH adapter;
- provisioning;
- hsite.top/domains;
- DNS/SSL;
- files/deployments;
- support/knowledge;
- admin/operations/audit.

## Out of scope

Links, folders, biolinks, QR Codes, tracking pixels, link pages/overlays and their themes/widgets remain inherited until a safe removal plan.
