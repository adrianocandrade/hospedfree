# ADR-0003: Provider and provisioning

Status: accepted on 2026-08-10.

## Decision

Controllers and jobs depend on a typed `HostingProvider` contract. The initial adapters are a deterministic fake provider and an MOFH adapter. Provider responses are normalized into safe result objects; raw payloads are neither persisted nor returned.

Every remote operation has a unique idempotency key, explicit status, bounded retry policy and redacted diagnostic fields. Provider calls execute outside database transactions, followed by a locked persistence step and reconciliation.

## Consequences

- TLS verification is mandatory.
- The MOFH callback is not a source of truth until an authentication mechanism is proven.
- Real integration checks require an authorized disposable account and domain.
