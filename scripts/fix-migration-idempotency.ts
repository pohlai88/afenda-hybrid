/**
 * Fix Migration Idempotency
 * 
 * Makes CREATE TYPE statements idempotent by wrapping them in DO blocks
 * that check if the type exists before creating it.
 */

import * as fs from "fs";
import * as path from "path";

const migrationFile = path.join(
  process.cwd(),
  "src/db/migrations/20260320002149_wild_taskmaster/migration.sql"
);

let content = fs.readFileSync(migrationFile, "utf-8");

// Replace CREATE TYPE statements with idempotent versions
// Pattern: CREATE TYPE "schema"."type_name" AS ENUM(...);
const createTypeRegex = /CREATE TYPE "([^"]+)"\.\"([^"]+)" AS ENUM\(([^)]+)\);/g;

content = content.replace(createTypeRegex, (match, schema, typeName, enumValues) => {
  return `DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${typeName}' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = '${schema}')) THEN
    CREATE TYPE "${schema}"."${typeName}" AS ENUM(${enumValues});
  END IF;
END $$;--> statement-breakpoint`;
});

// Replace ALTER TYPE ADD VALUE statements with idempotent versions
// Pattern: ALTER TYPE "schema"."type_name" ADD VALUE 'value';
const alterTypeRegex = /ALTER TYPE "([^"]+)"\.\"([^"]+)" ADD VALUE '([^']+)'(\s+BEFORE\s+'([^']+)')?;/g;

content = content.replace(alterTypeRegex, (match, schema, typeName, newValue, beforeClause, beforeValue) => {
  const beforePart = beforeClause ? ` BEFORE '${beforeValue}'` : '';
  return `DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = '${newValue}' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = '${typeName}' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = '${schema}'))
  ) THEN
    ALTER TYPE "${schema}"."${typeName}" ADD VALUE '${newValue}'${beforePart};
  END IF;
END $$;--> statement-breakpoint`;
});

// Also handle CREATE TABLE statements that might already exist
// But we'll be more careful here - only fix the ones that are definitely problematic

fs.writeFileSync(migrationFile, content, "utf-8");
console.log("✅ Migration file updated to be idempotent");
