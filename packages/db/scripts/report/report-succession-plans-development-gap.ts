/**
 * Report-only: count succession plans in ACTIVE / UNDER_REVIEW with empty `developmentPlan`.
 * Use while `chk_succession_plans_development_when_live` is **not** yet enabled — measure data quality.
 *
 *   DATABASE_URL=... pnpm report:succession-plans-development-gap
 *
 * - Prints `succession_plans_live_without_development_plan_count=<n>` (machine-parseable).
 * - Exit **0** by default (safe for nightly “telemetry” jobs).
 * - `SUCCESSION_DEV_PLAN_GAP_FAIL=1` → exit **1** if count > 0 (optional strict mode).
 * - `SKIP_SUCCESSION_DEV_PLAN_GAP_REPORT=1` → no-op, exit 0.
 * - `SUCCESSION_DEV_PLAN_GAP_JSON_LINE=1` → stdout is **only** one JSON object (for metrics pipes); no key=value line.
 * - Appends a short section to **`GITHUB_STEP_SUMMARY`** when that env var is set (GitHub Actions job summary).
 *
 * @see docs/hcm/succession-plans-optional-development-plan-check.md
 * @see docs/CI_GATES.md → "Nightly: succession development-plan gap (staging)"
 */

import { config } from "dotenv";
import { appendFileSync, existsSync } from "fs";
import { resolve } from "path";
import { Client } from "pg";

const envTestPath = resolve(process.cwd(), ".env.test");
if (existsSync(envTestPath)) {
  config({ path: envTestPath });
}
config();

async function main(): Promise<void> {
  if (process.env.SKIP_SUCCESSION_DEV_PLAN_GAP_REPORT === "1") {
    console.log(
      "report-succession-plans-development-gap: SKIP_SUCCESSION_DEV_PLAN_GAP_REPORT=1 — skipping."
    );
    process.exit(0);
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error(
      "report-succession-plans-development-gap: DATABASE_URL not set (or SKIP_SUCCESSION_DEV_PLAN_GAP_REPORT=1)."
    );
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const res = await client.query<{ c: string }>(`
      SELECT COUNT(*)::text AS c
      FROM "talent"."succession_plans" s
      WHERE s."status" IN (
          'ACTIVE'::"talent"."succession_plan_status",
          'UNDER_REVIEW'::"talent"."succession_plan_status"
        )
        AND (
          s."developmentPlan" IS NULL
          OR length(trim(s."developmentPlan"::text)) = 0
        )
    `);

    const count = Number.parseInt(res.rows[0]?.c ?? "0", 10);
    const recordedAt = new Date().toISOString();
    const jsonPayload = {
      succession_plans_live_without_development_plan_count: count,
      recorded_at: recordedAt,
      metric: "talent.succession_plans.development_plan_gap",
    };

    if (process.env.SUCCESSION_DEV_PLAN_GAP_JSON_LINE === "1") {
      console.log(JSON.stringify(jsonPayload));
    } else {
      const line = `succession_plans_live_without_development_plan_count=${count}`;
      console.log(line);
      console.log(
        `report-succession-plans-development-gap: live rows missing a non-empty developmentPlan: ${count}`
      );
    }

    const gh = process.env.GITHUB_OUTPUT;
    if (gh) {
      appendFileSync(gh, `development_plan_gap_count=${count}\n`, { encoding: "utf-8" });
    }

    const stepSummary = process.env.GITHUB_STEP_SUMMARY;
    if (stepSummary) {
      appendFileSync(
        stepSummary,
        `### Succession plans — development plan gap (staging)\n\n` +
          `- **Count** (ACTIVE / UNDER_REVIEW, empty or whitespace-only \`developmentPlan\`): **${count}**\n` +
          `- **Recorded at:** ${recordedAt}\n\n`,
        { encoding: "utf-8" }
      );
    }

    if (count > 0 && process.env.SUCCESSION_DEV_PLAN_GAP_FAIL === "1") {
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
