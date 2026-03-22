/**
 * Report-only: count `talent.case_links` rows whose (type, id) endpoints do not resolve
 * to a row in `grievance_records` or `disciplinary_actions` for the same tenant.
 *
 *   DATABASE_URL=... pnpm report:case-links-integrity
 *
 * - Prints `case_links_orphan_endpoint_count=<n>` (machine-parseable).
 * - Exit **0** by default.
 * - `CASE_LINKS_ORPHAN_FAIL=1` → exit **1** if count > 0.
 * - `SKIP_CASE_LINKS_INTEGRITY_REPORT=1` → no-op.
 *
 * @see docs/hcm/talent-domain-boundaries.md
 * @see docs/CI_GATES.md
 */

import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";
import { Client } from "pg";

const envTestPath = resolve(process.cwd(), ".env.test");
if (existsSync(envTestPath)) {
  config({ path: envTestPath });
}
config();

async function main(): Promise<void> {
  if (process.env.SKIP_CASE_LINKS_INTEGRITY_REPORT === "1") {
    console.log("report-case-links-integrity: SKIP_CASE_LINKS_INTEGRITY_REPORT=1 — skipping.");
    process.exit(0);
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("report-case-links-integrity: DATABASE_URL not set.");
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const res = await client.query<{ c: string }>(`
      WITH expanded AS (
        SELECT
          cl."tenantId",
          cl."sourceType"::text AS endpoint_type,
          cl."sourceId" AS endpoint_id
        FROM "talent"."case_links" cl
        WHERE cl."deletedAt" IS NULL
        UNION ALL
        SELECT
          cl."tenantId",
          cl."targetType"::text,
          cl."targetId"
        FROM "talent"."case_links" cl
        WHERE cl."deletedAt" IS NULL
      )
      SELECT COUNT(*)::text AS c
      FROM expanded e
      WHERE
        (e.endpoint_type = 'GRIEVANCE' AND NOT EXISTS (
          SELECT 1 FROM "talent"."grievance_records" g
          WHERE g."grievanceRecordId" = e.endpoint_id
            AND g."tenantId" = e."tenantId"
            AND g."deletedAt" IS NULL
        ))
        OR
        (e.endpoint_type = 'DISCIPLINARY' AND NOT EXISTS (
          SELECT 1 FROM "talent"."disciplinary_actions" d
          WHERE d."disciplinaryActionId" = e.endpoint_id
            AND d."tenantId" = e."tenantId"
            AND d."deletedAt" IS NULL
        ))
    `);

    const count = Number.parseInt(res.rows[0]?.c ?? "0", 10);
    console.log(`case_links_orphan_endpoint_count=${count}`);
    console.log(
      `report-case-links-integrity: orphan (type, id, tenant) endpoints on non-deleted case_links: ${count}`
    );

    if (count > 0 && process.env.CASE_LINKS_ORPHAN_FAIL === "1") {
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
