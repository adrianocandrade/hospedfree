# Security Rules

- Never add secrets to docs, tests, examples, or generated files.
- Do not reintroduce purchase-code checks, Vebto calls, or remote package replacement.
- Keep `DISABLE_CSRF=false` outside exceptional local debugging.
- Set `TRUSTED_PROXIES` only for known infrastructure.
- Add focused tests for auth, policy, workspace, or billing-sensitive changes.
- Never log or expose hosting passwords, provider tokens, cookies, 2FA secrets, private keys or raw callbacks.
- Encrypt recoverable credentials when storage is unavoidable and hide them from serialization.
- Authenticate provider callbacks/webhooks and make provisioning idempotent.
- Scope hosting, domain, SSL, deploy and support records to the authenticated owner/workspace.
- Verify TLS; never copy Bixa patterns that disable certificate checks.
- ZIP/Git deploy must block traversal, sensitive files and destructive replacement.
- Use disposable authorized accounts/domains for real MOFH, DNS or ACME tests.
