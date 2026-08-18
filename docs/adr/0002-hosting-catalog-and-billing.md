# ADR-0002: Hosting catalog and billing

Status: accepted on 2026-08-10.

## Decision

The existing `products`, `prices`, `subscriptions` and `invoices` tables remain the commercial source of truth. HospedFree adds a hosting profile for each hosting product and separate provider-package mappings.

Free orders do not require a subscription. Paid provisioning starts only after the local subscription confirms the selected product and price. Payment and provider operations retain independent states.

## Consequences

- No historical price or quota is seeded.
- A paid plan is public only when it has an enabled hosting profile, a provider mapping, at least one price and an enabled configured gateway.
- Cancellation or exhausted payment grace schedules a downgrade to the Free provider package; it never deletes the hosting account.
