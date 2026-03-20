# CI Gates Documentation

**Version**: 2.0  
**Last Updated**: 2026-03-20  
**Status**: Production Ready

## Overview

The AFENDA-HYBRID project implements a comprehensive CI gate system to ensure database schema quality, security, and consistency. The gates are organized into two main workflows:

1. **Early Gate** (`early-gate.yml`) - Fast checks for all PRs
2. **Database CI** (`db-ci.yml`) - Deep database-specific validation

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CI GATE ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        EARLY GATE (All PRs)                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │   │
│  │  │  TIER 1  │  │  TIER 2  │  │  TIER 3  │  │       TIER 4         │ │   │
│  │  │  <30s    │  │  <1min   │  │  <2min   │  │       <1min          │ │   │
│  │  ├──────────┤  ├──────────┤  ├──────────┤  ├──────────────────────┤ │   │
│  │  │ Lint     │  │ Schema   │  │ Quality  │  │ Breaking Changes     │ │   │
│  │  │ Type     │  │ Drift    │  │ Gates    │  │ Detection            │ │   │
│  │  │ Deps     │  │ Check    │  │ Guideline│  │                      │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────────┘ │   │
│  │                                                                      │   │
│  │  ┌──────────────────────┐  ┌──────────────────────────────────────┐ │   │
│  │  │       TIER 5         │  │            TIER 6                    │ │   │
│  │  │       <1min          │  │            <30s                      │ │   │
│  │  ├──────────────────────┤  ├──────────────────────────────────────┤ │   │
│  │  │ Security Gate        │  │ Documentation Sync                   │ │   │
│  │  │ - Secrets scan       │  │ - Registry validation                │ │   │
│  │  │ - Migration security │  │ - Schema docs                        │ │   │
│  │  │ - RLS patterns       │  │                                      │ │   │
│  │  └──────────────────────┘  └──────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    DATABASE CI (Schema Changes)                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │   │
│  │  │ STAGE 1  │  │ STAGE 2  │  │ STAGE 3  │  │      STAGE 4         │ │   │
│  │  ├──────────┤  ├──────────┤  ├──────────┤  ├──────────────────────┤ │   │
│  │  │ Schema   │  │ Custom   │  │Migration │  │ Concurrent Safety    │ │   │
│  │  │ Check    │  │ SQL      │  │ Up/Down  │  │                      │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────────┘ │   │
│  │                                                                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │   │
│  │  │ STAGE 5  │  │ STAGE 6  │  │ STAGE 7  │  │      STAGE 8         │ │   │
│  │  ├──────────┤  ├──────────┤  ├──────────┤  ├──────────────────────┤ │   │
│  │  │ Smoke    │  │ Data     │  │ Type     │  │ Security Scan        │ │   │
│  │  │ Tests    │  │ Integrity│  │ Safety   │  │                      │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────────┘ │   │
│  │                                                                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │                       STAGE 9                                 │   │   │
│  │  ├──────────────────────────────────────────────────────────────┤   │   │
│  │  │ Performance Baseline                                          │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Early Gate Workflow

### Triggers

- **Pull Requests**: All PRs to `main` and `develop` branches
- **Push**: Direct pushes to `main` and `develop`
- **Schedule**: Daily drift check at midnight UTC
- **Manual**: Via workflow_dispatch with optional auto-fix

### Jobs

#### Tier 1: Instant Checks (< 30 seconds)

| Job | Purpose | Blocking |
|-----|---------|----------|
| `lint-check` | ESLint and formatting | No |
| `type-check` | TypeScript compilation | **Yes** |
| `dependency-check` | Lockfile integrity, audit | No |

#### Tier 2: Schema Drift Detection (< 1 minute)

| Job | Purpose | Blocking |
|-----|---------|----------|
| `schema-drift` | Detect uncommitted schema changes | **Yes** |

**Checks performed:**
- Schema file hash comparison
- Migration sequence validation
- drizzle-kit consistency
- Custom SQL marker validation

#### Tier 3: Quality Gates (< 2 minutes)

| Job | Purpose | Blocking |
|-----|---------|----------|
| `schema-quality` | Strict schema validation | **Yes** |
| `guideline-compliance` | DB-first guideline checks | Warning |

**Checks performed:**
- Index patterns (`check:indexes`)
- Relation completeness (`check:relations`)
- Enum consistency (`check:enums`)
- Cross-schema dependencies (`check:cross-schema`)
- Tenant isolation (`check:tenant`)
- Constraint patterns (`check:constraints`)
- Naming conventions (`check:naming`)

#### Tier 4: Breaking Change Detection (< 1 minute)

| Job | Purpose | Blocking |
|-----|---------|----------|
| `breaking-change-detection` | Detect destructive changes | Warning |

**Detects:**
- DROP TABLE
- DROP COLUMN
- TRUNCATE
- ALTER TYPE
- SET NOT NULL without default

#### Tier 5: Security Gates (< 1 minute)

| Job | Purpose | Blocking |
|-----|---------|----------|
| `security-gate` | Security validation | **Yes** |

**Checks performed:**
- Hardcoded secrets scan
- Migration security patterns
- RLS policy patterns
- SQL injection patterns

#### Tier 6: Documentation Sync (< 30 seconds)

| Job | Purpose | Blocking |
|-----|---------|----------|
| `documentation-sync` | Validate documentation | **Yes** |

**Checks performed:**
- Custom SQL Registry validation
- Schema documentation completeness

### Exit Criteria

The early gate **blocks merge** if any of these fail:
- TypeScript check
- Schema drift detection
- Schema quality gate
- Security gate
- Documentation sync

## Database CI Workflow

### Triggers

- **Pull Requests**: Changes to `src/db/schema/**`, `src/db/migrations/**`, `drizzle.config.ts`, `package.json`
- **Push**: Changes to schema/migrations on `main`

### Stages

#### Stage 1: Schema Consistency Check

Validates schema files are consistent and properly structured.

```bash
pnpm db:check
pnpm check:migrations
pnpm check:drift
pnpm gate:strict
```

#### Stage 2: Custom SQL Validation

Validates custom SQL blocks against the registry and checks syntax.

```bash
pnpm check:custom-sql-registry
pnpm check:custom-sql-syntax
```

#### Stage 3: Migration Up/Down Test

Tests migration application and idempotency.

**Steps:**
1. Create extensions (btree_gist, pgcrypto)
2. Apply migrations (up)
3. Verify schema structure
4. Verify tables, indexes, FKs, triggers
5. Drop and recreate database
6. Re-apply migrations (idempotency check)

#### Stage 4: Concurrent Migration Safety

Validates migrations are safe for concurrent execution.

**Checks:**
- Non-concurrent index creation warnings
- Lock timeout testing
- Explicit LOCK TABLE detection

#### Stage 5: Database Smoke Tests

Basic functionality tests against real database.

```bash
pnpm test:db:smoke
pnpm test:db:contracts
pnpm test:db:enums
```

#### Stage 6: Data Integrity Tests

Tests constraint enforcement and data integrity.

```bash
pnpm test:db:tenant-isolation
pnpm test:db:constraints
pnpm test:db:fk-cascades
```

#### Stage 7: TypeScript Type Safety

Validates type exports and Zod schemas.

```bash
pnpm tsc --noEmit
pnpm db:verify-exports
pnpm check:branded-ids
pnpm check:type-inference
```

#### Stage 8: Security Scan

Deep security analysis of migrations.

**Checks:**
- Sensitive data patterns
- Dangerous operations
- Custom SQL documentation
- SQL injection patterns
- RLS policy verification

#### Stage 9: Performance Baseline

Analyzes index coverage and query patterns.

**Checks:**
- Missing indexes on foreign keys
- Query plan analysis

### Exit Criteria

The database CI **blocks merge** if any of these fail:
- Schema check
- Custom SQL validation
- Migration test
- Smoke tests
- Type safety
- Security scan

## Validation Scripts

### Schema Validation

| Script | Purpose | Command |
|--------|---------|---------|
| `check:naming` | Naming conventions | `pnpm check:naming` |
| `check:structure` | Schema structure | `pnpm check:structure` |
| `check:compliance` | Guideline compliance | `pnpm check:compliance` |
| `check:tenant` | Tenant isolation | `pnpm check:tenant` |
| `check:constraints` | Constraint patterns | `pnpm check:constraints` |
| `check:shared` | Shared column usage | `pnpm check:shared` |
| `check:indexes` | Index patterns | `pnpm check:indexes` |
| `check:relations` | Relation completeness | `pnpm check:relations` |
| `check:enums` | Enum consistency | `pnpm check:enums` |
| `check:cross-schema` | Cross-schema deps | `pnpm check:cross-schema` |

### Migration Validation

| Script | Purpose | Command |
|--------|---------|---------|
| `check:migrations` | Migration format | `pnpm check:migrations` |
| `check:drift` | Schema drift | `pnpm check:drift` |
| `check:breaking-changes` | Breaking changes | `pnpm check:breaking-changes` |
| `check:custom-sql-registry` | Registry validation | `pnpm check:custom-sql-registry` |
| `check:custom-sql-syntax` | SQL syntax | `pnpm check:custom-sql-syntax` |

### Type Validation

| Script | Purpose | Command |
|--------|---------|---------|
| `check:branded-ids` | Branded ID consistency | `pnpm check:branded-ids` |
| `check:type-inference` | Type exports | `pnpm check:type-inference` |
| `db:verify-exports` | Zod schema exports | `pnpm db:verify-exports` |

### Security Validation

| Script | Purpose | Command |
|--------|---------|---------|
| `check:security` | Security patterns | `pnpm check:security` |
| `check:rls-policies` | RLS policies | `pnpm check:rls-policies` |

### Documentation Validation

| Script | Purpose | Command |
|--------|---------|---------|
| `check:docs-sync` | Documentation sync | `pnpm check:docs-sync` |
| `check:hr-audit-matrix` | `hr-schema-audit-matrix.md`: 112 rows + exact `talent` table set (17) | `pnpm check:hr-audit-matrix` |

## Running Locally

### Full Gate Check

```bash
# Run all checks (non-strict)
pnpm check:all

# Run all checks (strict - warnings are errors)
pnpm check:all:strict

# Run early gate
pnpm gate:early

# Run strict gate
pnpm gate:strict
```

### Individual Checks

```bash
# Schema drift
pnpm check:drift

# Migrations
pnpm check:migrations

# Security
pnpm check:security

# Custom SQL
pnpm check:custom-sql-registry
```

### Auto-Fix

```bash
# Dry run (see what would be fixed)
pnpm fix:schema:dry

# Apply fixes
pnpm fix:schema

# Fix all (schema + lint)
pnpm fix:all
```

## Strict Mode

Enable strict mode to treat warnings as errors:

```bash
# Via command line
pnpm check:compliance:strict

# Via environment variable
CI_STRICT_WARNINGS=1 pnpm check:compliance
```

## Bypassing Checks

For development/prototyping, some checks can be bypassed:

```bash
# Allow schema drift
pnpm check:drift --allow-drift

# Quick migration check (skip checksum validation)
pnpm check:migrations --quick

# Bypass migration validation (logs but doesn't fail)
pnpm check:migrations --bypass
```

**Note**: Bypass options should never be used in CI.

## Custom SQL Registry

All custom SQL must be documented in `CUSTOM_SQL_REGISTRY.json`:

```json
{
  "version": "1.0",
  "entries": {
    "CSQL-001": {
      "purpose": "Description of what this SQL does",
      "migration": "20260319144405_migration_name",
      "type": "PARTITION|TRIGGER|FUNCTION|INDEX|...",
      "justification": "Why Drizzle can't express this",
      "rollback": "DROP FUNCTION ...",
      "approvedBy": "dba-team",
      "approvedDate": "2026-03-19",
      "sqlLines": "18-78"
    }
  }
}
```

Migration files must include markers:

```sql
-- CUSTOM: Create partition for audit_trail (CSQL-001)
CREATE TABLE audit.audit_trail_2026_q1 PARTITION OF ...
```

## CSQL-014 staging gate (review goal `finalScore`)

Before applying migration `20260320125500_review_goal_final_score_triggers` to **staging** or **production**, ensure no rows violate the trigger rules.

### Local / script

```bash
# Uses DATABASE_URL (e.g. staging connection string)
pnpm check:csql014-preflight
```

- Exit **0** when violation and orphan counts are both **0**.
- Exit **1** otherwise (with counts logged). Remediate using `docs/preflight-csql-014-review-goal-final-score.sql`.
- Jobs **without** a database (e.g. some PR checks): set `SKIP_CSQL014_PREFLIGHT=1` to no-op.

### CI/CD sketch (GitHub Actions)

Run after migrations are applied to the target DB but **before** promoting the release (or as a dedicated “data quality” job on staging):

```yaml
  data-quality-csql014:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' # or deploy branches only
    env:
      DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - name: CSQL-014 preflight (blocks if violations)
        run: pnpm check:csql014-preflight
```

Replace `STAGING_DATABASE_URL` with your secret; use a **read-only** role if your org requires it (the script only runs `SELECT COUNT`).

### Nightly staging monitoring (optional)

Run the same gate on a **schedule** so regressions surface before the next promotion — not a substitute for the pre-deploy gate, but an early warning.

**GitHub Actions** example (`.github/workflows/staging-csql014-nightly.yml` — adjust branch/cron/secrets):

```yaml
name: Staging CSQL-014 preflight (nightly)

on:
  schedule:
    - cron: "0 6 * * *" # 06:00 UTC daily; tune for your timezone
  workflow_dispatch: {}

jobs:
  preflight:
    runs-on: ubuntu-latest
    env:
      DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - id: gate
        run: pnpm check:csql014-preflight
        continue-on-error: true
      - name: Slack notify on violation
        if: steps.gate.outcome == 'failure'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_CSQL014_WEBHOOK_URL }}
        run: |
          if [ -z "${SLACK_WEBHOOK_URL:-}" ]; then echo "No SLACK_CSQL014_WEBHOOK_URL; skip notify"; exit 0; fi
          curl -sS -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"*CSQL-014 preflight failed* on scheduled staging check. Remediate: \`docs/preflight-csql-014-review-goal-final-score.sql\` — workflow: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}\"}" \
            "$SLACK_WEBHOOK_URL"
      - name: Microsoft Teams notify on violation (optional)
        if: steps.gate.outcome == 'failure'
        env:
          TEAMS_WEBHOOK_URL: ${{ secrets.TEAMS_CSQL014_WEBHOOK_URL }}
        run: |
          if [ -z "${TEAMS_WEBHOOK_URL:-}" ]; then echo "No TEAMS_CSQL014_WEBHOOK_URL; skip notify"; exit 0; fi
          curl -sS -X POST -H 'Content-Type: application/json' \
            --data "{\"@type\":\"MessageCard\",\"summary\":\"CSQL-014 preflight failed\",\"themeColor\":\"FF0000\",\"text\":\"Scheduled staging CSQL-014 preflight failed. See workflow run ${{ github.run_id }} and docs/preflight-csql-014-review-goal-final-score.sql\"}" \
            "$TEAMS_WEBHOOK_URL"
      - name: Fail job if gate failed
        if: steps.gate.outcome == 'failure'
        run: exit 1
```

Notes:

- Store webhook URLs as **secrets** (`SLACK_CSQL014_WEBHOOK_URL`, optional `TEAMS_CSQL014_WEBHOOK_URL`, plus `STAGING_DATABASE_URL`). If unset, notify steps no-op and the job still fails when the gate fails. The `curl` example uses a minimal payload; use your org’s Slack app formatting if needed.
- **Teams** Office 365 connectors expect a **MessageCard**-style JSON; your tenant may use **Workflows** URLs instead — adjust the body to match Microsoft’s current webhook schema.
- To post **counts** (not only fail/success), extend `scripts/check-csql-014-preflight.ts` to print JSON on success (e.g. `{"violations":0,"orphans":0}`) and parse that in a follow-up step for richer notifications.
- Keep **read-only** `DATABASE_URL` for this job if policy allows.

## Performance reviews lifecycle preflight

Before applying migration `20260320131009_loose_venom` (or any deploy that adds lifecycle CHECKs on `talent.performance_reviews`), ensure rows satisfy:

- `completedDate` only when `status` is `COMPLETED` or `ACKNOWLEDGED`
- `acknowledgedDate` only when `status` is `ACKNOWLEDGED`
- `finalRating` / `overallScore` only when `status` is terminal (`COMPLETED` or `ACKNOWLEDGED`)

### Local / script

```bash
pnpm check:reviews-lifecycle-preflight
```

- Exit **0** when all three violation counts are **0**.
- Exit **1** otherwise. Remediate using `docs/preflight-performance-reviews-lifecycle.sql`.
- Jobs without a database: set `SKIP_REVIEWS_LIFECYCLE_PREFLIGHT=1` to no-op (same pattern as CSQL-014).

Run **before** the migration on the same database (typically staging first). For production integrity, run **after** CSQL-014 preflight if you use both gates in one promotion: clear goal `finalScore` / review outcomes in an order that matches your workflow (see remediation notes in the SQL file).

## Promotion records preflight

Before migration `20260320131426_flaky_black_tom` (approval **CHECK**, partial/reporting indexes, unique active row per employee effective date), run:

```bash
pnpm check:promotion-records-preflight
```

- Exit **0** when **approval** violations and **duplicate** `(tenantId, employeeId, effectiveDate)` groups (among non-deleted rows) are both **0**.
- Remediation: `docs/preflight-promotion-records-approval.sql`.
- Jobs without a DB: `SKIP_PROMOTION_RECORDS_PREFLIGHT=1`.

**Note:** `approvedBy` / `approvedAt` use **CHECK** constraints (not a trigger): paired NULL/non-NULL, and when `status` is `APPROVED` or `COMPLETED`, both must be set. Stamps on other statuses are rejected.

## Grievance resolution preflight

Before migration `20260320131847_grievance_resolution_consistency` (stricter `resolvedBy` / `resolvedDate` / `status = RESOLVED` pairing + partial index on resolved cases), run:

```bash
pnpm check:grievance-resolution-preflight
```

- Exit **0** when **resolution_violations** is **0**.
- Remediation: `docs/preflight-grievance-records-resolution.sql`.
- Jobs without a DB: `SKIP_GRIEVANCE_RESOLUTION_PREFLIGHT=1`.

This replaces `chk_grievance_records_resolved_complete` (RESOLVED implies both fields) with **full consistency**: resolution fields are paired, and **`status` must be `RESOLVED` whenever either field is set**.

## Learning / certification lifecycle preflight

Before migration `20260320132450_learning_completion_cert_verification`:

- **`learning.training_enrollments`**: `completionDate` is set **if and only if** `status = COMPLETED` (there is no `completedBy` column today).
- **`talent.employee_certifications`**: `verifiedBy` / `verificationDate` are **paired**, and **must be NULL** while `status = PENDING_VERIFICATION`.

```bash
pnpm check:learning-cert-lifecycle-preflight
```

- Exit **0** when both violation counts are **0**.
- Remediation: `docs/preflight-learning-completion-cert-verification.sql`.
- Jobs without a DB: `SKIP_LEARNING_CERT_LIFECYCLE_PREFLIGHT=1`.

## Succession plans lifecycle preflight

Before migration `20260320132957_succession_plans_lifecycle`:

- **`targetDate`** required when **`status`** is **`ACTIVE`** or **`UNDER_REVIEW`**
- **Unique** active row per **`(tenantId, positionId, successorId)`**
- **`developmentPlan`** becomes **`varchar(4000)`** (values **>4000** chars are truncated by the migration `USING` clause — preflight flags them)

```bash
pnpm check:succession-plans-preflight
```

- Exit **0** when **missing_target_date**, **duplicate_position_successor_groups**, and **development_plan_over_4000_chars** are all **0**.
- Remediation: `docs/preflight-succession-plans-lifecycle.sql`.
- Jobs without a DB: `SKIP_SUCCESSION_PLANS_PREFLIGHT=1`.

**Optional (not enabled):** require non-empty `developmentPlan` for `ACTIVE` / `UNDER_REVIEW` — see `docs/succession-plans-optional-development-plan-check.md` (CHECK name, preflight `SELECT`, Drizzle snippet, CI extension).

### Nightly: succession development-plan gap (staging)

While the optional CHECK is **off**, you can still **measure** how many live rows lack a real `developmentPlan` — useful for deciding when data is clean enough to enable `chk_succession_plans_development_when_live`.

**Local / script** (read-only `SELECT COUNT`):

```bash
DATABASE_URL=... pnpm report:succession-plans-development-gap
```

- Prints `succession_plans_live_without_development_plan_count=<n>` and a human-readable summary.
- Exits **0** even when `n > 0` (safe for non-blocking nightly jobs).
- `SUCCESSION_DEV_PLAN_GAP_FAIL=1` → exit **1** if `n > 0` (strict / “warn as failure”).
- `SKIP_SUCCESSION_DEV_PLAN_GAP_REPORT=1` → no-op.
- In **GitHub Actions**, if `GITHUB_OUTPUT` is set, appends `development_plan_gap_count=<n>` for later steps.

**GitHub Actions** example (`.github/workflows/staging-succession-dev-plan-gap-nightly.yml` — informational notify only; job stays **green** unless you add strict mode below):

```yaml
name: Staging succession — development plan gap (nightly)

on:
  schedule:
    - cron: "30 6 * * *" # 06:30 UTC; offset from other nightly jobs
  workflow_dispatch: {}

jobs:
  report:
    runs-on: ubuntu-latest
    env:
      DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - id: gap
        run: pnpm report:succession-plans-development-gap
      - name: Slack when gap > 0 (optional)
        if: steps.gap.outputs.development_plan_gap_count != '0'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_SUCCESSION_DEV_PLAN_GAP_WEBHOOK_URL }}
        run: |
          if [ -z "${SLACK_WEBHOOK_URL:-}" ]; then echo "No webhook; skip"; exit 0; fi
          curl -sS -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"*Succession plans (staging)*: \`${{ steps.gap.outputs.development_plan_gap_count }}\` ACTIVE/UNDER_REVIEW row(s) with empty \`developmentPlan\`. Optional CHECK not enabled — \`docs/succession-plans-optional-development-plan-check.md\`. Workflow: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}\"}" \
            "$SLACK_WEBHOOK_URL"
```

To emit **only** the JSON metrics line (for a follow-up `curl` / warehouse step), add to the **gap** step:

```yaml
        env:
          SUCCESSION_DEV_PLAN_GAP_JSON_LINE: "1"
```

The script appends **`development_plan_gap_count=<n>`** to **`GITHUB_OUTPUT`** when GitHub sets that env var (default on every step), which exposes **`steps.gap.outputs.development_plan_gap_count`**.

**Strict nightly (red build when gap > 0):** on the report step set `SUCCESSION_DEV_PLAN_GAP_FAIL: 1`, or add `run: test "${{ steps.gap.outputs.development_plan_gap_count }}" -eq 0`.

**Trends / metrics (optional):** the report script can emit **one JSON line** (`SUCCESSION_DEV_PLAN_GAP_JSON_LINE=1`) and appends to **`GITHUB_STEP_SUMMARY`** when GitHub provides it — see `docs/succession-plans-optional-development-plan-check.md` → *Metrics & trend charts*.

## Talent: `case_links` orphan endpoints (optional report)

`talent.case_links` is polymorphic; FK to grievance/disciplinary rows is **not** enforced in PostgreSQL. Use a read-only count to find broken `(sourceType, sourceId)` / `(targetType, targetId)` references.

```bash
DATABASE_URL=... pnpm report:case-links-integrity
```

- Prints `case_links_orphan_endpoint_count=<n>`.
- Exits **0** by default; `CASE_LINKS_ORPHAN_FAIL=1` → exit **1** if `n > 0`.
- `SKIP_CASE_LINKS_INTEGRITY_REPORT=1` → no-op.
- See `docs/talent-domain-boundaries.md`.

## Troubleshooting

### Schema Drift Detected

```
❌ Schema drift detected!
```

**Solution:**
```bash
pnpm db:generate
git add src/db/migrations
git commit -m "chore: add migration for schema changes"
```

### Custom SQL Not Documented

```
❌ Custom SQL CSQL-XXX not found in CUSTOM_SQL_REGISTRY.json
```

**Solution:**
1. Add entry to `src/db/schema/audit/CUSTOM_SQL_REGISTRY.json`
2. Document in `src/db/schema/audit/CUSTOM_SQL.md`

### Type Safety Errors

```
❌ Missing createSelectSchema export
```

**Solution:**
```typescript
import { createSelectSchema, createInsertSchema } from "drizzle-orm/zod";

export const myTableSelectSchema = createSelectSchema(myTable);
export const myTableInsertSchema = createInsertSchema(myTable);
```

### Breaking Change Detected

```
❌ Breaking changes detected: DROP COLUMN
```

**Solution:**
1. Review if the change is necessary
2. Consider deprecation period
3. Add comment to PR acknowledging the breaking change
4. Ensure rollback plan exists

## Best Practices

1. **Run gates locally** before pushing:
   ```bash
   pnpm gate:early
   ```

2. **Use auto-fix** for common issues:
   ```bash
   pnpm fix:schema
   ```

3. **Document custom SQL** immediately when adding

4. **Test migrations** against real database:
   ```bash
   pnpm docker:test:start
   pnpm db:migrate
   pnpm test:db
   ```

5. **Review breaking changes** carefully before approving

## Related Documentation

- [DB-First Guideline](./architecture/01-db-first-guideline.md)
- [Custom SQL Documentation](../src/db/schema/audit/CUSTOM_SQL.md)
- [Custom SQL Registry](../src/db/schema/audit/CUSTOM_SQL_REGISTRY.json)
