/**
 * Test Migration Script
 * 
 * Attempts to run the migration and capture the actual error message.
 */

import { config } from "dotenv";
import { Client } from "pg";
import * as fs from "fs";
import * as path from "path";

config();

async function testMigration(): Promise<void> {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("✅ Connected to database\n");

    // Read the migration file
    const migrationFile = path.join(
      process.cwd(),
      "src/db/migrations/20260320002149_wild_taskmaster/migration.sql"
    );

    if (!fs.existsSync(migrationFile)) {
      console.error(`❌ Migration file not found: ${migrationFile}`);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationFile, "utf-8");

    // Split by statement breakpoints
    const statements = migrationSQL
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`📄 Found ${statements.length} statements in migration\n`);

    // Try to execute each statement and see where it fails
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const statementNum = i + 1;

      // Skip empty statements
      if (!statement || statement.trim().length === 0) {
        continue;
      }

      // Show progress for every 100 statements
      if (statementNum % 100 === 0) {
        console.log(`⏳ Processing statement ${statementNum}/${statements.length}...`);
      }

      try {
        await client.query(statement);
      } catch (error) {
        console.error(`\n❌ ERROR at statement ${statementNum}/${statements.length}\n`);
        console.error("Statement preview (first 200 chars):");
        console.error(statement.substring(0, 200) + "...\n");
        console.error("Full error:");
        if (error instanceof Error) {
          console.error(error.message);
          if ("code" in error) {
            console.error(`Error code: ${error.code}`);
          }
          if ("position" in error) {
            console.error(`Position: ${error.position}`);
          }
        } else {
          console.error(String(error));
        }
        process.exit(1);
      }
    }

    console.log("\n✅ All statements executed successfully!");
  } catch (error) {
    console.error("\n❌ Connection or execution error:");
    if (error instanceof Error) {
      console.error(error.message);
      console.error(error.stack);
    } else {
      console.error(String(error));
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

testMigration().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
