---
name: hospedfree-system
description: Guidance for changing, auditing, debugging, documenting, or improving the HospedFree Laravel/React system. Use for free or paid hosting, hsite.top, MOFH providers, provisioning, domains, DNS, SSL, files, deployments, plans, billing, support, knowledge, auth, admin, migration from inherited link modules, or analysis of the old HospedFree and Bixa references.
---

# HospedFree System

## Purpose

Ground work in the approved HospedFree product, the inherited code reality and the security rules for hosting operations.

## Workflow

1. Read AGENTS.md and PRODUCT.md.
2. Read DESIGN.md and docs/brand-hospedfree.md for UI/content work.
3. Classify the capability as current, reusable, target, reference-only or open.
4. Read the relevant reference below.
5. Inspect local code; it is the implementation truth.
6. Never copy old HospedFree/Bixa code, data, secrets or unsafe patterns.
7. Add focused tests and report only checks actually run.

## Reference routing

- Module ownership and target architecture: references/module-map.md.
- Product and implementation limits: references/rules.md.
- Sensitive surfaces and known issues: references/security-known-issues.md.
- Validation: references/testing.md.
- Old HospedFree, plugins, Bixa and Vebto provenance: references/reference-systems.md.

## Core decisions

- Free hosting with hsite.top is confirmed.
- Recurring paid hosting is confirmed; price and limits are open.
- MOFH stays behind an internal adapter and outside public branding.
- Current users/workspaces and billing are preserved until reviewed replacement.
- Links, biolinks and QR Codes are inherited and outside product scope.

## UI work

For design, UX, accessibility, responsive behavior or frontend polish, also use the generated impeccable skill. Do not edit generated skill files.

## Documentation policy

Mark current versus target status. Update docs/system when module ownership or behavior changes. Never include real credentials or raw provider payloads.
