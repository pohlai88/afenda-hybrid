-- Grievance resolution: replace partial RESOLVED CHECK with full pairing + status consistency.
-- Preflight: docs/preflight/preflight-grievance-records-resolution.sql | pnpm check:grievance-resolution-preflight
ALTER TABLE "talent"."grievance_records" DROP CONSTRAINT "chk_grievance_records_resolved_complete";--> statement-breakpoint
CREATE INDEX "idx_grievance_records_resolved_reporting" ON "talent"."grievance_records" ("tenantId","resolvedDate") WHERE "deletedAt" IS NULL AND "status" = 'RESOLVED'::"talent"."grievance_status";--> statement-breakpoint
ALTER TABLE "talent"."grievance_records" ADD CONSTRAINT "chk_grievance_records_resolution_consistency" CHECK ((("resolvedBy" IS NULL) = ("resolvedDate" IS NULL)) AND
          ("status"::text != 'RESOLVED' OR ("resolvedBy" IS NOT NULL AND "resolvedDate" IS NOT NULL)) AND
          (("resolvedBy" IS NULL AND "resolvedDate" IS NULL) OR "status"::text = 'RESOLVED'));
