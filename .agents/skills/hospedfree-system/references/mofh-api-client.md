# MOFH API client reference

Use this reference when changing or diagnosing MOFH provisioning, packages,
accounts, domains or provider support tickets. The source is the
`infinityfree/mofh-client` documentation supplied for HospedFree. Treat the
installed dependency and local adapters as implementation truth when they
differ from documentation.

## Before changing code

1. Check the installed version in `composer.lock`.
2. Inspect `vendor/infinityfree/mofh-client/src/Client.php` and the relevant
   response class.
3. Inspect the corresponding adapter under `app/Hosting/Providers`.
4. Reproduce one endpoint at a time with normalized, redacted output.
5. Do not infer that all credentials are invalid when only one endpoint fails.

The client requires PHP, JSON and SimpleXML. Keep every provider URL on HTTPS
and retain timeout handling.

## Identifier taxonomy

Do not interchange these values:

| Value | Origin | Used for |
| --- | --- | --- |
| Reseller API username/password | MOFH reseller API setup | Authenticate provider API calls |
| Account key | Unique alphanumeric value, at most eight characters, supplied to `createAccount` | Account mutations such as suspend, unsuspend, password, removal and package change |
| VistaPanel username | Returned by `CreateAccountResponse::getVpUsername()`, usually similar to `prefix_12345678` | VistaPanel/FTP login and `getUserDomains` |
| Hosting password | Generated when creating the account | VistaPanel, FTP, database and server-side Site.Pro session |
| Package name | Configured in the reseller package catalog | `createAccount` and `changePackage`; normalize to lowercase |

Persist the account key as the remote provider identifier and the VistaPanel
username as the panel username. Never invent either value or convert a local
fake account by changing only its provider column.

## Method contract

| Method | Main input | Kind | Expected response data |
| --- | --- | --- | --- |
| `availability` | Domain | Read | `AvailabilityResponse::isAvailable()` |
| `createAccount` | Account key, password, email, domain, package | Mutation | `CreateAccountResponse::getVpUsername()` |
| `getUserDomains` | VistaPanel username | Read | `GetUserDomainsResponse::getDomains()` |
| `getDomainUser` | Domain | Read | Username, document root and status |
| `getCname` | Domain | Read | CNAME verification label |
| `listPackages` | Reseller authentication | Read | Packages with `name`, `QUOTA`, `BWLIMIT` and provider fields |
| `suspend` | Account key, reason, linked flag | Mutation | Normalized success/error |
| `unsuspend` | Account key | Mutation | Normalized success/error |
| `password` | Account key, new password | Mutation | Normalized success/error |
| `changePackage` | Account key, lowercase package | Mutation | Normalized success/error |
| `removeAccount` | Account key | Destructive mutation | Normalized success/error; suspend first |
| `createTicket` | Subject, body, domain, VistaPanel username, user IP | External mutation | `CreateTicketResponse::getTicketId()` |
| `replyTicket` | Ticket ID, body, VistaPanel username, user IP | External mutation | Normalized success/error |

Every response supports `isSuccessful()` and `getMessage()`. Never return the
response object, raw body or `getMessage()` directly to an API client. Map it to
a typed internal DTO with a safe code, safe message and retry indicator.

## Package catalog rules

- Treat the remote package catalog as the authority for deployable package
  names.
- Keep the local commercial catalog in `products`, `prices` and hosting plans.
- Map each local hosting plan to a provider package; do not create a second
  billing catalog.
- A package is selectable only when its local mapping is active and the remote
  name exists.
- Normalize remote package names to lowercase before create/change calls.
- Import only allowlisted fields such as name, disk quota and bandwidth quota.
  Never pass the complete provider package payload to the frontend.
- Diagnose `listPackages` independently. A successful availability or domain
  lookup proves those endpoints work, not necessarily the package endpoint.
- Compare the library request with current MOFH endpoint documentation when
  package authentication fails; endpoint authentication conventions can
  differ between API generations.
- The current MOFH package endpoint is `GET /json-api/listpkgs` with HTTP Basic
  authentication. Do not send reseller credentials in its query string. This
  project handles that endpoint in `MofhHostingPackageCatalogProvider` instead
  of patching the installed dependency.
- MOFH currently returns the package collection under the singular `package`
  key, while some client versions/documentation expect `packages`. The adapter
  accepts both envelopes and exposes neither raw payload.
- Despite the client documentation describing quota values as MB, the live
  endpoint currently returns `QUOTA` and `BWLIMIT` in bytes. Normalize those
  values to MB inside the adapter; treat `PHP_INT_MAX` as an unspecified or
  unlimited value rather than displaying it as a quota.

## Safe smoke-test sequence

Run only with an explicitly authorized disposable account/domain.

1. Confirm configuration presence without printing values.
2. Confirm the API base URL is HTTPS and the executing server IP is allowlisted.
3. Run `availability` with a harmless probe domain.
4. Run `listPackages` and display only normalized names/quotas.
5. For an existing account, call `getUserDomains` with the VistaPanel username.
6. Call `getDomainUser` for an expected domain and verify the returned username
   matches using a constant-time comparison.
7. Test Site.Pro only when the real VistaPanel/FTP username and password are
   available server-side. Never print the returned session URL.
8. Create a new account only after the free package is confirmed remotely and
   the chosen subdomain is available. Use a new account key and generated
   password; do not reuse an existing customer's account.
9. Reconcile until the VistaPanel username and active state are returned.
10. Delete a disposable account only with explicit authorization, suspending it
    first as required by the provider.

The project command `hosting:smoke-test` is read-only unless its implementation
explicitly documents otherwise. Adding a creation option requires idempotency,
an availability check, a confirmed package, auditability and focused tests.

## Error classification

- Transport/timeout: retryable; return a generic safe message.
- HTTP success with `isSuccessful() === false`: provider rejection; classify
  locally without exposing the raw provider message.
- Invalid or malformed response: retryable only when a later reconciliation can
  safely recover.
- Duplicate/out-of-order request: rely on local idempotency keys and reconcile.
- Package upgrade failure: preserve the existing hosting account and mark it
  recoverable; never delete the site.

Redact API usernames/passwords, hosting passwords, cookies, tokens, query
strings containing authentication, ticket bodies and raw provider responses
from logs, exceptions, events and test fixtures.

## Local architecture mapping

- `HostingProvider`: lifecycle, availability and account mutations.
- `HostingPackageCatalogProvider`: normalized remote packages.
- `HostingDomainProvider`: domain ownership and verification.
- `HostingPanelProvider`: VistaPanel access and normalized stats.
- `HostingFileManagerProvider`: server-only FTP/file operations.
- `HostingSiteBuilderProvider`: server-side Site.Pro session.

Keep MOFH terminology inside adapters and operational documentation. Public UI
must use provider-neutral HospedFree language.

Site.Pro's authenticated `requestLogin` response can use a regional HTTPS host
and an opaque `login_hash` query parameter. Permit only exact redirect hosts
configured by an administrator and only the `login_hash` parameter. Never put
the VistaPanel username, hosting password or Site.Pro API credentials in the
returned URL, logs or ordinary serialization.
