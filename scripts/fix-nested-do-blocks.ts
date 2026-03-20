/**
 * Fix Nested DO Blocks in Migration
 * 
 * Removes nested DO blocks that were created by running the idempotency script multiple times.
 */

import * as fs from "fs";
import * as path from "path";

const migrationFile = path.join(
  process.cwd(),
  "src/db/migrations/20260320002149_wild_taskmaster/migration.sql"
);

let content = fs.readFileSync(migrationFile, "utf-8");

// Pattern to match nested DO blocks:
// DO $$ 
// BEGIN
//   IF NOT EXISTS ... THEN
//     DO $$ 
// BEGIN
//   IF NOT EXISTS ... THEN
//     CREATE TYPE ...
//   END IF;
// END $$;
//   END IF;
// END $$;

// Fix nested DO blocks for CREATE TYPE
const nestedDoBlockRegex = /DO \$\$\s+BEGIN\s+IF NOT EXISTS \(SELECT 1 FROM pg_type WHERE typname = '([^']+)' AND typnamespace = \(SELECT oid FROM pg_namespace WHERE nspname = '([^']+)'\)\) THEN\s+DO \$\$\s+BEGIN\s+IF NOT EXISTS \(SELECT 1 FROM pg_type WHERE typname = '\1' AND typnamespace = \(SELECT oid FROM pg_namespace WHERE nspname = '\2'\)\) THEN\s+(CREATE TYPE "[^"]+"\."\1" AS ENUM\([^)]+\);)\s+END IF;\s+END \$\$;--> statement-breakpoint\s+END IF;\s+END \$\$;--> statement-breakpoint/gs;

content = content.replace(nestedDoBlockRegex, (match, typeName, schema, createTypeStmt) => {
  return `DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${typeName}' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = '${schema}')) THEN
    ${createTypeStmt}
  END IF;
END $$;--> statement-breakpoint`;
});

// Also fix any remaining nested patterns with simpler approach - just remove inner DO blocks
// This is a more aggressive fix that looks for the pattern and simplifies it
const simpleNestedPattern = /(\s+DO \$\$\s+BEGIN\s+IF NOT EXISTS[^}]+THEN\s+)DO \$\$\s+BEGIN\s+IF NOT EXISTS[^}]+THEN\s+(CREATE TYPE[^;]+;)\s+END IF;\s+END \$\$;--> statement-breakpoint\s+END IF;\s+END \$\$;--> statement-breakpoint/gs;

content = content.replace(simpleNestedPattern, (match, outerBlock, createStmt) => {
  // Extract the type name and schema from the outer block
  const typeMatch = outerBlock.match(/typname = '([^']+)'/);
  const schemaMatch = outerBlock.match(/nspname = '([^']+)'/);
  if (typeMatch && schemaMatch) {
    return `DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${typeMatch[1]}' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = '${schemaMatch[1]}')) THEN
    ${createStmt}
  END IF;
END $$;--> statement-breakpoint`;
  }
  return match;
});

fs.writeFileSync(migrationFile, content, "utf-8");
console.log("✅ Fixed nested DO blocks in migration file");
