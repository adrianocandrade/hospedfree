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

## Baseline debt

- active code still contains MeuLinkBio/link modules;
- global lint/format debt predates HospedFree;
- eval warning exists in the inherited ad host;
- .env and databases must be isolated from old projects;
- real provider testing requires authorized disposable accounts/domains.

Do not label every sensitive surface vulnerable without reproducing or inspecting the exact path.
