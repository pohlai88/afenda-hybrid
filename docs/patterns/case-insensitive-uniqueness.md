# Case-Insensitive Uniqueness Pattern

**Context**: Business codes (orgCode, regionCode, locationCode) should be treated as identifiers where case doesn't matter  
**Problem**: Without enforcement, `ACME` and `acme` can coexist as "different" values  
**Solution**: Implement DB-level case-insensitive uniqueness constraints

---

## Options Comparison

| **Option** | **Prevents ACME vs acme** | **Complexity** | **Runtime cost** | **Portability** | **Recommended when** |
|---|---:|---:|---:|---:|---|
| **Do nothing** | No | None | None | High | Legacy systems where case matters |
| **App normalization (lower/upper before write)** | Yes if enforced | Low | None at DB | High | Small teams that control all writers |
| **DB unique index on lower(code)** | Yes | Low | Small on writes | High | Want DB guarantee without changing column type |
| **citext column type** | Yes | Low | Minimal | Postgres only | Postgres-first projects wanting simplest developer ergonomics |
| **Trigger to normalize or validate** | Yes | Medium | Small per-write | DB-specific | Need complex rules or gradual migration |
| **Composite approach (store canonical + original)** | Yes | Medium | Small | High | Want to preserve original case while enforcing uniqueness |

---

## Recommendation

**Enforce case-insensitive uniqueness.** For business codes (orgCode, regionCode, locationCode) you almost always want users and integrations to treat codes as identifiers, not distinct values based on letter case. That avoids subtle duplicates, UX confusion, and downstream bugs.

If you use **Postgres**, prefer **citext** for the simplest developer experience. If you need portability or prefer explicit SQL expressions, use a **unique index on `lower(code)`**. Both give a DB-level guarantee; choose based on your stack and migration constraints.

---

## Implementation Patterns

### 1. citext (Postgres simplest) ⭐ RECOMMENDED

**Pros**: 
- Column behaves case-insensitively everywhere
- No need to call `lower()` in queries
- Indexes are straightforward
- Clean developer experience

**Cons**: 
- Postgres only
- Requires `citext` extension

#### Drizzle Schema

```typescript
import { pgSchema, integer, index, foreignKey } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { citext } from "drizzle-orm/pg-core"; // Custom type

// Define citext type
export const citextType = customType<{ data: string }>({
  dataType() {
    return "citext";
  },
});

export const organizations = coreSchema.table(
  "organizations",
  {
    organizationId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    orgCode: citextType().notNull(), // Case-insensitive
    name: text().notNull(),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (t) => [
    // Unique constraint on case-insensitive code
    uniqueIndex("uq_organizations_code")
      .on(t.tenantId, t.orgCode)
      .where(sql`${t.deletedAt} IS NULL`),
    
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_organizations_tenant",
    }).onDelete("cascade").onUpdate("cascade"),
  ]
);
```

#### Migration SQL

```sql
-- CUSTOM: Enable citext extension
CREATE EXTENSION IF NOT EXISTS citext;

-- Convert column to citext
ALTER TABLE core.organizations
  ALTER COLUMN org_code TYPE citext;

-- Create unique index (partial for soft-delete)
CREATE UNIQUE INDEX uq_organizations_code
  ON core.organizations (tenant_id, org_code)
  WHERE deleted_at IS NULL;
```

---

### 2. Unique index on lower(code) (portable)

**Pros**: 
- Works without changing column type
- Portable across DBs that support functional indexes
- No extension required

**Cons**: 
- Queries that compare must use `lower()`
- Slightly more verbose

#### Drizzle Schema

```typescript
export const organizations = coreSchema.table(
  "organizations",
  {
    organizationId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    orgCode: text().notNull(), // Regular text
    name: text().notNull(),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (t) => [
    // Functional unique index on lower(code)
    uniqueIndex("uq_organizations_code")
      .on(
        t.tenantId, 
        sql`lower(${t.orgCode})`
      )
      .where(sql`${t.deletedAt} IS NULL`),
    
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_organizations_tenant",
    }).onDelete("cascade").onUpdate("cascade"),
  ]
);
```

#### Migration SQL

```sql
-- Create functional unique index
CREATE UNIQUE INDEX uq_organizations_code
  ON core.organizations (tenant_id, lower(org_code))
  WHERE deleted_at IS NULL;
```

#### Query Pattern

```typescript
// When querying, use lower() for case-insensitive comparison
const org = await db
  .select()
  .from(organizations)
  .where(
    and(
      eq(organizations.tenantId, tenantId),
      sql`lower(${organizations.orgCode}) = lower(${code})`
    )
  );
```

---

### 3. Application normalization

**Pros**: 
- No DB changes
- Easy to implement
- Portable

**Cons**: 
- No DB guarantee
- Risk if other writers bypass app
- Must be disciplined

#### Pattern

```typescript
// Service layer normalization
export const organizationInsertSchema = createInsertSchema(organizations, {
  orgCode: z
    .string()
    .min(1)
    .max(50)
    .transform(s => s.trim().toLowerCase()), // Normalize to lowercase
});

// Always normalize before write
async function createOrganization(data: NewOrganization) {
  const normalized = {
    ...data,
    orgCode: data.orgCode.trim().toLowerCase(),
  };
  
  return await db.insert(organizations).values(normalized);
}
```

**Add DB unique index for safety**:

```sql
CREATE UNIQUE INDEX uq_organizations_code
  ON core.organizations (tenant_id, org_code)
  WHERE deleted_at IS NULL;
```

---

### 4. Composite approach (canonical + original)

**Pros**: 
- Preserves original case for display
- Enforces uniqueness on canonical
- Flexible

**Cons**: 
- Extra column
- More complex
- Requires backfill

#### Drizzle Schema

```typescript
export const organizations = coreSchema.table(
  "organizations",
  {
    organizationId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    orgCode: text().notNull(), // Original case preserved
    orgCodeCanonical: text().notNull(), // Normalized for uniqueness
    name: text().notNull(),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (t) => [
    // Unique on canonical
    uniqueIndex("uq_organizations_code_canonical")
      .on(t.tenantId, t.orgCodeCanonical)
      .where(sql`${t.deletedAt} IS NULL`),
    
    // Regular index on original for display queries
    index("idx_organizations_code").on(t.tenantId, t.orgCode),
  ]
);
```

#### Zod Schema

```typescript
export const organizationInsertSchema = createInsertSchema(organizations, {
  orgCode: z.string().min(1).max(50).transform(s => s.trim()),
}).transform(data => ({
  ...data,
  orgCodeCanonical: data.orgCode.toLowerCase(),
}));
```

---

## Migration Strategy

### Step 1: Detect Existing Conflicts

```sql
-- Find duplicate codes (case-insensitive)
SELECT 
  tenant_id, 
  lower(org_code) AS canon, 
  array_agg(org_code ORDER BY created_at) AS variants,
  count(*) AS duplicate_count
FROM core.organizations
WHERE deleted_at IS NULL
GROUP BY tenant_id, lower(org_code)
HAVING count(*) > 1
ORDER BY duplicate_count DESC;
```

### Step 2: Resolve Conflicts

**Option A: Keep oldest, soft-delete others**

```sql
-- Soft-delete duplicates (keep oldest)
WITH ranked AS (
  SELECT 
    organization_id,
    ROW_NUMBER() OVER (
      PARTITION BY tenant_id, lower(org_code) 
      ORDER BY created_at ASC
    ) AS rn
  FROM core.organizations
  WHERE deleted_at IS NULL
)
UPDATE core.organizations
SET deleted_at = NOW()
WHERE organization_id IN (
  SELECT organization_id 
  FROM ranked 
  WHERE rn > 1
);
```

**Option B: Rename duplicates**

```sql
-- Rename duplicates with suffix
WITH ranked AS (
  SELECT 
    organization_id,
    org_code,
    ROW_NUMBER() OVER (
      PARTITION BY tenant_id, lower(org_code) 
      ORDER BY created_at ASC
    ) AS rn
  FROM core.organizations
  WHERE deleted_at IS NULL
)
UPDATE core.organizations o
SET org_code = r.org_code || '_' || r.rn
FROM ranked r
WHERE o.organization_id = r.organization_id
  AND r.rn > 1;
```

### Step 3: Apply Constraint

**For citext**:

```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS citext;

-- Convert column
ALTER TABLE core.organizations
  ALTER COLUMN org_code TYPE citext;

-- Add unique index
CREATE UNIQUE INDEX uq_organizations_code
  ON core.organizations (tenant_id, org_code)
  WHERE deleted_at IS NULL;
```

**For lower() index**:

```sql
-- Add functional unique index
CREATE UNIQUE INDEX uq_organizations_code
  ON core.organizations (tenant_id, lower(org_code))
  WHERE deleted_at IS NULL;
```

### Step 4: Update Application Code

```typescript
// Update Zod schemas
export const organizationInsertSchema = createInsertSchema(organizations, {
  orgCode: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/i, "Code must be alphanumeric")
    .transform(s => s.trim()),
});

// Add validation in service layer
export async function createOrganization(data: NewOrganization) {
  // Normalize input
  const normalized = {
    ...data,
    orgCode: data.orgCode.trim(),
  };
  
  try {
    return await db.insert(organizations).values(normalized);
  } catch (error) {
    if (error.code === "23505") { // Unique violation
      throw new Error(`Organization code "${normalized.orgCode}" already exists`);
    }
    throw error;
  }
}
```

### Step 5: Add Tests

```typescript
describe("Organization code uniqueness", () => {
  it("should prevent case-insensitive duplicates", async () => {
    const tenantId = 1;
    
    // Create with uppercase
    await createOrganization({ tenantId, orgCode: "ACME", name: "ACME Corp" });
    
    // Attempt lowercase should fail
    await expect(
      createOrganization({ tenantId, orgCode: "acme", name: "Acme Inc" })
    ).rejects.toThrow("already exists");
  });
  
  it("should allow same code in different tenants", async () => {
    await createOrganization({ tenantId: 1, orgCode: "ACME", name: "ACME 1" });
    await createOrganization({ tenantId: 2, orgCode: "ACME", name: "ACME 2" });
    // Should succeed
  });
  
  it("should allow same code after soft-delete", async () => {
    const org1 = await createOrganization({ 
      tenantId: 1, 
      orgCode: "ACME", 
      name: "ACME 1" 
    });
    
    // Soft-delete
    await db
      .update(organizations)
      .set({ deletedAt: new Date() })
      .where(eq(organizations.organizationId, org1.organizationId));
    
    // Should allow reuse
    await createOrganization({ tenantId: 1, orgCode: "ACME", name: "ACME 2" });
  });
});
```

---

## CI Gate Integration

### Add to check-guideline-compliance-v2.ts

```typescript
function checkCaseInsensitiveUniqueness(table: TableInfo): void {
  const content = fs.readFileSync(table.file, "utf-8");
  
  // Check for code columns
  const codeColumns = table.columns.filter(c => 
    c.name.toLowerCase().includes("code") && 
    c.type === "text"
  );
  
  for (const col of codeColumns) {
    // Check if column has case-insensitive uniqueness
    const hasCitextType = content.includes(`${col.name}: citext`);
    const hasLowerIndex = table.indexes.some(idx => 
      idx.name.includes(col.name.toLowerCase()) &&
      content.includes(`lower(${col.name})`)
    );
    
    if (!hasCitextType && !hasLowerIndex) {
      const loc = findLineAndColumn(content, `${col.name}:`);
      issues.push({
        file: table.relativePath,
        line: loc.line,
        column: loc.column,
        table: table.name,
        principle: "P3",
        rule: "case-insensitive-code",
        message: `Code column "${col.name}" should enforce case-insensitive uniqueness`,
        severity: "warning",
        autoFixable: false,
        codeSnippet: getCodeSnippet(content, loc.line),
        suggestion: `Use citext type or add unique index on lower(${col.name})`,
      });
    }
  }
}
```

---

## Operational Notes

### Collation and Locale

- `lower()` behavior depends on locale for some characters
- If you have non-ASCII codes, test with your expected locales
- `citext` follows Postgres rules
- For complex Unicode case folding you may need additional normalization

### Performance Considerations

- Functional indexes (`lower(code)`) have minimal overhead
- `citext` is slightly faster than functional indexes
- Both are negligible for typical workloads
- Index size is similar to regular text index

### Monitoring

```sql
-- Check for potential case conflicts
SELECT 
  tenant_id,
  lower(org_code) AS code_lower,
  array_agg(DISTINCT org_code) AS case_variants,
  count(*) AS count
FROM core.organizations
WHERE deleted_at IS NULL
GROUP BY tenant_id, lower(org_code)
HAVING count(DISTINCT org_code) > 1;
```

---

## Quick Checklist

- [ ] Decide: `citext` vs `lower()` index
- [ ] Run duplicate detection query
- [ ] Resolve conflicts (merge/rename/soft-delete)
- [ ] Add migration to convert column or create functional index
- [ ] Update Zod schemas to trim/normalize input
- [ ] Add integration tests for uniqueness
- [ ] Test soft-delete behavior
- [ ] Document pattern in schema comments
- [ ] Add CI gate check (optional)

---

## Final Verdict

**Use `citext`** if you're Postgres-only and want the cleanest developer experience.

**Use `lower()` index** if you need portability or prefer explicit SQL expressions.

Both provide the DB guarantee you want and prevent `ACME` vs `acme` surprises.

---

**Related**:
- [DB-First Guideline](../architecture/01-db-first-guideline.md) Section 4.8 (Unique Constraints)
- [Soft-Delete Pattern](./soft-delete-pattern.md)
- [Tenant Isolation](./tenant-isolation-pattern.md)
