/**
 * Learning path ↔ course junction Zod (sequence bounds, partial updates).
 * Run: pnpm vitest run --config vitest.db.config.ts src/db/__tests__/learning-path-courses-zod.test.ts
 */
import { describe, expect, it } from "vitest";
import {
  learningPathCourseInsertSchema,
  learningPathCourseUpdateSchema,
} from "../schema-hrm/learning/fundamentals/learningPathCourses";
import { LEARNING_ORDERED_SEQUENCE_MAX } from "../schema-hrm/learning/_zodShared";
import { expectZodIssueAtPath } from "./lib/expect-zod-issue";

const baseInsert = {
  learningPathId: 1,
  courseId: 1,
  sequenceNumber: 1,
};

describe("learningPathCourses Zod", () => {
  it("rejects sequenceNumber above max", () => {
    expectZodIssueAtPath(
      learningPathCourseInsertSchema,
      { ...baseInsert, sequenceNumber: LEARNING_ORDERED_SEQUENCE_MAX + 1 },
      "sequenceNumber"
    );
  });

  it("allows optional isRequired on insert (DB default true)", () => {
    const r = learningPathCourseInsertSchema.safeParse({ ...baseInsert, isRequired: false });
    expect(r.success).toBe(true);
  });

  it("update allows partial patch with only isRequired", () => {
    const r = learningPathCourseUpdateSchema.safeParse({ isRequired: false });
    expect(r.success).toBe(true);
  });

  it("update allows partial patch with only sequenceNumber", () => {
    const r = learningPathCourseUpdateSchema.safeParse({ sequenceNumber: 3 });
    expect(r.success).toBe(true);
  });
});
