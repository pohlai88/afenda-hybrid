# `packages/db/src` — database layer

Schema (`schema-platform`, `schema-hrm`), migrations, tests, and small helpers.

## Quick start

```bash
pnpm install          # repo root
cp ../../.env.example ../../.env   # set DATABASE_URL
pnpm docker:test:start
pnpm db:migrate
pnpm test:db
pnpm db:studio
```

## Layout

| Path               | Role                                                             |
| ------------------ | ---------------------------------------------------------------- |
| `schema-platform/` | `core`, `security`, `audit` — Drizzle entry re-exports HRM       |
| `schema-hrm/`      | `hr`, `payroll`, `benefits`, `learning`, `recruitment`, `talent` |
| `migrations/`      | Generated SQL (append `-- CUSTOM:` blocks at end only)           |
| `_shared/`         | Column mixins, Zod helpers                                       |
| `_session/`        | `setSessionContext` / `clearSessionContext` (Postgres GUCs)      |
| `_queries/`        | Multi-table reads/writes                                         |
| `_services/`       | Use-case services (e.g. recruitment guards)                      |
| `__tests__/`       | Vitest                                                           |

**Imports across `src`:** use `@db/*` (see `packages/db/tsconfig.json` paths).

**Boundaries:** tables only under `schema-*`; no business tables in `_shared`; `_services` may call `_queries` and schema.

## Commands (in `packages/db` or via `pnpm --filter @afenda/db`)

| Command                                      | Purpose                               |
| -------------------------------------------- | ------------------------------------- |
| `pnpm db:generate`                           | Migration from schema changes         |
| `pnpm db:migrate`                            | Apply migrations                      |
| `pnpm db:check`                              | Drizzle migration consistency         |
| `pnpm check:migrations` / `pnpm check:drift` | Lockdown helpers                      |
| `pnpm test:db` / `pnpm test:db:smoke`        | Tests                                 |
| `pnpm gate:early`                            | Local CI-like script bundle           |
| `pnpm docker:test:*`                         | Test Postgres (default port **5433**) |

## Lockdown & custom SQL

Rules: [docs/SCHEMA_LOCKDOWN.md](../../docs/SCHEMA_LOCKDOWN.md). Custom SQL index: [schema-platform/audit/CUSTOM_SQL.md](./schema-platform/audit/CUSTOM_SQL.md).

## More docs

- [docs/architecture/01-db-first-guideline.md](../../docs/architecture/01-db-first-guideline.md)
- Package READMEs: [\_shared](./_shared/README.md), [\_session](./_session/README.md), [\_queries](./_queries/README.md), [\_services](./_services/README.md), [schema-platform](./schema-platform/README.md), [schema-hrm](./schema-hrm/README.md)
