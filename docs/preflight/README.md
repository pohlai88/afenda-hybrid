# Preflight SQL

Read-only **`SELECT`** scripts you run against a **real database** (staging or a read replica) **before** you apply a migration that would start enforcing new rules. They are **not** run by `drizzle-kit migrate` and **not** appended to migration files.

## How this ties to schema migrations

| Piece                                                           | Role                                                                                                                |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Migration** (`packages/db/src/migrations/<timestamp>_name/`)  | DDL + optional `-- CUSTOM:` SQL (CHECK, trigger, unique index, …) that **fails** if existing rows violate the rule. |
| **Preflight `.sql` here**                                       | Same logical rule expressed as **`SELECT`** so you can see **which rows** would break **before** migrate.           |
| **`pnpm check:*-preflight`** (`packages/db/scripts/preflight/`) | Optional automation: runs the **count** (or equivalent) against `DATABASE_URL` so CI/staging can fail early.        |

**Typical order**

1. Deploy / point at the DB that will receive the migration (staging).
2. Run the matching preflight file (or `pnpm check:…-preflight`).
3. If rows fail, fix data (or adjust the migration design) using the remediation hints in the SQL file.
4. When preflight is clean, apply the migration (`pnpm db:migrate` on that DB).

Each preflight file’s header comments name the **migration folder** it pairs with (example: CSQL-014 → `20260320125500_review_goal_final_score_triggers`).

## Ordered bundle (`check:preflight`)

From `packages/db`, with `DATABASE_URL` set:

```bash
pnpm check:preflight
```

Runs the six automated gates **in migration timestamp order**:

1. `check:csql014-preflight`
2. `check:reviews-lifecycle-preflight`
3. `check:promotion-records-preflight`
4. `check:grievance-resolution-preflight`
5. `check:learning-cert-lifecycle-preflight`
6. `check:succession-plans-preflight`

**`SKIP_ALL_PREFLIGHTS=1`** — the bundle exits 0 without connecting (use when no DB is available). Each individual script still supports its own `SKIP_*` env var (see the script header in `packages/db/scripts/preflight/`).

## Quality / parity with SQL

Each `check:*-preflight` script is paired 1:1 with a `.sql` file here. The TypeScript gate uses the same **predicate** as the SQL **violation `COUNT`** (and detail `SELECT`s in the SQL match what you would inspect manually). If a gate and its SQL ever disagree, treat the **migration + SQL remediation** as the source of truth and align the TS `WHERE` to match.

## Files

| File                                                                                                         | Topic                                                                           |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| [preflight-csql-014-review-goal-final-score.sql](./preflight-csql-014-review-goal-final-score.sql)           | Review goals `finalScore` vs parent status → `pnpm check:csql014-preflight`     |
| [preflight-performance-reviews-lifecycle.sql](./preflight-performance-reviews-lifecycle.sql)                 | Performance review lifecycle → `pnpm check:reviews-lifecycle-preflight`         |
| [preflight-promotion-records-approval.sql](./preflight-promotion-records-approval.sql)                       | Promotion approval / effective dates → `pnpm check:promotion-records-preflight` |
| [preflight-grievance-records-resolution.sql](./preflight-grievance-records-resolution.sql)                   | Grievance resolution → `pnpm check:grievance-resolution-preflight`              |
| [preflight-learning-completion-cert-verification.sql](./preflight-learning-completion-cert-verification.sql) | Learning completion / certs → `pnpm check:learning-cert-lifecycle-preflight`    |
| [preflight-succession-plans-lifecycle.sql](./preflight-succession-plans-lifecycle.sql)                       | Succession plans → `pnpm check:succession-plans-preflight`                      |

**Also:** [SCHEMA_LOCKDOWN.md](../SCHEMA_LOCKDOWN.md) (when to use custom SQL) · [CUSTOM_SQL.md](../../packages/db/src/schema-platform/audit/CUSTOM_SQL.md) (CSQL index).
