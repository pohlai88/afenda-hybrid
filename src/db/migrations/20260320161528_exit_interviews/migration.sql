CREATE TYPE "recruitment"."exit_interview_format" AS ENUM('IN_PERSON', 'VIDEO', 'PHONE', 'OTHER');--> statement-breakpoint
CREATE TYPE "recruitment"."exit_interview_status" AS ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'DECLINED', 'CANCELLED', 'NO_SHOW');--> statement-breakpoint
CREATE TABLE "recruitment"."exit_interviews" (
	"exitInterviewId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "recruitment"."exit_interviews_exitInterviewId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"employeeId" integer NOT NULL,
	"conductedByEmployeeId" integer,
	"linkedOffboardingChecklistId" integer,
	"format" "recruitment"."exit_interview_format",
	"scheduledAt" timestamp with time zone,
	"conductedAt" timestamp with time zone,
	"durationMinutes" smallint,
	"status" "recruitment"."exit_interview_status" DEFAULT 'SCHEDULED'::"recruitment"."exit_interview_status" NOT NULL,
	"keyThemes" text,
	"summaryNotes" text,
	"concernsRaised" text,
	"wouldRehire" boolean,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_exit_interviews_duration" CHECK ("durationMinutes" IS NULL OR "durationMinutes" > 0),
	CONSTRAINT "chk_exit_interviews_completed_timing" CHECK ("status" <> 'COMPLETED' OR "conductedAt" IS NOT NULL)
);
--> statement-breakpoint
CREATE INDEX "idx_exit_interviews_tenant" ON "recruitment"."exit_interviews" ("tenantId");--> statement-breakpoint
CREATE INDEX "idx_exit_interviews_employee" ON "recruitment"."exit_interviews" ("tenantId","employeeId");--> statement-breakpoint
CREATE INDEX "idx_exit_interviews_conductor" ON "recruitment"."exit_interviews" ("tenantId","conductedByEmployeeId");--> statement-breakpoint
CREATE INDEX "idx_exit_interviews_status" ON "recruitment"."exit_interviews" ("tenantId","status");--> statement-breakpoint
CREATE INDEX "idx_exit_interviews_scheduled" ON "recruitment"."exit_interviews" ("tenantId","scheduledAt");--> statement-breakpoint
CREATE INDEX "idx_exit_interviews_linked_checklist" ON "recruitment"."exit_interviews" ("tenantId","linkedOffboardingChecklistId");--> statement-breakpoint
ALTER TABLE "recruitment"."exit_interviews" ADD CONSTRAINT "fk_exit_interviews_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "recruitment"."exit_interviews" ADD CONSTRAINT "fk_exit_interviews_offboarding_checklist" FOREIGN KEY ("linkedOffboardingChecklistId") REFERENCES "recruitment"."offboarding_checklists"("offboardingChecklistId") ON DELETE SET NULL ON UPDATE CASCADE;