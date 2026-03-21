# `src/db/_queries`

**Purpose:** Reusable **data-access helpers** — async functions that take a Drizzle `Database` (or transaction) plus tenant/context arguments and compose **multiple tables** into one coherent read or write. They sit between raw table modules (`schema-hrm/*`, `schema-platform/*`) and higher-level use-cases.

## What belongs here

- Multi-step selects, aggregations, or inserts that **do not** fit cleanly in a single table file.
- Domain-sized folders (e.g. `talent/`) so the tree stays navigable as it grows.

## What does _not_ belong here

- **Table definitions** — keep those under `schema-platform/` and `schema-hrm/`.
- **HTTP / API / CLI orchestration** — prefer [`_services`](../_services/README.md) (services may call into `_queries`).
- **Column mixins and global Zod wire primitives** — use [`_shared`](../_shared/README.md).

## Layout

```
_queries/
├── index.ts              # Root barrel: explicit re-exports per domain (no `export *`)
└── <domain>/
    ├── index.ts          # Domain barrel: explicit re-exports from files in this folder
    └── *.ts              # One concern per file (e.g. readiness vs qualified holders)
```

Current domains: **`talent/`** (competency frameworks, certifications, proficiency helpers).

## Import rules

| Scope                           | Rule                                                                   |
| ------------------------------- | ---------------------------------------------------------------------- |
| **Inside** `_queries/<domain>/` | Use **relative** imports between siblings (`./getFrameworkReadiness`). |
| **Cross-area** under `src/db`   | Use the **`@db/*`** alias: `@db/db`, `@db/schema-hrm/...`, etc.        |

## Public API (barrels)

- **`index.ts`** re-exports only what each domain’s `index.ts` exposes — **explicit named exports**, no `export *`.
- Consumers should prefer stable entrypoints such as `@db/_queries/talent` or `@db/_queries` (root), not deep file paths, unless you need a private helper.

## How this fits with other layers

| Layer           | Relationship to `_queries`                                                                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`_shared`**   | Table modules spread mixins from `_shared`; `_queries` typically does **not** import `_shared` (logic uses table columns and schema types).                                                       |
| **`_session`**  | Callers (API, jobs, tests) should set session context **before** work that hits audited/RLS-protected tables — see [`_session`](../_session/README.md). `_queries` do not set context themselves. |
| **`_services`** | May import and call `_queries` for shared multi-table access; keep **tenant guards** and **insert policy** in services when they are use-case specific.                                           |

## Tests

Integration or contract tests live under [`src/db/__tests__/`](../__tests__/). Prefer importing the public barrel, e.g. `@db/_queries/talent`, so paths match production import style.

## See also

- [Database layer overview](../README.md) — structure, CI, commands
- [`_shared`](../_shared/README.md) · [`_session`](../_session/README.md) · [`_services`](../_services/README.md)
- [DB-first guideline](../../../docs/architecture/01-db-first-guideline.md)
