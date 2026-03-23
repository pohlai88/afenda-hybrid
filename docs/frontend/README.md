# Frontend documentation

Design system and UI stack for AFENDA-HYBRID (library packages only — there is no in-repo Next.js app).

## Packages

| Package                                                           | Role                                                |
| ----------------------------------------------------------------- | --------------------------------------------------- |
| [`@afenda/ui-core`](../../packages/ui-core/README.md)             | Primitives, patterns, hooks, tokens (`globals.css`) |
| [`@afenda/view-engine`](../../packages/view-engine/README.md)     | Metadata-driven forms, lists, kanban                |
| [`@afenda/erp-view-pack`](../../packages/erp-view-pack/README.md) | ERP patterns and widget overrides                   |

## Docs in this folder

| Doc                                                    | Notes                                                                                              |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| [implementation.md](./implementation.md)               | Historical implementation plan; cross-check paths against current `packages/*`                     |
| [nextjs-complete-guide.md](./nextjs-complete-guide.md) | Next.js reference when you add an app; use `@afenda/ui-core` (and siblings) in `transpilePackages` |
| [verification-report.md](./verification-report.md)     | Snapshot; scripts may be outdated                                                                  |

## Root commands (current)

```bash
pnpm ui-core              # filter @afenda/ui-core
pnpm test:ui-packages     # erp-view-pack + view-engine tests
```

## View engine

See [../view-engine/README.md](../view-engine/README.md).
