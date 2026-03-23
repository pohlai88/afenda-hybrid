---
name: react-bundle-analysis
description: Build-time bundle size, tree-shaking, dynamic imports, and barrel files.
---

## Purpose

Keep **JavaScript delivery** appropriate for ERP UIs: fast navigations, smaller critical paths, fewer duplicate dependencies.

## When to Apply

- A route or dialog pulls in large chart/editor libraries eagerly
- Bundle analyzer shows duplicated packages across chunks
- Barrel files (`index.ts` re-exporting everything) prevent tree-shaking

## Anti-Patterns

- Static imports of heavy optional features on every page
- Re-exporting entire dependency graphs from package entrypoints without `package.json` `sideEffects` discipline
- Multiple versions of the same library in one app

## Code Examples

```tsx
import dynamic from "next/dynamic";

const HeavyChart = dynamic(() => import("./heavy-chart"), { ssr: false, loading: () => null });
```

## AFENDA Mapping

- **`ui-core`:** Keep peer dependencies clear; avoid optional heavy deps unless lazy-loaded by consumers.
- **`apps/web`:** Split admin-only or report-only features with dynamic imports and route boundaries.
