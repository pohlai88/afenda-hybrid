-- Succession plans: targetDate required for ACTIVE/UNDER_REVIEW; varchar(4000) developmentPlan;
-- partial indexes; unique active row per (tenant, position, successor).
-- Preflight: docs/preflight-succession-plans-lifecycle.sql | pnpm check:succession-plans-preflight
ALTER TABLE "talent"."succession_plans" ALTER COLUMN "developmentPlan" SET DATA TYPE varchar(4000) USING (
  CASE WHEN "developmentPlan" IS NULL THEN NULL ELSE LEFT("developmentPlan"::text, 4000) END
);--> statement-breakpoint
CREATE INDEX "idx_succession_plans_active_target" ON "talent"."succession_plans" ("tenantId","targetDate") WHERE "deletedAt" IS NULL AND "status" = 'ACTIVE'::"talent"."succession_plan_status";--> statement-breakpoint
CREATE INDEX "idx_succession_plans_archived_reporting" ON "talent"."succession_plans" ("tenantId","positionId") WHERE "deletedAt" IS NULL AND "status" = 'ARCHIVED'::"talent"."succession_plan_status";--> statement-breakpoint
CREATE UNIQUE INDEX "uq_succession_plans_position_successor" ON "talent"."succession_plans" ("tenantId","positionId","successorId") WHERE "deletedAt" IS NULL;--> statement-breakpoint
ALTER TABLE "talent"."succession_plans" ADD CONSTRAINT "chk_succession_plans_target_when_live" CHECK ("status"::text NOT IN ('ACTIVE', 'UNDER_REVIEW') OR "targetDate" IS NOT NULL);
