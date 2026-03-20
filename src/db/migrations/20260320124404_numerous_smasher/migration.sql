ALTER TABLE "talent"."grievance_records" ALTER COLUMN "description" SET DATA TYPE varchar(4000) USING "description"::varchar(4000);--> statement-breakpoint
ALTER TABLE "talent"."grievance_records" ALTER COLUMN "investigationNotes" SET DATA TYPE varchar(4000) USING "investigationNotes"::varchar(4000);--> statement-breakpoint
ALTER TABLE "talent"."grievance_records" ALTER COLUMN "resolution" SET DATA TYPE varchar(4000) USING "resolution"::varchar(4000);--> statement-breakpoint
CREATE INDEX "idx_grievance_records_incident" ON "talent"."grievance_records" ("tenantId","incidentDate");--> statement-breakpoint
CREATE INDEX "idx_grievance_records_under_investigation" ON "talent"."grievance_records" ("tenantId") WHERE "status" = 'UNDER_INVESTIGATION' AND "deletedAt" IS NULL;--> statement-breakpoint
ALTER TABLE "talent"."grievance_records" ADD CONSTRAINT "chk_grievance_records_resolved_complete" CHECK ("status" != 'RESOLVED' OR ("resolvedBy" IS NOT NULL AND "resolvedDate" IS NOT NULL));