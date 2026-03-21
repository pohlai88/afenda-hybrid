/**
 * Ensures docs/hr-schema-audit-matrix.md:
 * - Has EXPECTED_TABLE_ROWS numbered data rows.
 * - Lists every required `talent` table exactly once.
 * - Lists every required `recruitment` table exactly once (pipeline / compliance guard).
 *
 * Shared rules: scripts/lib/hr-schema-audit-matrix-core.ts
 * CI test: src/db/__tests__/hr-schema-audit-matrix.test.ts
 *
 * Run: pnpm check:hr-audit-matrix
 */
import * as fs from "fs";
import * as path from "path";
import { verifyHrSchemaAuditMatrix } from "./lib/hr-schema-audit-matrix-core";

const MATRIX_PATH = path.join(process.cwd(), "docs/hr-schema-audit-matrix.md");

function main(): void {
  const text = fs.readFileSync(MATRIX_PATH, "utf-8");
  const { ok, errors } = verifyHrSchemaAuditMatrix(text);

  if (!ok) {
    for (const e of errors) {
      console.error(e);
    }
    process.exit(1);
  }

  console.log("OK: hr-schema-audit-matrix.md passed verification (row count, talent, recruitment).");
}

main();
