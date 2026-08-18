# HospedFree Project Context

HospedFree is a Laravel 12 and React 19 hosting product under construction. It offers free hosting with an hsite.top subdomain and recurring paid hosting plans. MOFH is the initial provider behind an internal adapter.

The code is an isolated copy of the former MeuLinkBio base. Authentication, workspaces, billing, admin and shared UI are reuse candidates. Links, biolinks and QR Codes remain in code temporarily but are outside the HospedFree product.

The old HospedFree, its Botble plugins and Bixa are read-only references. Never copy code, secrets or data from them.

Product truth lives in `PRODUCT.md`, design in `DESIGN.md`, brand in `docs/brand-hospedfree.md`, and architecture/reference knowledge in `docs/system/`.

Use `.agents/skills/hospedfree-system` for project work. The old `meulinkbio-system` skill is a compatibility/deprecation reference only.
# Current implementation note

As of 2026-08-10, the base includes implemented hosting orders/accounts, provider operations, fake provider, MOFH adapter, customer hosting UI, admin hosting UI, support tickets and knowledge base. Links, biolinks and QR Codes remain in code temporarily but are hidden from the HospedFree experience.
