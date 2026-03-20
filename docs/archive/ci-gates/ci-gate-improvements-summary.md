# CI Gate Improvements - Quick Reference

**Related**: [Full Analysis](./ci-gate-analysis.md) | [Audit Schema Review](../../../.cursor/plans/audit_schema_review_4d06dcb2.plan.md)

## TL;DR

Our CI gates caught **4/12 issues** (33%) from the audit schema review. The gates are good at structural checks but weak at semantic validation. We need to add **8 new validation rules** across 3 priority tiers.

---

## What CI Currently Catches ✅

| Check | Script | What It Validates |
|-------|--------|-------------------|
| Missing Zod schemas | `check:compliance` | `createSelectSchema`, `createInsertSchema` exports |
| Missing type exports | `check:compliance` | `$inferSelect`, `$inferInsert` types |
| Missing branded IDs | `check:compliance` | `.brand<"EntityId">()` patterns |
| Tenant isolation | `check:tenant` | `tenantId` column + index |
| FK constraints | `check:compliance` | Foreign key definitions |
| Timestamp presence | `check:compliance` | `timestampColumns` mixin usage |
| Soft-delete patterns | `check:constraints` | Partial indexes for `deletedAt` |
| Naming conventions | `check:naming` | camelCase, snake_case consistency |

---

## What CI Currently Misses ❌

### Critical (P0) - Blocks Deployment

1. **Timestamp Type Inconsistency**
   - **Issue**: `retentionPolicy` uses `integer()` for timestamps instead of `timestamp({ withTimezone: true })`
   - **Impact**: Breaks timezone handling, date queries
   - **Fix**: Add semantic type validation for timestamp columns

2. **Append-Only Violations**
   - **Issue**: `auditTrail` has `updatedAt` despite being immutable
   - **Impact**: Allows accidental audit record modifications
   - **Fix**: Detect append-only tables and enforce `appendOnlyTimestampColumns`

### High Priority (P1) - Should Block Merge

3. **Polymorphic FK Anti-Pattern**
   - **Issue**: `actorId` references multiple tables with no discriminator
   - **Impact**: No referential integrity, orphaned records
   - **Fix**: Require discriminator column + check constraint

4. **Missing Composite Indexes**
   - **Issue**: No index for `tenant+table+operation+date` query pattern
   - **Impact**: Slow queries on large tables
   - **Fix**: Heuristic checks for common query patterns

### Medium Priority (P2) - Should Warn

5. **Custom SQL Documentation Drift**
   - **Issue**: GIN indexes in CUSTOM_SQL.md not referenced in schema
   - **Impact**: Documentation-code mismatch
   - **Fix**: Cross-reference validation

6. **Incomplete Relations**
   - **Issue**: `_relations.ts` missing `servicePrincipals` relation
   - **Impact**: Reduced type safety
   - **Fix**: Validate all FKs have relations

7. **Zod Type Mismatches**
   - **Issue**: `AuditTrailIdSchema` uses `z.bigint()` but column is `mode: "number"`
   - **Impact**: Runtime validation errors
   - **Fix**: Align Zod types with Drizzle column modes

### Low Priority (P3) - Nice to Have

8. **Missing Immutability Triggers**
   - **Issue**: No trigger to prevent audit trail updates
   - **Impact**: Relies on application-level enforcement
   - **Fix**: Check CUSTOM_SQL.md for enforcement mechanisms

---

## Quick Implementation Guide

### Phase 1: Enhance Existing Script (2-3 hours)

**File**: `scripts/check-guideline-compliance-v2.ts`

Add 4 new rules to existing functions:

```typescript
// 1. In checkP3_EnforceInvariantsInDB() - Add timestamp type check
const timestampPatterns = ["At", "Date", "Time", "Timestamp"];
for (const col of table.columns) {
  const hasTimestampSemantics = timestampPatterns.some(p => col.name.endsWith(p));
  if (hasTimestampSemantics && col.type !== "timestamp") {
    issues.push({ /* ... */ });
  }
}

// 2. In checkP1_DatabaseAsSourceOfTruth() - Add append-only check
const isAppendOnly = 
  content.includes("append-only") || 
  content.includes("appendOnlyTimestampColumns") ||
  table.name.includes("trail") ||
  table.name.includes("log");

if (isAppendOnly && content.includes("updatedAt")) {
  issues.push({ /* ... */ });
}

// 3. In checkP3_EnforceInvariantsInDB() - Add polymorphic FK check
const polymorphicFks = FK_EXEMPT_COLUMNS[table.name] || [];
for (const polyCol of polymorphicFks) {
  const baseName = polyCol.replace(/Id$/, "");
  const discriminatorCol = `${baseName}Type`;
  const hasDiscriminator = table.columns.some(c => c.name === discriminatorCol);
  
  if (!hasDiscriminator) {
    issues.push({ /* ... */ });
  }
}

// 4. In checkP7_TypeScriptAsSchemaLanguage() - Add Zod type alignment
const pkColumn = table.columns.find(c => c.isPrimaryKey);
if (pkColumn && table.hasBrandedId) {
  // Check if z.bigint() matches bigint({ mode: "bigint" })
  // Check if z.number() matches bigint({ mode: "number" })
  // etc.
}
```

**Test**:
```bash
pnpm check:compliance
# Should now catch issues 1, 2, 3, 7
```

---

### Phase 2: Create New Scripts (4-6 hours)

#### Script 1: `scripts/check-index-patterns.ts`

**Purpose**: Validate common index patterns

```typescript
// Check for composite indexes on tenant-scoped tables
if (table.hasTenantScope && hasOperationCol && hasTimestampCol) {
  const hasCompositeIndex = table.indexes.some(idx => 
    idx.columns.includes("tenantId") && 
    idx.columns.some(c => c.includes("operation")) &&
    idx.columns.some(c => c.endsWith("At"))
  );
  
  if (!hasCompositeIndex) {
    issues.push({ /* ... */ });
  }
}
```

**Add to package.json**:
```json
"check:indexes": "tsx scripts/check-index-patterns.ts"
```

#### Script 2: `scripts/check-relations-completeness.ts`

**Purpose**: Ensure all FKs have relations

```typescript
// Parse _relations.ts
const relationsContent = fs.readFileSync(relationsFile, "utf-8");

// For each FK, check if relation exists
for (const fk of table.foreignKeys) {
  const referencedTable = extractReferencedTable(fk.references);
  const hasRelation = relationsContent.includes(referencedTable);
  
  if (!hasRelation) {
    issues.push({ /* ... */ });
  }
}
```

**Add to package.json**:
```json
"check:relations": "tsx scripts/check-relations-completeness.ts"
```

---

### Phase 3: Update CI Workflows (1 hour)

**File**: `.github/workflows/early-gate.yml`

Add new checks to `schema-quality` job:

```yaml
- name: Run strict DB gate
  run: pnpm gate:strict

- name: Check index patterns
  run: pnpm check:indexes

- name: Check relation completeness
  run: pnpm check:relations
```

Update `check:all` script:

```json
"check:all": "pnpm check:naming && pnpm check:structure && pnpm check:compliance && pnpm check:tenant && pnpm check:constraints && pnpm check:shared && pnpm check:indexes && pnpm check:relations"
```

---

## Testing Strategy

### 1. Test on Known Issues

```bash
# Should catch all 8 issues in audit schema
cd src/db/schema/audit
pnpm check:compliance  # Should find issues 1, 2, 3, 7
pnpm check:indexes     # Should find issue 4
pnpm check:relations   # Should find issue 6
```

### 2. Test on Clean Schemas

```bash
# Should pass on properly structured schemas
cd src/db/schema/core
pnpm check:all  # Should pass with 0 errors
```

### 3. Test False Positives

```bash
# Ensure legitimate patterns aren't flagged
# e.g., tenants table without tenantId is OK
# e.g., enum tables without timestamps is OK
```

---

## Expected Results

### Before Enhancements

```
Running CI gates on audit schema...
✅ Type check: PASS
✅ Zod schemas: PASS
✅ Tenant isolation: PASS
⚠️  8 issues not detected

Gate effectiveness: 33% (4/12 issues caught)
```

### After Enhancements

```
Running CI gates on audit schema...
✅ Type check: PASS
✅ Zod schemas: PASS
✅ Tenant isolation: PASS
❌ Timestamp type consistency: FAIL (retentionPolicy.ts:81)
❌ Append-only violation: FAIL (auditTrail.ts:153)
❌ Polymorphic FK pattern: FAIL (auditTrail.ts:97)
❌ Missing composite index: FAIL (auditTrail.ts)
⚠️  Custom SQL drift: WARNING (CUSTOM_SQL.md)
⚠️  Incomplete relations: WARNING (_relations.ts)
❌ Zod type mismatch: FAIL (auditTrail.ts:226)

Gate effectiveness: 92% (11/12 issues caught)
```

---

## Effort Estimate

| Phase | Tasks | Time | Priority |
|-------|-------|------|----------|
| 1 | Enhance `check:compliance` | 2-3h | P0 |
| 2 | Create `check:indexes` | 2h | P1 |
| 2 | Create `check:relations` | 2h | P1 |
| 3 | Update CI workflows | 1h | P0 |
| 3 | Update package.json | 0.5h | P0 |
| 4 | Testing & validation | 2h | P0 |
| 4 | Documentation | 1h | P1 |
| **Total** | | **10-11h** | |

**Recommendation**: Implement Phase 1 immediately (P0 critical issues), Phase 2 in next sprint.

---

## Success Criteria

- [ ] CI catches timestamp type inconsistencies (100%)
- [ ] CI catches append-only violations (100%)
- [ ] CI catches polymorphic FK issues (100%)
- [ ] CI catches missing composite indexes (80%+)
- [ ] CI catches incomplete relations (90%+)
- [ ] CI catches Zod type mismatches (100%)
- [ ] Gate effectiveness improves from 33% to 90%+
- [ ] No false positives on existing schemas
- [ ] CI runtime increases by < 30 seconds

---

## Rollout Plan

### Week 1: Critical Fixes
1. Implement Phase 1 enhancements
2. Test on audit schema
3. Deploy to CI (warning mode)
4. Fix issues in audit schema

### Week 2: New Scripts
1. Implement Phase 2 scripts
2. Test on all schemas
3. Deploy to CI (warning mode)
4. Fix issues across codebase

### Week 3: Enforcement
1. Switch from warning to error mode
2. Update documentation
3. Train team on new rules
4. Monitor for false positives

---

## Questions?

- **Why not use AST parsing?** - Regex is faster and sufficient for 90% of cases. AST parsing can be added later for complex patterns.
- **Will this slow down CI?** - Minimal impact (~20-30s). New checks are fast regex/text searches.
- **What about false positives?** - Exemption system allows bypassing with justification.
- **Can we auto-fix these?** - Some (append-only, Zod types) yes. Others (polymorphic FKs, indexes) require design decisions.

---

## Related Documents

- [Full CI Gate Analysis](./ci-gate-analysis.md) - Detailed gap analysis
- [Audit Schema Review Plan](../../../.cursor/plans/audit_schema_review_4d06dcb2.plan.md) - Original issues
- [DB-First Guideline](../architecture/01-db-first-guideline.md) - Schema design principles
