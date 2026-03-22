DROP TRIGGER IF EXISTS "trg_sync_employee_skill_proficiency" ON "talent"."employee_skills";
--> statement-breakpoint

DROP FUNCTION IF EXISTS "talent"."sync_employee_skill_proficiency"();
--> statement-breakpoint

DROP INDEX IF EXISTS "talent"."idx_employee_skills_level";
--> statement-breakpoint

ALTER TABLE "talent"."employee_skills"
  DROP COLUMN IF EXISTS "proficiencyLevel";
