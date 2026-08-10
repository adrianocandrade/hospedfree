# Security and Known Issues Reference

> Deprecated inherited-base reference. The canonical HospedFree baseline is `docs/security/security-audit.md`.

Full map: `docs/system/divergences-and-known-issues.md` and `docs/security/security-audit.md`.

## Sensitive Surfaces

- Protected resource passwords for links, folders, and biolinks.
- Workspace scoping and filters such as `workspace_id=all` and `user_id`.
- CSRF bypasses and `DISABLE_CSRF`.
- Trusted proxy configuration.
- Custom HTML, SVG, ad snippets, highlighted HTML, and `eval`.
- Upload backends, TUS, S3 presigned URLs, and remote file delivery.
- Billing gateway webhooks and local subscription sync.
- Social auth callbacks and account linking.
- Webhook delivery signing, retry, and logs.

## Known Baseline

- Global lint has pre-existing foundation debt.
- Global format check has pre-existing imported-code debt.
- npm audit has residual low/moderate advisories in transitive paths without current fix under the existing tree.
- Playwright smoke needs an isolated local environment before running against login/register/dashboard.

## Review Rule

Do not treat every sensitive surface as broken. Inspect the exact code path, reproduce the issue when possible, and add a focused regression test for confirmed fixes.
