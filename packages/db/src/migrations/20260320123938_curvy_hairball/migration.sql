ALTER TABLE "talent"."goal_tracking" ALTER COLUMN "notes" SET DATA TYPE varchar(1000) USING "notes"::varchar(1000);--> statement-breakpoint
CREATE INDEX "idx_goal_tracking_tracking_date" ON "talent"."goal_tracking" ("trackingDate");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_goal_tracking_goal_date" ON "talent"."goal_tracking" ("goalId","trackingDate");