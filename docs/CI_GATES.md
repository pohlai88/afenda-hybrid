# CI Gates

## Workflows

| Workflow   | Path                               | Trigger                             |
| ---------- | ---------------------------------- | ----------------------------------- |
| Early gate | `.github/workflows/early-gate.yml` | PR/push to main/develop, daily cron |
| DB CI      | `.github/workflows/db-ci.yml`      | Schema/migration changes only       |

YAML in `.github/workflows/` is authoritative when this file and reality differ.

---

## Local Commands

### Full Run (all static checks, no DB required)

```bash
pnpm gate:full
```

### 360-Degree Run (everything including DB-backed checks and tests)

```bash
# Requires Docker test DB running
pnpm docker:test:start
pnpm gate:360
```

Runs `gate:full` (all static checks including architecture docs via `gate:docs`) + `check:custom-sql-syntax` + `check:preflight` + `test:db`.

### Category-Specific Gates

Run only the checks you need:

| Command                  | What it runs                                                       | DB needed |
| ------------------------ | ------------------------------------------------------------------ | --------- |
| `pnpm gate:lint`         | eslint + prettier                                                  | No        |
| `pnpm gate:types`        | typecheck + drizzle check + exports + branded-ids + type-inference | No        |
| `pnpm gate:conventions`  | naming + structure + compliance + constraints + shared + enums     | No        |
| `pnpm gate:architecture` | tenant + indexes + relations + cross-schema                        | No        |
| `pnpm gate:security`     | security + rls-policies                                            | No        |
| `pnpm gate:migrations`   | migrations + drift + breaking-changes + custom-sql-registry        | No        |
| `pnpm gate:docs`         | docs-sync + architecture-docs + hr-audit-matrix                    | No        |

### Legacy Gates (kept for compatibility)

| Command            | What it runs                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| `pnpm gate:early`  | Fast pre-commit subset (typecheck + db:check + verify-exports + check:all + migrations + drift) |
| `pnpm gate:strict` | Same as gate:early with `--strict-warnings`                                                     |

### DB-Backed Checks (require DATABASE_URL)

| Command                        | What it runs                            |
| ------------------------------ | --------------------------------------- |
| `pnpm check:custom-sql-syntax` | Validates custom SQL against PostgreSQL |
| `pnpm check:preflight`         | All 6 domain preflight checks           |
| `pnpm test:db`                 | All vitest suites                       |

### Auto-Fix Commands

| Command               | What it does                            |
| --------------------- | --------------------------------------- |
| `pnpm fix:schema`     | Auto-fix Zod, branded IDs, type exports |
| `pnpm fix:lint`       | eslint --fix + prettier                 |
| `pnpm fix:all`        | fix:schema + fix:lint                   |
| `pnpm gate:early:fix` | fix:schema then gate:early              |

---

## Pre-commit Hook

The Husky pre-commit hook runs automatically on `git commit`:

1. `pnpm typecheck`
2. `pnpm db:check`
3. `pnpm check:drift --quick` (skip with `SKIP_DRIFT_CHECK=1`)
4. `pnpm check:migrations --quick` (skip with `SKIP_MIGRATION_CHECK=1`)
5. `pnpm db:verify-exports`
6. `pnpm lint-staged`

---

## Check Inventory (18 static + 1 DB-backed)

### Included in `check:all` (18 checks)

| Check                       | Category     | Purpose                                        |
| --------------------------- | ------------ | ---------------------------------------------- |
| `check:naming`              | Conventions  | Schema/table/column naming patterns            |
| `check:structure`           | Conventions  | Barrel exports, \_relations.ts, tier layout    |
| `check:compliance`          | Conventions  | DB-first guidelines, Zod patterns, mixins      |
| `check:constraints`         | Conventions  | NOT NULL, CHECK, UNIQUE, enum defaults         |
| `check:shared`              | Conventions  | Mixin usage for timestamps/audit               |
| `check:enums`               | Conventions  | Enum consistency and exports                   |
| `check:tenant`              | Architecture | tenantId, FK to tenants, tenant in indexes     |
| `check:indexes`             | Architecture | Tenant-led composites, partial indexes         |
| `check:relations`           | Architecture | FK to relations completeness                   |
| `check:cross-schema`        | Architecture | Tier hierarchy, circular deps                  |
| `check:security`            | Security     | SQL injection, credentials, dangerous ops      |
| `check:rls-policies`        | Security     | RLS on tenant tables, policy naming            |
| `check:migrations`          | Migrations   | Drizzle format, checksums, custom SQL markers  |
| `check:drift`               | Migrations   | Schema vs migrations drift                     |
| `check:breaking-changes`    | Migrations   | Drops, type changes detection                  |
| `check:custom-sql-registry` | Migrations   | CUSTOM_SQL_REGISTRY.json validation            |
| `check:docs-sync`           | Docs         | README, table/docs alignment                   |
| `check:architecture-docs`   | Docs         | Architecture layout, required files, ADR index |
| `check:hr-audit-matrix`     | Docs         | HR schema audit matrix structure               |

### DB-Backed (not in check:all)

| Check                     | Purpose                      |
| ------------------------- | ---------------------------- |
| `check:custom-sql-syntax` | PostgreSQL syntax validation |

### Preflight Checks (run via `check:preflight`)

| Check                                     | Domain                                   |
| ----------------------------------------- | ---------------------------------------- |
| `check:csql014-preflight`                 | Review goal final score vs parent status |
| `check:reviews-lifecycle-preflight`       | Performance review lifecycle             |
| `check:promotion-records-preflight`       | Promotion approval                       |
| `check:grievance-resolution-preflight`    | Grievance resolution                     |
| `check:learning-cert-lifecycle-preflight` | Learning completion/certs                |
| `check:succession-plans-preflight`        | Succession plans lifecycle               |

---

## Architecture Documentation Rules

`check:architecture-docs` enforces the layout of `docs/architecture/`:

**Required files:**

- `docs/architecture/00-overview.md`
- `docs/architecture/01-db-first-guideline.md`
- `docs/architecture/adr/README.md`

**Allowed structure:**

- `.md` files in the root of `docs/architecture/`
- ADRs under `adr/` (format: `NNNN-*.md`)
- No other subdirectories (edit allowlist in `check-architecture-docs.ts` if adding `diagrams/` etc.)

**ADR index consistency:** Every ADR file under `adr/` (except `README.md`) must be mentioned in `adr/README.md` (substring check).

**Fix violations:**

- Missing required file: Create it or restore from git history
- Disallowed directory: Move contents to allowed location or add to allowlist
- ADR not in index: Add link/row to `adr/README.md`

See [CONTRIBUTING.md](../CONTRIBUTING.md) for README tier roles and doc update checklist.
