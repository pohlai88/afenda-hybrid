---
name: react-architecture-governance
description: Governance checks — package layers, imports, and client boundaries.
---

## Purpose

Detect **structural violations** early: they compound and block scaling the design system.

## When to Apply

- New imports across packages
- Moving files between `ui-core`, `view-engine`, `erp-view-pack`, and `apps/web`
- Adding or removing `"use client"` at file top

## Anti-Patterns

- Upward imports (e.g. `ui-core` → `erp-view-pack`)
- Server-only modules reachable from client bundles
- Deep imports that bypass `package.json` `exports`

## Code Examples

Checklist (agent or human):

```md
- [ ] Dependency direction: ui-core ← view-engine ← erp-view-pack ← app
- [ ] No `next/server` or DB imports under packages meant to be client-safe
- [ ] `"use client"` only where needed; server components stay async-capable in app routes
```

## AFENDA Mapping

- Primary reference: [react-architecture — package-layering](../../react-architecture/references/package-layering.md)
- RSC pitfalls: [client-server-boundary-anti-patterns](../../react-architecture/references/client-server-boundary-anti-patterns.md)
- Pattern docs: [docs/patterns/metadata-driven-view-composition-standard.md](../../../docs/patterns/metadata-driven-view-composition-standard.md)
- **Layer imports (automated):** [tools/react-governance/README.md](../../../../tools/react-governance/README.md) — `pnpm react-governance` / `check --json` for CI and future quality scoring
