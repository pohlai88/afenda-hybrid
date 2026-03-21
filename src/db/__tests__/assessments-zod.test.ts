/**
 * Assessments Zod: date/timestamptz wire formats, passingScore vs maxScore.
 * Run: pnpm vitest run --config vitest.db.config.ts src/db/__tests__/assessments-zod.test.ts
 */
import { describe, expect, it } from "vitest";
import { assessmentInsertSchema, assessmentUpdateSchema } from "../schema-hrm/learning/operations/assessments";
import { expectZodIssueAtPath } from "./lib/expect-zod-issue";

const baseInsert = {
  tenantId: 1,
  courseId: 1,
  employeeId: 1,
  assessmentType: "QUIZ" as const,
  assessmentDate: "2026-03-01",
  createdBy: 1,
  updatedBy: 1,
};

describe("assessments Zod", () => {
  it("insert rejects passingScore greater than maxScore when both are set", () => {
    expectZodIssueAtPath(
      assessmentInsertSchema,
      { ...baseInsert, maxScore: 50, passingScore: 80 },
      "passingScore"
    );
  });

  it("insert accepts passingScore less than or equal to maxScore", () => {
    expect(
      assessmentInsertSchema.safeParse({ ...baseInsert, maxScore: 100, passingScore: 60 }).success
    ).toBe(true);
  });

  it("update applies same passing vs max rule", () => {
    expectZodIssueAtPath(assessmentUpdateSchema, { maxScore: 40, passingScore: 90 }, "passingScore");
  });

  it("insert rejects assessmentDate that is not YYYY-MM-DD", () => {
    expectZodIssueAtPath(
      assessmentInsertSchema,
      { ...baseInsert, assessmentDate: "03/01/2026" },
      "assessmentDate"
    );
  });

  it("insert accepts parseable ISO startTime for timestamptz", () => {
    const r = assessmentInsertSchema.safeParse({
      ...baseInsert,
      startTime: "2026-03-01T14:30:00.000Z",
    });
    expect(r.success).toBe(true);
  });

  it("insert rejects unparseable startTime", () => {
    expectZodIssueAtPath(
      assessmentInsertSchema,
      { ...baseInsert, startTime: "not-a-datetime" },
      "startTime"
    );
  });
});
