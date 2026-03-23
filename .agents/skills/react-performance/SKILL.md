---
name: react-performance
description: >-
  React performance for AFENDA-HYBRID: runtime rendering (re-renders, keys, virtualization)
  and build-time delivery (bundles, tree-shaking, code splitting, compiler directives).
  Use when fixing slow lists, grids, or large client bundles.
metadata:
  author: AFENDA team
  version: "2026.03.23"
  source: React docs + AFENDA-HYBRID codebase analysis
  official_docs: https://react.dev
---

Performance work splits into **two domains**. Diagnose which domain applies before changing code.

## Runtime performance

- Re-render scope: state placement, stable keys, splitting interactive leaves
- Memoization: prefer letting **React Compiler** optimize when enabled; avoid blanket `useMemo`/`useCallback`
- Lists and grids: virtualization (e.g. TanStack Virtual) for large collections
- Event handlers: avoid recreating heavy closures in hot paths when it measurably matters

## Build-time performance

- Bundle size: dynamic `import()`, route-level splitting, dependency audits
- Tree-shaking: avoid side-effectful modules and accidental barrel re-exports
- Compiler directives: `"use memo"` / `"use no memo"` only when justified (document why)

> Provenance: see [GENERATION.md](GENERATION.md).

**Version alignment:** React **19**; confirm compiler and Next bundler behavior against current project config.

## Core

| Domain     | Topic                         | Reference                                                      |
| ---------- | ----------------------------- | -------------------------------------------------------------- |
| Runtime    | Re-renders, keys, splitting   | [rendering-optimization](references/rendering-optimization.md) |
| Build-time | Compiler modes and directives | [compiler-directives](references/compiler-directives.md)       |
| Build-time | Bundles, imports, barrels     | [bundle-analysis](references/bundle-analysis.md)               |
| Runtime    | Virtualized lists/grids       | [virtualization](references/virtualization.md)                 |

## Non-Goals

This skill does **not**:

- Optimize server-side code, SQL, or database pooling (`@afenda/db`)
- Tune CDN, caching headers, or image pipelines (unless explicitly in scope)
- Change business logic to “skip” renders
- Apply risky automatic refactors — use [react-quality-engine](../react-quality-engine/SKILL.md) tiers

## AFENDA Monorepo Reality Mapping

| Area              | Enforce                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| **ui-core**       | Primitives stay lean; avoid heavy optional deps in hot paths; document virtualization helpers if added |
| **view-engine**   | List/kanban renderers: prefer virtualization for large datasets; stable row keys                       |
| **erp-view-pack** | Selection and bulk UIs: minimize re-renders on selection changes (narrow subscriptions)                |
| **apps/web**      | Route-level code splitting; defer heavy client-only modules behind `dynamic` where appropriate         |

## Related skills

- [react-accessibility](../react-accessibility/SKILL.md) — keyboard and focus interact with perf fixes
- [react-quality-engine](../react-quality-engine/SKILL.md) — scoring and safe refactor workflow
