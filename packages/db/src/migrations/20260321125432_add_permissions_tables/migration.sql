CREATE TABLE "security"."permissions" (
	"permissionId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "security"."permissions_permissionId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"resource" text NOT NULL,
	"action" text NOT NULL,
	"key" text NOT NULL,
	"description" text,
	"isSystemPermission" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security"."role_permissions" (
	"rolePermissionId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "security"."role_permissions_rolePermissionId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"roleId" integer NOT NULL,
	"permissionId" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security"."user_permissions" (
	"userPermissionId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "security"."user_permissions_userPermissionId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"userId" integer NOT NULL,
	"permissionId" integer NOT NULL,
	"reason" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_permissions_tenant" ON "security"."permissions" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_permissions_resource" ON "security"."permissions" ("tenantId","resource");--> statement-breakpoint
CREATE INDEX "idx_permissions_key" ON "security"."permissions" ("tenantId","key");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_permissions_key" ON "security"."permissions" ("tenantId",lower("key")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_role_permissions_tenant" ON "security"."role_permissions" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_role_permissions_role" ON "security"."role_permissions" ("tenantId","roleId");--> statement-breakpoint
CREATE INDEX "idx_role_permissions_permission" ON "security"."role_permissions" ("tenantId","permissionId");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_role_permissions" ON "security"."role_permissions" ("tenantId","roleId","permissionId");--> statement-breakpoint
CREATE INDEX "idx_user_permissions_tenant" ON "security"."user_permissions" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_user_permissions_user" ON "security"."user_permissions" ("tenantId","userId");--> statement-breakpoint
CREATE INDEX "idx_user_permissions_permission" ON "security"."user_permissions" ("tenantId","permissionId");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_user_permissions" ON "security"."user_permissions" ("tenantId","userId","permissionId");--> statement-breakpoint
ALTER TABLE "security"."permissions" ADD CONSTRAINT "fk_permissions_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "security"."role_permissions" ADD CONSTRAINT "fk_role_permissions_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "security"."role_permissions" ADD CONSTRAINT "fk_role_permissions_role" FOREIGN KEY ("roleId") REFERENCES "security"."roles"("roleId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "security"."role_permissions" ADD CONSTRAINT "fk_role_permissions_permission" FOREIGN KEY ("permissionId") REFERENCES "security"."permissions"("permissionId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "security"."user_permissions" ADD CONSTRAINT "fk_user_permissions_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "security"."user_permissions" ADD CONSTRAINT "fk_user_permissions_permission" FOREIGN KEY ("permissionId") REFERENCES "security"."permissions"("permissionId") ON DELETE CASCADE ON UPDATE CASCADE;