import { integer, date, text, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { employees } from "../../hr/fundamentals/employees";

/**
 * Salary Withholdings - Temporary holds on salary payments.
 * Tracks periods when salary is withheld (e.g., pending investigation, legal order).
 */
export const salaryWithholdingStatuses = ["ACTIVE", "RELEASED", "CANCELLED"] as const;

export const salaryWithholdingStatusEnum = payrollSchema.enum("salary_withholding_status", [...salaryWithholdingStatuses]);

export const SalaryWithholdingStatusSchema = z.enum(salaryWithholdingStatuses);
export type SalaryWithholdingStatus = z.infer<typeof SalaryWithholdingStatusSchema>;

export const salaryWithholdings = payrollSchema.table(
  "salary_withholdings",
  {
    withholdingId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    startDate: date().notNull(),
    endDate: date(),
    reason: text().notNull(),
    status: salaryWithholdingStatusEnum().notNull().default("ACTIVE"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_salary_withholdings_tenant").on(t.tenantId),
    index("idx_salary_withholdings_employee").on(t.tenantId, t.employeeId),
    index("idx_salary_withholdings_status").on(t.tenantId, t.status),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_salary_withholdings_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.employeeId],
      foreignColumns: [employees.employeeId],
      name: "fk_salary_withholdings_employee",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_salary_withholdings_date_range",
      sql`${t.endDate} IS NULL OR ${t.endDate} >= ${t.startDate}`
    ),
  ]
);

export const SalaryWithholdingIdSchema = z.number().int().positive().brand<"SalaryWithholdingId">();
export type SalaryWithholdingId = z.infer<typeof SalaryWithholdingIdSchema>;

export const salaryWithholdingSelectSchema = createSelectSchema(salaryWithholdings);

export const salaryWithholdingInsertSchema = createInsertSchema(salaryWithholdings, {
  tenantId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  reason: z.string().min(10).max(1000),
  status: SalaryWithholdingStatusSchema.optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
}).superRefine((data, ctx) => {
  if (data.endDate && data.endDate < data.startDate) {
    ctx.addIssue({
      code: "custom",
      message: "endDate must be on or after startDate",
      path: ["endDate"],
    });
  }
});

export const salaryWithholdingUpdateSchema = createUpdateSchema(salaryWithholdings, {
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional().nullable(),
  reason: z.string().min(10).max(1000).optional(),
  status: SalaryWithholdingStatusSchema.optional(),
  updatedBy: z.number().int().positive().optional(),
})
  .omit({ tenantId: true, employeeId: true });

export type SalaryWithholding = typeof salaryWithholdings.$inferSelect;
export type NewSalaryWithholding = typeof salaryWithholdings.$inferInsert;
