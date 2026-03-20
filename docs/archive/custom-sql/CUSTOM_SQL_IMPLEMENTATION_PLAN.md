# Custom SQL Implementation Plan

**Date**: March 20, 2026  
**Status**: Ready to Implement

---

## Executive Summary

The AFENDA-HYBRID project has a comprehensive custom SQL registry and documentation, but the actual custom SQL blocks need to be implemented in the database. This document outlines the implementation plan.

---

## Current State

### ✅ Completed
- Custom SQL Registry created (`CUSTOM_SQL_REGISTRY.json`)
- Custom SQL documentation created (`CUSTOM_SQL.md` - 533 lines)
- JSON Schema for validation created (`CUSTOM_SQL_REGISTRY.schema.json`)
- GitHub issue template for custom SQL requests created
- Schema lockdown system active
- Migration validation scripts operational
- Two custom SQL blocks implemented:
  - CSQL-008: Tenant isolation trigger function
  - CSQL-009: Tenant isolation trigger attachment

### ⏳ Pending Implementation
- CSQL-001 through CSQL-007: Audit trail enhancements
- CSQL-006: Employee audit trigger (in second migration)

---

## Custom SQL Registry Overview

| ID | Purpose | Type | Migration | Status |
|----|---------|------|-----------|--------|
| CSQL-001 | Partition audit_trail by quarter | PARTITION | 20260319144405 | ❌ Not Implemented |
| CSQL-002 | Create initial quarterly partitions | PARTITION | 20260319144405 | ❌ Not Implemented |
| CSQL-003 | GIN indexes on JSONB columns | INDEX | 20260319144405 | ❌ Not Implemented |
| CSQL-004 | Partition maintenance function | FUNCTION | 20260319144405 | ❌ Not Implemented |
| CSQL-005 | 7W1H audit trigger function | TRIGGER_FUNCTION | 20260319144405 | ❌ Not Implemented |
| CSQL-006 | Employee audit trigger | TRIGGER | 20260319153700 | ❌ Not Implemented |
| CSQL-007 | Audit trail immutability trigger | TRIGGER | 20260319144405 | ❌ Not Implemented |
| CSQL-008 | Tenant isolation trigger function | TRIGGER_FUNCTION | 20260319144405 | ✅ Implemented |
| CSQL-009 | Tenant isolation trigger attachment | TRIGGER | 20260319144405 | ✅ Implemented |

---

## Implementation Options

### Option 1: New Migration (Recommended)
**Pros**:
- Clean separation of concerns
- Preserves existing migration history
- Easy to rollback if needed
- Follows schema lockdown workflow

**Cons**:
- Requires generating a new migration
- Adds another migration to history

**Steps**:
```bash
# 1. Create new migration
pnpm db:generate

# 2. Add custom SQL blocks to migration file
# 3. Add -- CUSTOM: markers
# 4. Update registry with new migration name and line numbers
# 5. Validate
pnpm check:migrations

# 6. Apply
pnpm db:migrate

# 7. Test
pnpm test:db:smoke
```

### Option 2: Modify Existing Migration (Not Recommended)
**Pros**:
- Keeps all custom SQL in first migration
- Matches registry entries

**Cons**:
- ❌ Violates schema lockdown principles
- ❌ Migration already applied to database
- ❌ Would require rolling back and reapplying
- ❌ Breaks migration checksums
- ❌ Not safe for production

**Verdict**: ❌ **DO NOT USE** - Violates schema lockdown

### Option 3: Direct SQL Execution (Development Only)
**Pros**:
- Quick for local development
- Can test SQL before creating migration

**Cons**:
- ❌ Bypasses migration tracking
- ❌ Creates schema drift
- ❌ Not reproducible
- ❌ Only for prototyping

**Verdict**: ⚠️ **Use only for testing**, then create proper migration

---

## Recommended Implementation Plan

### Phase 1: Prepare Custom SQL
**Goal**: Extract and organize custom SQL from CUSTOM_SQL.md

**Tasks**:
1. ✅ Review CUSTOM_SQL.md (already done)
2. ✅ Understand each custom SQL block (already done)
3. ⏳ Decide: New migration or separate implementation?

### Phase 2: Create New Migration
**Goal**: Generate migration for custom SQL enhancements

**Tasks**:
1. Generate new migration: `pnpm db:generate`
2. Name it: `add_audit_trail_enhancements` or similar
3. Add custom SQL blocks with proper markers
4. Update CUSTOM_SQL_REGISTRY.json with new migration name

### Phase 3: Implement Custom SQL Blocks
**Goal**: Add all custom SQL to migration file

**CSQL-001: Partition audit_trail**
```sql
-- CUSTOM: Convert audit_trail to partitioned table (CSQL-001)
-- Drop existing table
DROP TABLE IF EXISTS audit.audit_trail CASCADE;

-- Create partitioned table
CREATE TABLE audit.audit_trail (
  -- [Full table definition from CUSTOM_SQL.md]
) PARTITION BY RANGE (occurred_at);

-- Add foreign key
ALTER TABLE audit.audit_trail 
  ADD CONSTRAINT fk_audit_trail_tenant 
  FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id);
```

**CSQL-002: Create partitions**
```sql
-- CUSTOM: Create initial quarterly partitions (CSQL-002)
CREATE TABLE audit.audit_trail_2026_q1 
  PARTITION OF audit.audit_trail
  FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
-- [Repeat for Q2, Q3, Q4, 2027 Q1]
```

**CSQL-003: GIN indexes**
```sql
-- CUSTOM: Create GIN indexes on JSONB columns (CSQL-003)
CREATE INDEX idx_audit_old_data_gin 
  ON audit.audit_trail USING gin (old_data jsonb_path_ops);
CREATE INDEX idx_audit_new_data_gin 
  ON audit.audit_trail USING gin (new_data jsonb_path_ops);
CREATE INDEX idx_audit_client_info_gin 
  ON audit.audit_trail USING gin (client_info jsonb_path_ops);
```

**CSQL-004: Partition maintenance function**
```sql
-- CUSTOM: Create partition maintenance function (CSQL-004)
CREATE OR REPLACE FUNCTION audit.create_next_quarter_partition()
RETURNS void
LANGUAGE plpgsql
AS $$
-- [Full function from CUSTOM_SQL.md]
$$;
```

**CSQL-005: 7W1H audit trigger function**
```sql
-- CUSTOM: Create 7W1H audit trigger function (CSQL-005)
CREATE OR REPLACE FUNCTION audit.log_change_7w1h()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
-- [Full function from CUSTOM_SQL.md - 130+ lines]
$$;
```

**CSQL-007: Immutability trigger**
```sql
-- CUSTOM: Prevent updates/deletes on audit_trail (CSQL-007)
CREATE OR REPLACE FUNCTION audit.prevent_audit_modification()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Audit trail is immutable. Cannot % records.', TG_OP
    USING ERRCODE = '23506';
END;
$$;

CREATE TRIGGER trg_audit_trail_immutable
BEFORE UPDATE OR DELETE ON audit.audit_trail
FOR EACH ROW
EXECUTE FUNCTION audit.prevent_audit_modification();
```

### Phase 4: Update Registry
**Goal**: Update CUSTOM_SQL_REGISTRY.json with accurate information

**Tasks**:
1. Update migration names for CSQL-001 through CSQL-007
2. Update `sqlLines` with actual line numbers
3. Validate JSON against schema

### Phase 5: Validate & Test
**Goal**: Ensure everything works correctly

**Tasks**:
1. Validate migration format: `pnpm check:migrations`
2. Check for drift: `pnpm check:drift`
3. Apply migration: `pnpm db:migrate`
4. Verify in database:
   ```sql
   -- Check partitions
   SELECT * FROM pg_partitions WHERE tablename = 'audit_trail';
   
   -- Check indexes
   \d+ audit.audit_trail
   
   -- Check functions
   \df audit.*
   
   -- Check triggers
   SELECT * FROM pg_trigger WHERE tgname LIKE '%audit%';
   ```
5. Run smoke tests: `pnpm test:db:smoke`
6. Test audit trigger manually

### Phase 6: Documentation
**Goal**: Update documentation to reflect implementation

**Tasks**:
1. Update CUSTOM_SQL_IMPLEMENTATION_PLAN.md (this file)
2. Document any deviations from original plan
3. Add troubleshooting notes
4. Update QUICK_START.md if needed

---

## Decision Required

### Question: How to implement custom SQL?

**Option A: New Migration (Recommended)**
- Create `20260320XXXXXX_add_audit_trail_enhancements`
- Add all CSQL-001 through CSQL-007
- Update registry to point to new migration
- Clean, follows best practices

**Option B: Direct SQL for Testing**
- Execute SQL directly in database
- Test functionality
- Then create proper migration
- Good for development/validation

**Option C: Wait for Future Need**
- Keep current simple audit_trail
- Implement partitioning when volume increases
- Implement triggers when needed
- Pragmatic approach

---

## Recommendation

### For Development/Testing: **Option B**
1. Execute custom SQL directly to test functionality
2. Validate that partitioning, triggers, and functions work
3. Then create proper migration with all custom SQL
4. This allows testing before committing to migration

### For Production: **Option A**
1. Create new migration immediately
2. Add all custom SQL blocks
3. Follow schema lockdown workflow
4. Deploy with confidence

---

## Current Database State

### Audit Trail Table
```
Table: audit.audit_trail
Type: Regular (non-partitioned)
Columns: 9 (auditId, tenantId, tableName, operation, rowId, oldData, newData, changedBy, changedAt)
Indexes: 3 (primary key, tenant_date, table)
Partitions: 0
Triggers: 0
```

### What's Missing
- ❌ Partitioning by quarter
- ❌ Quarterly partition tables
- ❌ GIN indexes on JSONB columns
- ❌ Partition maintenance function
- ❌ 7W1H audit trigger function
- ❌ Immutability enforcement trigger
- ❌ Employee audit trigger

---

## Next Steps

1. **Decide on implementation approach** (Option A or B)
2. **If Option A**: Generate new migration and add custom SQL
3. **If Option B**: Test SQL directly, then create migration
4. **Update registry** with accurate line numbers
5. **Validate and test** thoroughly
6. **Document** any issues or deviations

---

## Questions to Answer

1. **Do we need partitioning now?**
   - If audit volume is low, simple table may suffice
   - Partitioning adds complexity
   - Can be added later when needed

2. **Do we need 7W1H audit trigger now?**
   - Current simple audit_trail may be sufficient
   - Complex trigger adds overhead
   - Can be added when richer audit data is needed

3. **Should we implement all custom SQL at once?**
   - Option 1: Implement all now (comprehensive)
   - Option 2: Implement incrementally as needed (pragmatic)
   - Option 3: Start with essentials, add advanced features later

---

## Risk Assessment

### Low Risk
- ✅ Creating new migration
- ✅ Adding indexes
- ✅ Adding simple triggers

### Medium Risk
- ⚠️ Partitioning existing table (requires DROP/RECREATE)
- ⚠️ Complex trigger functions (130+ lines of PL/pgSQL)
- ⚠️ Partition maintenance automation

### High Risk
- ❌ Modifying existing migrations
- ❌ Direct SQL without migration tracking
- ❌ Skipping validation steps

---

## Success Criteria

✅ All custom SQL blocks implemented  
✅ All blocks have `-- CUSTOM:` markers  
✅ Registry updated with accurate line numbers  
✅ Migration validation passes  
✅ Database tests pass  
✅ Partitioning works correctly  
✅ Triggers fire as expected  
✅ No schema drift detected  
✅ Documentation updated  

---

**Status**: Ready for implementation decision

**Next Action**: Choose implementation approach and proceed
