import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Prefer values from `.env` over inherited shell/system env so local URLs match the file.
config({ override: true });

/**
 * Migrations require elevated privileges (CREATE POLICY, ALTER TABLE, etc.).
 * Use DATABASE_URL_ADMIN (superuser / owner role) for drizzle-kit operations.
 * Falls back to DATABASE_URL for backward compatibility / simple setups.
 *
 * Runtime application code should use DATABASE_URL (restricted app role subject to RLS).
 */
function resolveMigrationUrl(): string {
  const admin = process.env.DATABASE_URL_ADMIN?.trim();
  if (admin) return admin;
  const app = process.env.DATABASE_URL?.trim();
  if (app) return app;
  throw new Error("DATABASE_URL_ADMIN or DATABASE_URL must be set for migrations");
}

export default defineConfig({
  dialect: "postgresql",
  // Single entry avoids duplicate table/enum registration (glob would also load index.ts barrels).
  schema: "./src/db/schema-platform/index.ts",
  out: "./src/db/migrations",
  schemaFilter: ["core", "security", "audit", "hr", "payroll", "benefits", "talent", "learning", "recruitment"],
  entities: {
    roles: true,
  },
  strict: true,
  verbose: true,
  dbCredentials: {
    url: resolveMigrationUrl(),
  },
});
