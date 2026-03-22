import { integer, date, text, timestamp, index, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { benefitsSchema } from "../_schema";
import { timestampColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { employees } from "../../hr/fundamentals/employees";
import { benefitPlans } from "../fundamentals/benefitPlans";
import { CoverageLevelSchema } from "./benefitEnrollments";

/**
 * Benefit Applications - Employee requests to enroll in benefit plans.
 * Tracks application workflow from draft through approval/rejection.
 */
export const benefitApplicationStatuses = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "WITHDRAWN",
] as const;

export const benefitApplicationStatusEnum = benefitsSchema.enum("benefit_application_status", [
  ...benefitApplicationStatuses,
]);

export const BenefitApplicationStatusSchema = z.enum(benefitApplicationStatuses);
export type BenefitApplicationStatus = z.infer<typeof BenefitApplicationStatusSchema>;

export const benefitApplications = benefitsSchema.table(
  "benefit_applications",
  {
    applicationId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    benefitPlanId: integer().notNull(),
    requestedCoverageLevel: text().notNull(),
    effectiveDate: date().notNull(),
    status: benefitApplicationStatusEnum().notNull().default("DRAFT"),
    submittedAt: timestamp({ withTimezone: true }),
    approvedAt: timestamp({ withTimezone: true }),
    approvedBy: integer(),
    rejectionReason: text(),
    ...timestampColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_benefit_applications_tenant").on(t.tenantId),
    index("idx_benefit_applications_employee").on(t.tenantId, t.employeeId),
    index("idx_benefit_applications_plan").on(t.tenantId, t.benefitPlanId),
    index("idx_benefit_applications_status").on(t.tenantId, t.status),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_benefit_applications_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.employeeId],
      foreignColumns: [employees.employeeId],
      name: "fk_benefit_applications_employee",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.benefitPlanId],
      foreignColumns: [benefitPlans.benefitPlanId],
      name: "fk_benefit_applications_plan",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const BenefitApplicationIdSchema = z
  .number()
  .int()
  .positive()
  .brand<"BenefitApplicationId">();
export type BenefitApplicationId = z.infer<typeof BenefitApplicationIdSchema>;

export const benefitApplicationSelectSchema = createSelectSchema(benefitApplications);

export const benefitApplicationInsertSchema = createInsertSchema(benefitApplications, {
  tenantId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  benefitPlanId: z.number().int().positive(),
  requestedCoverageLevel: CoverageLevelSchema,
  effectiveDate: z.coerce.date(),
  status: BenefitApplicationStatusSchema.optional(),
  approvedBy: z.number().int().positive().optional().nullable(),
  rejectionReason: z.string().max(1000).optional().nullable(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const benefitApplicationUpdateSchema = createUpdateSchema(benefitApplications, {
  requestedCoverageLevel: CoverageLevelSchema.optional(),
  effectiveDate: z.coerce.date().optional(),
  status: BenefitApplicationStatusSchema.optional(),
  approvedBy: z.number().int().positive().optional().nullable(),
  rejectionReason: z.string().max(1000).optional().nullable(),
  updatedBy: z.number().int().positive().optional(),
}).omit({ tenantId: true, employeeId: true, benefitPlanId: true });

export type BenefitApplication = typeof benefitApplications.$inferSelect;
export type NewBenefitApplication = typeof benefitApplications.$inferInsert;
