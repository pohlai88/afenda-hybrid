/**
 * Preflight: training_enrollments completion vs COMPLETED; employee_certifications verification pairing.
 *
 *   DATABASE_URL=... pnpm check:learning-cert-lifecycle-preflight
 *
 * SKIP_LEARNING_CERT_LIFECYCLE_PREFLIGHT=1 — exit 0 when job has no DB.
 *
 * @see docs/preflight/preflight-learning-completion-cert-verification.sql
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
  if (process.env.SKIP_LEARNING_CERT_LIFECYCLE_PREFLIGHT === "1") {
    console.log(
      "check-learning-cert-lifecycle-preflight: SKIP_LEARNING_CERT_LIFECYCLE_PREFLIGHT=1 — skipping."
    );
    process.exit(0);
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error(
      "check-learning-cert-lifecycle-preflight: DATABASE_URL not set (or SKIP_LEARNING_CERT_LIFECYCLE_PREFLIGHT=1)."
    );
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const training = await client.query<{ c: string }>(`
      SELECT COUNT(*)::text AS c
      FROM "learning"."training_enrollments" e
      WHERE NOT (
        (e."completionDate" IS NULL OR e."status"::text = 'COMPLETED')
        AND (e."status"::text != 'COMPLETED' OR e."completionDate" IS NOT NULL)
      )
    `);

    const certs = await client.query<{ c: string }>(`
      SELECT COUNT(*)::text AS c
      FROM "talent"."employee_certifications" c
      WHERE NOT (
        (c."verifiedBy" IS NULL = (c."verificationDate" IS NULL))
        AND (
          c."status"::text != 'PENDING_VERIFICATION'
          OR (c."verifiedBy" IS NULL AND c."verificationDate" IS NULL)
        )
      )
    `);

    const trainingCount = Number.parseInt(training.rows[0]?.c ?? "0", 10);
    const certCount = Number.parseInt(certs.rows[0]?.c ?? "0", 10);

    console.log(
      `check-learning-cert-lifecycle-preflight: training_completion_violations=${trainingCount}, employee_cert_verification_violations=${certCount}`
    );

    if (trainingCount > 0 || certCount > 0) {
      console.error(
        "Learning/cert lifecycle preflight failed. See docs/preflight/preflight-learning-completion-cert-verification.sql"
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
