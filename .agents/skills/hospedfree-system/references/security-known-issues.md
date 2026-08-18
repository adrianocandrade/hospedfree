# Security and known issues

Read docs/security/security-audit.md and docs/system/divergences-and-known-issues.md.

## High-risk surfaces

- account/workspace ownership;
- provider secrets, responses and callbacks;
- hosting credentials;
- payment webhooks and provisioning transitions;
- domains, DNS, Cloudflare and ACME;
- ZIP/Git deploy;
- files/uploads;
- tickets/rich text/attachments;
- admin actions and logs;
- inherited custom HTML/SVG/ad code.

## Reference hazards

Bixa contained disabled TLS verification, raw callback logging and passwords in e-mail. These patterns are explicitly prohibited.

The live VistaPanel `option=installer` redirect currently contains the hosting account password. Never return or log that redirect. `MofhHostingPanelProvider` must reject it with `installer_redirect_contains_password`, and `HostingToolsService` must use the current validated HTTPS control-panel URL as the safe installer fallback until the provider offers credential-free SSO.

## Baseline debt

- active code still contains MeuLinkBio/link modules;
- global lint/format debt predates HospedFree;
- eval warning exists in the inherited ad host;
- .env and databases must be isolated from old projects;
- real provider testing requires authorized disposable accounts/domains.

## Confirmed release blockers — 2026-08-13

- The Site.Pro `login_hash` is contained by the server-side one-use redirect broker and no-store/no-referrer controls. Provider TTL/one-time semantics still require authorized verification before launch.
- Outgoing e-mail MIME remains a privileged technical surface. Metadata, content and download now use separate permissions, and content access/download are persisted in the administrative security audit.
- The previous e-mail address now receives a content-safe notice after a confirmed address change. The notice never includes the new address, OTP, signed URL or token.
- Customer security events and safe communication metadata have configurable retention. The customer projection contains only the event type, masked IP and timestamp.

Implemented controls include least-privilege self-service updates, current-password/pending-email confirmation, notice to the previous address, scoped expiring personal tokens, a read-only selected-user admin security tab, a token/browser HTTP owner-attacker matrix, explicit customer security events, configurable retention and customer communication metadata isolated from the technical MIME log.

The full evidence and task matrix are in `docs/audits/security-and-completion-audit-2026-08-13.md`.

Do not label every sensitive surface vulnerable without reproducing or inspecting the exact path.
