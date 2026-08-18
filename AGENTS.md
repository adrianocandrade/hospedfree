# HospedFree Agent Instructions

## Product boundary

- This repository is the new HospedFree base. The target product is web hosting with a useful free plan and recurring paid hosting plans.
- Free accounts use the hsite.top subdomain offering. MOFH is an infrastructure provider behind an adapter and must not become the public brand or leak into product copy.
- The initial commercial catalog is approved: Free remains R$ 0; the public `Hospedagem Pro` plan uses the internal MOFH `pro` package with 10 GB disk, 150 GB monthly traffic, 5 domains, 10 MySQL databases and no ads, priced at R$ 9,90/month or R$ 99/year. MOFH remains an internal provider name and must not appear in public product copy.
- Two future Premium plans backed by AndradeHost/KeyHelp remain target-only. Their names, prices, quotas and package mappings are open until real infrastructure costs, adapters and authorized smoke tests are available; do not invent them.
- Short links, biolinks, QR Codes and their themes/widgets are inherited MeuLinkBio code, not HospedFree product features. Keep them stable until a reviewed removal or adaptation plan exists.
- Billing, plans, subscriptions, trials, payments and invoices are reusable foundation capabilities. Preserve them unless a scoped HospedFree design replaces them safely.
- The current users/workspaces architecture remains the implementation truth until an explicit identity migration is approved. Do not copy the old Botble members model into this base.

## Sources and provenance

- PRODUCT.md is the product truth.
- DESIGN.md is the target experience contract.
- docs/brand-hospedfree.md is the canonical brand source.
- docs/system/ distinguishes current inherited code, reuse candidates and planned HospedFree modules.
- The old project at D:\ARQUIVOS\PROJETOS\2025\SITES\hospedfree and Bixa at its bixa-2.0.1 subdirectory are read-only references. Never copy their code, secrets, database records, credentials or provider payloads.
- Bixa and the old Botble plugins help identify workflows only. Local code and current security rules always win.

## Security invariants

- Never expose or log hosting passwords, API credentials, cookies, two-factor secrets, private keys, payment secrets or raw provider payloads.
- Keep provider integrations behind contracts/adapters. Authenticate callbacks and verify signatures or allowlists where the provider supports them.
- Scope every customer resource to the authenticated owner or workspace and enforce admin permissions separately.
- Encrypt recoverable credentials at rest when storage is unavoidable; redact them from exceptions, notifications and audit logs.
- Git/ZIP deployment must block path traversal, secret files and destructive remote replacement. Public repositories only is the default until a secure token design is approved.
- Production-only provider, DNS and ACME checks must use disposable accounts/domains in an approved staging or production environment.
- Do not reintroduce Envato/Vebto purchase-code activation or remote package updaters.

## Frontend

- Prefer shadcn components from common/foundation/resources/client/shadcn, then common/foundation/resources/client/ui.
- Use Trans with static message strings for visible UI copy so translations can be extracted.
- Use Lucide icons for new controls and semantic Tailwind tokens instead of direct colors.
- Follow docs/brand-hospedfree.md. The official logo files are in public/images and must not be redrawn.
- Keep the hosting dashboard task-oriented, accessible and responsive. Credentials are masked by default; icon-only controls need accessible names or tooltips.
- New HospedFree admin/dashboard pages must follow the existing foundation page patterns before creating custom structure: `DashboardLayout.SectionContent`, `SectionContentHeader`, `SectionScrollContainer`, shadcn `GenericTable`, `TableSearchInput`, `TablePagination`, `Empty`, `Dialog`, `Dropdown`, `Badge`, `Input`, `Textarea` and `Select` where those patterns match the job. Do not build standalone centered cards/forms for admin CRUD, plans, subscriptions, support or knowledge screens when the existing billing/admin components already provide the correct model.
- When changing hosting plans, subscriptions, tickets, knowledge base or customer hosting screens, inspect the comparable existing foundation screen first, especially billing products/plans and subscriptions, and preserve its interaction model unless there is a documented HospedFree reason to diverge.
- Before adding new Bixa parity features to admin or dashboard, normalize any existing HospedFree screen that diverges from current foundation architecture. `Planos e pacotes` must adapt the existing billing/products/subscriptions flow with provider package mapping; hosting/admin settings must include the provider/tool configuration surfaces needed by MOFH/VistaPanel, WebFTP, Cloudflare, ACME/SSL, Site.Pro, allowed domains and health checks.

## Backend

- Use PHP 8.2+ and follow existing Laravel patterns.
- Prefer Laravel helpers and facades when consistent with surrounding code.
- Use class constants such as User::class instead of raw class-name strings.
- Hosting lifecycle, payment and provisioning are separate states. A successful payment does not equal successful provisioning.
- Provisioning operations must be idempotent and observable without logging secrets.
- Security-sensitive changes require focused regression tests.

## Documentation and validation

- Do not claim a feature is implemented merely because it appears in target documentation.
- Mark material statements as current, planned, reference-only or open decision.
- Do not edit generated Impeccable skill files.
- Do not claim a command passed unless it was actually run.
- For documentation-only work, check links/paths, search for secrets and audit stale brand references.
- Preferred behavior checks are composer test:php, npm run lint, npm run typecheck, npm run format:check, npm run build and php artisan route:list. Regenerate the API client only when routes or schemas change.

# Current implementation note

As of 2026-08-10, this base contains implemented HospedFree hosting core (`app/Hosting`), support (`app/Support`), knowledge base (`app/Knowledge`), customer hosting UI and admin hosting UI. Treat legacy links/biolinks/QR as hidden inherited code, not active HospedFree product.
