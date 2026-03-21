import { integer, numeric, text, timestamp, index, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { employees } from "../../hr/fundamentals/employees";
import { payrollPeriods } from "./payrollPeriods";
import { zMoney12_2NonNegative, zMoney12_2NonNegativeOptionalNullable } from "../_zodShared";

/**
 * Tax Exemption Declarations - Employee-submitted tax exemption claims per payroll period.
 * Aggregates multiple exemption category entries for statutory tax computation.
 */
export const taxDeclarationStatuses = ["DRAFT", "SUBMITTED", "VERIFIED", "REJECTED", "CANCELLED"] as const;

export const taxDeclarationStatusEnum = payrollSchema.enum("tax_declaration_status", [...taxDeclarationStatuses]);

export const TaxDeclarationStatusSchema = z.enum(taxDeclarationStatuses);
export type TaxDeclarationStatus = z.infer<typeof TaxDeclarationStatusSchema>;

export const taxExemptionDeclarations = payrollSchema.table(
  "tax_exemption_declarations",
  {
    declarationId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    payrollPeriodId: integer().notNull(),
    totalDeclaredAmount: numeric({ precision: 12, scale: 2 }).notNull().default("0.00"),
    status: taxDeclarationStatusEnum().notNull().default("DRAFT"),
    submittedAt: timestamp({ withTimezone: true }),
    verifiedAt: timestamp({ withTimezone: true }),
    verifiedBy: integer(),
    rejectionReason: text(),
    ...timestampColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_tax_exemption_declarations_tenant").on(t.tenantId),
    index("idx_tax_exemption_declarations_employee").on(t.tenantId, t.employeeId),
    index("idx_tax_exemption_declarations_period").on(t.tenantId, t.payrollPeriodId),
    index("idx_tax_exemption_declarations_status").on(t.tenantId, t.status),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_tax_exemption_declarations_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.employeeId],
      foreignColumns: [employees.employeeId],
      name: "fk_tax_exemption_declarations_employee",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.payrollPeriodId],
      foreignColumns: [payrollPeriods.payrollPeriodId],
      name: "fk_tax_exemption_declarations_period",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const TaxExemptionDeclarationIdSchema = z.number().int().positive().brand<"TaxExemptionDeclarationId">();
export type TaxExemptionDeclarationId = z.infer<typeof TaxExemptionDeclarationIdSchema>;

export const taxExemptionDeclarationSelectSchema = createSelectSchema(taxExemptionDeclarations);

export const taxExemptionDeclarationInsertSchema = createInsertSchema(taxExemptionDeclarations, {
  tenantId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  payrollPeriodId: z.number().int().positive(),
  totalDeclaredAmount: zMoney12_2NonNegative().optional(),
  status: TaxDeclarationStatusSchema.optional(),
  verifiedBy: z.number().int().positive().optional().nullable(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const taxExemptionDeclarationUpdateSchema = createUpdateSchema(taxExemptionDeclarations, {
  totalDeclaredAmount: zMoney12_2NonNegativeOptionalNullable(),
  status: TaxDeclarationStatusSchema.optional(),
  verifiedBy: z.number().int().positive().optional().nullable(),
  updatedBy: z.number().int().positive().optional(),
})
  .omit({ tenantId: true, employeeId: true, payrollPeriodId: true });

export type TaxExemptionDeclaration = typeof taxExemptionDeclarations.$inferSelect;
export type NewTaxExemptionDeclaration = typeof taxExemptionDeclarations.$inferInsert;
