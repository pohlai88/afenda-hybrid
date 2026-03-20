-- ============================================================================
-- CUSTOM: Harden audit.log_change_7w1h() function (CSQL-010)
-- ============================================================================
-- Purpose: Guard against missing createdBy/updatedBy columns and populate rowId
-- Justification: Function needs to work with tables that don't have auditColumns

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
  v_row_id text;
  v_pk_column text;
  v_has_created_by boolean;
  v_has_updated_by boolean;
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

  -- Extract tenant_id and changed_by from the row
  IF TG_OP = 'DELETE' THEN
    v_tenant_id := OLD."tenantId";
    v_changed_by := CASE WHEN v_has_updated_by THEN OLD."updatedBy" ELSE NULL END;
    v_old_data := to_jsonb(OLD);
    v_new_data := NULL;
    
    -- Extract primary key for rowId
    SELECT a.attname INTO v_pk_column
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = (TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME)::regclass
      AND i.indisprimary
    LIMIT 1;
    
    v_row_id := (v_old_data ->> v_pk_column);
    
  ELSIF TG_OP = 'UPDATE' THEN
    v_tenant_id := NEW."tenantId";
    v_changed_by := CASE WHEN v_has_updated_by THEN NEW."updatedBy" ELSE NULL END;
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    
    -- Extract primary key for rowId
    SELECT a.attname INTO v_pk_column
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = (TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME)::regclass
      AND i.indisprimary
    LIMIT 1;
    
    v_row_id := (v_new_data ->> v_pk_column);
    
  ELSIF TG_OP = 'INSERT' THEN
    v_tenant_id := NEW."tenantId";
    v_changed_by := CASE WHEN v_has_created_by THEN NEW."createdBy" ELSE NULL END;
    v_old_data := NULL;
    v_new_data := to_jsonb(NEW);
    
    -- Extract primary key for rowId
    SELECT a.attname INTO v_pk_column
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = (TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME)::regclass
      AND i.indisprimary
    LIMIT 1;
    
    v_row_id := (v_new_data ->> v_pk_column);
  END IF;

  -- Insert audit record
  INSERT INTO audit.audit_trail (
    "tenantId",
    "tableName",
    operation,
    "oldData",
    "newData",
    "changedBy",
    "changedAt",
    "rowId"
  ) VALUES (
    v_tenant_id,
    TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
    TG_OP::audit.audit_operation,
    v_old_data,
    v_new_data,
    v_changed_by,
    now(),
    v_row_id
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
-- CUSTOM: Attach audit triggers to tenant-scoped tables with auditColumns (CSQL-006)
-- ============================================================================
-- Purpose: Enable automatic audit logging for all data changes
-- Justification: Trigger attachments cannot be expressed in Drizzle schema

CREATE TRIGGER trg_audit_organizations
  AFTER INSERT OR UPDATE OR DELETE ON core.organizations
  FOR EACH ROW EXECUTE FUNCTION audit.log_change_7w1h();

--> statement-breakpoint
CREATE TRIGGER trg_audit_locations
  AFTER INSERT OR UPDATE OR DELETE ON core.locations
  FOR EACH ROW EXECUTE FUNCTION audit.log_change_7w1h();

--> statement-breakpoint
CREATE TRIGGER trg_audit_employees
  AFTER INSERT OR UPDATE OR DELETE ON hr.employees
  FOR EACH ROW EXECUTE FUNCTION audit.log_change_7w1h();

--> statement-breakpoint
CREATE TRIGGER trg_audit_users
  AFTER INSERT OR UPDATE OR DELETE ON security.users
  FOR EACH ROW EXECUTE FUNCTION audit.log_change_7w1h();

--> statement-breakpoint
CREATE TRIGGER trg_audit_roles
  AFTER INSERT OR UPDATE OR DELETE ON security.roles
  FOR EACH ROW EXECUTE FUNCTION audit.log_change_7w1h();

--> statement-breakpoint
CREATE TRIGGER trg_audit_service_principals
  AFTER INSERT OR UPDATE OR DELETE ON security.service_principals
  FOR EACH ROW EXECUTE FUNCTION audit.log_change_7w1h();
