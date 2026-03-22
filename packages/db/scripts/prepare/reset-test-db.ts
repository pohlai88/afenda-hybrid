/**
 * Drops and recreates the Postgres database used by db integration tests,
 * then applies Drizzle migrations from src/migrations.
 *
 * Use when Vitest fails mid-migration (e.g. "relation already exists") or the
 * test schema is in an inconsistent state — faster than restarting Docker when
 * you only need a clean catalog.
 *
 * Safety:
 * - Target DB name must be `afenda_test` unless AFENDA_FORCE_DB_RESET=1.
 * - Connects to the `postgres` maintenance database to run DROP/CREATE.
 *
 * Usage:
 *   pnpm test:db:recreate
 *   # or
 *   pnpm exec tsx scripts/prepare/reset-test-db.ts
 */

import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";
import { Client, Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

const DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/afenda_test";

const envTestPath = resolve(process.cwd(), ".env.test");
if (existsSync(envTestPath)) {
  config({ path: envTestPath });
}
config();

function getDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL?.trim();
  return raw && raw.length > 0 ? raw : DEFAULT_DATABASE_URL;
}

function assertSafeIdentifier(name: string, label: string): void {
  if (!/^[a-z_][a-z0-9_]*$/.test(name)) {
    throw new Error(`${label} must match /^[a-z_][a-z0-9_]*$/ for this script (got: ${name})`);
  }
}

function parseDatabaseName(databaseUrl: string): string {
  let u: URL;
  try {
    u = new URL(databaseUrl);
  } catch {
    throw new Error("Invalid DATABASE_URL (could not parse as URL)");
  }
  const segment = u.pathname.replace(/^\//, "").split("/")[0];
  const name = segment ? decodeURIComponent(segment) : "";
  if (!name) {
    throw new Error("DATABASE_URL must include a database name (path segment)");
  }
  return name;
}

function maintenanceConnectionString(databaseUrl: string, maintenanceDb: string): string {
  const u = new URL(databaseUrl);
  u.pathname = `/${maintenanceDb}`;
  return u.toString();
}

async function recreateDatabase(
  adminUrl: string,
  dbName: string,
  ownerRole: string
): Promise<void> {
  assertSafeIdentifier(dbName, "Database name");
  assertSafeIdentifier(ownerRole, "Owner role");

  const admin = new Client({ connectionString: adminUrl });
  await admin.connect();
  try {
    await admin.query(
      `SELECT pg_terminate_backend(pid)
       FROM pg_stat_activity
       WHERE datname = $1
         AND pid <> pg_backend_pid()`,
      [dbName]
    );

    await admin.query(`DROP DATABASE IF EXISTS ${dbName}`);
    await admin.query(`CREATE DATABASE ${dbName} OWNER ${ownerRole} TEMPLATE template0`);
  } finally {
    await admin.end();
  }
}

async function runMigrations(databaseUrl: string): Promise<void> {
  const migrationsPath = resolve(process.cwd(), "src/migrations");
  if (!existsSync(migrationsPath)) {
    throw new Error(`Migrations directory not found: ${migrationsPath}`);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const client = await pool.connect();
    try {
      await client.query("CREATE EXTENSION IF NOT EXISTS btree_gist");
      await client.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");
    } finally {
      client.release();
    }

    const db = drizzle({ client: pool });
    await migrate(db, { migrationsFolder: migrationsPath });
  } finally {
    await pool.end();
  }
}

async function main(): Promise<void> {
  const databaseUrl = getDatabaseUrl();
  const dbName = parseDatabaseName(databaseUrl);

  const allowed = dbName === "afenda_test" || process.env.AFENDA_FORCE_DB_RESET === "1";
  if (!allowed) {
    console.error(
      `Refusing to reset database "${dbName}". Only "afenda_test" is allowed by default.\n` +
        `Set AFENDA_FORCE_DB_RESET=1 if you use a different dedicated test database name.`
    );
    process.exit(1);
  }

  const u = new URL(databaseUrl);
  const ownerRole = decodeURIComponent(u.username || "postgres");
  assertSafeIdentifier(ownerRole, "Owner role (URL username)");

  const adminUrl = maintenanceConnectionString(databaseUrl, "postgres");

  console.log(`Recreating database "${dbName}"…`);
  await recreateDatabase(adminUrl, dbName, ownerRole);
  console.log(`✓ Database "${dbName}" recreated`);

  console.log("Applying migrations…");
  await runMigrations(databaseUrl);
  console.log("✓ Migrations applied");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
