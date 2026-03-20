-- Align talent.competency_skills with Drizzle schema (tenant + audit + indexes)
-- Create talent.performance_review_goals (was missing from baseline migration)

DROP INDEX IF EXISTS "talent"."uq_competency_skills_framework_skill";
--> statement-breakpoint

DROP INDEX IF EXISTS "talent"."idx_competency_skills_framework";
--> statement-breakpoint

DROP INDEX IF EXISTS "talent"."idx_competency_skills_skill";
--> statement-breakpoint

ALTER TABLE "talent"."competency_skills" DROP CONSTRAINT IF EXISTS "fk_competency_skills_framework";
--> statement-breakpoint

ALTER TABLE "talent"."competency_skills" DROP CONSTRAINT IF EXISTS "fk_competency_skills_skill";
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'talent'
      AND table_name = 'competency_skills'
      AND column_name = 'tenantId'
  ) THEN
    ALTER TABLE "talent"."competency_skills" ADD COLUMN "tenantId" integer;
  END IF;
END $$;
--> statement-breakpoint

UPDATE "talent"."competency_skills" AS cs
SET "tenantId" = cf."tenantId"
FROM "talent"."competency_frameworks" AS cf
WHERE cs."frameworkId" = cf."frameworkId"
  AND cs."tenantId" IS NULL;
--> statement-breakpoint

ALTER TABLE "talent"."competency_skills" ALTER COLUMN "tenantId" SET NOT NULL;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'talent'
      AND table_name = 'competency_skills'
      AND column_name = 'createdBy'
  ) THEN
    ALTER TABLE "talent"."competency_skills" ADD COLUMN "createdBy" integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'talent'
      AND table_name = 'competency_skills'
      AND column_name = 'updatedBy'
  ) THEN
    ALTER TABLE "talent"."competency_skills" ADD COLUMN "updatedBy" integer;
  END IF;
END $$;
--> statement-breakpoint

UPDATE "talent"."competency_skills"
SET "createdBy" = 1, "updatedBy" = 1
WHERE "createdBy" IS NULL OR "updatedBy" IS NULL;
--> statement-breakpoint

ALTER TABLE "talent"."competency_skills" ALTER COLUMN "createdBy" SET NOT NULL;
--> statement-breakpoint

ALTER TABLE "talent"."competency_skills" ALTER COLUMN "updatedBy" SET NOT NULL;
--> statement-breakpoint

ALTER TABLE "talent"."competency_skills" DROP COLUMN IF EXISTS "isRequired";
--> statement-breakpoint

ALTER TABLE "talent"."competency_skills" ALTER COLUMN "requiredLevel" DROP DEFAULT;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_competency_skills_tenant'
      AND connamespace = 'talent'::regnamespace
  ) THEN
    ALTER TABLE "talent"."competency_skills"
      ADD CONSTRAINT "fk_competency_skills_tenant"
      FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
--> statement-breakpoint

ALTER TABLE "talent"."competency_skills"
  ADD CONSTRAINT "fk_competency_skills_framework"
  FOREIGN KEY ("frameworkId") REFERENCES "talent"."competency_frameworks"("frameworkId")
  ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint

ALTER TABLE "talent"."competency_skills"
  ADD CONSTRAINT "fk_competency_skills_skill"
  FOREIGN KEY ("skillId") REFERENCES "talent"."skills"("skillId")
  ON DELETE RESTRICT ON UPDATE CASCADE;
--> statement-breakpoint

CREATE INDEX "idx_competency_skills_framework"
  ON "talent"."competency_skills" ("tenantId", "frameworkId");
--> statement-breakpoint

CREATE INDEX "idx_competency_skills_skill"
  ON "talent"."competency_skills" ("tenantId", "skillId");
--> statement-breakpoint

CREATE UNIQUE INDEX "uq_competency_skills_framework_skill"
  ON "talent"."competency_skills" ("tenantId", "frameworkId", "skillId")
  WHERE "deletedAt" IS NULL;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "talent"."performance_review_goals" (
	"reviewGoalId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "talent"."performance_review_goals_reviewGoalId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenantId" integer NOT NULL,
	"reviewId" integer NOT NULL,
	"goalId" integer NOT NULL,
	"goalTitleSnapshot" text NOT NULL,
	"goalWeightSnapshot" numeric(5, 2),
	"goalTargetSnapshot" text,
	"goalDueDateSnapshot" date,
	"managerScore" numeric(5, 2),
	"employeeScore" numeric(5, 2),
	"finalScore" numeric(5, 2),
	"comment" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "chk_performance_review_goals_scores" CHECK (("managerScore" IS NULL OR ("managerScore" >= 0 AND "managerScore" <= 5)) AND
          ("employeeScore" IS NULL OR ("employeeScore" >= 0 AND "employeeScore" <= 5)) AND
          ("finalScore" IS NULL OR ("finalScore" >= 0 AND "finalScore" <= 5)))
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_performance_review_goals_tenant"
  ON "talent"."performance_review_goals" ("tenantId");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_performance_review_goals_review"
  ON "talent"."performance_review_goals" ("tenantId", "reviewId");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_performance_review_goals_goal"
  ON "talent"."performance_review_goals" ("tenantId", "goalId");
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "uq_performance_review_goals_review_goal"
  ON "talent"."performance_review_goals" ("tenantId", "reviewId", "goalId")
  WHERE "deletedAt" IS NULL;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_performance_review_goals_tenant'
      AND connamespace = 'talent'::regnamespace
  ) THEN
    ALTER TABLE "talent"."performance_review_goals"
      ADD CONSTRAINT "fk_performance_review_goals_tenant"
      FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_performance_review_goals_review'
      AND connamespace = 'talent'::regnamespace
  ) THEN
    ALTER TABLE "talent"."performance_review_goals"
      ADD CONSTRAINT "fk_performance_review_goals_review"
      FOREIGN KEY ("reviewId") REFERENCES "talent"."performance_reviews"("reviewId")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_performance_review_goals_goal'
      AND connamespace = 'talent'::regnamespace
  ) THEN
    ALTER TABLE "talent"."performance_review_goals"
      ADD CONSTRAINT "fk_performance_review_goals_goal"
      FOREIGN KEY ("goalId") REFERENCES "talent"."performance_goals"("goalId")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
