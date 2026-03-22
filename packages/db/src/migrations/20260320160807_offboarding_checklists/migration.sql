CREATE TYPE "recruitment"."offboarding_task_category" AS ENUM('IT_DEPROVISION', 'ACCESS_REVOCATION', 'ASSET_RETURN', 'PAYROLL', 'BENEFITS', 'STATUTORY_FILING', 'EXIT_INTERVIEW', 'KNOWLEDGE_TRANSFER', 'COMPLIANCE', 'OTHER');--> statement-breakpoint
CREATE TABLE "recruitment"."offboarding_checklists" (
	"offboardingChecklistId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "recruitment"."offboarding_checklists_offboardingChecklistId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"taskName" text NOT NULL,
	"taskCategory" "recruitment"."offboarding_task_category" NOT NULL,
	"description" text,
	"assignedTo" integer,
	"dueDate" date,
	"completedDate" date,
	"sequenceNumber" smallint DEFAULT 1 NOT NULL,
	"status" "recruitment"."onboarding_task_status" DEFAULT 'PENDING'::"recruitment"."onboarding_task_status" NOT NULL,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_offboarding_checklists_sequence" CHECK ("sequenceNumber" >= 1)
);
--> statement-breakpoint
CREATE INDEX "idx_offboarding_checklists_tenant" ON "recruitment"."offboarding_checklists" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_offboarding_checklists_employee" ON "recruitment"."offboarding_checklists" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_offboarding_checklists_category" ON "recruitment"."offboarding_checklists" ("tenantId","taskCategory");--> statement-breakpoint
CREATE INDEX "idx_offboarding_checklists_status" ON "recruitment"."offboarding_checklists" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_offboarding_checklists_assigned" ON "recruitment"."offboarding_checklists" ("tenantId","assignedTo");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_offboarding_checklists_sequence" ON "recruitment"."offboarding_checklists" ("tenantId","employeeId","sequenceNumber") WHERE "deletedAt" IS NULL;--> statement-breakpoint
ALTER TABLE "recruitment"."offboarding_checklists" ADD CONSTRAINT "fk_offboarding_checklists_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;