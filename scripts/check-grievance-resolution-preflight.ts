/**
 * Preflight: grievance_records resolution CHECK (pairing + RESOLVED iff both set).
 *
 *   DATABASE_URL=... pnpm check:grievance-resolution-preflight
 *
 * SKIP_GRIEVANCE_RESOLUTION_PREFLIGHT=1 — exit 0 when job has no DB.
 *
 * @see docs/preflight-grievance-records-resolution.sql
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
  if (process.env.SKIP_GRIEVANCE_RESOLUTION_PREFLIGHT === "1") {
    console.log(
      "check-grievance-resolution-preflight: SKIP_GRIEVANCE_RESOLUTION_PREFLIGHT=1 — skipping.",
    );
    process.exit(0);
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error(
      "check-grievance-resolution-preflight: DATABASE_URL not set (or SKIP_GRIEVANCE_RESOLUTION_PREFLIGHT=1).",
    );
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const res = await client.query<{ c: string }>(`
      SELECT COUNT(*)::text AS c
      FROM "talent"."grievance_records" g
      WHERE NOT (
        (g."resolvedBy" IS NULL = (g."resolvedDate" IS NULL))
        AND (
          g."status"::text != 'RESOLVED'
          OR (g."resolvedBy" IS NOT NULL AND g."resolvedDate" IS NOT NULL)
        )
        AND (
          (g."resolvedBy" IS NULL AND g."resolvedDate" IS NULL)
          OR g."status"::text = 'RESOLVED'
        )
      )
    `);

    const count = Number.parseInt(res.rows[0]?.c ?? "0", 10);
    console.log(`check-grievance-resolution-preflight: resolution_violations=${count}`);

    if (count > 0) {
      console.error(
        "Grievance resolution preflight failed. See docs/preflight-grievance-records-resolution.sql",
      );
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
