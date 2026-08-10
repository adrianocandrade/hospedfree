# Rules Reference

> Deprecated inherited-base reference. HospedFree rules in `../../hospedfree-system/references/rules.md` and root `AGENTS.md` take precedence.

Full rules: `AGENTS.md`, `.agents/rules/*.md`, and `docs/system/ai-rules.md`.

## Never Reintroduce

- Envato/Vebto purchase-code activation.
- `ENVATO_*` environment variables.
- Envato OAuth purchase validation.
- License-blocking middleware or alerts.
- Remote package replacement or `/update` web updater.

## Preserve

- Billing, plans, subscriptions, trials, invoices, Stripe, PayPal.
- Legal package/dependency license metadata.
- Workspace permission boundaries.
- Existing generated Impeccable files.

## Frontend

- Prefer shadcn from `common/foundation/resources/client/shadcn`.
- Fall back to `common/foundation/resources/client/ui`.
- Use `<Trans message="..." />` for visible text.
- Use lucide icons.
- Use Tailwind semantic tokens from `common-tailwind.css`.
- Use the `impeccable` skill for substantive UI design or UX work.

## Backend

- Follow existing Laravel patterns.
- Prefer helpers/facades when consistent with surrounding code.
- Use class constants such as `User::class`, not raw class strings.
- Add focused tests for auth, policy, workspace, billing, upload, webhook, password, or public-rendering changes.

## Documentation

- Code reality beats vendor docs.
- Summarize external docs with source links and access dates.
- Do not document secrets.
- Update `docs/system/` when changing modules, operations, or known divergences.
