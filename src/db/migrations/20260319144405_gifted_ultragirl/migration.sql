CREATE SCHEMA "core";
--> statement-breakpoint
CREATE SCHEMA "security";
--> statement-breakpoint
CREATE SCHEMA "audit";
--> statement-breakpoint
CREATE SCHEMA "hr";
--> statement-breakpoint
CREATE TYPE "core"."tenant_status" AS ENUM('ACTIVE', 'SUSPENDED', 'CLOSED');--> statement-breakpoint
CREATE TYPE "core"."region_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "core"."region_type" AS ENUM('CONTINENT', 'COUNTRY', 'STATE', 'PROVINCE', 'CITY', 'DISTRICT', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "core"."organization_status" AS ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "core"."organization_type" AS ENUM('COMPANY', 'DIVISION', 'DEPARTMENT', 'UNIT', 'TEAM');--> statement-breakpoint
CREATE TYPE "core"."location_status" AS ENUM('ACTIVE', 'INACTIVE', 'CLOSED');--> statement-breakpoint
CREATE TYPE "security"."user_status" AS ENUM('ACTIVE', 'INACTIVE', 'LOCKED', 'PENDING_VERIFICATION');--> statement-breakpoint
CREATE TYPE "audit"."audit_operation" AS ENUM('INSERT', 'UPDATE', 'DELETE');--> statement-breakpoint
CREATE TYPE "hr"."employee_status" AS ENUM('ACTIVE', 'ON_LEAVE', 'TERMINATED', 'PENDING');--> statement-breakpoint
CREATE TABLE "core"."tenants" (
	"tenantId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "core"."tenants_tenantId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantCode" text NOT NULL,
	"name" text NOT NULL,
	"status" "core"."tenant_status" DEFAULT 'ACTIVE'::"core"."tenant_status" NOT NULL,
	"settings" jsonb,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "core"."regions" (
	"regionId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "core"."regions_regionId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"regionCode" text NOT NULL,
	"name" text NOT NULL,
	"parentRegionId" integer,
	"regionType" "core"."region_type" DEFAULT 'COUNTRY'::"core"."region_type" NOT NULL,
	"status" "core"."region_status" DEFAULT 'ACTIVE'::"core"."region_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "core"."organizations" (
	"organizationId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "core"."organizations_organizationId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"orgCode" text NOT NULL,
	"name" text NOT NULL,
	"parentOrganizationId" integer,
	"orgType" "core"."organization_type" DEFAULT 'DEPARTMENT'::"core"."organization_type" NOT NULL,
	"status" "core"."organization_status" DEFAULT 'ACTIVE'::"core"."organization_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."locations" (
	"locationId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "core"."locations_locationId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"locationCode" text NOT NULL,
	"name" text NOT NULL,
	"regionId" integer,
	"address" text,
	"city" text NOT NULL,
	"postalCode" text,
	"latitude" numeric(9,6),
	"longitude" numeric(9,6),
	"status" "core"."location_status" DEFAULT 'ACTIVE'::"core"."location_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_locations_latitude" CHECK ("latitude" IS NULL OR ("latitude" >= -90 AND "latitude" <= 90)),
	CONSTRAINT "chk_locations_longitude" CHECK ("longitude" IS NULL OR ("longitude" >= -180 AND "longitude" <= 180))
);
--> statement-breakpoint
CREATE TABLE "security"."users" (
	"userId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "security"."users_userId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"email" text NOT NULL,
	"displayName" text NOT NULL,
	"status" "security"."user_status" DEFAULT 'PENDING_VERIFICATION'::"security"."user_status" NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "audit"."audit_trail" (
	"auditId" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit"."audit_trail_auditId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"tableName" text NOT NULL,
	"operation" "audit"."audit_operation" NOT NULL,
	"rowId" integer,
	"oldData" jsonb,
	"newData" jsonb,
	"changedBy" integer,
	"changedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr"."employees" (
	"employeeId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hr"."employees_employeeId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeCode" text NOT NULL,
	"firstName" text NOT NULL,
	"lastName" text NOT NULL,
	"email" text NOT NULL,
	"hireDate" date NOT NULL,
	"status" "hr"."employee_status" DEFAULT 'PENDING'::"hr"."employee_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tenants_code" ON "core"."tenants" (lower("tenantCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_tenants_status" ON "core"."tenants" ("status");--> statement-breakpoint
CREATE INDEX "idx_tenants_code" ON "core"."tenants" ("tenantCode");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_regions_code" ON "core"."regions" (lower("regionCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_regions_parent" ON "core"."regions" ("parentRegionId");--> statement-breakpoint
CREATE INDEX "idx_regions_type" ON "core"."regions" ("regionType");--> statement-breakpoint
CREATE INDEX "idx_organizations_tenant" ON "core"."organizations" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_organizations_parent" ON "core"."organizations" ("tenantId","parentOrganizationId");--> statement-breakpoint
CREATE INDEX "idx_organizations_type" ON "core"."organizations" ("tenantId","orgType");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_organizations_code" ON "core"."organizations" ("tenantId",lower("orgCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_locations_tenant" ON "core"."locations" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_locations_region" ON "core"."locations" ("tenantId","regionId");--> statement-breakpoint
CREATE INDEX "idx_locations_city" ON "core"."locations" ("tenantId","city");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_locations_code" ON "core"."locations" ("tenantId",lower("locationCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_users_tenant" ON "security"."users" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "security"."users" ("tenantId","email");--> statement-breakpoint
CREATE INDEX "idx_audit_trail_tenant_date" ON "audit"."audit_trail" ("tenantId","changedAt");--> statement-breakpoint
CREATE INDEX "idx_audit_trail_table" ON "audit"."audit_trail" ("tableName","changedAt");--> statement-breakpoint
CREATE INDEX "idx_employees_tenant" ON "hr"."employees" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_employees_status" ON "hr"."employees" ("tenantId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_employees_code" ON "hr"."employees" ("tenantId","employeeCode") WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_employees_email" ON "hr"."employees" ("tenantId","email") WHERE "deletedAt" IS NULL;--> statement-breakpoint
ALTER TABLE "core"."regions" ADD CONSTRAINT "fk_regions_parent" FOREIGN KEY ("parentRegionId") REFERENCES "core"."regions"("regionId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."organizations" ADD CONSTRAINT "fk_organizations_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."organizations" ADD CONSTRAINT "fk_organizations_parent" FOREIGN KEY ("parentOrganizationId") REFERENCES "core"."organizations"("organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."locations" ADD CONSTRAINT "fk_locations_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."locations" ADD CONSTRAINT "fk_locations_region" FOREIGN KEY ("regionId") REFERENCES "core"."regions"("regionId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "security"."users" ADD CONSTRAINT "users_tenantId_tenants_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId");--> statement-breakpoint
ALTER TABLE "security"."users" ADD CONSTRAINT "fk_users_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId");--> statement-breakpoint
ALTER TABLE "audit"."audit_trail" ADD CONSTRAINT "audit_trail_tenantId_tenants_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId");--> statement-breakpoint
ALTER TABLE "hr"."employees" ADD CONSTRAINT "employees_tenantId_tenants_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId");--> statement-breakpoint
ALTER TABLE "hr"."employees" ADD CONSTRAINT "fk_employees_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId");--> statement-breakpoint
-- CUSTOM: Create tenant isolation trigger function (check_same_tenant_parent) (CSQL-008)
CREATE OR REPLACE FUNCTION "core"."check_same_tenant_parent"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  parent_tenant_id integer;
BEGIN
  IF NEW."parentOrganizationId" IS NULL THEN
    RETURN NEW;
  END IF;
  
  SELECT "tenantId" INTO parent_tenant_id
  FROM "core"."organizations"
  WHERE "organizationId" = NEW."parentOrganizationId";
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parent organization (ID: %) does not exist', NEW."parentOrganizationId"
      USING ERRCODE = 'foreign_key_violation',
            HINT = 'Ensure the parent organization exists before assigning it';
  END IF;
  
  IF parent_tenant_id != NEW."tenantId" THEN
    RAISE EXCEPTION 'Cross-tenant parent assignment rejected: parent organization (ID: %, tenant: %) cannot be parent of organization in tenant %',
      NEW."parentOrganizationId", parent_tenant_id, NEW."tenantId"
      USING ERRCODE = 'check_violation',
            HINT = 'Parent organization must belong to the same tenant',
            DETAIL = format('Attempted to set parent_organization_id=%s (tenant_id=%s) for organization in tenant_id=%s',
                          NEW."parentOrganizationId", parent_tenant_id, NEW."tenantId");
  END IF;
  
  RETURN NEW;
END;
$$;--> statement-breakpoint
-- CUSTOM: Attach tenant isolation trigger to core.organizations table (CSQL-009)
CREATE TRIGGER "trg_organizations_same_tenant_parent"
BEFORE INSERT OR UPDATE OF "parentOrganizationId", "tenantId" ON "core"."organizations"
FOR EACH ROW
EXECUTE PROCEDURE "core"."check_same_tenant_parent"();