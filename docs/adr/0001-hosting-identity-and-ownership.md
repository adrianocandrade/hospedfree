# ADR-0001: Hosting identity and ownership

Status: accepted on 2026-08-10.

## Decision

Hosting resources belong to the current personal workspace and also record the user who requested or purchased them. The customer UI hides workspace switching and team management in the first HospedFree release, while the existing users/workspaces implementation remains the authorization boundary.

Customer queries always resolve the active workspace server-side. A client-supplied workspace ID never grants access. Global administration requires explicit permissions.

## Consequences

- No Botble `members` or `member_id` model is imported.
- One active Free slot is enforced per workspace in both application logic and the database.
- Billing remains attached to the user; hosting orders record the purchaser and subscription relationship.
