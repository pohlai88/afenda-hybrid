# CI Gate Quick Reference Card

**For Developers**: What CI checks and how to fix common issues

---

## Quick Diagnostics

### Is CI Failing on Your PR?

```bash
# Run all checks locally
pnpm gate:strict

# Run specific checks
pnpm check:compliance    # Type safety, Zod schemas, patterns
pnpm check:tenant        # Tenant isolation
pnpm check:constraints   # Check constraints, indexes
pnpm check:naming        # Naming conventions
pnpm check:structure     # File structure
pnpm check:shared        # Shared column mixins
```

---

## Common Issues & Fixes

### ❌ Issue 1: "Missing createSelectSchema export"

**Error**:
```
❌ src/db/schema/hr/employees.ts:1:1
   [P7/zod-select-schema] Table: employees
   Missing createSelectSchema export
```

**Fix**:
```typescript
// Add at end of file
export const employeesSelectSchema = createSelectSchema(employees);
export const employeesInsertSchema = createInsertSchema(employees);
```

---

### ❌ Issue 2: "Column should be .notNull()"

**Error**:
```
⚠️  src/db/schema/hr/employees.ts:45:3
   [P3/not-null-default] Table: employees
   Column "departmentId" should be .notNull() unless explicitly justified
```

**Fix**:
```typescript
// Before
departmentId: integer(),

// After
departmentId: integer().notNull(),

// OR if intentionally nullable, add to exemption list
// in scripts/check-guideline-compliance-v2.ts
```

---

### ❌ Issue 3: "Missing tenantId for tenant isolation"

**Error**:
```
❌ src/db/schema/hr/employees.ts:10:1
   [P3/tenant-scope] Table: employees
   Domain table should include tenantId for tenant isolation
```

**Fix**:
```typescript
import { tenantScopedColumns } from "../_shared";

export const employees = hrSchema.table("employees", {
  employeeId: integer().primaryKey().generatedAlwaysAsIdentity(),
  ...tenantScopedColumns,  // Adds tenantId with FK
  // ... rest of columns
});
```

---

### ❌ Issue 4: "Timestamp type inconsistency" (NEW)

**Error**:
```
❌ src/db/schema/audit/retentionPolicy.ts:81:3
   [P3/timestamp-type-consistency] Table: retention_policies
   Column "effectiveFrom" has timestamp semantics but uses integer()
```

**Fix**:
```typescript
// Before
effectiveFrom: integer(),  // Timestamp as epoch
lastAppliedAt: integer(),  // Timestamp of last job run

// After
effectiveFrom: timestamp({ withTimezone: true }),
lastAppliedAt: timestamp({ withTimezone: true }),
```

**Why**: Columns ending in `At`, `Date`, `Time`, or `Timestamp` should use `timestamp({ withTimezone: true })` for consistency.

---

### ❌ Issue 5: "Append-only table has updatedAt" (NEW)

**Error**:
```
❌ src/db/schema/audit/auditTrail.ts:153:3
   [P1/append-only-no-updates] Table: audit_trail
   Append-only table should not have updatedAt column
```

**Fix**:
```typescript
// Before
import { timestampColumns } from "../_shared";
export const auditTrail = auditSchema.table("audit_trail", {
  auditId: bigint({ mode: "number" }).primaryKey(),
  ...timestampColumns,  // Includes updatedAt - WRONG for append-only
});

// After
import { appendOnlyTimestampColumns } from "../_shared";
export const auditTrail = auditSchema.table("audit_trail", {
  auditId: bigint({ mode: "number" }).primaryKey(),
  ...appendOnlyTimestampColumns,  // Only createdAt - CORRECT
});
```

**Why**: Append-only tables (audit trails, event logs) should never be updated, so `updatedAt` is inappropriate.

---

### ❌ Issue 6: "Polymorphic FK without discriminator" (NEW)

**Error**:
```
❌ src/db/schema/audit/auditTrail.ts:97:3
   [P3/polymorphic-discriminator] Table: audit_trail
   Polymorphic FK "actorId" should have discriminator column "actorType"
```

**Fix**:
```typescript
// Before (anti-pattern)
actorId: integer(),  // Can reference users OR servicePrincipals

// After (discriminated union)
actorId: integer(),
actorType: actorTypeEnum().notNull().default("USER"),

// Add check constraint
check(
  "chk_audit_actor_type_match",
  sql`
    (${t.actorType} = 'USER' AND ${t.actorId} IS NOT NULL) OR
    (${t.actorType} = 'SERVICE_PRINCIPAL' AND ${t.actorId} IS NOT NULL) OR
    (${t.actorType} IN ('SYSTEM', 'ANONYMOUS') AND ${t.actorId} IS NULL)
  `
),
```

**Why**: Polymorphic FKs without discriminators have no referential integrity enforcement.

---

### ❌ Issue 7: "Zod type doesn't match column type" (NEW)

**Error**:
```
❌ src/db/schema/audit/auditTrail.ts:226:1
   [P7/zod-type-alignment] Table: audit_trail
   Branded ID schema uses z.bigint() but column uses bigint({ mode: "number" })
```

**Fix**:
```typescript
// Before
auditId: bigint({ mode: "number" }).primaryKey(),
// ...
export const AuditTrailIdSchema = z.bigint().brand<"AuditTrailId">();

// After
auditId: bigint({ mode: "number" }).primaryKey(),
// ...
export const AuditTrailIdSchema = z.number().int().brand<"AuditTrailId">();
```

**Why**: When using `bigint({ mode: "number" })`, the runtime type is `number`, so Zod schema should be `z.number()`, not `z.bigint()`.

---

### ⚠️  Issue 8: "Missing composite index for query pattern" (NEW)

**Error**:
```
⚠️  src/db/schema/audit/auditTrail.ts:88:1
   [P5/missing-composite-index] Table: audit_trail
   Table should have composite index for tenant + operation + timestamp queries
```

**Fix**:
```typescript
export const auditTrail = auditSchema.table(
  "audit_trail",
  {
    // ... columns
  },
  (t) => [
    // ... existing indexes
    
    // Add composite index for common query pattern
    index("idx_audit_tenant_table_op_date")
      .on(t.tenantId, t.tableName, t.operation, t.occurredAt),
  ]
);
```

**Why**: Composite indexes improve query performance for common filter combinations.

---

### ⚠️  Issue 9: "Incomplete relations"

**Error**:
```
⚠️  src/db/schema/audit/_relations.ts:1:1
   [P7/relation-completeness]
   Missing relation for FK from audit_trail to servicePrincipals
```

**Fix**:
```typescript
// In _relations.ts
import { servicePrincipals } from "../security/servicePrincipals";

export const auditRelations = defineRelations(
  { auditTrail, retentionPolicies, tenants, users, servicePrincipals },
  (r) => ({
    auditTrail: {
      // ... existing relations
      
      // Add missing relation
      actorServicePrincipal: r.one.servicePrincipals({
        from: r.auditTrail.actorId,
        to: r.servicePrincipals.servicePrincipalId,
        optional: true,
      }),
    },
  })
);
```

---

## Exemption System

### When to Exempt

Some patterns are intentionally non-standard. Add exemptions with justification:

```typescript
// In scripts/check-guideline-compliance-v2.ts

// Nullable columns
const NULLABLE_EXEMPT_COLUMNS: Record<string, string[]> = {
  audit_trail: [
    "actorId",  // Nullable for SYSTEM/ANONYMOUS actors
    "sourceIp", // Not always available (internal calls)
  ],
};

// Polymorphic FKs
const FK_EXEMPT_COLUMNS: Record<string, string[]> = {
  audit_trail: [
    "actorId",  // Polymorphic: references users OR servicePrincipals
  ],
};

// Tables without tenant isolation
const TENANT_EXEMPT = ["tenants", "regions", "audit_trail"];
```

---

## Pre-Commit Checklist

Before committing schema changes:

- [ ] Run `pnpm gate:strict` locally
- [ ] All Zod schemas exported
- [ ] All type exports added
- [ ] Branded IDs defined
- [ ] Tenant isolation (if applicable)
- [ ] Timestamps use correct types
- [ ] Append-only tables use correct mixin
- [ ] Polymorphic FKs have discriminators
- [ ] Relations complete in `_relations.ts`
- [ ] Custom SQL documented

---

## Auto-Fix

Some issues can be auto-fixed:

```bash
# Dry run (see what would change)
pnpm fix:schema:dry

# Apply fixes
pnpm fix:schema

# Fix lint issues
pnpm fix:lint

# Fix everything
pnpm fix:all
```

**Auto-fixable issues**:
- Missing Zod schemas
- Missing type exports
- Missing branded IDs
- Append-only mixin usage
- Zod type alignment

**Manual fixes required**:
- Polymorphic FK patterns
- Composite indexes
- Relations completeness
- Custom SQL documentation

---

## CI Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Push to PR                                                │
│    ↓                                                         │
│ 2. Early Gate (< 2 min)                                      │
│    - Lint check                                              │
│    - Type check                                              │
│    - Dependency check                                        │
│    ↓                                                         │
│ 3. Schema Quality Gate (< 2 min)                             │
│    - check:compliance ← NEW RULES HERE                       │
│    - check:tenant                                            │
│    - check:constraints                                       │
│    - check:indexes ← NEW                                     │
│    - check:relations ← NEW                                   │
│    ↓                                                         │
│ 4. Database CI Gate (< 5 min)                                │
│    - Schema consistency                                      │
│    - Migration test                                          │
│    - Smoke tests                                             │
│    ↓                                                         │
│ 5. ✅ All Checks Passed → Ready for Review                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Getting Help

### Documentation

- [Full CI Analysis](./ci-gate-analysis.md)
- [Coverage Matrix](./ci-gate-coverage-matrix.md)
- [Executive Summary](./EXECUTIVE_SUMMARY_CI_GATES.md)
- [DB-First Guideline](../architecture/01-db-first-guideline.md)

### Common Commands

```bash
# Check specific schema
pnpm check:compliance src/db/schema/audit

# Run in strict mode (warnings = errors)
pnpm check:compliance:strict

# Get detailed output
pnpm check:compliance --verbose

# Check only specific rules
pnpm check:compliance --rules=timestamp-type-consistency,append-only-no-updates
```

### Debugging

```bash
# See what CI is checking
cat .github/workflows/early-gate.yml

# See validation rules
cat scripts/check-guideline-compliance-v2.ts

# See exemptions
grep -A 10 "EXEMPT" scripts/check-guideline-compliance-v2.ts
```

---

## Quick Tips

### ✅ Do

- Use shared column mixins (`timestampColumns`, `tenantScopedColumns`)
- Export Zod schemas for all tables
- Add branded IDs for type safety
- Use `timestamp({ withTimezone: true })` for all timestamps
- Add composite indexes for common query patterns
- Document polymorphic FKs with discriminators

### ❌ Don't

- Use `integer()` for timestamp columns
- Add `updatedAt` to append-only tables
- Create polymorphic FKs without discriminators
- Skip Zod schema exports
- Forget to add relations in `_relations.ts`
- Use `timestamp()` without `withTimezone: true`

---

## Performance Tips

CI checks are fast, but you can make them faster:

```bash
# Run only changed files (future enhancement)
pnpm check:compliance --changed

# Skip slow checks in development
pnpm check:compliance --skip-relations

# Parallel execution (already enabled in CI)
pnpm check:all  # Runs all checks in parallel
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-19 | Initial version with 8 new validation rules |
| 0.9 | 2026-03-01 | Original CI gates (structural checks only) |

---

**Last Updated**: March 19, 2026  
**Maintained By**: Platform Team  
**Questions?**: Ask in #platform-support
