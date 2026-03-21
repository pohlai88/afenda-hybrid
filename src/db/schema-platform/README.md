# `src/db/schema-platform`

**Purpose:** PostgreSQL **platform** domains — **`core`**, **`security`**, and **`audit`** — as Drizzle table modules, plus the **single barrel** consumed by **Drizzle Kit** and apps that want one import surface for the whole data model.

## Layout

| Folder          | Postgres schema (typical) | Notes                                                                                           |
| --------------- | ------------------------- | ----------------------------------------------------------------------------------------------- |
| **`core/`**     | `core`                    | Tenants, orgs, locations, currencies, … — [index](./core/index.ts)                              |
| **`security/`** | `security`                | Users, roles, service principals — [README](./security/README.md), [index](./security/index.ts) |
| **`audit/`**    | `audit`                   | Audit trail — custom SQL registry lives here — [index](./audit/index.ts)                        |
| **`index.ts`**  | —                         | **Drizzle Kit schema entry** (`drizzle.config.ts` → `./src/db/schema-platform/index.ts`)        |

## Relationship to `schema-hrm`

Human-capital tables live in the sibling package **[`schema-hrm`](../schema-hrm/README.md)** (`hr`, `payroll`, `benefits`, `learning`, `recruitment`, `talent`). For ergonomics, **`schema-platform/index.ts` re-exports** those domains so `import { … } from "@db/schema-platform"` (or a star import) can see platform + HRM in one place.

`schemaFilter` in `drizzle.config.ts` must list **all** Postgres schema names Drizzle manages (platform + HRM).

## Imports when authoring tables

| Scope                                                | Convention                                                                                                                                                            |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Inside** `schema-platform/**`                      | Prefer **relative** imports to sibling modules in the same folder or subfolder.                                                                                       |
| **`_shared` mixins / Zod wire**                      | From deep files, `../../../_shared` (etc.) or **`@db/_shared`** — match depth to readability.                                                                         |
| **Cross-package** (`schema-platform` ↔ `schema-hrm`) | Prefer **`@db/schema-hrm/...`** or **`@db/schema-platform/...`** when jumping between top-level trees; relative `../schema-hrm/...` is fine from platform edge files. |
| **`_queries` / `_services` / `db.ts`**               | Use **`@db/schema-platform`**, **`@db/schema-hrm/...`**, **`@db/db`** — same rule as other `src/db` areas.                                                            |

## Barrel style (`index.ts`)

This tree’s root and subfolder barrels historically use **`export *`** so Drizzle Kit and consumers pick up every table/enum without maintaining a huge explicit symbol list. That differs from **`_queries` / `_services` / `_shared`**, where explicit named exports reduce API drift. **Do not** blindly apply the infra “no `export *`” rule here without a dedicated migration plan.

The root barrel also **re-exports** [`setSessionContext`](../_session/setSessionContext.ts) from [`_session`](../_session/README.md) for convenience; callers still **own** invoking it before audited work (see [parent README](../README.md#session-guc-namespace-canonical)).

## See also

- [HRM schema package](../schema-hrm/README.md)
- [Database layer overview](../README.md) — directory map, infra READMEs, session GUCs
- [`_shared`](../_shared/README.md) · [`drizzle.config.ts`](../../../drizzle.config.ts)
- [DB-first guideline](../../../docs/architecture/01-db-first-guideline.md)
