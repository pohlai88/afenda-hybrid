import { integer, text, date, numeric, timestamp, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { currencies } from "../../core/currencies";

/**
 * Final Settlements - End-of-employment payout calculations.
 * Circular FK note: employeeId, processedBy, approvedBy FKs added via custom SQL.
 */
export const settlementStatuses = ["DRAFT", "CALCULATING", "PENDING_APPROVAL", "APPROVED", "PROCESSING", "PAID", "CANCELLED"] as const;

export const settlementStatusEnum = payrollSchema.enum("settlement_status", [...settlementStatuses]);

export const settlementStatusZodEnum = createSelectSchema(settlementStatusEnum);

export const finalSettlements = payrollSchema.table(
  "final_settlements",
  {
    finalSettlementId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    settlementNumber: text().notNull(),
    terminationDate: date().notNull(),
    lastWorkingDay: date().notNull(),
    unpaidSalary: numeric({ precision: 12, scale: 2 }).notNull().default("0"),
    leaveEncashment: numeric({ precision: 12, scale: 2 }).notNull().default("0"),
    gratuity: numeric({ precision: 12, scale: 2 }).notNull().default("0"),
    bonus: numeric({ precision: 12, scale: 2 }).notNull().default("0"),
    otherEarnings: numeric({ precision: 12, scale: 2 }).notNull().default("0"),
    totalEarnings: numeric({ precision: 12, scale: 2 }).notNull(),
    loanRecovery: numeric({ precision: 12, scale: 2 }).notNull().default("0"),
    advanceRecovery: numeric({ precision: 12, scale: 2 }).notNull().default("0"),
    otherDeductions: numeric({ precision: 12, scale: 2 }).notNull().default("0"),
    totalDeductions: numeric({ precision: 12, scale: 2 }).notNull(),
    netSettlement: numeric({ precision: 12, scale: 2 }).notNull(),
    currencyId: integer().notNull(),
    status: settlementStatusEnum().notNull().default("DRAFT"),
    processedBy: integer(),
    processedAt: timestamp({ withTimezone: true }),
    approvedBy: integer(),
    approvedAt: timestamp({ withTimezone: true }),
    paidAt: timestamp({ withTimezone: true }),
    notes: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_final_settlements_tenant").on(t.tenantId),
    index("idx_final_settlements_employee").on(t.tenantId, t.employeeId),
    index("idx_final_settlements_status").on(t.tenantId, t.status),
    index("idx_final_settlements_date").on(t.tenantId, t.terminationDate),
    uniqueIndex("uq_final_settlements_number")
      .on(t.tenantId, sql`lower(${t.settlementNumber})`)
      .where(sql`${t.deletedAt} IS NULL`),
    uniqueIndex("uq_final_settlements_employee")
      .on(t.tenantId, t.employeeId)
      .where(sql`${t.deletedAt} IS NULL AND ${t.status} != 'CANCELLED'`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_final_settlements_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.currencyId],
      foreignColumns: [currencies.currencyId],
      name: "fk_final_settlements_currency",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_final_settlements_earnings",
      sql`${t.unpaidSalary} >= 0 AND ${t.leaveEncashment} >= 0 AND ${t.gratuity} >= 0 AND ${t.bonus} >= 0 AND ${t.otherEarnings} >= 0`
    ),
    check(
      "chk_final_settlements_deductions",
      sql`${t.loanRecovery} >= 0 AND ${t.advanceRecovery} >= 0 AND ${t.otherDeductions} >= 0`
    ),
    check(
      "chk_final_settlements_totals",
      sql`${t.totalEarnings} >= 0 AND ${t.totalDeductions} >= 0`
    ),
    check(
      "chk_final_settlements_dates",
      sql`${t.lastWorkingDay} <= ${t.terminationDate}`
    ),
  ]
);

export const FinalSettlementIdSchema = z.number().int().brand<"FinalSettlementId">();
export type FinalSettlementId = z.infer<typeof FinalSettlementIdSchema>;

export const finalSettlementSelectSchema = createSelectSchema(finalSettlements);

export const finalSettlementInsertSchema = createInsertSchema(finalSettlements, {
  settlementNumber: z.string().min(1).max(50),
  unpaidSalary: z.string().optional(),
  leaveEncashment: z.string().optional(),
  gratuity: z.string().optional(),
  bonus: z.string().optional(),
  otherEarnings: z.string().optional(),
  totalEarnings: z.string(),
  loanRecovery: z.string().optional(),
  advanceRecovery: z.string().optional(),
  otherDeductions: z.string().optional(),
  totalDeductions: z.string(),
  netSettlement: z.string(),
  notes: z.string().max(2000).optional(),
});

export const finalSettlementUpdateSchema = createUpdateSchema(finalSettlements);

export type FinalSettlement = typeof finalSettlements.$inferSelect;
export type NewFinalSettlement = typeof finalSettlements.$inferInsert;
