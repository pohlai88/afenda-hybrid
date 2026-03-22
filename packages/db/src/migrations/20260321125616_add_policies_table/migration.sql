CREATE TABLE "security"."policies" (
	"policyId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "security"."policies_policyId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"policyCode" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"resource" text NOT NULL,
	"actions" text[] NOT NULL,
	"roles" text[],
	"effect" text DEFAULT 'allow' NOT NULL,
	"conditions" jsonb DEFAULT '[]' NOT NULL,
	"priority" smallint DEFAULT 0 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_policies_tenant" ON "security"."policies" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_policies_resource" ON "security"."policies" ("tenantId","resource");--> statement-breakpoint
CREATE INDEX "idx_policies_enabled" ON "security"."policies" ("tenantId","enabled");--> statement-breakpoint
CREATE INDEX "idx_policies_priority" ON "security"."policies" ("tenantId","priority");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_policies_code" ON "security"."policies" ("tenantId",lower("policyCode")) WHERE "deletedAt" IS NULL;--> statement-breakpoint
ALTER TABLE "security"."policies" ADD CONSTRAINT "fk_policies_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;