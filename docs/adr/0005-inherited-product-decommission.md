# ADR-0005: Inherited product decommission

Status: accepted on 2026-08-10.

## Decision

Links, folders, biolinks, QR codes, tracking pixels, bookings, link pages and overlays are hidden from the normal HospedFree experience after replacement routes exist. Their code and tables are removed only in reviewed dependency slices.

No conversion migration drops inherited tables. Data archival or destruction requires a later explicit ADR and verified backup.

## Consequences

- New registrations no longer create a default biolink or link.
- Menus and default redirects move to hosting before old routes are retired.
- Generated clients, policies, jobs, translations and tests are removed together with each retired module.
