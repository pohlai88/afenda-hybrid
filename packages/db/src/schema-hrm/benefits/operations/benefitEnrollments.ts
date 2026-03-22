import { sql } from "drizzle-orm";
import {
  check,
  date,
  foreignKey,
  index,
  integer,
  numeric,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { auditColumns, softDeleteColumns, timestampColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { benefitsSchema } from "../_schema";
import { dateValue, nonNegativeDecimalString } from "../_zodShared";
import { benefitPlans } from "../fundamentals/benefitPlans";

/**
 * Benefit Enrollments - Employee participation in benefit plans.
 * Circular FK note: employeeId FK added via custom SQL.
 * Audit columns are required in the database and must be set by the API or service layer.
 */
export const enrollmentStatuses = [
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
  "TERMINATED",
  "CANCELLED",
] as const;

export const enrollmentStatusEnum = benefitsSchema.enum("enrollment_status", [
  ...enrollmentStatuses,
]);

export const EnrollmentStatusSchema = z.enum(enrollmentStatuses);
export type EnrollmentStatus = z.infer<typeof EnrollmentStatusSchema>;

export const benefitCoverageLevels = [
  "EMPLOYEE_ONLY",
  "EMPLOYEE_PLUS_PARTNER",
  "EMPLOYEE_PLUS_CHILDREN",
  "FAMILY",
  "CUSTOM",
] as const;

export const CoverageLevelSchema = z.enum(benefitCoverageLevels);
export type CoverageLevel = z.infer<typeof CoverageLevelSchema>;

/**
 * Table `benefit_enrollments` — employee on a plan; one active open-ended row per (tenant, employee, plan); `employeeId` FK via custom SQL.
 */
export const benefitEnrollments = benefitsSchema.table(
  "benefit_enrollments",
  {
    enrollmentId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    benefitPlanId: integer().notNull(),
    enrollmentDate: date().notNull(),
    effectiveFrom: date().notNull(),
    effectiveTo: date(),
    employeeContribution: numeric({ precision: 10, scale: 2 }),
    coverageLevel: text(),
    /** Lifecycle: `PENDING` | `ACTIVE` | `SUSPENDED` | `TERMINATED` | `CANCELLED`. */
    status: enrollmentStatusEnum().notNull().default("PENDING"),
    terminationReason: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_benefit_enrollments_tenant").on(t.tenantId),
    index("idx_benefit_enrollments_employee").on(t.tenantId, t.employeeId),
    index("idx_benefit_enrollments_plan").on(t.tenantId, t.benefitPlanId),
    index("idx_benefit_enrollments_status").on(t.tenantId, t.status),
    index("idx_benefit_enrollments_created").on(t.tenantId, t.createdAt),
    index("idx_benefit_enrollments_effective").on(t.tenantId, t.effectiveFrom, t.effectiveTo),
    uniqueIndex("uq_benefit_enrollments_active")
      .on(t.tenantId, t.employeeId, t.benefitPlanId)
      .where(sql`${t.deletedAt} IS NULL AND ${t.status} = 'ACTIVE' AND ${t.effectiveTo} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_benefit_enrollments_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.benefitPlanId],
      foreignColumns: [benefitPlans.benefitPlanId],
      name: "fk_benefit_enrollments_plan",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_benefit_enrollments_effective_range",
      sql`${t.effectiveTo} IS NULL OR ${t.effectiveTo} >= ${t.effectiveFrom}`
    ),
    check(
      "chk_benefit_enrollments_contribution",
      sql`${t.employeeContribution} IS NULL OR ${t.employeeContribution} >= 0`
    ),
  ]
);

export const BenefitEnrollmentIdSchema = z.number().int().positive().brand<"BenefitEnrollmentId">();
export type BenefitEnrollmentId = z.infer<typeof BenefitEnrollmentIdSchema>;

export const benefitEnrollmentSelectSchema = createSelectSchema(benefitEnrollments);

export const benefitEnrollmentInsertSchema = createInsertSchema(benefitEnrollments, {
  tenantId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  benefitPlanId: z.number().int().positive(),
  enrollmentDate: z.coerce.date(),
  effectiveFrom: z.coerce.date(),
  effectiveTo: z.coerce.date().optional().nullable(),
  employeeContribution: nonNegativeDecimalString.optional(),
  coverageLevel: CoverageLevelSchema.optional(),
  status: EnrollmentStatusSchema.optional(),
  terminationReason: z.string().max(500).optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
}).superRefine((data, ctx) => {
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
  const st = data.status ?? "PENDING";
  if (st === "TERMINATED") {
    const tr = data.terminationReason?.trim() ?? "";
    if (tr.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "terminationReason is required when status is TERMINATED",
        path: ["terminationReason"],
      });
    }
  }
});

export const benefitEnrollmentUpdateSchema = createUpdateSchema(benefitEnrollments, {
  enrollmentDate: z.coerce.date().optional(),
  effectiveFrom: z.coerce.date().optional(),
  effectiveTo: z.coerce.date().optional().nullable(),
  employeeContribution: nonNegativeDecimalString.optional().nullable(),
  coverageLevel: CoverageLevelSchema.optional().nullable(),
  status: EnrollmentStatusSchema.optional(),
  terminationReason: z.string().max(500).optional().nullable(),
}).superRefine((data, ctx) => {
  if (
    data.effectiveFrom !== undefined &&
    data.effectiveTo !== undefined &&
    data.effectiveTo !== null
  ) {
    const fromT = dateValue(data.effectiveFrom);
    const toT = dateValue(data.effectiveTo);
    if (!Number.isNaN(fromT) && !Number.isNaN(toT) && toT < fromT) {
      ctx.addIssue({
        code: "custom",
        message: "effectiveTo must be on or after effectiveFrom",
        path: ["effectiveTo"],
      });
    }
  }
  if (data.status === "TERMINATED") {
    const tr =
      data.terminationReason === undefined || data.terminationReason === null
        ? ""
        : String(data.terminationReason).trim();
    if (tr.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "terminationReason is required when status is TERMINATED",
        path: ["terminationReason"],
      });
    }
  }
});

export type BenefitEnrollment = typeof benefitEnrollments.$inferSelect;
export type NewBenefitEnrollment = typeof benefitEnrollments.$inferInsert;
