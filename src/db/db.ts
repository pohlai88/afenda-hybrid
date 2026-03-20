import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

/** Same default as vitest.config.ts / vitest.db.config.ts (Docker test Postgres). */
const DEFAULT_LOCAL_TEST_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5433/afenda_test";

/**
 * Resolves connection string. Under Vitest, falls back so `drizzle()` never receives `undefined`
 * (drizzle-orm 1.0 expects a string or `{ connection, ... }`).
 */
function resolveDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL?.trim();
  if (raw) return raw;
  if (process.env.VITEST === "true") {
    process.env.DATABASE_URL = DEFAULT_LOCAL_TEST_DATABASE_URL;
    return DEFAULT_LOCAL_TEST_DATABASE_URL;
  }
  throw new Error(
    "DATABASE_URL is not set. Define it in .env or the environment (not required under Vitest — a local test default is applied).",
  );
}

// Migrations use quoted camelCase identifiers (e.g. "tenantId"); match that at runtime
export const db = drizzle(resolveDatabaseUrl(), {
  schema,
  casing: "camelCase",
});

export type Database = typeof db;
