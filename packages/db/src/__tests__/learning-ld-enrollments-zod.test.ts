/**
 * L&D: course enrollments, path assignments, path progress, training enrollment Zod refinements.
 * Run: pnpm test:db -- src/__tests__/learning-ld-enrollments-zod.test.ts
 */
import { describe, expect, it } from "vitest";
import {
  courseEnrollmentInsertSchema,
  courseEnrollmentUpdateSchema,
} from "../schema-hrm/learning/operations/courseEnrollments";
import {
  learningPathAssignmentInsertSchema,
  learningPathAssignmentUpdateSchema,
} from "../schema-hrm/learning/operations/learningPathAssignments";
import {
  learningPathCourseProgressInsertSchema,
  learningPathCourseProgressUpdateSchema,
} from "../schema-hrm/learning/operations/learningPathCourseProgress";
import {
  trainingEnrollmentInsertSchema,
  trainingEnrollmentUpdateSchema,
} from "../schema-hrm/learning/operations/trainingEnrollments";
import { expectZodIssueAtPath } from "./lib/expect-zod-issue";

/** Drizzle date columns typically coerce from ISO date strings in Zod insert schemas. */
const enrolledAt = "2026-03-01";

const baseCourseEnrollment = {
  tenantId: 1,
  courseId: 1,
  employeeId: 1,
  enrolledAt,
  createdBy: 1,
  updatedBy: 1,
};

const basePathAssignment = {
  tenantId: 1,
  learningPathId: 1,
  employeeId: 1,
  assignedAt: enrolledAt,
  createdBy: 1,
  updatedBy: 1,
};

const basePathProgress = {
  tenantId: 1,
  pathAssignmentId: 1,
  pathCourseId: 1,
  createdBy: 1,
  updatedBy: 1,
};

const baseTrainingEnrollment = {
  tenantId: 1,
  sessionId: 1,
  employeeId: 1,
  enrollmentDate: enrolledAt,
  createdBy: 1,
  updatedBy: 1,
};

describe("learning L&D Zod — completion vs status", () => {
  it("courseEnrollmentInsertSchema rejects COMPLETED without completionDate", () => {
    expectZodIssueAtPath(
      courseEnrollmentInsertSchema,
      { ...baseCourseEnrollment, status: "COMPLETED" },
      "completionDate"
    );
  });

  it("courseEnrollmentInsertSchema rejects completionDate when status is not COMPLETED", () => {
    expectZodIssueAtPath(
      courseEnrollmentInsertSchema,
      {
        ...baseCourseEnrollment,
        status: "IN_PROGRESS",
        completionDate: "2026-03-15",
      },
      "completionDate"
    );
  });

  it("courseEnrollmentInsertSchema accepts COMPLETED with completionDate", () => {
    const r = courseEnrollmentInsertSchema.safeParse({
      ...baseCourseEnrollment,
      status: "COMPLETED",
      completionDate: "2026-03-15",
    });
    expect(r.success).toBe(true);
  });

  it("courseEnrollmentUpdateSchema applies same completion rule", () => {
    expectZodIssueAtPath(courseEnrollmentUpdateSchema, { status: "COMPLETED" }, "completionDate");
  });

  it("courseEnrollmentUpdateSchema rejects completionDate that is not YYYY-MM-DD", () => {
    expectZodIssueAtPath(
      courseEnrollmentUpdateSchema,
      { status: "COMPLETED", completionDate: "15-03-2026" },
      "completionDate"
    );
  });

  it("trainingEnrollmentInsertSchema rejects COMPLETED without completionDate", () => {
    expectZodIssueAtPath(
      trainingEnrollmentInsertSchema,
      { ...baseTrainingEnrollment, status: "COMPLETED" },
      "completionDate"
    );
  });

  it("trainingEnrollmentUpdateSchema rejects completionDate when status is not COMPLETED", () => {
    expectZodIssueAtPath(
      trainingEnrollmentUpdateSchema,
      { status: "PENDING", completionDate: "2026-03-10" },
      "completionDate"
    );
  });

  it("learningPathCourseProgressInsertSchema rejects COMPLETED without completionDate", () => {
    expectZodIssueAtPath(
      learningPathCourseProgressInsertSchema,
      { ...basePathProgress, status: "COMPLETED" },
      "completionDate"
    );
  });

  it("learningPathCourseProgressUpdateSchema applies same completion rule", () => {
    expectZodIssueAtPath(
      learningPathCourseProgressUpdateSchema,
      { status: "COMPLETED" },
      "completionDate"
    );
  });
});

describe("learning L&D Zod — training enrollment attendance vs COMPLETED", () => {
  it("trainingEnrollmentInsertSchema rejects COMPLETED when attendancePercent < 80 (with completionDate)", () => {
    expectZodIssueAtPath(
      trainingEnrollmentInsertSchema,
      {
        ...baseTrainingEnrollment,
        status: "COMPLETED",
        completionDate: "2026-03-20",
        attendancePercent: 79,
      },
      "status"
    );
  });

  it("trainingEnrollmentInsertSchema accepts COMPLETED when attendancePercent is null", () => {
    const r = trainingEnrollmentInsertSchema.safeParse({
      ...baseTrainingEnrollment,
      status: "COMPLETED",
      completionDate: "2026-03-20",
    });
    expect(r.success).toBe(true);
  });

  it("trainingEnrollmentInsertSchema accepts COMPLETED when attendancePercent >= 80", () => {
    const r = trainingEnrollmentInsertSchema.safeParse({
      ...baseTrainingEnrollment,
      status: "COMPLETED",
      completionDate: "2026-03-20",
      attendancePercent: 80,
    });
    expect(r.success).toBe(true);
  });

  it("trainingEnrollmentUpdateSchema rejects setting COMPLETED with attendancePercent < 80", () => {
    expectZodIssueAtPath(
      trainingEnrollmentUpdateSchema,
      { status: "COMPLETED", attendancePercent: 50, completionDate: "2026-03-20" },
      "status"
    );
  });
});

describe("learning L&D Zod — path assignment", () => {
  it("accepts minimal insert", () => {
    expect(learningPathAssignmentInsertSchema.safeParse(basePathAssignment).success).toBe(true);
  });

  it("update allows clearing complianceCode", () => {
    const r = learningPathAssignmentUpdateSchema.safeParse({ complianceCode: null });
    expect(r.success).toBe(true);
  });

  it("insert rejects dueBy before assignedAt", () => {
    expectZodIssueAtPath(
      learningPathAssignmentInsertSchema,
      {
        ...basePathAssignment,
        assignedAt: "2026-06-01",
        dueBy: "2026-05-15",
      },
      "dueBy"
    );
  });

  it("update applies dueBy vs assignedAt when both are in the payload", () => {
    expectZodIssueAtPath(
      learningPathAssignmentUpdateSchema,
      { assignedAt: "2026-04-01", dueBy: "2026-03-01" },
      "dueBy"
    );
  });
});

describe("learning L&D Zod — completion vs dueBy (temporal order)", () => {
  it("courseEnrollmentInsertSchema rejects completionDate after dueBy", () => {
    expectZodIssueAtPath(
      courseEnrollmentInsertSchema,
      {
        ...baseCourseEnrollment,
        dueBy: "2026-03-10",
        completionDate: "2026-03-20",
        status: "COMPLETED",
      },
      "completionDate"
    );
  });

  it("trainingEnrollmentInsertSchema rejects completionDate after dueBy", () => {
    expectZodIssueAtPath(
      trainingEnrollmentInsertSchema,
      {
        ...baseTrainingEnrollment,
        dueBy: "2026-03-10",
        completionDate: "2026-03-11",
        status: "COMPLETED",
      },
      "completionDate"
    );
  });

  it("courseEnrollmentUpdateSchema applies same completion vs due rule", () => {
    expectZodIssueAtPath(
      courseEnrollmentUpdateSchema,
      { dueBy: "2026-01-01", completionDate: "2026-02-01", status: "COMPLETED" },
      "completionDate"
    );
  });
});
