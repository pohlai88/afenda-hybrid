# `src/db/_session`

**Purpose:** **Connection-scoped PostgreSQL session variables** used by audit triggers and (when enabled) RLS. This folder is **infrastructure only**: no table definitions, no domain business rules, no imports from `schema-hrm` / `schema-platform`.

## API

| Export                       | Role                                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `setSessionContext(db, ctx)` | Sets `afenda.*` GUCs (`tenant_id`, `user_id`, optional correlation/request metadata) for the current transaction/session. |
| `clearSessionContext(db)`    | Resets those GUCs (useful with pooling).                                                                                  |
| `SessionContext`             | Typed payload for `setSessionContext`.                                                                                    |
| `DbExecutor`                 | Minimal `{ execute }` surface accepted by session helpers (works with Drizzle `db` and transactions).                     |

Implementation: [`setSessionContext.ts`](./setSessionContext.ts). The barrel [`index.ts`](./index.ts) uses **explicit named re-exports** only (no `export *`).

## GUC namespace

Keys are **`afenda.*`** (e.g. `afenda.tenant_id`) so triggers and policies can use `current_setting('afenda.tenant_id', true)`. The full list and guidance on renaming live in the parent doc: [Session GUC namespace (canonical)](../README.md#session-guc-namespace-canonical).

## When to call it

Call **`setSessionContext`** at the **start** of each request or transaction that mutates or reads tenant-scoped data under audit/RLS. Typical owners: API middleware, server actions, background job runners, or test setup — **not** individual `_queries` or `_services` functions (avoid duplicate/nested sets unless you deliberately nest transactions).

## What does _not_ belong here

- Query builders or multi-table reads — [`_queries`](../_queries/README.md).
- Use-case orchestration and tenant validation on insert — [`_services`](../_services/README.md).
- Drizzle column mixins — [`_shared`](../_shared/README.md).

## Import rules

| Scope                             | Rule                                                                                                 |
| --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **This folder**                   | Only [`setSessionContext.ts`](./setSessionContext.ts) + [`index.ts`](./index.ts); no subdomains yet. |
| **Callers elsewhere in `src/db`** | Prefer **`@db/_session`** for consistency with other cross-area imports.                             |

## How this fits with other layers

| Layer                        | Relationship to `_session`                                                                                                                                |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`_shared`**                | Independent; session code does not use column mixins.                                                                                                     |
| **`_queries` / `_services`** | Rely on **callers** having set session context when the database expects it; they remain free of GUC side effects unless you explicitly choose otherwise. |
| **`schema-*` + migrations**  | Triggers/policies read `current_setting('afenda.*', true)`; keep names in sync with `setSessionContext`.                                                  |

## Tests

Session behavior is usually covered indirectly through integration tests that run against a real Postgres with audit triggers. If you add focused tests, keep them under [`src/db/__tests__/`](../__tests__/) and import via `@db/_session`.

## See also

- [Database layer overview](../README.md)
- [`_shared`](../_shared/README.md) · [`_queries`](../_queries/README.md) · [`_services`](../_services/README.md)
- [DB-first guideline](../../../docs/architecture/01-db-first-guideline.md)
