-- ============================================================================
-- CUSTOM: Fix audit.log_change_7w1h() column name mismatches (CSQL-011)
-- ============================================================================
-- Purpose: Fix column name mismatches in audit trigger function
-- Issue: Previous migration used incorrect column names:
--   - "changedBy" should be "actorId"
--   - "changedAt" should be "occurredAt"
--   - "rowId" should be "rowKey"
--   - "tableName" was combining schema.table, but schema has separate columns

CREATE OR REPLACE FUNCTION audit.log_change_7w1h()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id integer;
  v_actor_id integer;
  v_old_data jsonb;
  v_new_data jsonb;
  v_row_key text;
  v_pk_column text;
  v_has_created_by boolean;
  v_has_updated_by boolean;
  v_affected_columns text[];
BEGIN
  -- Check if table has createdBy/updatedBy columns
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = TG_TABLE_SCHEMA 
      AND table_name = TG_TABLE_NAME 
      AND column_name = 'createdBy'
  ) INTO v_has_created_by;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = TG_TABLE_SCHEMA 
      AND table_name = TG_TABLE_NAME 
      AND column_name = 'updatedBy'
  ) INTO v_has_updated_by;

  -- Extract tenant_id and actor_id from the row
  IF TG_OP = 'DELETE' THEN
    v_tenant_id := OLD."tenantId";
    v_actor_id := CASE WHEN v_has_updated_by THEN OLD."updatedBy" ELSE NULL END;
    v_old_data := to_jsonb(OLD);
    v_new_data := NULL;
    
    -- Extract primary key for rowKey
    SELECT a.attname INTO v_pk_column
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = (TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME)::regclass
      AND i.indisprimary
    LIMIT 1;
    
    v_row_key := (v_old_data ->> v_pk_column);
    
  ELSIF TG_OP = 'UPDATE' THEN
    v_tenant_id := NEW."tenantId";
    v_actor_id := CASE WHEN v_has_updated_by THEN NEW."updatedBy" ELSE NULL END;
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    
    -- Extract primary key for rowKey
    SELECT a.attname INTO v_pk_column
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = (TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME)::regclass
      AND i.indisprimary
    LIMIT 1;
    
    v_row_key := (v_new_data ->> v_pk_column);
    
    -- Compute affected columns for UPDATE
    SELECT array_agg(key)
    INTO v_affected_columns
    FROM jsonb_each(v_new_data) AS n(key, value)
    WHERE v_old_data ->> key IS DISTINCT FROM v_new_data ->> key;
    
  ELSIF TG_OP = 'INSERT' THEN
    v_tenant_id := NEW."tenantId";
    v_actor_id := CASE WHEN v_has_created_by THEN NEW."createdBy" ELSE NULL END;
    v_old_data := NULL;
    v_new_data := to_jsonb(NEW);
    
    -- Extract primary key for rowKey
    SELECT a.attname INTO v_pk_column
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = (TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME)::regclass
      AND i.indisprimary
    LIMIT 1;
    
    v_row_key := (v_new_data ->> v_pk_column);
  END IF;

  -- Insert audit record with correct column names
  INSERT INTO audit.audit_trail (
    "tenantId",
    "schemaName",
    "tableName",
    operation,
    "oldData",
    "newData",
    "actorId",
    "occurredAt",
    "rowKey",
    "affectedColumns"
  ) VALUES (
    v_tenant_id,
    TG_TABLE_SCHEMA,
    TG_TABLE_NAME,
    TG_OP::audit.audit_operation,
    v_old_data,
    v_new_data,
    v_actor_id,
    now(),
    v_row_key,
    v_affected_columns
  );

  -- Return appropriate value
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;
