# `_shared/` (global mixins & Zod wire)

**Purpose:** Reusable **definitions** for authoring Drizzle tables and shared Zod wire shapes across the repo. Everything here is **build-time / schema-time** — no `Database`, no queries, no imports from [`_queries`](../_queries/README.md), [`_services`](../_services/README.md), or [`_session`](../_session/README.md).

## Contents

| Module            | Role                                                                                                                                                                                                            |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `timestamps.ts`   | `timestampColumns`, `softDeleteColumns`, `appendOnlyTimestampColumns`, CI fingerprints.                                                                                                                         |
| `auditColumns.ts` | `createdBy` / `updatedBy` mixins and fingerprints.                                                                                                                                                              |
| `nameColumns.ts`  | Shared `name` text column pattern.                                                                                                                                                                              |
| `zodWire.ts`      | `date` / `timestamptz` Zod schemas and helpers (`isoDateWireString`, `nullableOptional`, …). Domain `_zodShared.ts` files import and re-export for local ergonomics.                                            |
| `index.ts`        | **Explicit** re-exports from the above (including every `zodWire` symbol) — **no `export *`**. Also exports `ALL_SHARED_FINGERPRINTS`, `MANDATORY_SHARED_COLUMNS`, `RECOMMENDED_SHARED_COLUMNS` for CI/tooling. |

## Not the same as `schema-hrm/<domain>/_shared/`

Domain folders may define **package-local** helpers (e.g. `talent/_shared/proficiency.ts`) tied to that PostgreSQL schema. Do **not** treat those as global `_shared`; avoid re-exporting domain `_shared` from here.

## Import rules

| Scope                                                     | Rule                                                                                                                                                                                              |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Inside** `_shared/`                                     | **Relative** imports between files (`./zodWire`).                                                                                                                                                 |
| **Schema packages** (`schema-hrm/*`, `schema-platform/*`) | Typically `from "../../_shared"` or **`@db/_shared`** when crossing many levels — both resolve to this folder; prefer **`@db/_shared`** for consistency with other infra under `packages/db/src`. |

## How this fits with other layers

| Layer                        | Relationship to `_shared`                                                                                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`_session`**               | Independent.                                                                                                                                                                                      |
| **`_queries` / `_services`** | May use types from table/Zod modules that were built with these mixins; they should **not** import `_shared` for runtime query logic except where a shared Zod helper is genuinely needed (rare). |
| **Migrations / CI**          | Fingerprint constants support duplication detection (`check-shared-columns`, etc.).                                                                                                               |

## Tests

Behavior is mostly enforced by CI gates and schema tests. If you add Zod-wire unit tests, place them under [`__tests__/`](../__tests__/) and import via **`@db/_shared`** where appropriate.

## See also

- [Database layer overview](../README.md)
- [`_session`](../_session/README.md) · [`_queries`](../_queries/README.md) · [`_services`](../_services/README.md)
- [DB-first guideline](../../../docs/architecture/01-db-first-guideline.md) — shared columns and tenancy
