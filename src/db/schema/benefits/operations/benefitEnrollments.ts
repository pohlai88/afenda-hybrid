import { integer, text, date, numeric, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { benefitsSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { benefitPlans } from "../fundamentals/benefitPlans";

/**
 * Benefit Enrollments - Employee participation in benefit plans.
 * Circular FK note: employeeId FK added via custom SQL.
 */
export const enrollmentStatuses = ["PENDING", "ACTIVE", "SUSPENDED", "TERMINATED", "CANCELLED"] as const;

export const enrollmentStatusEnum = benefitsSchema.enum("enrollment_status", [...enrollmentStatuses]);

export const enrollmentStatusZodEnum = createSelectSchema(enrollmentStatusEnum);

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

export const BenefitEnrollmentIdSchema = z.number().int().brand<"BenefitEnrollmentId">();
export type BenefitEnrollmentId = z.infer<typeof BenefitEnrollmentIdSchema>;

export const benefitEnrollmentSelectSchema = createSelectSchema(benefitEnrollments);

export const benefitEnrollmentInsertSchema = createInsertSchema(benefitEnrollments, {
  employeeContribution: z.string().optional(),
  coverageLevel: z.string().max(100).optional(),
  terminationReason: z.string().max(500).optional(),
});

export const benefitEnrollmentUpdateSchema = createUpdateSchema(benefitEnrollments);

export type BenefitEnrollment = typeof benefitEnrollments.$inferSelect;
export type NewBenefitEnrollment = typeof benefitEnrollments.$inferInsert;
