# `src/db/_services`

**Purpose:** **Application-oriented database helpers** — orchestration, defense-in-depth validation (e.g. Zod `parse` on inserts), and **stable error types** (`code` fields) for flows that APIs, jobs, or CLIs drive. They coordinate `Database` / transactions with table modules and may delegate multi-table reads to [`_queries`](../_queries/README.md).

## What belongs here

- **Tenant and parent alignment** before insert when the database cannot express cross-row `tenantId` equality (see ADR 0002 / recruitment docs).
- One **bounded context** per subfolder (today: **`recruitment/`**).

## What does _not_ belong here

- **Table definitions** — `schema-platform/` and `schema-hrm/` only.
- **Global column mixins / Zod wire primitives** — [`_shared`](../_shared/README.md).
- **Pure multi-table reads** with no use-case-specific policy — often better as [`_queries`](../_queries/README.md); services can call those queries.

## Layout

```
_services/
├── index.ts                    # Root barrel: explicit re-exports per area (no `export *`)
└── <area>/
    ├── index.ts                # Area barrel
    └── *Service.ts             # e.g. createX with guards + schema.parse
```

## Import rules

| Scope                          | Rule                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Inside** `_services/<area>/` | **Relative** imports between siblings (`./applicationsService` only if needed; usually one file per service). |
| **Cross-area** under `src/db`  | **`@db/*`**: `@db/db`, `@db/schema-hrm/...`, optionally `@db/_queries/...`.                                   |

## Public API (barrels)

- Import from **`@db/_services/recruitment`** (area) or **`@db/_services`** (full re-export of wired areas).
- Barrels use **explicit named exports** only — no `export *`.

## How this fits with other layers

| Layer          | Relationship to `_services`                                                                        |
| -------------- | -------------------------------------------------------------------------------------------------- |
| **`_queries`** | Optional dependency: services may call shared query helpers instead of duplicating SQL.            |
| **`_session`** | Callers should set session context before writes that hit audit/RLS; services do not replace that. |
| **`_shared`**  | Not imported for orchestration; schema tables use mixins from `_shared` independently.             |

## Tests

Integration coverage for tenant guards lives in [`src/db/__tests__/`](../__tests__/) (e.g. `*-tenant-consistency.test.ts`). Import services via **`@db/_services/recruitment`** (or `@db/_services`) so resolution matches Vitest’s `@db` alias. Co-located `src/db/_services/**/__tests__` is fine for future unit-only tests.

## See also

- [Database layer overview](../README.md)
- [`_shared`](../_shared/README.md) · [`_session`](../_session/README.md) · [`_queries`](../_queries/README.md)
- [ADR 0002 — recruitment enforcement](../../../docs/architecture/adr/0002-recruitment-lifecycle-enforcement.md)
- [DB-first guideline](../../../docs/architecture/01-db-first-guideline.md)
