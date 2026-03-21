/**
 * Training sessions Zod: start/end date ordering (mirrors `chk_training_sessions_dates`).
 * Run: pnpm vitest run --config vitest.db.config.ts src/db/__tests__/training-sessions-zod.test.ts
 */
import { describe, expect, it } from "vitest";
import { trainingSessionInsertSchema, trainingSessionUpdateSchema } from "../schema-hrm/learning/operations/trainingSessions";
import { expectZodIssueAtPath } from "./lib/expect-zod-issue";

const baseInsert = {
  tenantId: 1,
  courseId: 1,
  sessionCode: "room-a",
  startDate: "2026-06-10",
  endDate: "2026-06-12",
  createdBy: 1,
  updatedBy: 1,
};

describe("training sessions Zod — date range", () => {
  it("insert rejects endDate before startDate", () => {
    expectZodIssueAtPath(
      trainingSessionInsertSchema,
      { ...baseInsert, startDate: "2026-06-10", endDate: "2026-06-09" },
      "endDate"
    );
  });

  it("insert accepts endDate on or after startDate", () => {
    expect(trainingSessionInsertSchema.safeParse(baseInsert).success).toBe(true);
  });

  it("update applies same rule when both dates are in the payload", () => {
    expectZodIssueAtPath(
      trainingSessionUpdateSchema,
      { startDate: "2026-01-20", endDate: "2026-01-01" },
      "endDate"
    );
  });
});
