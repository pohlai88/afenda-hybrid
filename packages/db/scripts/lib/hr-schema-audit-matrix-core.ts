/**
 * Shared rules for `docs/hcm/hr-schema-audit-matrix.md`.
 * Used by `packages/db/scripts/ci/verify-hr-schema-audit-matrix.ts` and `packages/db/src/__tests__/hr-schema-audit-matrix.test.ts`.
 */

/** Number of data rows (`| # | schema | table | ...`) in the matrix table body. */
export const EXPECTED_TABLE_ROWS = 115;

/** Third column where schema is `talent` — must appear exactly once each. Sync with docs/hcm/talent-schema-inventory.md. */
export const REQUIRED_TALENT_TABLES = [
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

/** Third column where schema is `recruitment` — compliance guardrail; keep aligned with Drizzle `recruitment` tables in audit scope. */
export const REQUIRED_RECRUITMENT_TABLES = [
  "applications",
  "backgroundChecks",
  "candidateSalaryBackfillIssues",
  "candidates",
  "exitInterviews",
  "interviews",
  "jobRequisitions",
  "offerLetters",
  "offboardingChecklists",
  "onboardingChecklists",
  "probationEvaluations",
] as const;

export interface AuditMatrixVerificationResult {
  ok: boolean;
  errors: string[];
}

function sortedCopy<T extends string>(arr: readonly T[]): string[] {
  return [...arr].map(String).sort();
}

/** Lines like `| 1 | audit | auditTrail |` */
function extractRowsForSchema(text: string, schemaName: string): string[] {
  if (!/^\w+$/.test(schemaName)) {
    throw new Error(`extractRowsForSchema: invalid schema name ${schemaName}`);
  }
  const re = new RegExp(`^\\|\\s*\\d+\\s*\\|\\s*${schemaName}\\s*\\|\\s*(\\w+)\\s*\\|`);
  const out: string[] = [];
  for (const line of text.split("\n")) {
    const m = line.match(re);
    if (m) out.push(m[1]!);
  }
  return out;
}

/**
 * Validates matrix markdown: row count, talent section completeness/uniqueness, recruitment section completeness/uniqueness.
 */
export function verifyHrSchemaAuditMatrix(text: string): AuditMatrixVerificationResult {
  const errors: string[] = [];

  const rowMatches = text.match(/^\|\s*\d+\s*\|/gm) ?? [];
  if (rowMatches.length !== EXPECTED_TABLE_ROWS) {
    errors.push(
      `Expected ${EXPECTED_TABLE_ROWS} data rows, found ${rowMatches.length}. Update the matrix or EXPECTED_TABLE_ROWS in packages/db/scripts/lib/hr-schema-audit-matrix-core.ts.`
    );
  }

  const titleMatch = text.match(/^#\s+HR\s*\/\s*HCM schema audit matrix \((\d+) tables\)/im);
  if (titleMatch && parseInt(titleMatch[1]!, 10) !== EXPECTED_TABLE_ROWS) {
    errors.push(
      `Title says ${titleMatch[1]} tables but EXPECTED_TABLE_ROWS is ${EXPECTED_TABLE_ROWS} — align the heading and constant.`
    );
  }

  const talentFound = extractRowsForSchema(text, "talent");
  const talentSorted = sortedCopy(talentFound);
  const talentReq = sortedCopy(REQUIRED_TALENT_TABLES);
  const talentOk =
    talentSorted.length === talentReq.length && talentSorted.every((n, i) => n === talentReq[i]);
  if (!talentOk) {
    errors.push(
      "Talent section: must list exactly these tables once each:\n" +
        `  Expected (${talentReq.length}): ${talentReq.join(", ")}\n` +
        `  Found (${talentSorted.length}): ${talentSorted.join(", ")}`
    );
  }
  const talentDupes = talentFound.filter((t, i) => talentFound.indexOf(t) !== i);
  if (talentDupes.length > 0) {
    errors.push(`Talent section: duplicate table rows: ${[...new Set(talentDupes)].join(", ")}`);
  }

  const recFound = extractRowsForSchema(text, "recruitment");
  const recSorted = sortedCopy(recFound);
  const recReq = sortedCopy(REQUIRED_RECRUITMENT_TABLES);
  const recOk = recSorted.length === recReq.length && recSorted.every((n, i) => n === recReq[i]);
  if (!recOk) {
    errors.push(
      "Recruitment section: must list exactly these tables once each:\n" +
        `  Expected (${recReq.length}): ${recReq.join(", ")}\n` +
        `  Found (${recSorted.length}): ${recSorted.join(", ")}`
    );
  }
  const recDupes = recFound.filter((t, i) => recFound.indexOf(t) !== i);
  if (recDupes.length > 0) {
    errors.push(`Recruitment section: duplicate table rows: ${[...new Set(recDupes)].join(", ")}`);
  }

  return { ok: errors.length === 0, errors };
}
