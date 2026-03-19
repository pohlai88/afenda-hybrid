---
name: DB-First Guideline Rewrite
overview: Rewrite the DB-first guideline with a comprehensive PostgreSQL-to-Drizzle primitives reference as the core section, covering PK, FK, indexes, RLS, policies, constraints, relations, enums, views, sequences -- and marking triggers/partitioning as custom-SQL escapes.
todos:
  - id: rewrite-purpose-principles
    content: "Update Sections 1-2: add Drizzle/Zod scope and P7 TypeScript-as-schema-language principle"
    status: completed
  - id: rewrite-schema-org
    content: "Rewrite Section 3: three-tier schema layering with Drizzle file layout"
    status: completed
  - id: write-primitives-ref
    content: "Write NEW Section 4: full PostgreSQL primitives reference (PK, FK, index, constraints, enums, RLS, policies, roles, relations, views, sequences, PG types, extensions, custom SQL escapes)"
    status: completed
  - id: write-pg-types
    content: "Write NEW Section 4.11: PostgreSQL type selection guide (numeric for finance, date vs timestamp, JSONB with GIN, tsvector for search, generated columns, UUID vs integer PKs)"
    status: completed
  - id: write-mixins-zod
    content: "Write NEW Section 5: shared column mixins, Zod 4 integration (branded IDs, top-level formats, codecs, JSON Schema generation)"
    status: completed
  - id: update-tenancy
    content: "Update Section 6 (tenancy): replace SQL examples with TypeScript helpers"
    status: completed
  - id: update-integrity
    content: "Update Section 7 (integrity): reference Section 4 for Drizzle syntax, show soft-delete in Drizzle"
    status: completed
  - id: rewrite-migrations
    content: "Rewrite Section 8 (migrations): Drizzle Kit workflow, keep two-phase and CI patterns"
    status: completed
  - id: update-ops-sections
    content: "Update Sections 9-12: swap raw SQL references to drizzle-kit"
    status: completed
  - id: add-appendix-c
    content: "Add Appendix C: Drizzle + Zod quick reference cheat sheet (type mapping, syntax, commands)"
    status: completed
  - id: update-overview
    content: Update 00-overview.md to reflect Drizzle/Zod focus
    status: completed
isProject: false
---

# Rewrite DB-First Guideline: PostgreSQL Primitives in Drizzle + Zod

## The Problem with the Current Plan

The previous plan treated schema examples as an afterthought. The **actual value** of this guideline is a systematic mapping of every PostgreSQL structural primitive to its Drizzle ORM equivalent, so engineers never have to guess how to express a DB concept in code. That mapping is now the centerpiece.

## Critical Findings from Drizzle Docs Research

These findings from the official Drizzle documentation (v1.0+) change several assumptions in the original plan:

1. `**drizzle-zod` is deprecated** -- Zod integration is now built into `drizzle-orm/zod` natively. Use `createSelectSchema`, `createInsertSchema`, `createUpdateSchema` directly from `drizzle-orm/zod`. No separate `drizzle-zod` package needed. Also includes `createSchemaFactory` for extended Zod instances (e.g., `@hono/zod-openapi`).
2. `**generatedAlwaysAsIdentity()`** is now the recommended PK pattern, replacing `serial()` / `bigserial()`. Uses PostgreSQL GENERATED ALWAYS AS IDENTITY (SQL standard).
3. `**casing: 'snake_case'`** option on `drizzle()` DB initialization auto-maps camelCase TS property names to snake_case DB columns. Eliminates manual column aliasing.
4. **Column helpers spread pattern** is officially documented in Drizzle (timestamps example). Validates our shared mixins approach.
5. **Materialized Views** have extensive options: `.using('btree')`, `.with({ fillfactor, autovacuum_enabled, ... })`, `.tablespace()`, `.withNoData()`, and `db.refreshMaterializedView().concurrently()`.
6. **View options**: `pgView` supports `.with({ checkOption, securityBarrier, securityInvoker })` for fine-grained control.
7. **Migration strategy**: Use "Option 3" from Drizzle docs -- `drizzle-kit generate` produces SQL migration files committed to Git, `drizzle-kit migrate` applies them. Aligns with DB-first principle.
8. **drizzle.config.ts** key options: `schemaFilter` (filter PG schemas), `entities.roles` (enable role management for RLS), `extensionsFilters` (ignore PostGIS tables), `migrations.prefix` (timestamp-based naming).
9. **Extensions**: pg_vector and PostGIS have first-class column types and index support in Drizzle.
10. `**pgTable` callback syntax** -- Drizzle supports a callback form `pgTable("name", (t) => ({ ... }))` as an alternative to the import-based form. Both are valid.

---

## Revised Document Structure

Rewrite [docs/architecture/01-db-first-guideline.md](docs/architecture/01-db-first-guideline.md) with these sections:

### Section 1 -- Purpose (minor update)

- Add: "This guideline uses **Drizzle ORM** (v1.0+) as the TypeScript schema language and the **built-in `drizzle-orm/zod`** integration for runtime validation schemas."

### Section 2 -- Principles (add one)

- Add P7: **TypeScript as Schema Language** -- Drizzle ORM table definitions are the canonical schema source; raw SQL is generated by `drizzle-kit generate`, not hand-written. Schemas are committed as `.ts` files; migrations are committed as generated `.sql` files.

### Section 3 -- Schema Organization (rewrite)

Refine into the three-tier model:

- **Tier 1: Foundational (`core`)** -- tenants, organizations, regions, locations, settings. Rarely changes. Everything else references this.
- **Tier 2: Infrastructure Shared (`security`, `audit`, `observability`)** -- cross-cutting concerns consumed by all domain schemas. References core.
- **Tier 3: Domain / Module (`hr`, `finance`, `projects`, ...)** -- each split into `fundamentals/` (master data) and `operations/` (transactional CRUD).

Include the file layout:

```
src/db/
  schema/
    _shared/           -- column mixins (timestamps.ts, tenantScope.ts, auditColumns.ts)
    core/              -- tenants.ts, organizations.ts, regions.ts, locations.ts, _relations.ts
    security/          -- users.ts, roles.ts, servicePrincipals.ts, _relations.ts
    audit/             -- auditTrail.ts, retentionPolicy.ts
    observability/     -- traces.ts
    hr/
      fundamentals/    -- employees.ts, departments.ts
      operations/      -- attendanceLogs.ts, payrollRuns.ts
      _relations.ts
    index.ts           -- barrel re-export of all schemas
  migrations/          -- generated by drizzle-kit generate (committed to Git)
  drizzle.config.ts
  db.ts                -- drizzle() init with casing: 'snake_case' and schema import
```

Include drizzle.config.ts reference:

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/**/*.ts",
  out: "./src/db/migrations",
  schemaFilter: ["core", "security", "audit", "hr", "finance"],
  entities: {
    roles: true,        // enable role management for RLS policies
  },
  migrations: {
    prefix: "timestamp", // timestamp-based migration naming
  },
  strict: true,
  verbose: true,
});
```

Include db.ts init reference:

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export const db = drizzle(process.env.DATABASE_URL!, {
  schema,
  casing: "snake_case", // auto-maps camelCase TS -> snake_case DB
});
```

### NEW Section 4 -- PostgreSQL Primitives Reference (THE core section)

This is the backbone. A comprehensive reference mapping every PostgreSQL primitive to Drizzle ORM API, with AFENDA-specific conventions.

#### 4.1 Named Schemas (`pgSchema`)

- Every tier gets a `pgSchema()` declaration
- Example: `export const coreSchema = pgSchema("core");`
- Schema-scoped tables: `coreSchema.table("tenants", { ... })`
- Schema-scoped enums: `coreSchema.enum("status", [...])`
- Schema-scoped sequences: `coreSchema.sequence("name", { ... })`

#### 4.2 Primary Keys

- **Single (RECOMMENDED)**: `.primaryKey().generatedAlwaysAsIdentity()` on `integer()` columns -- uses PostgreSQL GENERATED ALWAYS AS IDENTITY (modern SQL standard, preferred over serial/bigserial)
- **Single (legacy)**: `.primaryKey()` on `bigserial()` / `serial()` -- still valid but prefer identity columns
- **Composite**: `primaryKey({ columns: [t.col1, t.col2], name: "pk_name" })` in third arg
- AFENDA convention: surrogate `{entity}Id` (camelCase in TS, auto-mapped to `{entity}_id` in DB via `casing: 'snake_case'`) using `.generatedAlwaysAsIdentity()`

#### 4.3 Foreign Keys

- **Inline**: `.references(() => parentTable.column)` for simple single-column FKs within same schema
- **Inline with actions**: `.references(() => t.col, { onDelete: 'cascade', onUpdate: 'cascade' })`
- **Standalone**: `foreignKey({ columns: [...], foreignColumns: [...], name: "fk_name" })` for composite or self-referencing FKs
- **Self-referencing**: use `AnyPgColumn` type -- `.references((): AnyPgColumn => table.id)` or standalone `foreignKey()` operator
- **Actions**: `.onDelete('cascade' | 'restrict' | 'no action' | 'set null' | 'set default')`, `.onUpdate(...)`
- AFENDA convention: always use standalone `foreignKey()` form for **cross-schema** references (clearer intent); inline `.references()` is fine within the same schema

#### 4.4 Indexes

- **Regular**: `index("name").on(t.column)` -- btree by default
- **Unique**: `uniqueIndex("name").on(t.column)`
- **Composite**: `index("name").on(t.col1.asc(), t.col2.nullsFirst())`
- **Partial** (WHERE): `index("name").on(t.col).where(sql\`condition)`
- **Using** (non-btree): `index("name").using("gin", t.col.op("jsonb_ops"))` or `"gist"`, `"hnsw"` for pg_vector
- **Concurrently**: `index("name").on(t.col).concurrently()` -- zero-downtime; MUST be in separate non-transactional migration
- **With options**: `.with({ fillfactor: '70' })`
- AFENDA convention: always index `tenantId` as leading column on tenant-scoped tables; name indexes as `idx_{table}_{columns}`

#### 4.5 Constraints

- **NOT NULL**: `.notNull()` -- AFENDA default: every column is `.notNull()` unless explicitly justified
- **UNIQUE**: `.unique()` inline or `unique().on(t.col1, t.col2)` composite; use `.nullsNotDistinct()` for PG 15+
- **CHECK**: `check("chk_name", sql\`${t.status} IN ('ACTIVE','SUSPENDED','CLOSED'))` in third arg
- **DEFAULT**: `.default(value)`, `.defaultNow()`, `.defaultRandom()`, or `.default(sql\`expression)`
- **GENERATED**: `.generatedAlwaysAs(sql\`expression)` for computed columns

#### 4.6 Enums (`pgEnum`)

- **Public schema**: `export const statusEnum = pgEnum("tenant_status", ["ACTIVE", "SUSPENDED", "CLOSED"]);`
- **Named schema**: `export const statusEnum = coreSchema.enum("tenant_status", ["ACTIVE", "SUSPENDED", "CLOSED"]);`
- **Column usage**: `tenantStatus: statusEnum().notNull().default("ACTIVE")`
- Prefer enums over CHECK-based string validation when the value set is stable and shared across tables. Use CHECK for table-local validation.

#### 4.7 Relations (Drizzle soft relations)

- **One-to-one**: `relations(table, ({ one }) => ({ profile: one(profiles, { fields: [table.profileId], references: [profiles.id] }) }))`
- **One-to-many**: `relations(table, ({ many }) => ({ posts: many(posts) }))`
- **Many-to-many**: via junction table with `primaryKey({ columns: [t.userId, t.groupId] })`
- **Disambiguating**: use `relationName: "author"` when multiple relations exist between the same two tables
- **Cross-schema**: relations work across `pgSchema` boundaries
- Key distinction: `relations()` is application-level only (enables `db.query` API with `with: { posts: true }`); foreign keys are DB-level constraints. **AFENDA requires both**: FKs for integrity, relations for query convenience. Define them together.

#### 4.8 Row-Level Security and Policies

- **Enable RLS** (no policies): `pgTable.withRLS("name", { ... })` (v1.0+; deprecated `.enableRLS()` in 0.x)
- **Auto-enabled**: adding any `pgPolicy()` to a table enables RLS automatically
- **Define policies**: `pgPolicy("name", { as: 'permissive'|'restrictive', to: role, for: 'select'|'insert'|'update'|'delete'|'all', using: sql\`..., withCheck: sql... })` in table's third arg
- **Define roles**: `pgRole("name", { createRole, createDb, inherit })` or `.existing()` for pre-existing DB roles
- **Link to existing tables**: `pgPolicy("name", { ... }).link(existingTable)` for adding policies to tables you don't own
- **drizzle.config.ts**: set `entities: { roles: true }` to include role management in migrations; use `provider: 'neon'|'supabase'` to exclude provider-defined roles
- **Neon helpers**: `crudPolicy({ role, read: true, modify: false })` from `drizzle-orm/neon`
- **RLS on views**: use `.with({ securityInvoker: true })` on `pgView`
- AFENDA convention: RLS is opt-in per ADR; when enabled, show the full pattern with `afenda.tenant_id` session variable

#### 4.9 Views and Materialized Views

- **Views**: `pgView("name").as((qb) => qb.select(...).from(...))` -- column schema auto-inferred
- **Views with raw SQL**: `pgView("name", { col1: integer(), ... }).as(sql\`...)` -- must declare column schema
- **View options**: `.with({ checkOption: 'cascaded', securityBarrier: true, securityInvoker: true })`
- **Existing views** (read-only): `pgView("name", { ... }).existing()` -- drizzle-kit won't generate DDL
- **Materialized Views**: `pgMaterializedView("name").as((qb) => ...)` with `.using('btree')`, `.with({ fillfactor: 90, autovacuum_enabled: true })`, `.tablespace('name')`, `.withNoData()`
- **Refresh**: `await db.refreshMaterializedView(view)`, `.concurrently()`, `.withNoData()`
- Limitation: indexes on materialized views require custom SQL in the migration file

#### 4.10 Sequences (`pgSequence`)

- **Public schema**: `pgSequence("name", { startWith, increment, maxValue, minValue, cache, cycle })`
- **Named schema**: `coreSchema.sequence("name", { ... })`
- Use when you need controlled ID generation outside of `generatedAlwaysAsIdentity` (e.g., invoice numbers, batch IDs)

#### 4.11 PostgreSQL-Specific Data Types (NEW from PG docs research)

The guideline should include a **type selection guide** mapping business needs to the right PostgreSQL type + Drizzle function. PostgreSQL has ~45 built-in types; here are the ones most relevant to AFENDA beyond the basics:

**Numeric precision for financial data:**

- `numeric(precision, scale)` via Drizzle `numeric({ precision: 12, scale: 2 })` -- MUST be used for all monetary/financial columns in the `finance` schema. Never use `real`/`doublePrecision` for money (floating-point rounding errors). Maps to `z.string()` in Zod (numeric is returned as string by default for precision safety).

**Date vs Timestamp decision:**

- `date` via `date()` -- for calendar dates with no time component (birthdays, hire dates, fiscal periods)
- `timestamp with time zone` via `timestamp({ withTimezone: true })` -- for points in time (events, audit trails). AFENDA default: always use `withTimezone: true` for timestamps.
- `time with time zone` via `time({ withTimezone: true })` -- rarely needed; use for schedules only
- `interval` via `interval()` -- for durations (SLA windows, retention periods). Maps to `z.string()`.

**Network types** (relevant for security/audit schemas):

- `inet` via `inet()` -- IPv4/IPv6 host addresses (for login IP tracking)
- `cidr` via `cidr()` -- network address blocks (for IP allowlists)
- `macaddr` / `macaddr8` via `macaddr()` / `macaddr8()` -- device tracking

**Semi-structured data (JSONB):**

- `jsonb` via `jsonb()` -- for flexible metadata, tenant settings, feature flags. Prefer `jsonb` over `json` (supports indexing, containment queries).
- GIN indexes for JSONB: `index("idx_settings").using("gin", t.settings)` -- enables `@>` containment queries
- AFENDA pattern: use JSONB for `tenantSettings`, `userPreferences`, `featureFlags` -- typed at the Zod layer with `createSelectSchema(table, { settings: z.object({ ... }) })`

**Full Text Search** (important for enterprise search):

- `tsvector` via Drizzle `customType` or `sql` -- stores pre-processed search document
- `tsquery` -- search query type
- GIN index on tsvector columns for fast search
- Pattern: add a `searchVector` stored generated column + GIN index + trigger to auto-update. This requires custom SQL in migration (see 4.13).

**Generated columns** (PostgreSQL 12+ stored, 18+ virtual):

- Stored: `.generatedAlwaysAs(sql\`expression).stored()` -- computed on write, occupies storage
- Virtual: `.generatedAlwaysAs(sql\`expression)` -- computed on read (PG 18+), no storage
- Use cases: `fullName` from first+last, `searchVector` from title+description, `totalAmount` from subtotal+tax

**UUID as primary key option:**

- `uuid` via `uuid()` with `.defaultRandom()` -- uses `gen_random_uuid()` (pgcrypto, built-in PG 13+)
- Trade-off vs. integer PKs: UUIDs are globally unique and safe for distributed systems but larger (16 bytes vs 4/8) and have worse index locality
- AFENDA convention: use `integer().generatedAlwaysAsIdentity()` as default PK; use `uuid()` only when entities need to be referenced across systems or exposed in URLs

#### 4.12 PostgreSQL Extensions

- **pg_vector**: `vector({ dimensions: 3 })` column type; HNSW/IVFFlat indexes via `.using('hnsw', t.embedding.op('vector_cosine_ops'))`; distance helpers (`l2Distance`, `cosineDistance`, etc.)
- **PostGIS**: `geometry({ type: 'point', mode: 'xy' })` column type; GiST indexes via `.using('gist', t.geo)`
- **pgcrypto**: use via `sql\`gen_random_uuid()`in defaults; also provides`pgp_sym_encrypt`/`pgp_sym_decrypt` for PII column encryption
- **pg_trgm**: trigram similarity for fuzzy text matching; GIN/GiST indexes with `gin_trgm_ops` operator class
- **Config**: set `extensionsFilters: ["postgis"]` in drizzle.config.ts to exclude extension system tables from introspection

#### 4.13 Custom SQL Escapes (Triggers, Partitioning, Functions, Exclusion Constraints)

Things Drizzle does NOT natively support -- must be handled as custom SQL appended to generated migrations:

**Triggers** (critical for AFENDA audit/timestamps):

- `BEFORE INSERT/UPDATE` ROW trigger for auto-setting `updatedAt = now()`
- `AFTER INSERT/UPDATE/DELETE` ROW trigger for writing to `audit.audit_trail`
- Pattern: create the trigger function once in a base migration, then attach triggers per table
- Drizzle has early-stage Supabase trigger support (PR #4844) but not production-ready for general use

**Table Partitioning** (critical for large operational/audit tables):

- **Range partitioning** (most common): partition `audit.audit_trail` by `created_at` month/quarter for efficient time-range queries and partition pruning
- **List partitioning**: partition by `tenant_id` for very large tenants requiring isolation
- **Hash partitioning**: for even data distribution across shards
- PostgreSQL 18 supports all three; partition maintenance (attach/detach) is much faster than bulk DELETE
- AFENDA convention: partition `audit.audit_trail` and `*.operations` tables by range on timestamp when expected row count exceeds ~10M rows

**Stored functions/procedures:**

- For complex DB-side logic, transaction-boundary audit functions, custom aggregates
- AFENDA convention: minimize stored logic; prefer application-layer logic except for audit triggers and materialized view refresh functions

**Exclusion constraints:**

- Prevents overlapping ranges (e.g., employee schedules, room bookings, date-range validity)
- Uses GiST index automatically: `EXCLUDE USING gist (room_id WITH =, time_range WITH &&)`
- AFENDA convention: use for any scheduling/booking domain tables where range overlap must be prevented

**Domains** (named constraint-on-type):

- `CREATE DOMAIN email_address AS text CHECK (VALUE ~ '^[^@]+@[^@]+$')` -- reusable validated type
- Not supported by Drizzle natively; use custom SQL in migration when a single constrained type must be enforced across many tables at the DB level

**Pattern**: run `drizzle-kit generate`, then append custom SQL to the generated `.sql` migration file before committing. The custom SQL block should be clearly commented as `-- CUSTOM: <purpose>`.

### Section 5 -- Shared Column Mixins and Zod 4 Integration (NEW)

#### 5.1 Reusable column sets (spread pattern -- officially documented by Drizzle)

Show TypeScript column-set objects that spread into any table:

- `timestampColumns` -- `createdAt: timestamp({ withTimezone: true }).notNull().defaultNow()`, `updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow()`
- `softDeleteColumns` -- `deletedAt: timestamp({ withTimezone: true })`
- `tenantScopedColumns` -- `tenantId: integer().notNull().references(() => tenants.tenantId)` (index via table third arg)
- `auditColumns` -- `createdBy: integer().notNull()`, `updatedBy: integer().notNull()`

#### 5.2 Zod schema generation (built-in `drizzle-orm/zod`, NOT the deprecated `drizzle-zod` package)

**Prescribe Zod 4** (`zod@^4.0.0`) -- stable since July 2025. Drizzle v1's built-in zod integration is Zod 4 compatible.

- `createSelectSchema(table)` -- validates data queried from DB; works on tables, views, and enums
- `createInsertSchema(table)` -- validates insert payloads; respects defaults/generated columns
- `createUpdateSchema(table)` -- validates partial update payloads (all fields optional)
- **Refinements**: pass second arg with column overrides:
  - Callback to extend: `{ name: (schema) => schema.max(100) }`
  - Zod schema to overwrite: `{ preferences: z.object({ theme: z.string() }) }`
- **Factory**: `createSchemaFactory({ zodInstance: extendedZ, coerce: { date: true } })` for extended Zod instances (e.g., `@hono/zod-openapi`) or type coercion
- **Pattern**: export `insertSchema`, `selectSchema`, `updateSchema` alongside each table definition

#### 5.3 Zod 4 patterns for AFENDA (NEW from Zod research)

**Branded types for type-safe entity IDs:**

Zod 4 `.brand<T>()` enables nominal typing -- prevents accidentally passing a `userId` where a `tenantId` is expected, even though both are `number`:

```typescript
const TenantId = z.number().int().brand<"TenantId">();
const UserId = z.number().int().brand<"UserId">();
type TenantId = z.infer<typeof TenantId>; // number & z.$brand<"TenantId">
type UserId = z.infer<typeof UserId>;     // number & z.$brand<"UserId">
```

AFENDA convention: export branded ID types from each schema module for service-layer type signatures.

**Top-level string formats (Zod 4 breaking change):**

Zod 4 promotes string validations to top-level: `z.email()`, `z.uuid()`, `z.url()`, `z.ipv4()`, `z.ipv6()`, `z.mac()`, `z.cidrv4()`, `z.cidrv6()`. The old `z.string().email()` etc. are deprecated.

Use in refinement overrides:

```typescript
const insertUserSchema = createInsertSchema(users, {
  email: z.email(),                    // Zod 4 top-level format
  name: (schema) => schema.max(100),   // extends existing
});
```

**Codecs for bidirectional transformations:**

Zod 4 codecs handle DB-to-API serialization: `z.isoDatetimeToDate()`, `z.json(innerSchema)`, `z.epochMillisToDate()`. Define shared codecs in `_shared/codecs.ts`.

**JSON Schema generation for API docs:**

`z.toJSONSchema(schema)` built-in -- auto-generate OpenAPI specs from Drizzle+Zod schemas. Keeps API docs in sync with the database model.

**Metadata and registries:**

Attach metadata via `.meta()` and `.describe()` for documentation generators:

```typescript
const tenantInsertSchema = createInsertSchema(tenants)
  .describe("Schema for creating a new tenant");
```

**Error customization (Zod 4 breaking change):**

Zod 4 uses `error` param instead of deprecated `message`:

```typescript
z.string().min(5, { error: "Too short." });
z.string().min(5, { error: (issue) => `Must be >${issue.minimum} chars` });
```

### Section 6 -- Tenancy and Isolation (kept, updated)

- Replace SQL `SET LOCAL` example with a TypeScript helper function that wraps `db.execute(sql\`SET LOCAL ...)`
- Keep RLS decision framework, tenancy comparison table
- Add Drizzle RLS pattern example with `pgPolicy` + `pgRole` when RLS is opted-in

### Section 7 -- Integrity and Constraint Patterns (kept, updated)

- Reference back to Section 4.5 for Drizzle syntax
- Keep soft-delete pattern but show it in Drizzle: `uniqueIndex("uq_active_org_code").on(t.tenantId, t.orgCode).where(sql\`${t.deletedAt} IS NULL)`

### Section 8 -- Migrations (rewrite for Drizzle Kit)

- **Strategy**: "Option 3" from Drizzle docs -- `drizzle-kit generate` produces SQL migration files, committed to Git. Applied via `drizzle-kit migrate` or runtime `migrate()` from `drizzle-orm/*/migrator`.
- **drizzle.config.ts** reference configuration (see Section 3 above)
- **Commands**: `drizzle-kit generate`, `drizzle-kit migrate`, `drizzle-kit push` (dev only), `drizzle-kit pull` (introspect existing DB), `drizzle-kit check` (verify migration consistency)
- Keep two-phase change pattern, CI pipeline, and rollback rules (tooling-agnostic)
- Custom SQL escape pattern for triggers/partitioning in generated migration files

### Sections 9-12 (Testing, Operations, Security, Observability)

- Minimal changes: swap "raw SQL migration" references to `drizzle-kit`
- Keep checklists, metrics, alerting, role matrix as-is

### Appendix C -- Drizzle + Zod 4 Quick Reference (NEW)

One-page cheat sheet:

- **Column type mapping table**: PostgreSQL type -> Drizzle function -> Zod 4 type (from official drizzle-orm/zod docs)
  - `integer()` / `serial()` -> `z.number().min(-2_147_483_648).max(2_147_483_647).int()`
  - `bigint({ mode: 'number' })` / `bigserial({ mode: 'number' })` -> `z.number().min(-9_007_199_254_740_991).max(9_007_199_254_740_991).int()`
  - `bigint({ mode: 'bigint' })` -> `z.bigint().min(-9_223_372_036_854_775_808n).max(9_223_372_036_854_775_807n)`
  - `smallint()` -> `z.number().min(-32_768).max(32_767).int()`
  - `real()` -> `z.number().min(-8_388_608).max(8_388_607)`
  - `doublePrecision()` -> `z.number().min(-140_737_488_355_328).max(140_737_488_355_327)`
  - `text()` -> `z.string()`
  - `varchar({ length: N })` -> `z.string().max(N)`
  - `char({ length: N })` -> `z.string().length(N)`
  - `boolean()` -> `z.boolean()`
  - `timestamp({ mode: 'date' })` -> `z.date()`
  - `timestamp({ mode: 'string' })` -> `z.string()`
  - `uuid()` -> `z.uuid()` (Zod 4 top-level; previously `z.string().uuid()`)
  - `json() / jsonb()` -> `z.union([z.string(), z.number(), z.boolean(), z.null(), z.record(z.any()), z.array(z.any())])`
  - `pgEnum([...])` -> `z.enum([...])`
  - `vector({ dimensions: N })` -> `z.array(z.number()).length(N)`
  - `geometry({ type: 'point', mode: 'tuple' })` -> `z.tuple([z.number(), z.number()])`
  - `geometry({ type: 'point', mode: 'xy' })` -> `z.object({ x: z.number(), y: z.number() })`
- **Zod 4 top-level format types** (use in refinements): `z.email()`, `z.uuid()`, `z.url()`, `z.ipv4()`, `z.ipv6()`, `z.mac()`, `z.cidrv4()`, `z.cidrv6()`
- **Branded ID types**: `z.number().int().brand<"TenantId">()` for nominal typing
- **All constraint/index/FK/RLS syntax** at a glance
- **drizzle-kit command reference**: `generate`, `migrate`, `push`, `pull`, `check`, `export`
- **Zod 4 import**: `import { z } from "zod"` (stable) or `import * as z from "zod"`

---

## Reference: Drizzle Native vs Custom SQL

This research-backed matrix will be included in the doc:

- **Native Drizzle API** (full migration support): `pgSchema`, `pgTable`, `pgTable.withRLS`, `primaryKey`, `foreignKey`, `.references()`, `index`, `uniqueIndex`, `unique`, `check`, `.notNull()`, `.default()`, `.generatedAlwaysAsIdentity()`, `pgEnum`, `pgView`, `pgMaterializedView`, `pgSequence`, `pgPolicy`, `pgRole`, `relations`, `vector`, `geometry`
- **Custom SQL required** (append to generated migrations): triggers, table partitioning, stored functions/procedures, exclusion constraints, indexes on materialized views, custom operator classes

---

## Files Touched

- **Full rewrite**: [docs/architecture/01-db-first-guideline.md](docs/architecture/01-db-first-guideline.md)
- **Minor update**: [docs/architecture/00-overview.md](docs/architecture/00-overview.md)

