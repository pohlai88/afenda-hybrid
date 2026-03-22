# `schema-hrm/` (HRM schema package)

**Purpose:** PostgreSQL **human-capital** domains as TypeScript/Drizzle modules: **`hr`**, **`payroll`**, **`benefits`**, **`learning`**, **`recruitment`**, and **`talent`**. This folder is a **sibling** of [`schema-platform`](../schema-platform/README.md) (core / security / audit) and of infra folders [`_shared`](../_shared/README.md), [`_queries`](../_queries/README.md), [`_services`](../_services/README.md).

## Why a separate folder

- **Boundary:** platform / identity / audit vs HCM domains — easier ownership and reviews.
- **Scale:** Each domain can grow with `fundamentals/`, `operations/`, `_relations.ts`, domain `_shared/` (not the same as global `_shared`).

## Domains (quick nav)

| Domain             | Postgres schema (typical) | README                                           |
| ------------------ | ------------------------- | ------------------------------------------------ |
| **`hr/`**          | `hr`                      | [hr/README.md](./hr/README.md)                   |
| **`payroll/`**     | `payroll`                 | [payroll/README.md](./payroll/README.md)         |
| **`benefits/`**    | `benefits`                | [benefits/README.md](./benefits/README.md)       |
| **`learning/`**    | `learning`                | [learning/README.md](./learning/README.md)       |
| **`recruitment/`** | `recruitment`             | [recruitment/README.md](./recruitment/README.md) |
| **`talent/`**      | `talent`                  | [talent/README.md](./talent/README.md)           |

## Entry points

- **Drizzle Kit / full schema:** [`schema-platform/index.ts`](../schema-platform/index.ts) re-exports HRM domains — that file is the configured `schema` path in `drizzle.config.ts`.
- **Targeted imports:** App and infra code may import **`@db/schema-hrm/<domain>/...`** (e.g. `@db/schema-hrm/recruitment/operations/applications`) to avoid pulling the entire barrel.

## Imports when authoring tables

| Scope                                                        | Convention                                                                                   |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| **Inside** a domain (e.g. `recruitment/operations/*.ts`)     | **Relative** imports within the same domain tree.                                            |
| **Cross-HRM** (e.g. payroll → hr)                            | Shallow relatives (`../hr/...`) where stable; **`@db/schema-hrm/...`** when clearer.         |
| **`_shared` (global)**                                       | Column mixins and Zod wire: **`@db/_shared`** or relative `../../_shared` (depth-dependent). |
| **Domain `_shared/`** (e.g. `talent/_shared/proficiency.ts`) | **Local** helpers for that PG schema only — do not re-export as global `_shared`.            |
| **`_queries` / `_services`**                                 | **`@db/schema-hrm/...`** + **`@db/db`** — consistent with the rest of `packages/db/src`.     |

## Barrel style

Subfolder `index.ts` files typically use **`export *`** from child modules so Drizzle relations and Kit see a complete graph. The stricter **explicit barrel** policy applies to **`_queries` / `_services` / `_shared`**, not necessarily to every schema sub-barrel (see [schema-platform README](../schema-platform/README.md#barrel-style-indexts)).

## See also

- [schema-platform](../schema-platform/README.md) — Drizzle entry, core/security/audit
- [Database layer overview](../README.md)
- [DB-first guideline](../../../docs/architecture/01-db-first-guideline.md)
- Recruitment enforcement: [ADR 0002](../../../docs/architecture/adr/0002-recruitment-lifecycle-enforcement.md)
