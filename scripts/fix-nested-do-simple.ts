/**
 * Fix Nested DO Blocks - Simple Approach
 * 
 * Removes nested DO blocks by finding the pattern and simplifying it.
 */

import * as fs from "fs";
import * as path from "path";

const migrationFile = path.join(
  process.cwd(),
  "src/db/migrations/20260320002149_wild_taskmaster/migration.sql"
);

let content = fs.readFileSync(migrationFile, "utf-8");

// Split by statement breakpoints to process each statement individually
const statements = content.split("--> statement-breakpoint");

const fixedStatements: string[] = [];

for (let i = 0; i < statements.length; i++) {
  let statement = statements[i].trim();
  
  // Check if this statement contains nested DO blocks
  // Pattern: DO $$ ... BEGIN ... IF NOT EXISTS ... THEN DO $$ ... BEGIN ... IF NOT EXISTS ... THEN CREATE TYPE ... END IF; END $$; ... END IF; END $$;
  
  // Count DO $$ occurrences
  const doCount = (statement.match(/DO \$\$/g) || []).length;
  
  if (doCount > 1) {
    // This has nested DO blocks, extract the outer structure
    // Find the type name and schema from the first IF NOT EXISTS
    const firstIfMatch = statement.match(/IF NOT EXISTS \(SELECT 1 FROM pg_type WHERE typname = '([^']+)' AND typnamespace = \(SELECT oid FROM pg_namespace WHERE nspname = '([^']+)'\)\)/);
    
    // Find the CREATE TYPE statement
    const createTypeMatch = statement.match(/CREATE TYPE "([^"]+)"\."([^"]+)" AS ENUM\(([^)]+)\);/);
    
    if (firstIfMatch && createTypeMatch) {
      const typeName = firstIfMatch[1];
      const schema = firstIfMatch[2];
      
      // Rebuild the statement without nesting
      statement = `DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${typeName}' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = '${schema}')) THEN
    CREATE TYPE "${schema}"."${typeName}" AS ENUM(${createTypeMatch[3]});
  END IF;
END $$;`;
    }
  }
  
  fixedStatements.push(statement);
}

// Rejoin with statement breakpoints
content = fixedStatements.join("--> statement-breakpoint\n");

fs.writeFileSync(migrationFile, content, "utf-8");
console.log(`✅ Fixed nested DO blocks. Processed ${statements.length} statements.`);
