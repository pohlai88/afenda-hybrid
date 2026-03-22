---
name: Custom SQL Request
about: Request approval for custom SQL that cannot be expressed in Drizzle ORM
title: "[CUSTOM-SQL] "
labels: ["custom-sql", "dba-review", "schema-change"]
assignees: ["@dba-team", "@schema-owners"]
---

## Custom SQL Request

### CSQL ID

<!-- Assign the next sequential CSQL-XXX ID. Check CUSTOM_SQL_REGISTRY.json for the highest number. -->

**CSQL-XXX**: (e.g., CSQL-010)

### Purpose

<!-- Brief description of what this custom SQL does (1-2 sentences) -->

### Justification

<!-- Explain why Drizzle ORM cannot express this feature -->
<!-- Reference: https://orm.drizzle.team/docs/overview -->

**Why Drizzle can't express this:**

- [ ] Table partitioning (PARTITION BY RANGE/LIST/HASH)
- [ ] Exclusion constraints (EXCLUDE USING)
- [ ] Triggers and trigger functions
- [ ] Stored procedures and functions
- [ ] Advanced indexes (GIN with jsonb_path_ops, partial indexes with complex expressions)
- [ ] Row-level security (RLS) policies
- [ ] Other: ****\*\*****\_****\*\*****

### SQL Snippet

<!-- Provide the complete SQL code that will be added to the migration -->

```sql
-- CUSTOM: <purpose> (CSQL-XXX)


```

### Migration Context

<!-- Which migration will this be added to? -->

- **Migration name**: (e.g., 20260320120000_add_audit_triggers)
- **Related schema files**: (e.g., packages/db/src/schema-platform/audit/auditTrail.ts)
- **Related tables**: (e.g., audit.audit_trail, hr.employees)

### Rollback Procedure

<!-- Provide step-by-step instructions to rollback this change -->

```sql
-- Rollback:


```

### Performance Impact Assessment

<!-- Estimate the performance impact of this custom SQL -->

- [ ] **LOW** - No significant impact (e.g., trigger on low-volume table)
- [ ] **MEDIUM** - Moderate impact (e.g., index on medium-volume table)
- [ ] **HIGH** - Significant impact (e.g., partition maintenance on high-volume table)
- [ ] **UNKNOWN** - Needs performance testing

**Details:**

### Testing Plan

<!-- How will you test this custom SQL? -->

- [ ] Tested locally with sample data
- [ ] Tested in Docker test database
- [ ] Verified rollback procedure works
- [ ] Checked for tenant isolation issues
- [ ] Performance tested with representative data volume
- [ ] Reviewed for SQL injection vulnerabilities

### Security Considerations

<!-- Any security implications? -->

- [ ] No sensitive data exposed
- [ ] No privilege escalation risks
- [ ] Tenant isolation maintained
- [ ] Input validation handled
- [ ] No SQL injection vectors

### Documentation

<!-- Confirm you will update the required documentation -->

- [ ] Will add entry to `packages/db/src/schema-platform/audit/CUSTOM_SQL_REGISTRY.json`
- [ ] Will document in `packages/db/src/schema-platform/audit/CUSTOM_SQL.md` (if detailed explanation needed)
- [ ] Will add `-- CUSTOM: <purpose> (CSQL-XXX)` marker in migration file

### Approval Checklist

<!-- For reviewers -->

**DBA Review:**

- [ ] Justification is valid (Drizzle truly cannot express this)
- [ ] SQL syntax is correct
- [ ] Rollback procedure is complete and tested
- [ ] Performance impact is acceptable
- [ ] Security review passed
- [ ] Documentation requirements met

**Approved by:** @\***\*\_\_\_\*\***
**Approval date:** YYYY-MM-DD

---

### References

- [Schema Lockdown Guide](../../docs/SCHEMA_LOCKDOWN.md)
- [DB-First Guideline](../../docs/architecture/01-db-first-guideline.md)
- [Custom SQL Documentation](../../packages/db/src/schema-platform/audit/CUSTOM_SQL.md)
