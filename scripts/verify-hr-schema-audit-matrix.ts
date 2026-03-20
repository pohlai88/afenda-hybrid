/**
 * Ensures docs/hr-schema-audit-matrix.md:
 * - Has EXPECTED_TABLES numbered data rows (112).
 * - Lists every Drizzle-modeled `talent` table exactly once (schema column `talent`, third column = Drizzle symbol).
 *
 * Keep REQUIRED_TALENT_TABLES in sync with docs/talent-schema-inventory.md (17 tables).
 *
 * Run: pnpm check:hr-audit-matrix
 */
import * as fs from "fs";
import * as path from "path";

const EXPECTED_TABLES = 112;
const MATRIX_PATH = path.join(process.cwd(), "docs/hr-schema-audit-matrix.md");

/** Third column for rows where schema is `talent` — must match the matrix and talent-schema-inventory.md. */
const REQUIRED_TALENT_TABLES = [
  "caseLinks",
  "certifications",
  "competencyFrameworks",
  "competencySkills",
  "disciplinaryActions",
  "employeeCertifications",
  "employeeSkills",
  "goalTracking",
  "grievanceRecords",
  "performanceGoals",
  "performanceReviewGoals",
  "performanceReviews",
  "promotionRecords",
  "skills",
  "successionPlans",
  "talentPoolMemberships",
  "talentPools",
] as const;

function main(): void {
  const text = fs.readFileSync(MATRIX_PATH, "utf-8");
  const rowMatches = text.match(/^\|\s*\d+\s*\|/gm) ?? [];
  const count = rowMatches.length;
  if (count !== EXPECTED_TABLES) {
    console.error(
      `hr-schema-audit-matrix.md: expected ${EXPECTED_TABLES} data rows, found ${count}. Update the matrix or EXPECTED_TABLES.`
    );
    process.exit(1);
  }

  const talentRowRe = /^\|\s*\d+\s*\|\s*talent\s*\|\s*(\w+)\s*\|/gm;
  const found: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = talentRowRe.exec(text)) !== null) {
    found.push(m[1]!);
  }

  const sortedFound = [...found].sort();
  const sortedReq = [...REQUIRED_TALENT_TABLES].sort();
  const sameLength = sortedFound.length === sortedReq.length;
  const sameMembers =
    sameLength && sortedFound.every((name, i) => name === sortedReq[i]);

  if (!sameMembers) {
    console.error(
      "hr-schema-audit-matrix.md: talent section must list exactly these tables (once each):\n" +
        `  Expected (${sortedReq.length}): ${sortedReq.join(", ")}\n` +
        `  Found (${sortedFound.length}): ${sortedFound.join(", ")}`
    );
    process.exit(1);
  }

  console.log(`OK: audit matrix has ${count} table rows and ${found.length} talent tables.`);
}

main();
