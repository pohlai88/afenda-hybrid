/**
 * Preflight: succession_plans targetDate for ACTIVE/UNDER_REVIEW + unique (tenant, position, successor).
 *
 *   DATABASE_URL=... pnpm check:succession-plans-preflight
 *
 * SKIP_SUCCESSION_PLANS_PREFLIGHT=1 — exit 0 when job has no DB.
 *
 * @see docs/preflight-succession-plans-lifecycle.sql
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
  if (process.env.SKIP_SUCCESSION_PLANS_PREFLIGHT === "1") {
    console.log("check-succession-plans-preflight: SKIP_SUCCESSION_PLANS_PREFLIGHT=1 — skipping.");
    process.exit(0);
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error(
      "check-succession-plans-preflight: DATABASE_URL not set (or SKIP_SUCCESSION_PLANS_PREFLIGHT=1).",
    );
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const missingTarget = await client.query<{ c: string }>(`
      SELECT COUNT(*)::text AS c
      FROM "talent"."succession_plans" s
      WHERE s."status" IN (
          'ACTIVE'::"talent"."succession_plan_status",
          'UNDER_REVIEW'::"talent"."succession_plan_status"
        )
        AND s."targetDate" IS NULL
    `);

    const duplicates = await client.query<{ c: string }>(`
      SELECT COUNT(*)::text AS c
      FROM (
        SELECT 1
        FROM "talent"."succession_plans" s
        WHERE s."deletedAt" IS NULL
        GROUP BY s."tenantId", s."positionId", s."successorId"
        HAVING COUNT(*) > 1
      ) d
    `);

    const longPlan = await client.query<{ c: string }>(`
      SELECT COUNT(*)::text AS c
      FROM "talent"."succession_plans" s
      WHERE s."developmentPlan" IS NOT NULL
        AND length(s."developmentPlan"::text) > 4000
    `);

    const a = Number.parseInt(missingTarget.rows[0]?.c ?? "0", 10);
    const b = Number.parseInt(duplicates.rows[0]?.c ?? "0", 10);
    const c = Number.parseInt(longPlan.rows[0]?.c ?? "0", 10);

    console.log(
      `check-succession-plans-preflight: missing_target_date=${a}, duplicate_position_successor_groups=${b}, development_plan_over_4000_chars=${c}`,
    );

    if (a > 0 || b > 0 || c > 0) {
      console.error(
        "Succession plans preflight failed. See docs/preflight-succession-plans-lifecycle.sql",
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
