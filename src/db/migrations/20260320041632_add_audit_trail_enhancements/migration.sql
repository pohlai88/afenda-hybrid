-- Migration: Add Audit Trail Enhancements
-- This migration adds partitioning, GIN indexes, and audit triggers to the audit_trail table
-- All custom SQL blocks are marked with -- CUSTOM: comments and registered in CUSTOM_SQL_REGISTRY.json

-- ============================================================================
-- CUSTOM: Convert audit_trail to partitioned table (CSQL-001)
-- ============================================================================
-- Purpose: Enable quarterly partitioning for scalability and maintenance
-- Justification: Drizzle ORM does not support PARTITION BY RANGE syntax

-- Drop existing table and recreate as partitioned
DROP TABLE IF EXISTS audit.audit_trail CASCADE;

CREATE TABLE audit.audit_trail (
  "auditId" bigint GENERATED ALWAYS AS IDENTITY,
  "tenantId" integer NOT NULL,
  "tableName" text NOT NULL,
  operation audit.audit_operation NOT NULL,
  "rowId" integer,
  "oldData" jsonb,
  "newData" jsonb,
  "changedBy" integer,
  "changedAt" timestamptz NOT NULL DEFAULT now(),
  
  -- Composite primary key required for partitioning
  PRIMARY KEY ("auditId", "changedAt")
  
) PARTITION BY RANGE ("changedAt");

-- Foreign key (on parent table)
ALTER TABLE audit.audit_trail 
  ADD CONSTRAINT audit_trail_tenantId_tenants_tenantId_fkey
  FOREIGN KEY ("tenantId") REFERENCES core.tenants("tenantId")
  ON DELETE RESTRICT ON UPDATE CASCADE;

--> statement-breakpoint
-- ============================================================================
-- CUSTOM: Create initial quarterly partitions (CSQL-002)
-- ============================================================================
-- Purpose: Create partitions for 2026 Q1-Q4 and 2027 Q1
-- Justification: Partition creation requires explicit CREATE TABLE ... PARTITION OF syntax

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

--> statement-breakpoint
-- ============================================================================
-- CUSTOM: Create GIN indexes on JSONB columns (CSQL-003)
-- ============================================================================
-- Purpose: Optimize JSONB containment queries with jsonb_path_ops operator class
-- Justification: Drizzle supports GIN indexes but not jsonb_path_ops operator class

-- BTREE indexes for common query patterns (inherited by partitions)
CREATE INDEX idx_audit_trail_tenant_date ON audit.audit_trail ("tenantId", "changedAt");
CREATE INDEX idx_audit_trail_table ON audit.audit_trail ("tableName", "changedAt");

-- GIN indexes for JSONB containment queries (@> operator)
CREATE INDEX idx_audit_old_data_gin ON audit.audit_trail 
  USING gin("oldData" jsonb_path_ops);
  
CREATE INDEX idx_audit_new_data_gin ON audit.audit_trail 
  USING gin("newData" jsonb_path_ops);

--> statement-breakpoint
-- ============================================================================
-- CUSTOM: Create partition maintenance function (CSQL-004)
-- ============================================================================
-- Purpose: Automate creation of next quarter's partition
-- Justification: Stored procedures cannot be expressed in Drizzle schema language

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

--> statement-breakpoint
-- ============================================================================
-- CUSTOM: Create 7W1H audit trigger function (CSQL-005)
-- ============================================================================
-- Purpose: Automatically log all changes to audited tables with full context
-- Justification: Trigger functions require PL/pgSQL which Drizzle cannot express

CREATE OR REPLACE FUNCTION audit.log_change_7w1h()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id integer;
  v_changed_by integer;
  v_old_data jsonb;
  v_new_data jsonb;
BEGIN
  -- Extract tenant_id from the row (assumes all audited tables have tenantId)
  IF TG_OP = 'DELETE' THEN
    v_tenant_id := OLD."tenantId";
    v_changed_by := OLD."updatedBy";
    v_old_data := to_jsonb(OLD);
    v_new_data := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    v_tenant_id := NEW."tenantId";
    v_changed_by := NEW."updatedBy";
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'INSERT' THEN
    v_tenant_id := NEW."tenantId";
    v_changed_by := NEW."createdBy";
    v_old_data := NULL;
    v_new_data := to_jsonb(NEW);
  END IF;

  -- Insert audit record
  INSERT INTO audit.audit_trail (
    "tenantId",
    "tableName",
    operation,
    "oldData",
    "newData",
    "changedBy",
    "changedAt"
  ) VALUES (
    v_tenant_id,
    TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
    TG_OP::audit.audit_operation,
    v_old_data,
    v_new_data,
    v_changed_by,
    now()
  );

  -- Return appropriate value
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

--> statement-breakpoint
-- ============================================================================
-- CUSTOM: Prevent updates/deletes on audit_trail (CSQL-007)
-- ============================================================================
-- Purpose: Enforce immutability of audit records
-- Justification: Immutability enforcement requires BEFORE UPDATE/DELETE trigger

CREATE OR REPLACE FUNCTION audit.prevent_audit_modification()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Audit trail is immutable. Cannot % records.', TG_OP
    USING ERRCODE = '23506',
          HINT = 'Audit records cannot be modified or deleted';
END;
$$;

CREATE TRIGGER trg_audit_trail_immutable
BEFORE UPDATE OR DELETE ON audit.audit_trail
FOR EACH ROW
EXECUTE FUNCTION audit.prevent_audit_modification();
