# Testing Reference

> Deprecated inherited-module checks. Use `../../hospedfree-system/references/testing.md` for HospedFree work.

Use the narrowest checks that prove the change, then broaden for shared/security-sensitive behavior.

## Documentation or Skill Only

- Validate skill structure:
  - `python C:\Users\adriano\.codex\skills\.system\skill-creator\scripts\quick_validate.py .agents\skills\meulinkbio-system`
- Search for secrets before finalizing.
- Check internal links and referenced paths.
- Verify Envato/purchase-code/updater terms only appear in guardrail docs/tests or the documented historical migration residue.

## Backend Behavior

- `composer test:php`
- Add focused feature/unit tests for policies, auth, workspace scope, billing, uploads, webhooks, or public pages.
- Inspect routes with `php artisan route:list` when route behavior changes.
- Regenerate API docs/client with `composer api-docs` when API resources or routes change.

## Frontend Behavior

- `npm run typecheck`
- `npm run build`
- `npm run lint` when touching lint-clean surfaces or when fixing lint debt intentionally.
- Use Playwright smoke for login, registration, dashboard, links, public biolinks, mobile layout, and console errors when a safe local environment is available.

## Known Check Caveats

- Do not claim global lint or global format pass unless actually rerun and green.
- Do not run UI smoke against a production-like `.env`; create an isolated local database first.
