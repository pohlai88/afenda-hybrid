CREATE TYPE "security"."service_principal_status" AS ENUM('ACTIVE', 'INACTIVE', 'REVOKED');--> statement-breakpoint
CREATE TABLE "security"."roles" (
	"roleId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "security"."roles_roleId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"roleCode" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"permissions" jsonb,
	"isSystemRole" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security"."user_roles" (
	"userId" integer NOT NULL,
	"roleId" integer NOT NULL,
	"tenantId" integer NOT NULL,
	"assignedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"assignedBy" integer NOT NULL,
	"expiresAt" timestamp with time zone,
	CONSTRAINT "pk_user_roles" PRIMARY KEY("userId","roleId")
);
--> statement-breakpoint
CREATE TABLE "security"."service_principals" (
	"servicePrincipalId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "security"."service_principals_servicePrincipalId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"clientId" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" "security"."service_principal_status" DEFAULT 'ACTIVE'::"security"."service_principal_status" NOT NULL,
	"lastUsedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "security"."users" DROP CONSTRAINT "users_tenantId_tenants_tenantId_fkey";--> statement-breakpoint
ALTER TABLE "security"."users" ADD COLUMN "createdBy" integer;--> statement-breakpoint
ALTER TABLE "security"."users" ADD COLUMN "updatedBy" integer;--> statement-breakpoint
UPDATE "security"."users" SET "createdBy" = "userId", "updatedBy" = "userId" WHERE "createdBy" IS NULL;--> statement-breakpoint
ALTER TABLE "security"."users" ALTER COLUMN "createdBy" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "security"."users" ALTER COLUMN "updatedBy" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_users_email" ON "security"."users" ("tenantId",lower("email")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_roles_tenant" ON "security"."roles" ("tenantId");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_roles_code" ON "security"."roles" ("tenantId",lower("roleCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_user_roles_tenant" ON "security"."user_roles" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_user_roles_user" ON "security"."user_roles" ("tenantId","userId");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_user_roles_assignment" ON "security"."user_roles" ("tenantId","userId","roleId");--> statement-breakpoint
CREATE INDEX "idx_service_principals_tenant" ON "security"."service_principals" ("tenantId");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_service_principals_client_id" ON "security"."service_principals" ("clientId") WHERE "deletedAt" IS NULL;--> statement-breakpoint
ALTER TABLE "security"."roles" ADD CONSTRAINT "fk_roles_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "security"."user_roles" ADD CONSTRAINT "fk_user_roles_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "security"."user_roles" ADD CONSTRAINT "fk_user_roles_user" FOREIGN KEY ("userId") REFERENCES "security"."users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "security"."user_roles" ADD CONSTRAINT "fk_user_roles_role" FOREIGN KEY ("roleId") REFERENCES "security"."roles"("roleId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "security"."user_roles" ADD CONSTRAINT "fk_user_roles_assigned_by" FOREIGN KEY ("assignedBy") REFERENCES "security"."users"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "security"."service_principals" ADD CONSTRAINT "fk_service_principals_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "security"."users" DROP CONSTRAINT "fk_users_tenant", ADD CONSTRAINT "fk_users_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;