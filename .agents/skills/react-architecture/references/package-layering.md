---
name: afenda-package-layering
description: Dependency direction and responsibilities across ui-core, view-engine, erp-view-pack, and apps/web.
---

## Purpose

Prevent **circular dependencies** and keep generic UI reusable across apps and packages.

## When to Apply

- Adding a new package or importing between existing ones
- Moving a component from `apps/web` into a package (or vice versa)
- Exposing public APIs via `package.json` `exports`

## Anti-Patterns

- `ui-core` importing from `view-engine` or `erp-view-pack`
- `view-engine` importing from `erp-view-pack`
- Duplicating ERP-specific copy or icons inside `ui-core` primitives

## Code Examples

Allowed direction:

```
@afenda/ui-core  ←  @afenda/view-engine  ←  @afenda/erp-view-pack  ←  apps/web
```

## AFENDA Mapping

| Package         | May import                       | Must not import                            |
| --------------- | -------------------------------- | ------------------------------------------ |
| `ui-core`       | Radix, utilities, tokens         | `view-engine`, `erp-view-pack`, app routes |
| `view-engine`   | `ui-core`, metadata types        | `erp-view-pack`                            |
| `erp-view-pack` | `ui-core`, `view-engine`         | `apps/web`                                 |
| `apps/web`      | all published workspace packages | —                                          |

Public entry points: follow each package’s `src/index.ts` / `exports` — do not deep-import private paths unless the package explicitly allows it.

**Mechanical enforcement:** from the repo root run `pnpm react-governance` (see [tools/react-governance/README.md](../../../../tools/react-governance/README.md)). The CLI normalizes `@afenda/pkg/subpath` to the package root before applying layer rules; TypeScript `paths` aliases are not fully resolved in v1.
