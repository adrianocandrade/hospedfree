---
name: meulinkbio-system
description: Deprecated compatibility guidance for the inherited MeuLinkBio modules still present in HospedFree. Use hospedfree-system for all new product work; use this only to audit or safely retire inherited links, biolinks, folders, QR codes and related dependencies.
---

# MeuLinkBio System — Deprecated Compatibility

## Overview

This skill documents the inherited base only. For HospedFree work, stop and use `../hospedfree-system/SKILL.md`. Do not treat inherited link features as current product scope.

## Workflow

1. Read the HospedFree root `AGENTS.md`, `PRODUCT.md` and `docs/system/module-map.md`.
2. Use this skill only when auditing or safely retiring inherited behavior.
3. Read the relevant references below before proposing or editing behavior.
4. Inspect current code paths instead of relying on vendor docs.
5. Preserve billing and customer data.
6. Do not reintroduce Envato/Vebto purchase-code activation or remote updaters.
7. Add focused tests and record exact validation results.

## Reference Routing

- For module ownership, routes, and where code lives, read `references/module-map.md`.
- For Vebto/BeLink documentation, vendor claims, and local interpretation, read `references/vendor-docs.md`.
- For allowed/disallowed changes and style rules, read `references/rules.md`.
- For sensitive surfaces and known issues, read `references/security-known-issues.md`.
- For validation commands and acceptance checks, read `references/testing.md`.

## UI Work

Do not use MeuLinkBio visual rules for HospedFree. Use the HospedFree brand docs and the generated `impeccable` skill.

## Documentation Policy

Keep legacy statements explicitly historical. The canonical reference is `docs/system/vebto-docs-map.md`.
