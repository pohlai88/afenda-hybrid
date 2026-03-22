import { integer, text, timestamp, index, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { payrollSchema } from "../_schema";
import { timestampColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { employees } from "../../hr/fundamentals/employees";
import { payrollRuns } from "./payrollRuns";

/**
 * Payroll Corrections - Adjustments to processed payroll runs.
 * Tracks corrections for errors, missed components, or retroactive changes.
 */
export const payrollCorrectionStatuses = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "APPLIED",
  "REJECTED",
] as const;

export const payrollCorrectionStatusEnum = payrollSchema.enum("payroll_correction_status", [
  ...payrollCorrectionStatuses,
]);

export const PayrollCorrectionStatusSchema = z.enum(payrollCorrectionStatuses);
export type PayrollCorrectionStatus = z.infer<typeof PayrollCorrectionStatusSchema>;

export const payrollCorrections = payrollSchema.table(
  "payroll_corrections",
  {
    correctionId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    payrollRunId: integer().notNull(),
    employeeId: integer().notNull(),
    reason: text().notNull(),
    status: payrollCorrectionStatusEnum().notNull().default("DRAFT"),
    submittedAt: timestamp({ withTimezone: true }),
    approvedAt: timestamp({ withTimezone: true }),
    approvedBy: integer(),
    appliedAt: timestamp({ withTimezone: true }),
    rejectionReason: text(),
    ...timestampColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_payroll_corrections_tenant").on(t.tenantId),
    index("idx_payroll_corrections_run").on(t.tenantId, t.payrollRunId),
    index("idx_payroll_corrections_employee").on(t.tenantId, t.employeeId),
    index("idx_payroll_corrections_status").on(t.tenantId, t.status),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_payroll_corrections_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.payrollRunId],
      foreignColumns: [payrollRuns.payrollRunId],
      name: "fk_payroll_corrections_run",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.employeeId],
      foreignColumns: [employees.employeeId],
      name: "fk_payroll_corrections_employee",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const PayrollCorrectionIdSchema = z.number().int().positive().brand<"PayrollCorrectionId">();
export type PayrollCorrectionId = z.infer<typeof PayrollCorrectionIdSchema>;

export const payrollCorrectionSelectSchema = createSelectSchema(payrollCorrections);

export const payrollCorrectionInsertSchema = createInsertSchema(payrollCorrections, {
  tenantId: z.number().int().positive(),
  payrollRunId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  reason: z.string().min(10).max(1000),
  status: PayrollCorrectionStatusSchema.optional(),
  approvedBy: z.number().int().positive().optional().nullable(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const payrollCorrectionUpdateSchema = createUpdateSchema(payrollCorrections, {
  reason: z.string().min(10).max(1000).optional(),
  status: PayrollCorrectionStatusSchema.optional(),
  approvedBy: z.number().int().positive().optional().nullable(),
  updatedBy: z.number().int().positive().optional(),
}).omit({ tenantId: true, payrollRunId: true, employeeId: true });

export type PayrollCorrection = typeof payrollCorrections.$inferSelect;
export type NewPayrollCorrection = typeof payrollCorrections.$inferInsert;
