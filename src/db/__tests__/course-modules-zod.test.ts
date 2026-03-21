/**
 * Course module Zod: moduleCode normalization (matches DB unique index on lower(moduleCode)).
 * Run: pnpm vitest run --config vitest.db.config.ts src/db/__tests__/course-modules-zod.test.ts
 */
import { describe, expect, it } from "vitest";
import { courseModuleInsertSchema, courseModuleUpdateSchema } from "../schema-hrm/learning/fundamentals/courseModules";

const baseInsert = {
  courseId: 1,
  moduleCode: "placeholder",
  name: "Introduction",
  sequenceNumber: 1,
  createdBy: 1,
  updatedBy: 1,
};

describe("course module Zod", () => {
  it("normalizes moduleCode to lowercase on insert (e.g. Ab-1 -> ab-1)", () => {
    const r = courseModuleInsertSchema.safeParse({ ...baseInsert, moduleCode: "Ab-1" });
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.moduleCode).toBe("ab-1");
  });

  it("trims moduleCode before lowercasing on insert", () => {
    const r = courseModuleInsertSchema.safeParse({ ...baseInsert, moduleCode: "  Mod_1  " });
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.moduleCode).toBe("mod_1");
  });

  it("normalizes moduleCode on update when provided", () => {
    const r = courseModuleUpdateSchema.safeParse({ moduleCode: "Xy_9" });
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.moduleCode).toBe("xy_9");
  });
});
