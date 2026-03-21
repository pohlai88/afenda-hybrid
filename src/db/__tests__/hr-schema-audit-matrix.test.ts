/**
 * Keeps docs/hr-schema-audit-matrix.md aligned with REQUIRED_TALENT_TABLES and REQUIRED_RECRUITMENT_TABLES.
 * Run: pnpm vitest run --config vitest.db.config.ts src/db/__tests__/hr-schema-audit-matrix.test.ts
 * (No DATABASE_URL required — uses repo files only.)
 */
import * as fs from "fs";
import * as path from "path";
import { describe, expect, it } from "vitest";
import {
  EXPECTED_TABLE_ROWS,
  REQUIRED_RECRUITMENT_TABLES,
  REQUIRED_TALENT_TABLES,
  verifyHrSchemaAuditMatrix,
} from "../../../scripts/lib/hr-schema-audit-matrix-core";

const MATRIX_PATH = path.join(process.cwd(), "docs/hr-schema-audit-matrix.md");

describe("hr-schema-audit-matrix.md", () => {
  it("matches verifyHrSchemaAuditMatrix (row count, talent set, recruitment set)", () => {
    const text = fs.readFileSync(MATRIX_PATH, "utf-8");
    const { ok, errors } = verifyHrSchemaAuditMatrix(text);
    expect(errors).toEqual([]);
    expect(ok).toBe(true);
  });

  it("documents EXPECTED_TABLE_ROWS in the title", () => {
    const text = fs.readFileSync(MATRIX_PATH, "utf-8");
    expect(text).toMatch(new RegExp(`\\(${EXPECTED_TABLE_ROWS} tables\\)`, "i"));
  });

  it("includes offerLetters in REQUIRED_RECRUITMENT_TABLES guard", () => {
    expect(REQUIRED_RECRUITMENT_TABLES).toContain("offerLetters");
  });

  it("keeps talent inventory count in sync with REQUIRED_TALENT_TABLES", () => {
    expect(REQUIRED_TALENT_TABLES.length).toBe(17);
  });
});
