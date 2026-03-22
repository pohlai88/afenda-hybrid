/**
 * Staging / pre-prod gate: fail if data would violate performance_reviews lifecycle CHECKs
 * (completedDate / acknowledgedDate / finalRating / overallScore vs `status`).
 *
 * Usage:
 *   DATABASE_URL=postgresql://... pnpm check:reviews-lifecycle-preflight
 *
 * Skips (exit 0) when SKIP_REVIEWS_LIFECYCLE_PREFLIGHT=1 — use only for jobs without a DB.
 *
 * @see docs/preflight/preflight-performance-reviews-lifecycle.sql
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
  if (process.env.SKIP_REVIEWS_LIFECYCLE_PREFLIGHT === "1") {
    console.log(
      "check-performance-reviews-lifecycle-preflight: SKIP_REVIEWS_LIFECYCLE_PREFLIGHT=1 — skipping (no DB in this job)."
    );
    process.exit(0);
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error(
      "check-performance-reviews-lifecycle-preflight: DATABASE_URL is not set. Set it or use SKIP_REVIEWS_LIFECYCLE_PREFLIGHT=1."
    );
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const completed = await client.query<{ c: string }>(`
      SELECT COUNT(*)::text AS c
      FROM "talent"."performance_reviews" r
      WHERE r."completedDate" IS NOT NULL
        AND r."status" NOT IN (
          'COMPLETED'::"talent"."review_status",
          'ACKNOWLEDGED'::"talent"."review_status"
        )
    `);

    const acknowledged = await client.query<{ c: string }>(`
      SELECT COUNT(*)::text AS c
      FROM "talent"."performance_reviews" r
      WHERE r."acknowledgedDate" IS NOT NULL
        AND r."status" <> 'ACKNOWLEDGED'::"talent"."review_status"
    `);

    const terminalOutcomes = await client.query<{ c: string }>(`
      SELECT COUNT(*)::text AS c
      FROM "talent"."performance_reviews" r
      WHERE (
          r."finalRating" IS NOT NULL
          OR r."overallScore" IS NOT NULL
        )
        AND r."status" NOT IN (
          'COMPLETED'::"talent"."review_status",
          'ACKNOWLEDGED'::"talent"."review_status"
        )
    `);

    const completedCount = Number.parseInt(completed.rows[0]?.c ?? "0", 10);
    const acknowledgedCount = Number.parseInt(acknowledged.rows[0]?.c ?? "0", 10);
    const terminalOutcomesCount = Number.parseInt(terminalOutcomes.rows[0]?.c ?? "0", 10);

    console.log(
      `check-performance-reviews-lifecycle-preflight: completed_date_violations=${completedCount}, acknowledged_date_violations=${acknowledgedCount}, terminal_outcomes_while_non_terminal=${terminalOutcomesCount}`
    );

    if (completedCount > 0 || acknowledgedCount > 0 || terminalOutcomesCount > 0) {
      console.error(
        "Performance reviews lifecycle preflight failed. Remediate using docs/preflight/preflight-performance-reviews-lifecycle.sql then re-run."
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
