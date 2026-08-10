# Module Map Reference

> Deprecated inherited-module map. Use `docs/system/module-map.md` and the HospedFree system skill for current decisions.

Read `docs/system/module-map.md` for the full project map. This short reference keeps the most common navigation points close to the skill.

## Layers

- Product backend: `app/`.
- Foundation backend: `common/foundation/src/`.
- Product frontend: `resources/client/`.
- Foundation frontend: `common/foundation/resources/client/`.
- Product API routes: `routes/api.php`.
- Foundation API routes: `common/foundation/routes/api.php`.
- Public/web routes: `routes/web.php` and `common/foundation/routes/web.php`.
- Billing webhooks: `common/foundation/routes/webhooks.php`.
- Generated API client: `resources/client/gen/`.

## Product Areas

- Links: `app/Links`, dashboard pages, short-link renderers.
- Folders: `app/Folders`, folder CRUD and attach/detach routes.
- Biolinks: `app/Biolinks`, biolink renderer and dashboard editor.
- Biolink themes: `app/Biolinks/Models/BiolinkTheme.php`, `BiolinkThemesController`, `BiolinkAppearanceConfig`, editor appearance tab, public renderer, and `/admin/settings/biolink-themes`.
- QR Codes: `app/QrCodes`, `qr/{hashOrAlias}` redirect route.
- Analytics: `app/Analytics`, tracked events and reports.
- Tracking Pixels: `app/TrackingPixels`, `resources/views/pixels`.
- Link Pages: `app/LinkPages`, `resources/client/dashboard/link-pages`.
- Link Overlays: `app/LinkOverlays`, short-link renderers.
- Webhooks: `app/Webhooks`, `resources/client/account-settings/webhooks`.
- Tags: `app/Tags`.
- Landing and demo: `app/Http/Controllers/LandingPageController`, `app/Demo`.

## Foundation Areas

- Auth/users/social login: `common/foundation/src/Auth`, `Users`.
- Workspaces: `common/foundation/src/Workspaces`.
- Billing/plans/subscriptions/trials/payments: `common/foundation/src/Billing`.
- Roles/permissions: `common/foundation/src/Roles`, `Permissions`, `resources/defaults/permissions.php`.
- Settings: `common/foundation/src/Settings`.
- Uploads/files/images: `common/foundation/src/Files`, `Images`.
- Custom domains: `common/foundation/src/Domains`.
- Notifications, search, localization, logs, API docs, install, and admin live under their matching foundation directories.

## Before Editing

Always inspect the controller, model, request, policy, resource, route, generated client, and React query/hooks for the target behavior. Many workflows cross app and foundation boundaries.
