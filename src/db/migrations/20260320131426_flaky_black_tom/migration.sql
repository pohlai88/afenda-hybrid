-- promotion_records: approval CHECK, reporting indexes, unique (tenant, employee, effectiveDate).
-- Preflight: docs/preflight-promotion-records-approval.sql | pnpm check:promotion-records-preflight
CREATE INDEX "idx_promotion_records_approved_at" ON "talent"."promotion_records" ("tenantId","approvedAt");--> statement-breakpoint
CREATE INDEX "idx_promotion_records_approved_reporting" ON "talent"."promotion_records" ("tenantId","employeeId") WHERE "deletedAt" IS NULL AND "status" = 'APPROVED'::"talent"."promotion_status";--> statement-breakpoint
CREATE INDEX "idx_promotion_records_completed_reporting" ON "talent"."promotion_records" ("tenantId","employeeId","effectiveDate") WHERE "deletedAt" IS NULL AND "status" = 'COMPLETED'::"talent"."promotion_status";--> statement-breakpoint
CREATE UNIQUE INDEX "uq_promotion_records_employee_effective" ON "talent"."promotion_records" ("tenantId","employeeId","effectiveDate") WHERE "deletedAt" IS NULL;--> statement-breakpoint
ALTER TABLE "talent"."promotion_records" ADD CONSTRAINT "chk_promotion_records_approval_consistency" CHECK ((("approvedBy" IS NULL) = ("approvedAt" IS NULL)) AND
          ("status"::text NOT IN ('APPROVED', 'COMPLETED') OR ("approvedBy" IS NOT NULL AND "approvedAt" IS NOT NULL)));