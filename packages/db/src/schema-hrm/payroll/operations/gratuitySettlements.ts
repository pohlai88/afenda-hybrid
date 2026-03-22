import { integer, numeric, date, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { employees } from "../../hr/fundamentals/employees";
import { gratuityRules } from "../fundamentals/gratuityRules";
import { zMoney12_2Positive, zMoney12_2PositiveOptionalNullable } from "../_zodShared";

/**
 * Gratuity Settlements - End-of-service gratuity payments.
 * Calculates and tracks gratuity payments based on years of service and applicable rules.
 */
export const gratuitySettlementStatuses = [
  "DRAFT",
  "CALCULATED",
  "APPROVED",
  "PAID",
  "CANCELLED",
] as const;

export const gratuitySettlementStatusEnum = payrollSchema.enum("gratuity_settlement_status", [
  ...gratuitySettlementStatuses,
]);

export const GratuitySettlementStatusSchema = z.enum(gratuitySettlementStatuses);
export type GratuitySettlementStatus = z.infer<typeof GratuitySettlementStatusSchema>;

const yearsOfServiceSchema = z
  .string()
  .regex(/^\d{1,3}(\.\d{1,2})?$/, "must be valid numeric(5,2) >= 0");

export const gratuitySettlements = payrollSchema.table(
  "gratuity_settlements",
  {
    settlementId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    gratuityRuleId: integer().notNull(),
    totalYears: numeric({ precision: 5, scale: 2 }).notNull(),
    amount: numeric({ precision: 12, scale: 2 }).notNull(),
    settlementDate: date().notNull(),
    status: gratuitySettlementStatusEnum().notNull().default("DRAFT"),
    ...timestampColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_gratuity_settlements_tenant").on(t.tenantId),
    index("idx_gratuity_settlements_employee").on(t.tenantId, t.employeeId),
    index("idx_gratuity_settlements_status").on(t.tenantId, t.status),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_gratuity_settlements_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.employeeId],
      foreignColumns: [employees.employeeId],
      name: "fk_gratuity_settlements_employee",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.gratuityRuleId],
      foreignColumns: [gratuityRules.ruleId],
      name: "fk_gratuity_settlements_rule",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check("chk_gratuity_settlements_years", sql`${t.totalYears} >= 0`),
    check("chk_gratuity_settlements_amount", sql`${t.amount} >= 0`),
  ]
);

export const GratuitySettlementIdSchema = z
  .number()
  .int()
  .positive()
  .brand<"GratuitySettlementId">();
export type GratuitySettlementId = z.infer<typeof GratuitySettlementIdSchema>;

export const gratuitySettlementSelectSchema = createSelectSchema(gratuitySettlements);

export const gratuitySettlementInsertSchema = createInsertSchema(gratuitySettlements, {
  tenantId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  gratuityRuleId: z.number().int().positive(),
  totalYears: yearsOfServiceSchema,
  amount: zMoney12_2Positive(),
  settlementDate: z.coerce.date(),
  status: GratuitySettlementStatusSchema.optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const gratuitySettlementUpdateSchema = createUpdateSchema(gratuitySettlements, {
  totalYears: yearsOfServiceSchema.optional(),
  amount: zMoney12_2PositiveOptionalNullable(),
  settlementDate: z.coerce.date().optional(),
  status: GratuitySettlementStatusSchema.optional(),
  updatedBy: z.number().int().positive().optional(),
}).omit({ tenantId: true, employeeId: true, gratuityRuleId: true });

export type GratuitySettlement = typeof gratuitySettlements.$inferSelect;
export type NewGratuitySettlement = typeof gratuitySettlements.$inferInsert;
