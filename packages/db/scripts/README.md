# `packages/db/scripts`

| Folder           | Role                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------ |
| **`ci/`**        | Static checks for `gate:*` and CI (migrations, drift, `check:*`, docs sync, …)       |
| **`preflight/`** | DB-backed checks before risky migrations (`check:*-preflight`)                       |
| **`report/`**    | Non-blocking reports (`report:*`)                                                    |
| **`prepare/`**   | Local helpers (`prepare-migration`, `reset-test-db`, `apply-rls`, `auto-fix-schema`) |
| **`ops/`**       | Docker test DB (`docker-test-db.ps1`, `.sh`, `docker-init-test-db.sql`)              |
| **`lib/`**       | Shared modules (`schema-analyzer`, `hr-schema-audit-matrix-core`)                    |
| **`config/`**    | Exception JSON for validators                                                        |

Run from `packages/db` via **`pnpm`** (see `package.json`). Entrypoints are **TypeScript** executed with **`tsx`**.

**TypeScript** (not plain JS): shared `lib/`, same toolchain as `src/`, no compile step.
