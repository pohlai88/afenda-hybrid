---
name: react-architecture
description: >-
  React and Next.js App Router architecture for AFENDA-HYBRID: Server vs Client Components,
  composition, state placement, package layering (ui-core → view-engine → erp-view-pack → apps/web).
  Use when designing components, fixing import/layer violations, or RSC boundaries.
metadata:
  author: AFENDA team
  version: "2026.03.23"
  source: React docs + AFENDA-HYBRID codebase analysis
  official_docs: https://react.dev
---

React architecture in this monorepo is **governance-first**: correct boundaries make performance, a11y, and testing predictable. Prefer [Rules of React](https://react.dev/reference/rules) (purity, hooks, React owns invocation).

**Key ideas**

- Server Components by default in `apps/web`; `"use client"` only where browser APIs, local state, or event handlers require it.
- Libraries stack: `@afenda/ui-core` → `@afenda/view-engine` → `@afenda/erp-view-pack` → app — no upward imports.
- Metadata-driven UI follows [docs/patterns/metadata-driven-view-composition-standard.md](../../../docs/patterns/metadata-driven-view-composition-standard.md).

> Provenance: see [GENERATION.md](GENERATION.md).

**Version alignment:** React **19** peers in UI packages; Next.js in `apps/web` when present. Confirm framework-specific APIs against current Next.js docs.

## Core

| Topic             | Description                                      | Reference                                                                                  |
| ----------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Server Components | RSC data fetching, streaming, Suspense           | [server-components](references/server-components.md)                                       |
| Composition       | Slots, children, delegation                      | [composition-patterns](references/composition-patterns.md)                                 |
| State             | Where state lives: server vs client, URL, stores | [state-management](references/state-management.md)                                         |
| Package layering  | What belongs in each package                     | [package-layering](references/package-layering.md)                                         |
| RSC pitfalls      | Client/server boundary mistakes                  | [client-server-boundary-anti-patterns](references/client-server-boundary-anti-patterns.md) |

## Non-Goals

This skill does **not**:

- Rewrite business logic or domain rules
- Change API contracts, database schemas, or Drizzle models
- Replace design tokens or typography scales (see ERP typography standard)
- Perform automated refactors without [react-quality-engine](../react-quality-engine/SKILL.md) tiering

## AFENDA Monorepo Reality Mapping

| Area              | Enforce                                                                                                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ui-core**       | Client-safe primitives/patterns; no server-only imports; no app-specific routes; avoid global client stores (e.g. Zustand) in this layer                                                                      |
| **view-engine**   | Metadata and registry APIs stay framework-agnostic where possible; interactive renderers/widgets are `"use client"`; depend only on `ui-core` + metadata types                                                |
| **erp-view-pack** | ERP chrome and selection/bulk patterns; Zustand and client-only stores live here; follow [packages/erp-view-pack/src/patterns/\_CONVENTIONS.md](../../../packages/erp-view-pack/src/patterns/_CONVENTIONS.md) |
| **apps/web**      | Compose packages; Server Components default; colocate `"use client"` at leaves; server actions and route handlers own I/O boundaries                                                                          |

## Related skills

- [react-design-patterns](../react-design-patterns/SKILL.md) — hooks, forms, error UI
- [react-quality-engine](../react-quality-engine/SKILL.md) — audits and governance orchestration
