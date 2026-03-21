# Audit Schema - Custom SQL Extensions

This document contains PostgreSQL-specific SQL that must be appended to generated migrations.
These features are not natively supported by Drizzle ORM and require manual SQL.

> **Important**: After running `pnpm db:generate`, append the relevant sections below to the
> generated migration file. Mark each block with `-- CUSTOM: <purpose>` per guideline Section 4.13.

---

## 1. Table Partitioning (Range by occurred_at)

Partition the audit_trail table by quarter for scalability and maintenance.
Benefits: Partition pruning, easier archival, parallel maintenance.

```sql
-- CUSTOM: Convert audit_trail to partitioned table (run once during initial setup)
-- Note: This replaces the standard CREATE TABLE from Drizzle

-- Drop the Drizzle-generated table first (if exists)
DROP TABLE IF EXISTS audit.audit_trail;

-- Create partitioned audit trail table
CREATE TABLE audit.audit_trail (
  audit_id bigint GENERATED ALWAYS AS IDENTITY,

  -- WHO
  actor_id integer,
  actor_type audit.actor_type NOT NULL DEFAULT 'USER',

  -- WHAT
  operation audit.audit_operation NOT NULL,
  schema_name text NOT NULL,
  table_name text NOT NULL,
  old_data jsonb,
  new_data jsonb,

  -- WHEN
  occurred_at timestamptz NOT NULL DEFAULT now(),
  recorded_at timestamptz NOT NULL DEFAULT now(),

  -- WHERE
  source_ip inet,
  source_location text,

  -- WHY
  reason text,
  correlation_id uuid,
  request_id uuid,

  -- WHICH
  row_key text,
  affected_columns text[],

  -- WHOM
  target_actor_id integer,

  -- HOW
  client_info jsonb,
  session_id text,

  -- Tenant isolation
  tenant_id integer NOT NULL,

  -- Metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Composite primary key required for partitioning
  PRIMARY KEY (audit_id, occurred_at),

  -- Check constraints
  CONSTRAINT chk_audit_data_ops_have_table
    CHECK (operation NOT IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE') OR table_name IS NOT NULL),
  CONSTRAINT chk_audit_update_has_columns
    CHECK (operation != 'UPDATE' OR affected_columns IS NOT NULL)

) PARTITION BY RANGE (occurred_at);

-- Foreign key (on parent table)
ALTER TABLE audit.audit_trail
  ADD CONSTRAINT fk_audit_trail_tenant
  FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id)
  ON DELETE RESTRICT ON UPDATE CASCADE;
```

---

## 2. Initial Partitions (Quarterly)

Create partitions for the current and upcoming quarters.

```sql
-- CUSTOM: Create initial quarterly partitions

-- 2026 Q1 (Jan-Mar)
CREATE TABLE audit.audit_trail_2026_q1
  PARTITION OF audit.audit_trail
  FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');

-- 2026 Q2 (Apr-Jun)
CREATE TABLE audit.audit_trail_2026_q2
  PARTITION OF audit.audit_trail
  FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');

-- 2026 Q3 (Jul-Sep)
CREATE TABLE audit.audit_trail_2026_q3
  PARTITION OF audit.audit_trail
  FOR VALUES FROM ('2026-07-01') TO ('2026-10-01');

-- 2026 Q4 (Oct-Dec)
CREATE TABLE audit.audit_trail_2026_q4
  PARTITION OF audit.audit_trail
  FOR VALUES FROM ('2026-10-01') TO ('2027-01-01');

-- 2027 Q1 (create ahead for safety)
CREATE TABLE audit.audit_trail_2027_q1
  PARTITION OF audit.audit_trail
  FOR VALUES FROM ('2027-01-01') TO ('2027-04-01');
```

---

## 3. Indexes (BTREE + GIN)

Create indexes on each partition for optimal query performance.

```sql
-- CUSTOM: BTREE indexes for common query patterns (create on parent, inherited by partitions)

CREATE INDEX idx_audit_tenant_occurred ON audit.audit_trail (tenant_id, occurred_at);
CREATE INDEX idx_audit_actor ON audit.audit_trail (tenant_id, actor_id, occurred_at);
CREATE INDEX idx_audit_table ON audit.audit_trail (schema_name, table_name, occurred_at);
CREATE INDEX idx_audit_row_key ON audit.audit_trail (tenant_id, table_name, row_key);
CREATE INDEX idx_audit_correlation ON audit.audit_trail (correlation_id);
CREATE INDEX idx_audit_request ON audit.audit_trail (request_id);
CREATE INDEX idx_audit_session ON audit.audit_trail (tenant_id, session_id, occurred_at);

-- CUSTOM: Partial index for authentication operations (LOGIN/LOGOUT monitoring)
CREATE INDEX idx_audit_auth_ops ON audit.audit_trail (tenant_id, actor_id, occurred_at)
  WHERE operation IN ('LOGIN', 'LOGOUT');

-- CUSTOM: GIN indexes for JSONB containment queries (@> operator)
CREATE INDEX idx_audit_old_data_gin ON audit.audit_trail
  USING gin(old_data jsonb_path_ops);
CREATE INDEX idx_audit_new_data_gin ON audit.audit_trail
  USING gin(new_data jsonb_path_ops);
CREATE INDEX idx_audit_client_info_gin ON audit.audit_trail
  USING gin(client_info jsonb_path_ops);
```

---

## 4. Automated Partition Maintenance

Function to automatically create the next quarter's partition.
Schedule this to run monthly via pg_cron or external scheduler.

```sql
-- CUSTOM: Automated partition creation function

CREATE OR REPLACE FUNCTION audit.create_next_quarter_partition()
RETURNS void AS $$
DECLARE
  next_quarter_start date;
  next_quarter_end date;
  partition_name text;
  year_part text;
  quarter_num int;
BEGIN
  -- Calculate the start of the next quarter (3 months from now)
  next_quarter_start := date_trunc('quarter', now() + interval '3 months');
  next_quarter_end := next_quarter_start + interval '3 months';

  -- Build partition name: audit_trail_YYYY_qN
  year_part := to_char(next_quarter_start, 'YYYY');
  quarter_num := extract(quarter from next_quarter_start)::int;
  partition_name := 'audit_trail_' || year_part || '_q' || quarter_num;

  -- Check if partition already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'audit' AND tablename = partition_name
  ) THEN
    -- Create the partition
    EXECUTE format(
      'CREATE TABLE audit.%I PARTITION OF audit.audit_trail FOR VALUES FROM (%L) TO (%L)',
      partition_name, next_quarter_start, next_quarter_end
    );

    RAISE NOTICE 'Created partition: audit.%', partition_name;
  ELSE
    RAISE NOTICE 'Partition already exists: audit.%', partition_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- CUSTOM: Grant execute to migration role
GRANT EXECUTE ON FUNCTION audit.create_next_quarter_partition() TO migration;

-- Schedule with pg_cron (if available):
-- SELECT cron.schedule('create-audit-partition', '0 0 1 * *', 'SELECT audit.create_next_quarter_partition()');
```

---

## 5. 7W1H Audit Trigger Function

Generic trigger function that can be attached to any table for automatic audit logging.
Uses session variables for context (set by application via `SET LOCAL`).

```sql
-- CUSTOM: 7W1H Audit trigger function (create once, reuse across tables)

CREATE OR REPLACE FUNCTION audit.log_change_7w1h()
RETURNS TRIGGER AS $$
DECLARE
  v_old_data jsonb;
  v_new_data jsonb;
  v_row_key text;
  v_affected_columns text[];
  v_actor_id integer;
  v_actor_type audit.actor_type;
  v_correlation_id uuid;
  v_request_id uuid;
  v_session_id text;
  v_source_ip inet;
  v_client_info jsonb;
  v_reason text;
BEGIN
  -- ═══════════════════════════════════════════════════════════════════════
  -- Extract session context (set by application via SET LOCAL)
  -- ═══════════════════════════════════════════════════════════════════════
  v_actor_id := nullif(current_setting('afenda.user_id', true), '')::integer;
  v_actor_type := coalesce(
    nullif(current_setting('afenda.actor_type', true), '')::audit.actor_type,
    'SYSTEM'
  );
  v_correlation_id := nullif(current_setting('afenda.correlation_id', true), '')::uuid;
  v_request_id := nullif(current_setting('afenda.request_id', true), '')::uuid;
  v_session_id := nullif(current_setting('afenda.session_id', true), '');
  v_source_ip := nullif(current_setting('afenda.source_ip', true), '')::inet;
  v_client_info := nullif(current_setting('afenda.client_info', true), '')::jsonb;
  v_reason := nullif(current_setting('afenda.reason', true), '');

  -- ═══════════════════════════════════════════════════════════════════════
  -- Build WHAT: old/new data and affected columns
  -- ═══════════════════════════════════════════════════════════════════════
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    v_old_data := row_to_json(OLD)::jsonb;
  END IF;

  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    v_new_data := row_to_json(NEW)::jsonb;
  END IF;

  -- For UPDATE, calculate which columns changed
  IF TG_OP = 'UPDATE' THEN
    SELECT array_agg(key) INTO v_affected_columns
    FROM (
      SELECT key FROM jsonb_each(v_old_data)
      EXCEPT
      SELECT key FROM jsonb_each(v_new_data)
      UNION
      SELECT key FROM jsonb_each(v_new_data)
      EXCEPT
      SELECT key FROM jsonb_each(v_old_data)
      UNION
      SELECT o.key FROM jsonb_each(v_old_data) o
      JOIN jsonb_each(v_new_data) n ON o.key = n.key
      WHERE o.value IS DISTINCT FROM n.value
    ) changed_keys;
  END IF;

  -- ═══════════════════════════════════════════════════════════════════════
  -- Build WHICH: row key (primary key value)
  -- ═══════════════════════════════════════════════════════════════════════
  -- Try common PK column names; customize per table if needed
  v_row_key := coalesce(
    (CASE WHEN TG_OP = 'DELETE' THEN v_old_data ELSE v_new_data END)->>'id',
    (CASE WHEN TG_OP = 'DELETE' THEN v_old_data ELSE v_new_data END)->>TG_TABLE_NAME || '_id',
    (CASE WHEN TG_OP = 'DELETE' THEN v_old_data ELSE v_new_data END)->>'tenant_id' || ':' ||
    (CASE WHEN TG_OP = 'DELETE' THEN v_old_data ELSE v_new_data END)->>'id'
  );

  -- ═══════════════════════════════════════════════════════════════════════
  -- Insert audit record
  -- ═══════════════════════════════════════════════════════════════════════
  INSERT INTO audit.audit_trail (
    -- WHO
    actor_id,
    actor_type,
    -- WHAT
    operation,
    schema_name,
    table_name,
    old_data,
    new_data,
    -- WHEN (defaults to now())
    -- WHERE
    source_ip,
    -- WHY
    reason,
    correlation_id,
    request_id,
    -- WHICH
    row_key,
    affected_columns,
    -- HOW
    client_info,
    session_id,
    -- Tenant
    tenant_id
  ) VALUES (
    v_actor_id,
    v_actor_type,
    TG_OP::audit.audit_operation,
    TG_TABLE_SCHEMA,
    TG_TABLE_NAME,
    v_old_data,
    v_new_data,
    v_source_ip,
    v_reason,
    v_correlation_id,
    v_request_id,
    v_row_key,
    v_affected_columns,
    v_client_info,
    v_session_id,
    coalesce(
      (CASE WHEN TG_OP = 'DELETE' THEN v_old_data ELSE v_new_data END)->>'tenant_id',
      current_setting('afenda.tenant_id', true)
    )::integer
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CUSTOM: Grant execute to app role
GRANT EXECUTE ON FUNCTION audit.log_change_7w1h() TO app_write;
```

---

## 6. Attaching Audit Triggers to Tables

Example of attaching the 7W1H audit trigger to a table.

```sql
-- CUSTOM: Attach audit trigger to hr.employees
CREATE TRIGGER trg_employees_audit
  AFTER INSERT OR UPDATE OR DELETE ON hr.employees
  FOR EACH ROW
  EXECUTE FUNCTION audit.log_change_7w1h();

-- CUSTOM: Attach audit trigger to security.users
CREATE TRIGGER trg_users_audit
  AFTER INSERT OR UPDATE OR DELETE ON security.users
  FOR EACH ROW
  EXECUTE FUNCTION audit.log_change_7w1h();

-- Repeat for other tables requiring audit...
```

---

## 7. Session Context Helper (Application Layer)

TypeScript helper for setting session context before database operations.

```typescript
// src/db/_session/setSessionContext.ts
import { sql } from "drizzle-orm";

interface AuditContext {
  userId?: number;
  actorType?: "USER" | "SERVICE_PRINCIPAL" | "SYSTEM" | "ANONYMOUS";
  tenantId: number;
  correlationId?: string;
  requestId?: string;
  sessionId?: string;
  sourceIp?: string;
  clientInfo?: object;
  reason?: string;
}

export async function setAuditContext(
  db: { execute: (query: unknown) => Promise<unknown> },
  ctx: AuditContext
) {
  const settings = [
    ctx.tenantId != null && `SET LOCAL afenda.tenant_id = '${ctx.tenantId}'`,
    ctx.userId != null && `SET LOCAL afenda.user_id = '${ctx.userId}'`,
    ctx.actorType && `SET LOCAL afenda.actor_type = '${ctx.actorType}'`,
    ctx.correlationId && `SET LOCAL afenda.correlation_id = '${ctx.correlationId}'`,
    ctx.requestId && `SET LOCAL afenda.request_id = '${ctx.requestId}'`,
    ctx.sessionId && `SET LOCAL afenda.session_id = '${ctx.sessionId}'`,
    ctx.sourceIp && `SET LOCAL afenda.source_ip = '${ctx.sourceIp}'`,
    ctx.clientInfo && `SET LOCAL afenda.client_info = '${JSON.stringify(ctx.clientInfo)}'`,
    ctx.reason && `SET LOCAL afenda.reason = '${ctx.reason.replace(/'/g, "''")}'`,
  ].filter(Boolean);

  if (settings.length > 0) {
    await db.execute(sql.raw(settings.join("; ")));
  }
}
```

---

## 8. Audit Trail Immutability Enforcement

Prevent updates and deletes on audit_trail to enforce append-only semantics.

```sql
-- CUSTOM: Prevent updates/deletes on audit_trail (immutability enforcement)
CREATE OR REPLACE FUNCTION audit.prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit trail records cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_trail_immutable
  BEFORE UPDATE OR DELETE ON audit.audit_trail
  FOR EACH ROW
  EXECUTE FUNCTION audit.prevent_audit_modification();

-- CUSTOM: Grant execute to app role
GRANT EXECUTE ON FUNCTION audit.prevent_audit_modification() TO app_write;
```

---

## 9. Partition Compression Strategy

Enable compression on older partitions to reduce storage costs for read-only historical data.

```sql
-- CUSTOM: Enable compression on older partitions (PostgreSQL 14+)
-- Run quarterly after partition becomes read-only (e.g., after Q1 ends, compress Q1 of previous year)
-- This reduces storage for historical audit data that is rarely accessed

-- Example: Compress 2025 Q1 partition (run in Q2 2026)
ALTER TABLE audit.audit_trail_2025_q1 SET (
  toast_tuple_target = 128,
  fillfactor = 100
);

-- For TimescaleDB users (if applicable):
-- SELECT compress_chunk('audit.audit_trail_2025_q1');

-- Note: Compression is most effective on partitions that are:
-- 1. Read-only (no new inserts)
-- 2. Older than 1 year
-- 3. Accessed infrequently (reporting/analytics only)
```

---

## 10. Partition Archival (Optional)

Detach and archive old partitions to cold storage.

```sql
-- CUSTOM: Detach old partition for archival
ALTER TABLE audit.audit_trail DETACH PARTITION audit.audit_trail_2025_q1;

-- Export to CSV for S3 upload
COPY audit.audit_trail_2025_q1 TO '/tmp/audit_trail_2025_q1.csv' WITH CSV HEADER;

-- After successful S3 upload, drop the partition
DROP TABLE audit.audit_trail_2025_q1;
```

---

## 11. Polymorphic Actor Reference (Alternative Design)

The current `actorId` column in `audit_trail` is polymorphic (can reference either `users.userId` or `servicePrincipals.servicePrincipalId`). This section documents an alternative approach using a computed column for better query ergonomics without requiring a schema change.

**Current Design**: Single `actorId` column with `actorType` discriminator. Application layer must check `actorType` to determine which table to join.

**Alternative (Less Invasive)**: Add a computed column that provides a normalized reference string for easier querying:

```sql
-- CUSTOM: Add computed actor reference column for polymorphic actorId
-- This provides a normalized reference without changing the existing schema
-- Note: For partitioned tables, adding a column to the parent automatically
-- propagates to all partitions. The computed column will be available on all partitions.
ALTER TABLE audit.audit_trail
  ADD COLUMN actor_ref text
  GENERATED ALWAYS AS (
    CASE actor_type
      WHEN 'USER' THEN 'user:' || actor_id::text
      WHEN 'SERVICE_PRINCIPAL' THEN 'sp:' || actor_id::text
      WHEN 'SYSTEM' THEN 'system'
      WHEN 'ANONYMOUS' THEN 'anonymous'
      ELSE NULL
    END
  ) STORED;

-- CUSTOM: Index for actor reference lookups
-- Use CONCURRENTLY if table already has data (zero-downtime)
CREATE INDEX CONCURRENTLY idx_audit_actor_ref ON audit.audit_trail (actor_ref);

-- Usage example:
-- SELECT * FROM audit.audit_trail WHERE actor_ref = 'user:123';
-- SELECT * FROM audit.audit_trail WHERE actor_ref LIKE 'sp:%';
-- SELECT * FROM audit.audit_trail WHERE actor_ref IN ('system', 'anonymous');
```

**Alternative (More Invasive - Requires Migration)**: Use discriminated union pattern with separate nullable columns and proper FKs. This provides referential integrity at the database level but requires a data migration. See `auditTrail.ts` comments for schema design.

---

## Summary Checklist

After running `pnpm db:generate`, ensure the migration includes:

- [ ] Partitioned table creation (Section 1)
- [ ] Initial quarterly partitions (Section 2)
- [ ] BTREE and GIN indexes (Section 3)
- [ ] Partition maintenance function (Section 4)
- [ ] 7W1H trigger function (Section 5)
- [ ] Trigger attachments for audited tables (Section 6)
- [ ] Immutability enforcement trigger (Section 8)
- [ ] Compression strategy for old partitions (Section 9, optional)
- [ ] Polymorphic actor reference column (Section 11, optional enhancement)

Mark each custom SQL block with `-- CUSTOM: <purpose>` for CI compliance.
