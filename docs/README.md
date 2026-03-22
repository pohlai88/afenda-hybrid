# Documentation

Monorepo focus: **`@afenda/db`** (`packages/db/`).

## Use these first

| Doc                                        | Purpose                              |
| ------------------------------------------ | ------------------------------------ |
| [QUICK_START.md](./QUICK_START.md)         | Setup, Docker test DB, migrate, test |
| [SCHEMA_LOCKDOWN.md](./SCHEMA_LOCKDOWN.md) | Migrations + custom SQL              |
| [CI_GATES.md](./CI_GATES.md)               | What CI runs; local commands         |

**Checks:** `pnpm check:docs-sync` · `pnpm check:hr-audit-matrix` · `pnpm gate:early`

## Reference

| Area                   | Doc                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------ |
| DB design rules        | [architecture/01-db-first-guideline.md](./architecture/01-db-first-guideline.md)     |
| HCM                    | [hcm/README.md](./hcm/README.md)                                                     |
| Preflight SQL          | [preflight/README.md](./preflight/README.md)                                         |
| ADRs                   | [architecture/adr/](./architecture/adr/README.md)                                    |
| Case-insensitive codes | [patterns/case-insensitive-uniqueness.md](./patterns/case-insensitive-uniqueness.md) |
