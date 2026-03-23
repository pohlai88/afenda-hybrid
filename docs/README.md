# Documentation

Monorepo focus: **`@afenda/db`** (`packages/db/`). UI / view-engine docs live in subfolders below.

## Use these first

| Doc                                        | Purpose                              |
| ------------------------------------------ | ------------------------------------ |
| [QUICK_START.md](./QUICK_START.md)         | Setup, Docker test DB, migrate, test |
| [SCHEMA_LOCKDOWN.md](./SCHEMA_LOCKDOWN.md) | Migrations + custom SQL              |
| [CI_GATES.md](./CI_GATES.md)               | What CI runs; local commands         |

**Checks:** `pnpm check:docs-sync` · `pnpm check:hr-audit-matrix` · `pnpm gate:early`

## UI & view engine

| Area                      | Doc                                                          |
| ------------------------- | ------------------------------------------------------------ |
| Agents / React governance | [AGENTS.md](../AGENTS.md) (skill routing, monorepo UI rules) |
| View engine               | [view-engine/README.md](./view-engine/README.md)             |
| Frontend / Next           | [frontend/README.md](./frontend/README.md)                   |
| Testing / Vitest          | [testing/README.md](./testing/README.md)                     |

## Reference

| Area                               | Doc                                                                                                              |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| DB design rules                    | [architecture/01-db-first-guideline.md](./architecture/01-db-first-guideline.md)                                 |
| HCM                                | [hcm/README.md](./hcm/README.md)                                                                                 |
| Preflight SQL                      | [preflight/README.md](./preflight/README.md)                                                                     |
| ADRs                               | [architecture/adr/](./architecture/adr/README.md)                                                                |
| Audit & traceability (UX)          | [patterns/audit-traceability-ux-standard.md](./patterns/audit-traceability-ux-standard.md)                       |
| Bulk selection (UX + architecture) | [patterns/bulk-interaction-standard.md](./patterns/bulk-interaction-standard.md)                                 |
| Data grids (UX + interaction)      | [patterns/data-grid-interaction-standard.md](./patterns/data-grid-interaction-standard.md)                       |
| Destructive actions (safety)       | [patterns/destructive-action-safety-standard.md](./patterns/destructive-action-safety-standard.md)               |
| ERP visual density & typography    | [patterns/erp-visual-density-typography-standard.md](./patterns/erp-visual-density-typography-standard.md)       |
| Metadata-driven view composition   | [patterns/metadata-driven-view-composition-standard.md](./patterns/metadata-driven-view-composition-standard.md) |
| Command surface & toolbar          | [patterns/command-surface-toolbar-standard.md](./patterns/command-surface-toolbar-standard.md)                   |
| Notification & system feedback     | [patterns/notification-system-feedback-standard.md](./patterns/notification-system-feedback-standard.md)         |
| Permission & role interaction      | [patterns/permission-role-interaction-standard.md](./patterns/permission-role-interaction-standard.md)           |
| Workflow & state transition        | [patterns/workflow-state-transition-standard.md](./patterns/workflow-state-transition-standard.md)               |
| Cross-module navigation            | [patterns/cross-module-navigation-standard.md](./patterns/cross-module-navigation-standard.md)                   |
| Case-insensitive codes             | [patterns/case-insensitive-uniqueness.md](./patterns/case-insensitive-uniqueness.md)                             |
