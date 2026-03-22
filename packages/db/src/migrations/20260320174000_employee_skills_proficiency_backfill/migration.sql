DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_attribute
    WHERE attrelid = 'talent.employee_skills'::regclass
      AND attname = 'proficiency'
      AND NOT attisdropped
  ) THEN
    ALTER TABLE "talent"."employee_skills"
      ADD COLUMN "proficiency" "talent"."proficiency_level";
  END IF;
END $$;
--> statement-breakpoint

-- Backfill from legacy column only when it still exists (e.g. DB never ran 20260320111648_funny_wild_pack)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_attribute
    WHERE attrelid = 'talent.employee_skills'::regclass
      AND attname = 'proficiencyLevel'
      AND NOT attisdropped
  ) THEN
    UPDATE "talent"."employee_skills"
    SET "proficiency" = COALESCE("proficiency", "proficiencyLevel")
    WHERE "proficiency" IS NULL;
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_attribute
    WHERE attrelid = 'talent.employee_skills'::regclass
      AND attname = 'proficiency'
      AND NOT attisdropped
  ) THEN
    ALTER TABLE "talent"."employee_skills"
      ALTER COLUMN "proficiency" SET DEFAULT 'BEGINNER';
    UPDATE "talent"."employee_skills"
    SET "proficiency" = 'BEGINNER'
    WHERE "proficiency" IS NULL;
    ALTER TABLE "talent"."employee_skills"
      ALTER COLUMN "proficiency" SET NOT NULL;
  END IF;
END $$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_employee_skills_proficiency"
  ON "talent"."employee_skills" ("tenantId", "proficiency");
--> statement-breakpoint

-- CUSTOM: Optional sync trigger while legacy proficiencyLevel column exists (CSQL-013)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_attribute
    WHERE attrelid = 'talent.employee_skills'::regclass
      AND attname = 'proficiencyLevel'
      AND NOT attisdropped
  ) THEN
    EXECUTE $create_fn$
CREATE OR REPLACE FUNCTION "talent"."sync_employee_skill_proficiency"()
RETURNS trigger
LANGUAGE plpgsql
AS $func$
BEGIN
  IF NEW."proficiency" IS NULL AND NEW."proficiencyLevel" IS NOT NULL THEN
    NEW."proficiency" := NEW."proficiencyLevel";
  ELSIF NEW."proficiency" IS NOT NULL AND (NEW."proficiencyLevel" IS NULL OR NEW."proficiencyLevel" <> NEW."proficiency") THEN
    NEW."proficiencyLevel" := NEW."proficiency";
  END IF;

  RETURN NEW;
END;
$func$;
$create_fn$;

    EXECUTE $drop_trg$
      DROP TRIGGER IF EXISTS "trg_sync_employee_skill_proficiency" ON "talent"."employee_skills";
    $drop_trg$;

    EXECUTE $create_trg$
      CREATE TRIGGER "trg_sync_employee_skill_proficiency"
      BEFORE INSERT OR UPDATE ON "talent"."employee_skills"
      FOR EACH ROW
      EXECUTE FUNCTION "talent"."sync_employee_skill_proficiency"();
    $create_trg$;
  ELSE
    EXECUTE $drop_trg$
      DROP TRIGGER IF EXISTS "trg_sync_employee_skill_proficiency" ON "talent"."employee_skills";
    $drop_trg$;

    EXECUTE $drop_fn$
      DROP FUNCTION IF EXISTS "talent"."sync_employee_skill_proficiency"();
    $drop_fn$;
  END IF;
END $$;
