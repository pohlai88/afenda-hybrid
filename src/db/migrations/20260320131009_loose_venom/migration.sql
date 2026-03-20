-- Lifecycle CHECKs + indexes for talent.performance_reviews.
-- Preflight (row counts): docs/preflight-performance-reviews-lifecycle.sql
-- Gate: pnpm check:reviews-lifecycle-preflight
CREATE INDEX "idx_performance_reviews_period_end_active" ON "talent"."performance_reviews" ("tenantId","reviewPeriodEnd") WHERE "deletedAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_performance_reviews_completed_reporting" ON "talent"."performance_reviews" ("tenantId","employeeId") WHERE "deletedAt" IS NULL AND "status" = 'COMPLETED'::"talent"."review_status";--> statement-breakpoint
ALTER TABLE "talent"."performance_reviews" ADD CONSTRAINT "chk_performance_reviews_completed_date_vs_status" CHECK ("completedDate" IS NULL OR "status"::text IN ('COMPLETED', 'ACKNOWLEDGED'));--> statement-breakpoint
ALTER TABLE "talent"."performance_reviews" ADD CONSTRAINT "chk_performance_reviews_acknowledged_date_vs_status" CHECK ("acknowledgedDate" IS NULL OR "status"::text = 'ACKNOWLEDGED');--> statement-breakpoint
ALTER TABLE "talent"."performance_reviews" ADD CONSTRAINT "chk_performance_reviews_terminal_outcomes_vs_status" CHECK (("finalRating" IS NULL OR "status"::text IN ('COMPLETED', 'ACKNOWLEDGED')) AND
          ("overallScore" IS NULL OR "status"::text IN ('COMPLETED', 'ACKNOWLEDGED')));