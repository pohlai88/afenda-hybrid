# AFENDA frontend — verification (snapshot)

**Note:** This file was a point-in-time report. The monorepo no longer includes `apps/web` or `@afenda/ui`.

## Current checks (run locally)

```bash
pnpm install
pnpm typecheck
pnpm test:ui-packages
pnpm test:db    # when DB available
```

## Packages

| Package                 | Role                                       |
| ----------------------- | ------------------------------------------ |
| `@afenda/ui-core`       | Design tokens, primitives, patterns, hooks |
| `@afenda/view-engine`   | Metadata renderers, registry, tests        |
| `@afenda/erp-view-pack` | ERP widgets/patterns, tests                |

## Root scripts (see `package.json`)

- `pnpm ui-core` — `pnpm --filter @afenda/ui-core`
- `pnpm test:ui-packages` — erp-view-pack + view-engine tests

For detailed architecture, see [../view-engine/README.md](../view-engine/README.md) and [implementation.md](./implementation.md).
