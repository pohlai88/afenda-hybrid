--> statement-breakpoint

-- CUSTOM: Same-tenant parent guard for core.organizations (CSQL-008, CSQL-009)
CREATE OR REPLACE FUNCTION "core"."check_same_tenant_parent"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
DECLARE
  parent_tenant integer;
BEGIN
  IF NEW."parentOrganizationId" IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT o."tenantId" INTO parent_tenant
  FROM "core"."organizations" o
  WHERE o."organizationId" = NEW."parentOrganizationId";

  IF parent_tenant IS NULL THEN
    RAISE EXCEPTION 'parent organization % not found', NEW."parentOrganizationId";
  END IF;

  IF parent_tenant IS DISTINCT FROM NEW."tenantId" THEN
    RAISE EXCEPTION 'cross-tenant parent assignment rejected: parent belongs to tenant %, child tenant %',
      parent_tenant, NEW."tenantId";
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS "trg_organizations_same_tenant_parent" ON "core"."organizations";
CREATE TRIGGER "trg_organizations_same_tenant_parent"
  BEFORE INSERT OR UPDATE OF "parentOrganizationId", "tenantId"
  ON "core"."organizations"
  FOR EACH ROW
  EXECUTE FUNCTION "core"."check_same_tenant_parent"();
