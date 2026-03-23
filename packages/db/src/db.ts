import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema-platform";
import { coreRelations } from "./schema-platform/core/_relations";
import { securityRelations } from "./schema-platform/security/_relations";
import { auditRelations } from "./schema-platform/audit/_relations";
import { hrRelations } from "./schema-hrm/hr/_relations";
import { payrollRelations } from "./schema-hrm/payroll/_relations";
import { benefitsRelations } from "./schema-hrm/benefits/_relations";
import { talentRelations } from "./schema-hrm/talent/_relations";
import { learningRelations } from "./schema-hrm/learning/_relations";
import { recruitmentRelations } from "./schema-hrm/recruitment/_relations";

/** Same default as `vitest.config.ts` (Docker test Postgres on port 5433). */
const DEFAULT_LOCAL_TEST_DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/afenda_test";

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
  /**
   * Next.js `next build` imports server modules that reference `db` before runtime env is set.
   * Drizzle does not open a socket until a query runs; a syntactically valid URL is enough for build.
   */
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return "postgresql://127.0.0.1:5432/afenda_next_build_placeholder";
  }
  throw new Error(
    "DATABASE_URL is not set. Define it in .env or the environment (not required under Vitest — a local test default is applied)."
  );
}

// Migrations use quoted camelCase identifiers (e.g. "tenantId"); match that at runtime.
// Relational `db.query.*` needs merged `defineRelations` outputs (Drizzle 1.0). Shared keys
// (e.g. `tenants`, `employees`, `currencies`) must not be overwritten by a later spread unless
// intentionally reconciled — payroll tables are disjoint from benefits/security table keys.
//
// All 9 relation sets are merged here to enable relational queries across all modules:
// - Platform: core, security, audit
// - HRM: hr, payroll, benefits, talent, learning, recruitment
const allRelations = {
  ...coreRelations,
  ...securityRelations,
  ...auditRelations,
  ...hrRelations,
  ...payrollRelations,
  ...benefitsRelations,
  ...talentRelations,
  ...learningRelations,
  ...recruitmentRelations,
};

const _db = drizzle(resolveDatabaseUrl(), {
  schema,
  relations: allRelations,
  casing: "camelCase",
});

export const db: typeof _db = _db;

export type Database = typeof db;
