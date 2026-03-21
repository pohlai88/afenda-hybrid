/**
 * Courses Zod: catalog code normalization, cost string, cost+currency pairing,
 * format-dependent duration/capacity, ACTIVE/objectives, mandatory/prerequisites.
 * Run: pnpm vitest run --config vitest.db.config.ts src/db/__tests__/courses-zod.test.ts
 */
import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import {
  courseInsertSchema,
  courseUpdateSchema,
  isValidCourseCostString,
} from "../schema-hrm/learning/fundamentals/courses";
import { refineRequiresContentUrlForOnline } from "../schema-hrm/learning/_zodShared";
import { expectZodIssueAtPath } from "./lib/expect-zod-issue";

/** Non–instructor-led format so inserts are not forced to supply duration/capacity. */
const baseInsert = {
  tenantId: 1,
  courseCode: "x",
  name: "Safety 101",
  createdBy: 1,
  updatedBy: 1,
  format: "ONLINE" as const,
};

const compositeFormatContentUrlSchema = z
  .object({ format: z.string(), contentUrl: z.string().optional() })
  .superRefine(refineRequiresContentUrlForOnline);

describe("courses Zod", () => {
  it("normalizes courseCode to lowercase", () => {
    const r = courseInsertSchema.safeParse({ ...baseInsert, courseCode: "SaFe-1" });
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.courseCode).toBe("safe-1");
  });

  it("rejects cost without currencyId on insert", () => {
    expectZodIssueAtPath(
      courseInsertSchema,
      { ...baseInsert, courseCode: "c1", cost: "100.00" },
      "currencyId"
    );
  });

  it("accepts cost with currencyId on insert", () => {
    const r = courseInsertSchema.safeParse({
      ...baseInsert,
      courseCode: "c2",
      cost: "100.00",
      currencyId: 1,
    });
    expect(r.success).toBe(true);
  });

  it("update rejects setting cost without currencyId", () => {
    expectZodIssueAtPath(courseUpdateSchema, { cost: "50.00" }, "currencyId");
  });

  it("isValidCourseCostString enforces scale and max", () => {
    expect(isValidCourseCostString("0")).toBe(true);
    expect(isValidCourseCostString("1.2")).toBe(true);
    expect(isValidCourseCostString("1.234")).toBe(false);
    expect(isValidCourseCostString("100000000")).toBe(false);
  });

  it("insert rejects ACTIVE without non-empty objectives", () => {
    expectZodIssueAtPath(
      courseInsertSchema,
      { ...baseInsert, courseCode: "act1", status: "ACTIVE" },
      "objectives"
    );
  });

  it("insert accepts ACTIVE with objectives", () => {
    const r = courseInsertSchema.safeParse({
      ...baseInsert,
      courseCode: "act2",
      status: "ACTIVE",
      objectives: "Pass the exam",
    });
    expect(r.success).toBe(true);
  });

  it("insert rejects isMandatory true without non-empty prerequisites", () => {
    expectZodIssueAtPath(
      courseInsertSchema,
      { ...baseInsert, courseCode: "man1", isMandatory: true },
      "prerequisites"
    );
  });

  it("insert accepts isMandatory true with prerequisites", () => {
    const r = courseInsertSchema.safeParse({
      ...baseInsert,
      courseCode: "man2",
      isMandatory: true,
      prerequisites: "Safety clearance",
    });
    expect(r.success).toBe(true);
  });

  it("update rejects status ACTIVE without objectives in payload", () => {
    expectZodIssueAtPath(courseUpdateSchema, { status: "ACTIVE" }, "objectives");
  });

  it("update accepts status ACTIVE when objectives included", () => {
    expect(
      courseUpdateSchema.safeParse({ status: "ACTIVE", objectives: "Complete module A" }).success
    ).toBe(true);
  });

  it("update rejects isMandatory true without prerequisites in payload", () => {
    expectZodIssueAtPath(courseUpdateSchema, { isMandatory: true }, "prerequisites");
  });

  it("insert without format assumes CLASSROOM default and requires durationHours and maxParticipants", () => {
    const { format: _f, ...noFormat } = { ...baseInsert, courseCode: "implicit-class" };
    const r = courseInsertSchema.safeParse(noFormat);
    expect(r.success).toBe(false);
    if (r.success) return;
    const paths = r.error.issues.map((i) => i.path.join("."));
    expect(paths).toContain("durationHours");
    expect(paths).toContain("maxParticipants");
  });

  it("insert CLASSROOM requires durationHours and maxParticipants", () => {
    expectZodIssueAtPath(
      courseInsertSchema,
      { ...baseInsert, courseCode: "cl-dur", format: "CLASSROOM" },
      "durationHours"
    );
    expectZodIssueAtPath(
      courseInsertSchema,
      { ...baseInsert, courseCode: "cl-cap", format: "CLASSROOM", durationHours: 1 },
      "maxParticipants"
    );
    expect(
      courseInsertSchema.safeParse({
        ...baseInsert,
        courseCode: "cl-ok",
        format: "CLASSROOM",
        durationHours: 1,
        maxParticipants: 10,
      }).success
    ).toBe(true);
  });

  it("insert WORKSHOP requires durationHours but not maxParticipants", () => {
    expectZodIssueAtPath(
      courseInsertSchema,
      { ...baseInsert, courseCode: "ws-dur", format: "WORKSHOP" },
      "durationHours"
    );
    expect(
      courseInsertSchema.safeParse({
        ...baseInsert,
        courseCode: "ws-ok",
        format: "WORKSHOP",
        durationHours: 2,
      }).success
    ).toBe(true);
  });

  it("update allows empty patch (format refinements skipped when format omitted)", () => {
    expect(courseUpdateSchema.safeParse({}).success).toBe(true);
  });

  it("update with CLASSROOM requires durationHours and maxParticipants in the same payload", () => {
    expectZodIssueAtPath(courseUpdateSchema, { format: "CLASSROOM" }, "durationHours");
    expectZodIssueAtPath(
      courseUpdateSchema,
      { format: "CLASSROOM", durationHours: 1 },
      "maxParticipants"
    );
    expect(
      courseUpdateSchema.safeParse({
        format: "CLASSROOM",
        durationHours: 1,
        maxParticipants: 8,
      }).success
    ).toBe(true);
  });

  it("update with WORKSHOP requires durationHours only", () => {
    expectZodIssueAtPath(courseUpdateSchema, { format: "WORKSHOP" }, "durationHours");
    expect(courseUpdateSchema.safeParse({ format: "WORKSHOP", durationHours: 3 }).success).toBe(true);
  });
});

describe("learning composite: contentUrl + format (refineRequiresContentUrlForOnline)", () => {
  it("requires non-empty contentUrl for ONLINE", () => {
    expect(compositeFormatContentUrlSchema.safeParse({ format: "ONLINE" }).success).toBe(false);
    expect(
      compositeFormatContentUrlSchema.safeParse({
        format: "ONLINE",
        contentUrl: "https://lms.example/c/1",
      }).success
    ).toBe(true);
  });

  it("requires non-empty contentUrl for SELF_PACED", () => {
    expect(compositeFormatContentUrlSchema.safeParse({ format: "SELF_PACED" }).success).toBe(false);
    expect(
      compositeFormatContentUrlSchema.safeParse({
        format: "SELF_PACED",
        contentUrl: "https://lms.example/c/2",
      }).success
    ).toBe(true);
  });
});
