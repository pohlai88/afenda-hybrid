ALTER TABLE "hr"."contact_methods" ALTER COLUMN "verifiedAt" SET DATA TYPE timestamp with time zone USING (
  CASE
    WHEN "verifiedAt" IS NULL OR btrim("verifiedAt") = '' THEN NULL
    ELSE "verifiedAt"::timestamp with time zone
  END
);--> statement-breakpoint
ALTER TABLE "hr"."timesheets" ALTER COLUMN "approvedAt" SET DATA TYPE timestamp with time zone USING "approvedAt"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "hr"."overtime_records" ALTER COLUMN "approvedAt" SET DATA TYPE timestamp with time zone USING "approvedAt"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "hr"."shift_swaps" ALTER COLUMN "approvedAt" SET DATA TYPE timestamp with time zone USING "approvedAt"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "hr"."employee_declarations" ALTER COLUMN "submittedAt" SET DATA TYPE timestamp with time zone USING "submittedAt"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "hr"."employee_declarations" ALTER COLUMN "verifiedAt" SET DATA TYPE timestamp with time zone USING "verifiedAt"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payroll"."loan_records" ALTER COLUMN "approvedAt" SET DATA TYPE timestamp with time zone USING "approvedAt"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "talent"."promotion_records" ALTER COLUMN "approvedAt" SET DATA TYPE timestamp with time zone USING "approvedAt"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "learning"."training_enrollments" ALTER COLUMN "approvedAt" SET DATA TYPE timestamp with time zone USING "approvedAt"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "recruitment"."job_requisitions" ALTER COLUMN "approvedAt" SET DATA TYPE timestamp with time zone USING "approvedAt"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "recruitment"."offer_letters" ALTER COLUMN "approvedAt" SET DATA TYPE timestamp with time zone USING "approvedAt"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "recruitment"."offer_letters" ALTER COLUMN "sentAt" SET DATA TYPE timestamp with time zone USING "sentAt"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "recruitment"."offer_letters" ALTER COLUMN "respondedAt" SET DATA TYPE timestamp with time zone USING "respondedAt"::timestamp with time zone;--> statement-breakpoint
DROP INDEX "talent"."idx_performance_reviews_completed_reporting";--> statement-breakpoint
CREATE INDEX "idx_performance_reviews_completed_reporting" ON "talent"."performance_reviews" ("tenantId","employeeId") WHERE "deletedAt" IS NULL AND "status" = 'COMPLETED'::"talent"."review_status";--> statement-breakpoint
DROP INDEX "talent"."idx_promotion_records_approved_reporting";--> statement-breakpoint
CREATE INDEX "idx_promotion_records_approved_reporting" ON "talent"."promotion_records" ("tenantId","employeeId") WHERE "deletedAt" IS NULL AND "status" = 'APPROVED'::"talent"."promotion_status";--> statement-breakpoint
DROP INDEX "talent"."idx_promotion_records_completed_reporting";--> statement-breakpoint
CREATE INDEX "idx_promotion_records_completed_reporting" ON "talent"."promotion_records" ("tenantId","employeeId","effectiveDate") WHERE "deletedAt" IS NULL AND "status" = 'COMPLETED'::"talent"."promotion_status";--> statement-breakpoint
DROP INDEX "talent"."idx_grievance_records_resolved_reporting";--> statement-breakpoint
CREATE INDEX "idx_grievance_records_resolved_reporting" ON "talent"."grievance_records" ("tenantId","resolvedDate") WHERE "deletedAt" IS NULL AND "status" = 'RESOLVED'::"talent"."grievance_status";--> statement-breakpoint
DROP INDEX "learning"."idx_training_enrollments_completed_reporting";--> statement-breakpoint
CREATE INDEX "idx_training_enrollments_completed_reporting" ON "learning"."training_enrollments" ("tenantId","completionDate") WHERE "deletedAt" IS NULL AND "status" = 'COMPLETED'::"learning"."training_enrollment_status";--> statement-breakpoint
