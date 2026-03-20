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
- [Archived: Custom SQL files validation narrative](./archive/custom-sql/CUSTOM_SQL_FILES_VALIDATION.md)
