# Database Design Patterns

**Curated patterns for common database design challenges in AFENDA**

---

## Available Patterns

### Core Patterns

1. **[Case-Insensitive Uniqueness](./case-insensitive-uniqueness.md)** ⭐
   - Prevent `ACME` vs `acme` duplicates
   - Options: `citext`, `lower()` index, app normalization
   - **When**: Business codes (orgCode, regionCode, locationCode)
   - **Recommendation**: Use `citext` for Postgres, `lower()` index for portability

2. **[Soft-Delete Pattern](./soft-delete-pattern.md)**
   - Logical deletion with `deletedAt` timestamp
   - Partial unique indexes: `WHERE deletedAt IS NULL`
   - **When**: Data must be recoverable or auditable
   - **Recommendation**: Use `softDeleteColumns` mixin

3. **[Tenant Isolation Pattern](./tenant-isolation-pattern.md)**
   - Multi-tenant data isolation
   - Composite keys with `tenantId`
   - **When**: SaaS applications with multiple tenants
   - **Recommendation**: Use `tenantScopedColumns` mixin

4. **[Append-Only Tables](./append-only-pattern.md)**
   - Immutable audit trails and event logs
   - No `updatedAt`, only `createdAt`
   - **When**: Audit trails, event logs, history tables
   - **Recommendation**: Use `appendOnlyTimestampColumns` mixin

5. **[Polymorphic Associations](./polymorphic-associations-pattern.md)**
   - Reference multiple table types
   - Discriminated union pattern
   - **When**: Flexible associations (comments, attachments, audit actors)
   - **Recommendation**: Use discriminator + check constraint

### Advanced Patterns

6. **[Hierarchical Data](./hierarchical-data-pattern.md)**
   - Tree structures (org charts, categories)
   - Options: Adjacency list, nested sets, closure table
   - **When**: Parent-child relationships with arbitrary depth
   - **Recommendation**: Use closure table for complex queries

7. **[Temporal Data](./temporal-data-pattern.md)**
   - Time-based versioning and history
   - Effective date ranges
   - **When**: Price changes, policy versions, historical records
   - **Recommendation**: Use `effectiveFrom`/`effectiveTo` with exclusion constraints

8. **[Audit Trail Pattern](./audit-trail-pattern.md)**
   - 7W1H methodology (WHO, WHAT, WHEN, WHERE, WHY, WHICH, WHOM, HOW)
   - Partitioning strategy
   - **When**: Compliance, security, debugging
   - **Recommendation**: See audit schema implementation

9. **[Materialized Views](./materialized-views-pattern.md)**
   - Pre-computed aggregations
   - Refresh strategies
   - **When**: Complex queries, dashboards, reporting
   - **Recommendation**: Use `CONCURRENTLY` refresh with cron jobs

10. **[Partitioning Strategy](./partitioning-pattern.md)**
    - Range, list, hash partitioning
    - Partition pruning optimization
    - **When**: Large tables (>10M rows), time-series data
    - **Recommendation**: Use range partitioning on timestamp columns

---

## Pattern Selection Guide

### By Use Case

| Use Case | Pattern | Priority |
|----------|---------|----------|
| Business codes must be unique | Case-Insensitive Uniqueness | P0 |
| Multi-tenant SaaS | Tenant Isolation | P0 |
| Recoverable deletion | Soft-Delete | P1 |
| Audit/compliance | Audit Trail | P0 |
| Immutable logs | Append-Only Tables | P1 |
| Flexible associations | Polymorphic Associations | P2 |
| Org charts, categories | Hierarchical Data | P2 |
| Price history, versioning | Temporal Data | P2 |
| Dashboard performance | Materialized Views | P2 |
| Large tables (>10M rows) | Partitioning | P1 |

### By Problem

| Problem | Pattern | Solution |
|---------|---------|----------|
| `ACME` and `acme` both exist | Case-Insensitive Uniqueness | `citext` or `lower()` index |
| Deleted records still appear | Soft-Delete | `WHERE deletedAt IS NULL` |
| Cross-tenant data leaks | Tenant Isolation | Composite keys with `tenantId` |
| Audit records modified | Append-Only Tables | No `updatedAt`, immutability trigger |
| Can't track who changed what | Audit Trail | 7W1H columns + partitioning |
| Comments on multiple entities | Polymorphic Associations | Discriminator + check constraint |
| Slow dashboard queries | Materialized Views | Pre-computed aggregations |
| Table scans on large tables | Partitioning | Range partition on timestamp |

---

## Implementation Checklist

### For Each Pattern

- [ ] Read pattern documentation
- [ ] Understand trade-offs
- [ ] Check prerequisites (extensions, versions)
- [ ] Design schema changes
- [ ] Write migration script
- [ ] Detect and resolve conflicts
- [ ] Update Drizzle schema
- [ ] Update Zod schemas
- [ ] Add service layer logic
- [ ] Write integration tests
- [ ] Update API documentation
- [ ] Add monitoring queries

---

## Pattern Combinations

### Common Combinations

1. **Tenant Isolation + Soft-Delete + Case-Insensitive Uniqueness**
   ```typescript
   export const organizations = coreSchema.table(
     "organizations",
     {
       organizationId: integer().primaryKey().generatedAlwaysAsIdentity(),
       ...tenantScopedColumns,    // Tenant isolation
       orgCode: citextType().notNull(), // Case-insensitive
       name: text().notNull(),
       ...timestampColumns,
       ...softDeleteColumns,       // Soft-delete
     },
     (t) => [
       uniqueIndex("uq_organizations_code")
         .on(t.tenantId, t.orgCode)
         .where(sql`${t.deletedAt} IS NULL`), // Combines all three
     ]
   );
   ```

2. **Audit Trail + Append-Only + Partitioning**
   ```typescript
   export const auditTrail = auditSchema.table(
     "audit_trail",
     {
       auditId: bigint({ mode: "number" }).primaryKey(),
       ...appendOnlyTimestampColumns, // Append-only
       // ... 7W1H columns
     }
   );
   // Partitioned by (tenantId, occurredAt) - see CUSTOM_SQL.md
   ```

3. **Polymorphic Associations + Tenant Isolation**
   ```typescript
   export const comments = coreSchema.table(
     "comments",
     {
       commentId: integer().primaryKey().generatedAlwaysAsIdentity(),
       ...tenantScopedColumns,
       entityId: integer().notNull(),     // Polymorphic FK
       entityType: entityTypeEnum().notNull(), // Discriminator
       content: text().notNull(),
       ...timestampColumns,
     },
     (t) => [
       check(
         "chk_comments_entity_type_match",
         sql`
           (${t.entityType} = 'ORGANIZATION' AND ${t.entityId} IN (SELECT organization_id FROM organizations)) OR
           (${t.entityType} = 'USER' AND ${t.entityId} IN (SELECT user_id FROM users))
         `
       ),
     ]
   );
   ```

---

## Anti-Patterns to Avoid

### ❌ Don't Do This

1. **Case-sensitive business codes**
   ```typescript
   // BAD: Allows ACME and acme
   orgCode: text().notNull(),
   uniqueIndex("uq_org_code").on(t.tenantId, t.orgCode)
   ```

2. **Hard deletes on business data**
   ```typescript
   // BAD: Permanent data loss
   await db.delete(organizations).where(eq(organizations.id, id));
   ```

3. **Missing tenant isolation**
   ```typescript
   // BAD: Cross-tenant data leak risk
   uniqueIndex("uq_org_code").on(t.orgCode) // Missing tenantId!
   ```

4. **Mutable audit trails**
   ```typescript
   // BAD: Audit records can be modified
   ...timestampColumns, // Includes updatedAt
   ```

5. **Polymorphic FKs without discriminator**
   ```typescript
   // BAD: No referential integrity
   actorId: integer(), // Can reference users OR servicePrincipals
   // Missing: actorType discriminator
   ```

6. **Unique constraints without soft-delete consideration**
   ```typescript
   // BAD: Can't reuse code after soft-delete
   uniqueIndex("uq_org_code")
     .on(t.tenantId, t.orgCode)
   // Missing: .where(sql`${t.deletedAt} IS NULL`)
   ```

---

## CI Gate Integration

All patterns have corresponding CI checks:

| Pattern | CI Check | Rule | Severity |
|---------|----------|------|----------|
| Case-Insensitive Uniqueness | `check:compliance` | `case-insensitive-code` | info |
| Soft-Delete | `check:constraints` | `soft-delete-partial-index` | warning |
| Tenant Isolation | `check:tenant` | `tenant-scope` | error |
| Append-Only | `check:compliance` | `append-only-no-updates` | error |
| Polymorphic Associations | `check:compliance` | `polymorphic-discriminator` | error |
| Timestamp Consistency | `check:compliance` | `timestamp-type-consistency` | error |

Run all checks:
```bash
pnpm check:all
```

---

## Resources

### Documentation
- [DB-First Guideline](../architecture/01-db-first-guideline.md)
- [CI gates (maintained)](../CI_GATES.md)
- [Archived: CI gate analysis](../archive/ci-gates/ci-gate-analysis.md)
- [Architecture overview](../architecture/00-overview.md)

### Tools
- [Drizzle ORM](https://orm.drizzle.team/)
- [Zod Validation](https://zod.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Related
- [Migration Guide](../guides/migration-guide.md)
- [Testing Patterns](../guides/testing-patterns.md)
- [Performance Optimization](../guides/performance-optimization.md)

---

## Contributing

To add a new pattern:

1. Create `docs/patterns/your-pattern-name.md`
2. Follow the template structure:
   - Problem statement
   - Options comparison
   - Implementation examples
   - Migration strategy
   - Tests
   - CI integration
3. Add to this README
4. Add CI check if applicable
5. Submit PR with examples

---

**Last Updated**: March 19, 2026  
**Maintained By**: Platform Team
