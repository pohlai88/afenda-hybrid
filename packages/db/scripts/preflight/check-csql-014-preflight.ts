/**
 * Staging / pre-prod gate: fail if data would violate CSQL-014 triggers
 * (performance_review_goals.finalScore vs parent review terminal status).
 *
 * Usage:
 *   DATABASE_URL=postgresql://... pnpm check:csql014-preflight
 *
 * Skips (exit 0) when SKIP_CSQL014_PREFLIGHT=1 — use only for jobs without a DB.
 *
 * @see docs/preflight/preflight-csql-014-review-goal-final-score.sql
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
  if (process.env.SKIP_CSQL014_PREFLIGHT === "1") {
    console.log(
      "check-csql-014-preflight: SKIP_CSQL014_PREFLIGHT=1 — skipping (no DB in this job)."
    );
    process.exit(0);
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error(
      "check-csql-014-preflight: DATABASE_URL is not set. Set it or use SKIP_CSQL014_PREFLIGHT=1."
    );
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const violation = await client.query<{ c: string }>(`
      SELECT COUNT(*)::text AS c
      FROM "talent"."performance_review_goals" g
      INNER JOIN "talent"."performance_reviews" r ON r."reviewId" = g."reviewId"
      WHERE g."finalScore" IS NOT NULL
        AND g."deletedAt" IS NULL
        AND r."status" NOT IN (
          'COMPLETED'::"talent"."review_status",
          'ACKNOWLEDGED'::"talent"."review_status"
        )
    `);

    const orphans = await client.query<{ c: string }>(`
      SELECT COUNT(*)::text AS c
      FROM "talent"."performance_review_goals" g
      LEFT JOIN "talent"."performance_reviews" r ON r."reviewId" = g."reviewId"
      WHERE g."finalScore" IS NOT NULL
        AND g."deletedAt" IS NULL
        AND r."reviewId" IS NULL
    `);

    const violationCount = Number.parseInt(violation.rows[0]?.c ?? "0", 10);
    const orphanCount = Number.parseInt(orphans.rows[0]?.c ?? "0", 10);

    console.log(
      `check-csql-014-preflight: non_terminal_finalScore_violations=${violationCount}, orphans_with_finalScore=${orphanCount}`
    );

    if (violationCount > 0 || orphanCount > 0) {
      console.error(
        "CSQL-014 preflight failed. Remediate using docs/preflight/preflight-csql-014-review-goal-final-score.sql then re-run."
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
