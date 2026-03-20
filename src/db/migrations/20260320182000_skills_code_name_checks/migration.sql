-- CUSTOM: Enforce talent.skills skillCode pattern and name/description length (CSQL-012)
-- Idempotent: migration 20260320111648_funny_wild_pack may already attach these constraints.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint c
    INNER JOIN pg_catalog.pg_class r ON c.conrelid = r.oid
    INNER JOIN pg_catalog.pg_namespace n ON r.relnamespace = n.oid
    WHERE n.nspname = 'talent'
      AND r.relname = 'skills'
      AND c.conname = 'chk_skills_skill_code'
  ) THEN
    ALTER TABLE "talent"."skills"
      ADD CONSTRAINT "chk_skills_skill_code"
      CHECK (
        "skillCode" ~ '^[A-Za-z0-9_-]+$'
        AND char_length("skillCode") >= 2
        AND char_length("skillCode") <= 50
      );
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint c
    INNER JOIN pg_catalog.pg_class r ON c.conrelid = r.oid
    INNER JOIN pg_catalog.pg_namespace n ON r.relnamespace = n.oid
    WHERE n.nspname = 'talent'
      AND r.relname = 'skills'
      AND c.conname = 'chk_skills_name_length'
  ) THEN
    ALTER TABLE "talent"."skills"
      ADD CONSTRAINT "chk_skills_name_length"
      CHECK (
        char_length("name") >= 1
        AND char_length("name") <= 200
      );
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint c
    INNER JOIN pg_catalog.pg_class r ON c.conrelid = r.oid
    INNER JOIN pg_catalog.pg_namespace n ON r.relnamespace = n.oid
    WHERE n.nspname = 'talent'
      AND r.relname = 'skills'
      AND c.conname = 'chk_skills_description_length'
  ) THEN
    ALTER TABLE "talent"."skills"
      ADD CONSTRAINT "chk_skills_description_length"
      CHECK (
        "description" IS NULL
        OR char_length("description") <= 1000
      );
  END IF;
END $$;
