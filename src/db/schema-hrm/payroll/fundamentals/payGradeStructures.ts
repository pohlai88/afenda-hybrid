import { integer, text, date, numeric, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { dateValue } from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { currencies } from "../../../schema-platform/core/currencies";
import { jobGrades } from "../../hr/employment/jobGrades";

/**
 * Pay grade structures - salary bands per named structure, linked to HR job grades.
 * Rows are effective-dated so historical band definitions can be retained.
 */
export const payGradeStructureStatuses = ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"] as const;

export const payGradeStructureStatusEnum = payrollSchema.enum("pay_grade_structure_status", [...payGradeStructureStatuses]);

export const PayGradeStructureStatusSchema = z.enum(payGradeStructureStatuses);
export type PayGradeStructureStatus = z.infer<typeof PayGradeStructureStatusSchema>;

/** `numeric(12, 2)` — non-negative, max ~9,999,999,999.99, at most two decimal places. */
function isValidSalaryString(s: string): boolean {
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n) || n < 0 || n > 9_999_999_999.99) return false;
  const frac = s.split(".")[1];
  return frac === undefined || frac.length <= 2;
}

function parseSalaryString(s: string | undefined): number | null {
  if (s === undefined) return null;
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

/** Full insert row: all optional salary strings may be set together. */
function refineSalaryConsistencyInsert(
  minSalary: string | undefined,
  midSalary: string | undefined,
  maxSalary: string | undefined,
  ctx: z.RefinementCtx,
): void {
  const min = parseSalaryString(minSalary);
  const mid = parseSalaryString(midSalary);
  const max = parseSalaryString(maxSalary);
  if (min !== null && max !== null && min > max) {
    ctx.addIssue({
      code: "custom",
      message: "maxSalary must be greater than or equal to minSalary",
      path: ["maxSalary"],
    });
  }
  if (mid !== null) {
    if (min !== null && mid < min) {
      ctx.addIssue({
        code: "custom",
        message: "midSalary must be greater than or equal to minSalary when both are set",
        path: ["midSalary"],
      });
    }
    if (max !== null && mid > max) {
      ctx.addIssue({
        code: "custom",
        message: "midSalary must be less than or equal to maxSalary when both are set",
        path: ["midSalary"],
      });
    }
  }
}

type SalaryPatch = {
  minSalary?: string | null;
  midSalary?: string | null;
  maxSalary?: string | null;
};

/** Update patch: only compare bounds that appear in the patch (undefined = unchanged). */
function refineSalaryConsistencyPatch(d: SalaryPatch, ctx: z.RefinementCtx): void {
  const n = (v: string | null | undefined): number | null | undefined => {
    if (v === undefined) return undefined;
    if (v === null) return null;
    return parseSalaryString(v);
  };
  const min = n(d.minSalary);
  const mid = n(d.midSalary);
  const max = n(d.maxSalary);

  if (min !== undefined && min !== null && max !== undefined && max !== null && min > max) {
    ctx.addIssue({
      code: "custom",
      message: "maxSalary must be greater than or equal to minSalary",
      path: ["maxSalary"],
    });
  }
  if (mid !== undefined && mid !== null) {
    if (min !== undefined && min !== null && mid < min) {
      ctx.addIssue({
        code: "custom",
        message: "midSalary must be greater than or equal to minSalary when both are set in the patch",
        path: ["midSalary"],
      });
    }
    if (max !== undefined && max !== null && mid > max) {
      ctx.addIssue({
        code: "custom",
        message: "midSalary must be less than or equal to maxSalary when both are set in the patch",
        path: ["midSalary"],
      });
    }
  }
}

const optionalSalaryString = z
  .string()
  .optional()
  .refine((s) => s === undefined || isValidSalaryString(s), {
    message: "Salary must be a non-negative decimal (numeric 12,2) with at most 2 decimal places",
  });

const structureCodeSchema = z
  .string()
  .min(2)
  .max(50)
  .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed")
  .transform((s) => s.toUpperCase());

/**
 * Table `pay_grade_structures` — bands per `structureCode` + `jobGradeId`; unique per tenant on `(lower(structureCode), jobGradeId, effectiveFrom)` among non-deleted rows.
 */
export const payGradeStructures = payrollSchema.table(
  "pay_grade_structures",
  {
    payGradeStructureId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    /** Normalized to uppercase in Zod insert/update for consistent storage and uniqueness. */
    structureCode: text().notNull(),
    ...nameColumn,
    description: text(),
    jobGradeId: integer().notNull(),
    minSalary: numeric({ precision: 12, scale: 2 }),
    midSalary: numeric({ precision: 12, scale: 2 }),
    maxSalary: numeric({ precision: 12, scale: 2 }),
    currencyId: integer().notNull(),
    effectiveFrom: date().notNull(),
    effectiveTo: date(),
    /** Lifecycle: `DRAFT` | `ACTIVE` | `INACTIVE` | `ARCHIVED`. */
    status: payGradeStructureStatusEnum().notNull().default("DRAFT"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_pay_grade_structures_tenant").on(t.tenantId),
    index("idx_pay_grade_structures_structure").on(t.tenantId, t.structureCode),
    index("idx_pay_grade_structures_grade").on(t.tenantId, t.jobGradeId),
    index("idx_pay_grade_structures_effective").on(t.tenantId, t.effectiveFrom, t.effectiveTo),
    uniqueIndex("uq_pay_grade_structures_row")
      .on(t.tenantId, sql`lower(${t.structureCode})`, t.jobGradeId, t.effectiveFrom)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_pay_grade_structures_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.jobGradeId],
      foreignColumns: [jobGrades.jobGradeId],
      name: "fk_pay_grade_structures_job_grade",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.currencyId],
      foreignColumns: [currencies.currencyId],
      name: "fk_pay_grade_structures_currency",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_pay_grade_structures_salary_range",
      sql`${t.minSalary} IS NULL OR ${t.maxSalary} IS NULL OR ${t.minSalary} <= ${t.maxSalary}`
    ),
    check(
      "chk_pay_grade_structures_mid_salary",
      sql`${t.midSalary} IS NULL OR (
        (${t.minSalary} IS NULL OR ${t.midSalary} >= ${t.minSalary}) AND
        (${t.maxSalary} IS NULL OR ${t.midSalary} <= ${t.maxSalary})
      )`
    ),
    check(
      "chk_pay_grade_structures_salary_positive",
      sql`(${t.minSalary} IS NULL OR ${t.minSalary} >= 0) AND
          (${t.midSalary} IS NULL OR ${t.midSalary} >= 0) AND
          (${t.maxSalary} IS NULL OR ${t.maxSalary} >= 0)`
    ),
    check(
      "chk_pay_grade_structures_effective_range",
      sql`${t.effectiveTo} IS NULL OR ${t.effectiveTo} >= ${t.effectiveFrom}`
    ),
  ]
);

export const PayGradeStructureIdSchema = z.number().int().positive().brand<"PayGradeStructureId">();
export type PayGradeStructureId = z.infer<typeof PayGradeStructureIdSchema>;

export const payGradeStructureSelectSchema = createSelectSchema(payGradeStructures);

export const payGradeStructureInsertSchema = createInsertSchema(payGradeStructures, {
  tenantId: z.number().int().positive(),
  structureCode: structureCodeSchema,
  name: z.string().min(1).max(200),
  jobGradeId: z.number().int().positive(),
  currencyId: z.number().int().positive(),
  description: z.string().max(2000).optional(),
  minSalary: optionalSalaryString,
  midSalary: optionalSalaryString,
  maxSalary: optionalSalaryString,
  effectiveFrom: z.coerce.date(),
  effectiveTo: z.coerce.date().optional().nullable(),
  status: PayGradeStructureStatusSchema.optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
})
  .superRefine((data, ctx) => {
    if (data.effectiveTo != null) {
      const fromT = dateValue(data.effectiveFrom);
      const toT = dateValue(data.effectiveTo);
      if (Number.isNaN(fromT) || Number.isNaN(toT)) {
        ctx.addIssue({
          code: "custom",
          message: "effectiveFrom and effectiveTo must be valid dates",
          path: ["effectiveTo"],
        });
        return;
      }
      if (toT < fromT) {
        ctx.addIssue({
          code: "custom",
          message: "effectiveTo must be on or after effectiveFrom",
          path: ["effectiveTo"],
        });
      }
    }
    refineSalaryConsistencyInsert(data.minSalary, data.midSalary, data.maxSalary, ctx);
  });

/** Patch payload: `tenantId` and `jobGradeId` are immutable after insert. */
export const payGradeStructureUpdateSchema = createUpdateSchema(payGradeStructures, {
  structureCode: structureCodeSchema.optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  currencyId: z.number().int().positive().optional(),
  minSalary: z
    .string()
    .optional()
    .nullable()
    .refine((s) => s === undefined || s === null || isValidSalaryString(s), {
      message: "Salary must be a non-negative decimal (numeric 12,2) with at most 2 decimal places",
    }),
  midSalary: z
    .string()
    .optional()
    .nullable()
    .refine((s) => s === undefined || s === null || isValidSalaryString(s), {
      message: "Salary must be a non-negative decimal (numeric 12,2) with at most 2 decimal places",
    }),
  maxSalary: z
    .string()
    .optional()
    .nullable()
    .refine((s) => s === undefined || s === null || isValidSalaryString(s), {
      message: "Salary must be a non-negative decimal (numeric 12,2) with at most 2 decimal places",
    }),
  effectiveFrom: z.coerce.date().optional(),
  effectiveTo: z.coerce.date().optional().nullable(),
  status: PayGradeStructureStatusSchema.optional(),
})
  .omit({ tenantId: true, jobGradeId: true })
  .superRefine((data, ctx) => {
    if (data.effectiveFrom !== undefined && data.effectiveTo !== undefined && data.effectiveTo !== null) {
      const fromT = dateValue(data.effectiveFrom);
      const toT = dateValue(data.effectiveTo);
      if (Number.isNaN(fromT) || Number.isNaN(toT)) {
        ctx.addIssue({
          code: "custom",
          message: "effectiveFrom and effectiveTo must be valid dates",
          path: ["effectiveTo"],
        });
        return;
      }
      if (toT < fromT) {
        ctx.addIssue({
          code: "custom",
          message: "effectiveTo must be on or after effectiveFrom",
          path: ["effectiveTo"],
        });
      }
    }

    refineSalaryConsistencyPatch(data, ctx);
  });

export type PayGradeStructure = typeof payGradeStructures.$inferSelect;
export type NewPayGradeStructure = typeof payGradeStructures.$inferInsert;
