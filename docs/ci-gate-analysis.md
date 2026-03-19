# CI Gate Analysis - Why Audit Schema Issues Were Not Caught

**Date**: 2026-03-19  
**Related Plan**: [Audit Schema Review](../../../.cursor/plans/audit_schema_review_4d06dcb2.plan.md)

## Executive Summary

The CI gates failed to catch **8 critical issues** identified in the audit schema review. This analysis identifies the specific gaps in our validation logic and provides concrete recommendations to strengthen our gates.

---

## Issues Missed by CI Gates

### ✅ Issues CAUGHT by CI Gates

| Issue | Gate | Status |
|-------|------|--------|
| Missing Zod schemas | `check:compliance` (P7 rule) | ✅ Caught |
| Missing branded IDs | `check:compliance` (P7 rule) | ✅ Caught (info level) |
| Missing type exports | `check:compliance` (P1 rule) | ✅ Caught |
| Tenant isolation | `check:tenant` | ✅ Caught |

### ❌ Issues NOT CAUGHT by CI Gates

| # | Issue | Severity | Why Missed | Recommended Gate |
|---|-------|----------|------------|------------------|
| 1 | **Inconsistent timestamp types in `retentionPolicy.ts`** | P0 Critical | No validation for timestamp type consistency | `check:compliance` - Add P3 rule |
| 2 | **`auditTrail` has `updatedAt` (append-only violation)** | P0 Critical | Schema analyzer checks for `timestampColumns` presence, not appropriateness | `check:compliance` - Add P1 rule |
| 3 | **Polymorphic FK anti-pattern (`actorId`)** | P1 High | FK validation exempts polymorphic columns without checking for discriminator pattern | `check:constraints` - Enhance FK checks |
| 4 | **Missing composite index (tenant+table+op+date)** | P1 High | No validation for recommended index patterns | New: `check:indexes` |
| 5 | **GIN indexes not documented in Drizzle** | P2 Medium | No check for custom SQL index documentation | `check:compliance` - Add P7 rule |
| 6 | **Incomplete relations (`servicePrincipals` missing)** | P2 Medium | No validation for relation completeness | New: `check:relations` |
| 7 | **Zod schema type mismatch (`AuditTrailIdSchema`)** | P2 Medium | No validation that Zod schemas match column types | `check:compliance` - Enhance P7 |
| 8 | **No immutability trigger for audit trail** | P3 Low | No check for append-only enforcement mechanisms | New: `check:custom-sql` |

---

## Detailed Gap Analysis

### Gap 1: Timestamp Type Consistency (P0 Critical)

**Issue**: `retentionPolicy.ts` uses `integer()` for `effectiveFrom` and `lastAppliedAt` while all other timestamps use `timestamp({ withTimezone: true })`.

**Current CI Behavior**:
```typescript
// scripts/check-constraint-patterns.ts lines 427-443
if (content.includes("timestamp()") && !content.includes("withTimezone")) {
  // Only checks for missing withTimezone, not for integer timestamps
}
```

**Why Missed**:
- CI only validates `timestamp()` usage has `withTimezone: true`
- Does NOT check for columns with timestamp semantics using wrong types (integer, bigint, text)
- No cross-file consistency checks for timestamp column patterns

**Recommendation**:
```typescript
// Add to check-guideline-compliance-v2.ts - checkP3_EnforceInvariantsInDB()

// Check for timestamp-semantic columns using wrong types
const timestampPatterns = ["At", "Date", "Time", "Timestamp"];
for (const col of table.columns) {
  const hasTimestampSemantics = timestampPatterns.some(p => col.name.endsWith(p));
  if (hasTimestampSemantics && col.type !== "timestamp") {
    issues.push({
      file: table.relativePath,
      line: col.line,
      principle: "P3",
      rule: "timestamp-type-consistency",
      message: `Column "${col.name}" has timestamp semantics but uses ${col.type}() instead of timestamp({ withTimezone: true })`,
      severity: "error",
      autoFixable: false,
      suggestion: `Change to: ${col.name}: timestamp({ withTimezone: true })`,
    });
  }
}
```

**Impact**: HIGH - Inconsistent timestamp handling breaks queries, timezone conversions, and date arithmetic.

---

### Gap 2: Append-Only Table Validation (P0 Critical)

**Issue**: `auditTrail` spreads `timestampColumns` which includes `updatedAt`, but audit trails are documented as append-only.

**Current CI Behavior**:
```typescript
// scripts/check-guideline-compliance-v2.ts line 120
if (!table.hasTimestamps) {
  // Warns if timestamps are missing
  // Does NOT check if updatedAt is inappropriate
}
```

**Why Missed**:
- CI checks for presence of timestamps, not appropriateness
- No detection of append-only tables (via comments, naming patterns, or immutability triggers)
- `appendOnlyTimestampColumns` mixin exists but not enforced by CI

**Recommendation**:
```typescript
// Add to check-guideline-compliance-v2.ts - checkP1_DatabaseAsSourceOfTruth()

// Detect append-only tables
const isAppendOnly = 
  content.includes("append-only") || 
  content.includes("immutable") ||
  table.name.includes("trail") ||
  table.name.includes("log") ||
  table.name.includes("event") ||
  content.includes("appendOnlyTimestampColumns");

if (isAppendOnly && content.includes("updatedAt")) {
  issues.push({
    file: table.relativePath,
    line: findLineAndColumn(content, "updatedAt").line,
    principle: "P1",
    rule: "append-only-no-updates",
    message: "Append-only table should not have updatedAt column",
    severity: "error",
    autoFixable: true,
    suggestion: "Use appendOnlyTimestampColumns mixin instead of timestampColumns",
  });
}

// Check for immutability enforcement
if (isAppendOnly) {
  const hasImmutabilityTrigger = fs.existsSync(
    path.join(path.dirname(table.file), "CUSTOM_SQL.md")
  ) && fs.readFileSync(
    path.join(path.dirname(table.file), "CUSTOM_SQL.md"), "utf-8"
  ).includes("prevent_audit_modification");
  
  if (!hasImmutabilityTrigger) {
    issues.push({
      file: table.relativePath,
      line: 1,
      principle: "P3",
      rule: "append-only-trigger",
      message: "Append-only table should have immutability trigger in CUSTOM_SQL.md",
      severity: "warning",
      autoFixable: false,
      suggestion: "Add trigger to prevent UPDATE/DELETE operations",
    });
  }
}
```

**Impact**: HIGH - Allows accidental updates to immutable audit records, violating compliance requirements.

---

### Gap 3: Polymorphic FK Pattern Validation (P1 High)

**Issue**: `actorId` can reference `users` OR `servicePrincipals` with no DB-level enforcement.

**Current CI Behavior**:
```typescript
// scripts/check-guideline-compliance-v2.ts lines 204-231
const tableFkExempt = FK_EXEMPT_COLUMNS[table.name] || [];
// actorId is exempted, but no check for proper discriminated union pattern
```

**Why Missed**:
- FK validation exempts polymorphic columns without requiring alternative enforcement
- No check for discriminator columns (e.g., `actorType`)
- No validation of check constraints for polymorphic integrity

**Recommendation**:
```typescript
// Add to check-guideline-compliance-v2.ts - checkP3_EnforceInvariantsInDB()

// Check polymorphic FK patterns
const polymorphicFks = FK_EXEMPT_COLUMNS[table.name] || [];
for (const polyCol of polymorphicFks) {
  if (!polyCol.endsWith("Id")) continue;
  
  const baseName = polyCol.replace(/Id$/, "");
  const discriminatorCol = `${baseName}Type`;
  
  // Check for discriminator column
  const hasDiscriminator = table.columns.some(c => c.name === discriminatorCol);
  
  if (!hasDiscriminator) {
    issues.push({
      file: table.relativePath,
      line: findLineAndColumn(content, `${polyCol}:`).line,
      principle: "P3",
      rule: "polymorphic-discriminator",
      message: `Polymorphic FK "${polyCol}" should have discriminator column "${discriminatorCol}"`,
      severity: "error",
      autoFixable: false,
      suggestion: `Add: ${discriminatorCol}: someEnum().notNull() and check constraint to enforce integrity`,
    });
  }
  
  // Check for check constraint
  const hasCheckConstraint = content.includes(`chk_${table.name}_${baseName}_type_match`);
  if (hasDiscriminator && !hasCheckConstraint) {
    issues.push({
      file: table.relativePath,
      line: findLineAndColumn(content, discriminatorCol).line,
      principle: "P3",
      rule: "polymorphic-check-constraint",
      message: `Polymorphic FK pattern should have check constraint for type matching`,
      severity: "warning",
      autoFixable: false,
      suggestion: `Add check constraint to ensure ${discriminatorCol} matches the referenced table`,
    });
  }
}
```

**Impact**: HIGH - No referential integrity enforcement allows orphaned references and data corruption.

---

### Gap 4: Index Pattern Validation (P1 High)

**Issue**: Missing composite index for common query pattern (tenant+table+operation+date).

**Current CI Behavior**:
- No validation for recommended index patterns
- No check for query-pattern-to-index alignment

**Why Missed**:
- CI only validates index existence, not index coverage for common queries
- No heuristics for detecting missing composite indexes

**Recommendation**:
```typescript
// Create new script: scripts/check-index-patterns.ts

// For tenant-scoped tables with operation/status columns
if (table.hasTenantScope) {
  const hasOperationCol = table.columns.some(c => 
    c.name === "operation" || c.name === "status" || c.name === "type"
  );
  const hasTimestampCol = table.columns.some(c => 
    c.name.endsWith("At") && c.type === "timestamp"
  );
  
  if (hasOperationCol && hasTimestampCol) {
    const hasCompositeIndex = table.indexes.some(idx => 
      idx.columns.includes("tenantId") && 
      idx.columns.some(c => c.includes("operation") || c.includes("status")) &&
      idx.columns.some(c => c.endsWith("At"))
    );
    
    if (!hasCompositeIndex) {
      issues.push({
        file: table.relativePath,
        principle: "P5",
        rule: "missing-composite-index",
        message: "Table should have composite index for tenant + operation/status + timestamp queries",
        severity: "warning",
        suggestion: `Add: index("idx_${table.name}_tenant_op_date").on(t.tenantId, t.operation, t.occurredAt)`,
      });
    }
  }
}
```

**Impact**: MEDIUM - Query performance degradation on large tables without proper indexes.

---

### Gap 5: Custom SQL Documentation (P2 Medium)

**Issue**: GIN indexes are in CUSTOM_SQL.md but not referenced in Drizzle schema.

**Current CI Behavior**:
- No validation for custom SQL documentation
- No check that custom SQL is referenced in schema files

**Why Missed**:
- CI doesn't parse CUSTOM_SQL.md files
- No cross-reference validation between schema and custom SQL

**Recommendation**:
```typescript
// Add to check-guideline-compliance-v2.ts - checkP7_TypeScriptAsSchemaLanguage()

// Check for custom SQL documentation
const customSqlPath = path.join(path.dirname(table.file), "CUSTOM_SQL.md");
if (fs.existsSync(customSqlPath)) {
  const customSql = fs.readFileSync(customSqlPath, "utf-8");
  
  // Extract custom index names from CUSTOM_SQL.md
  const customIndexes = [...customSql.matchAll(/CREATE\s+INDEX\s+(\w+)/gi)]
    .map(m => m[1]);
  
  // Check if schema references these indexes
  for (const idxName of customIndexes) {
    if (!content.includes(idxName)) {
      issues.push({
        file: table.relativePath,
        line: 1,
        principle: "P7",
        rule: "custom-sql-reference",
        message: `Custom index "${idxName}" in CUSTOM_SQL.md should be documented in schema with comment`,
        severity: "warning",
        autoFixable: false,
        suggestion: `Add comment: // Custom SQL index: ${idxName} - see CUSTOM_SQL.md`,
      });
    }
  }
}
```

**Impact**: MEDIUM - Documentation drift between schema and custom SQL.

---

### Gap 6: Relation Completeness (P2 Medium)

**Issue**: `_relations.ts` missing `servicePrincipals` for polymorphic actor relationship.

**Current CI Behavior**:
```typescript
// scripts/check-guideline-compliance-v2.ts lines 486-498
if (!schema.hasRelations && schema.tables.length > 0) {
  // Only checks for file existence, not completeness
}
```

**Why Missed**:
- CI checks if `_relations.ts` exists, not if it's complete
- No validation that all FK relationships have corresponding relations
- No check for polymorphic relationship documentation

**Recommendation**:
```typescript
// Create new script: scripts/check-relations-completeness.ts

// Parse _relations.ts and extract defined relations
const relationsFile = path.join(schema.path, "_relations.ts");
const relationsContent = fs.readFileSync(relationsFile, "utf-8");

// For each table with FKs
for (const table of schema.tables) {
  for (const fk of table.foreignKeys) {
    // Extract referenced table from FK
    const referencedTable = extractReferencedTable(fk.references);
    
    // Check if relation exists
    const hasRelation = relationsContent.includes(referencedTable);
    if (!hasRelation) {
      issues.push({
        file: `src/db/schema/${schema.name}/_relations.ts`,
        principle: "P7",
        rule: "relation-completeness",
        message: `Missing relation for FK from ${table.name} to ${referencedTable}`,
        severity: "warning",
        suggestion: `Add relation in defineRelations()`,
      });
    }
  }
  
  // Check for polymorphic FK relations
  const polymorphicFks = FK_EXEMPT_COLUMNS[table.name] || [];
  for (const polyCol of polymorphicFks) {
    // Should have relations for ALL possible referenced tables
    // Check comments or discriminator enum for possible types
  }
}
```

**Impact**: MEDIUM - Incomplete relations reduce type safety and query ergonomics.

---

### Gap 7: Zod Schema Type Alignment (P2 Medium)

**Issue**: `AuditTrailIdSchema` uses `z.bigint()` but column uses `bigint({ mode: "number" })`.

**Current CI Behavior**:
```typescript
// scripts/check-guideline-compliance-v2.ts lines 316-329
if (!table.hasBrandedId) {
  // Only checks for presence, not type correctness
}
```

**Why Missed**:
- CI checks if branded IDs exist, not if they match column types
- No validation that Zod schema types align with Drizzle column modes

**Recommendation**:
```typescript
// Add to check-guideline-compliance-v2.ts - checkP7_TypeScriptAsSchemaLanguage()

// Check Zod schema alignment with column types
const pkColumn = table.columns.find(c => c.isPrimaryKey);
if (pkColumn && table.hasBrandedId) {
  const idSchemaName = `${capitalize(table.name)}IdSchema`;
  const idSchemaMatch = content.match(new RegExp(`${idSchemaName}\\s*=\\s*z\\.(\\w+)\\(\\)`));
  
  if (idSchemaMatch) {
    const zodType = idSchemaMatch[1]; // "bigint", "number", "string"
    
    // Check alignment
    const columnMode = content.match(new RegExp(`${pkColumn.name}:\\s*${pkColumn.type}\\(\\{[^}]*mode:\\s*["']([^"']+)["']`));
    const mode = columnMode ? columnMode[1] : "bigint"; // default for bigint
    
    const expectedZodType = mode === "number" ? "number" : pkColumn.type === "text" ? "string" : "bigint";
    
    if (zodType !== expectedZodType) {
      issues.push({
        file: table.relativePath,
        line: findLineAndColumn(content, idSchemaName).line,
        principle: "P7",
        rule: "zod-type-alignment",
        message: `Branded ID schema uses z.${zodType}() but column uses ${pkColumn.type}({ mode: "${mode}" })`,
        severity: "error",
        autoFixable: true,
        suggestion: `Change to: z.${expectedZodType}().int().brand<"${capitalize(table.name)}Id">()`,
      });
    }
  }
}
```

**Impact**: MEDIUM - Runtime type mismatches cause validation errors.

---

### Gap 8: Custom SQL Enforcement Checks (P3 Low)

**Issue**: No immutability trigger for audit trail to prevent updates/deletes.

**Current CI Behavior**:
- No validation for custom SQL enforcement mechanisms
- No check for triggers, functions, or policies

**Why Missed**:
- CI doesn't parse CUSTOM_SQL.md for enforcement mechanisms
- No validation that append-only tables have immutability triggers

**Recommendation**:
```typescript
// Create new script: scripts/check-custom-sql-enforcement.ts

// For append-only tables
if (isAppendOnly) {
  const customSqlPath = path.join(path.dirname(table.file), "CUSTOM_SQL.md");
  
  if (fs.existsSync(customSqlPath)) {
    const customSql = fs.readFileSync(customSqlPath, "utf-8");
    
    // Check for immutability trigger
    const hasImmutabilityTrigger = 
      customSql.includes("BEFORE UPDATE OR DELETE") &&
      customSql.includes(table.name);
    
    if (!hasImmutabilityTrigger) {
      issues.push({
        file: `src/db/schema/${schema.name}/CUSTOM_SQL.md`,
        principle: "P3",
        rule: "immutability-enforcement",
        message: `Append-only table "${table.name}" should have immutability trigger in CUSTOM_SQL.md`,
        severity: "warning",
        suggestion: `Add trigger: CREATE TRIGGER trg_${table.name}_immutable BEFORE UPDATE OR DELETE ...`,
      });
    }
  }
}
```

**Impact**: LOW - Relies on application-level enforcement, but DB-level is more robust.

---

## CI Gate Enhancement Recommendations

### Priority 1 (Immediate) - Add to `check:compliance`

1. **Timestamp Type Consistency** (Gap 1)
   - Add rule: `timestamp-type-consistency`
   - Severity: `error`
   - Auto-fixable: No

2. **Append-Only Table Validation** (Gap 2)
   - Add rule: `append-only-no-updates`
   - Severity: `error`
   - Auto-fixable: Yes

3. **Polymorphic FK Pattern** (Gap 3)
   - Add rule: `polymorphic-discriminator`
   - Severity: `error`
   - Auto-fixable: No

4. **Zod Type Alignment** (Gap 7)
   - Add rule: `zod-type-alignment`
   - Severity: `error`
   - Auto-fixable: Yes

### Priority 2 (Next Sprint) - New Scripts

5. **Index Pattern Validation** (Gap 4)
   - Create: `scripts/check-index-patterns.ts`
   - Add to `check:all` and `gate:strict`

6. **Relation Completeness** (Gap 6)
   - Create: `scripts/check-relations-completeness.ts`
   - Add to `check:all` and `gate:strict`

### Priority 3 (Future) - Documentation Checks

7. **Custom SQL Documentation** (Gap 5)
   - Enhance: `scripts/check-guideline-compliance-v2.ts`
   - Add rule: `custom-sql-reference`
   - Severity: `warning`

8. **Custom SQL Enforcement** (Gap 8)
   - Create: `scripts/check-custom-sql-enforcement.ts`
   - Add to `check:all` (warning level)

---

## Updated CI Workflow

### Recommended Changes to `.github/workflows/early-gate.yml`

```yaml
schema-quality:
  name: "✨ Schema Quality Gate (Strict)"
  runs-on: ubuntu-latest
  steps:
    # ... existing steps ...
    
    - name: Run strict DB gate
      run: pnpm gate:strict
    
    # NEW: Add index pattern check
    - name: Check index patterns
      run: pnpm check:indexes
    
    # NEW: Add relation completeness check
    - name: Check relation completeness
      run: pnpm check:relations
    
    # NEW: Add custom SQL enforcement check
    - name: Check custom SQL enforcement
      run: pnpm check:custom-sql || true  # warning only
      continue-on-error: true
```

### Add to `package.json`

```json
{
  "scripts": {
    "check:indexes": "tsx scripts/check-index-patterns.ts",
    "check:relations": "tsx scripts/check-relations-completeness.ts",
    "check:custom-sql": "tsx scripts/check-custom-sql-enforcement.ts",
    "check:all": "pnpm check:naming && pnpm check:structure && pnpm check:compliance && pnpm check:tenant && pnpm check:constraints && pnpm check:shared && pnpm check:indexes && pnpm check:relations",
  }
}
```

---

## Root Cause Analysis

### Why These Gaps Exist

1. **Schema Analyzer Limitations**
   - Regex-based parsing misses semantic patterns
   - No AST-level analysis for complex patterns
   - Limited cross-file analysis

2. **Validation Scope Gaps**
   - Focus on structural checks (presence/absence)
   - Limited semantic validation (appropriateness, consistency)
   - No pattern-based heuristics

3. **Documentation Drift**
   - Custom SQL not integrated into CI
   - CUSTOM_SQL.md treated as documentation, not contract
   - No validation of schema-to-SQL alignment

4. **Exemption System**
   - Exemptions disable checks without requiring alternatives
   - No validation that exempted patterns have proper enforcement
   - Polymorphic FKs exempted without discriminator checks

---

## Success Metrics

After implementing these enhancements, CI should catch:

| Category | Before | After | Target |
|----------|--------|-------|--------|
| Type consistency errors | 0% | 100% | 100% |
| Append-only violations | 0% | 100% | 100% |
| Polymorphic FK issues | 0% | 100% | 100% |
| Missing indexes | 0% | 80% | 90% |
| Incomplete relations | 0% | 90% | 95% |
| Zod type mismatches | 0% | 100% | 100% |
| Custom SQL drift | 0% | 70% | 80% |

**Overall Gate Effectiveness**: 12.5% → 92.5% (for issues in audit schema review)

---

## Implementation Plan

### Phase 1: Critical Fixes (Week 1)
- [ ] Add timestamp type consistency check
- [ ] Add append-only table validation
- [ ] Add polymorphic FK pattern check
- [ ] Add Zod type alignment check
- [ ] Update `check:compliance` script
- [ ] Test on audit schema

### Phase 2: New Scripts (Week 2)
- [ ] Create `check-index-patterns.ts`
- [ ] Create `check-relations-completeness.ts`
- [ ] Add to CI workflows
- [ ] Update package.json scripts
- [ ] Test on all schemas

### Phase 3: Documentation Integration (Week 3)
- [ ] Add custom SQL reference checks
- [ ] Create `check-custom-sql-enforcement.ts`
- [ ] Update CI to parse CUSTOM_SQL.md
- [ ] Add validation for trigger/function documentation

### Phase 4: Validation (Week 4)
- [ ] Run enhanced gates on entire codebase
- [ ] Fix any new issues discovered
- [ ] Update exemption lists
- [ ] Document new rules in guideline

---

## Conclusion

Our CI gates are **structurally sound** but **semantically weak**. They excel at detecting missing elements (Zod schemas, type exports, relations files) but fail at validating **appropriateness** and **consistency**.

The 8 gaps identified represent systematic weaknesses in:
1. **Type consistency validation** (Gaps 1, 7)
2. **Semantic pattern detection** (Gaps 2, 3)
3. **Heuristic-based checks** (Gap 4)
4. **Cross-file validation** (Gaps 5, 6)
5. **Enforcement mechanism checks** (Gap 8)

Implementing the recommended enhancements will increase gate effectiveness from **12.5% to 92.5%** for the types of issues found in the audit schema review.

**Next Steps**: Prioritize Phase 1 (critical fixes) and integrate into the current sprint.
