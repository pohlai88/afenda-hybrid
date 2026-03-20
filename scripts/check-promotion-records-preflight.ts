/**
 * Preflight: promotion_records approval CHECK + unique (tenant, employee, effectiveDate).
 *
 *   DATABASE_URL=... pnpm check:promotion-records-preflight
 *
 * SKIP_PROMOTION_RECORDS_PREFLIGHT=1 — exit 0 when job has no DB.
 *
 * @see docs/preflight-promotion-records-approval.sql
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
  if (process.env.SKIP_PROMOTION_RECORDS_PREFLIGHT === "1") {
    console.log(
      "check-promotion-records-preflight: SKIP_PROMOTION_RECORDS_PREFLIGHT=1 — skipping.",
    );
    process.exit(0);
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error(
      "check-promotion-records-preflight: DATABASE_URL not set (or SKIP_PROMOTION_RECORDS_PREFLIGHT=1).",
    );
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const approval = await client.query<{ c: string }>(`
      SELECT COUNT(*)::text AS c
      FROM "talent"."promotion_records" p
      WHERE NOT (
        (p."approvedBy" IS NULL = (p."approvedAt" IS NULL))
        AND (
          p."status" NOT IN (
            'APPROVED'::"talent"."promotion_status",
            'COMPLETED'::"talent"."promotion_status"
          )
          OR (p."approvedBy" IS NOT NULL AND p."approvedAt" IS NOT NULL)
        )
      )
    `);

    const duplicates = await client.query<{ c: string }>(`
      SELECT COUNT(*)::text AS c
      FROM (
        SELECT 1
        FROM "talent"."promotion_records" p
        WHERE p."deletedAt" IS NULL
        GROUP BY p."tenantId", p."employeeId", p."effectiveDate"
        HAVING COUNT(*) > 1
      ) d
    `);

    const approvalCount = Number.parseInt(approval.rows[0]?.c ?? "0", 10);
    const duplicateGroups = Number.parseInt(duplicates.rows[0]?.c ?? "0", 10);

    console.log(
      `check-promotion-records-preflight: approval_violations=${approvalCount}, duplicate_effective_date_groups=${duplicateGroups}`,
    );

    if (approvalCount > 0 || duplicateGroups > 0) {
      console.error(
        "Promotion records preflight failed. See docs/preflight-promotion-records-approval.sql",
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
