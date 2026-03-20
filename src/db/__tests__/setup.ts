/**
 * Test setup file for database integration tests
 * 
 * This file runs before all tests to ensure:
 * 1. Database connection is available
 * 2. Required extensions are installed
 * 3. Migrations are applied
 */

import { beforeAll, afterAll } from "vitest";
import { db } from "../db";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as path from "path";
import * as fs from "fs";

let pool: Pool | null = null;

/**
 * Wait for database to be ready
 */
async function waitForDatabase(maxRetries = 30, delay = 1000): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await db.execute(sql`SELECT 1`);
      return;
    } catch (error) {
      if (i === maxRetries - 1) {
        throw new Error(
          `Database not available after ${maxRetries} retries. ` +
          `Make sure Docker container is running: pnpm docker:test:start\n` +
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/**
 * Ensure required extensions exist (fresh DBs from test:db:recreate have none until this runs).
 */
async function ensureRequiredExtensions(): Promise<void> {
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS btree_gist`);
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

  const extensions = await db.execute(sql`
    SELECT extname FROM pg_extension 
    WHERE extname IN ('btree_gist', 'pgcrypto')
  `);

  const extNames = (extensions.rows as Array<{ extname: string }>).map(
    (r) => r.extname,
  );

  if (!extNames.includes("btree_gist")) {
    throw new Error(
      "Required extension 'btree_gist' is not installed (CREATE EXTENSION failed — need superuser or rds_superuser?)",
    );
  }

  if (!extNames.includes("pgcrypto")) {
    throw new Error(
      "Required extension 'pgcrypto' is not installed (CREATE EXTENSION failed — need superuser or rds_superuser?)",
    );
  }
}

/**
 * Run migrations
 */
async function runMigrations(): Promise<void> {
  const databaseUrl =
    process.env.DATABASE_URL?.trim() ||
    "postgresql://postgres:postgres@localhost:5433/afenda_test";
  process.env.DATABASE_URL = databaseUrl;

  // Create a connection pool for migrations
  pool = new Pool({
    connectionString: databaseUrl,
  });

  // Create a drizzle instance for migrations (needs the pool directly)
  const migrationDb = drizzle({ client: pool });

  // Get migrations path relative to project root
  const migrationsPath = path.join(process.cwd(), "src/db/migrations");
  
  // Check if migrations directory exists
  if (!fs.existsSync(migrationsPath)) {
    console.warn(`⚠️  Migrations directory not found: ${migrationsPath}`);
    console.warn("   Skipping migrations. Run 'pnpm db:generate' first.");
    return;
  }

  try {
    await migrate(migrationDb, { migrationsFolder: migrationsPath });
    console.log("✓ Migrations applied successfully");
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  }
}

beforeAll(async () => {
  console.log("Setting up test database...");
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL || "not set (using default)"}`);
  
  // Wait for database to be ready
  await waitForDatabase();
  console.log("✓ Database connection established");

  // Extensions before migrations (exclusion constraints / crypto may depend on them)
  await ensureRequiredExtensions();
  console.log("✓ Required extensions present");

  // Run migrations
  await runMigrations();
}, 60000); // 60 second timeout for setup

afterAll(async () => {
  // Close connection pool if created
  if (pool) {
    await pool.end();
  }
}, 10000);
