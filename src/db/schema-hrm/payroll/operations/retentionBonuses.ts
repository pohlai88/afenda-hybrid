import { integer, numeric, date, text, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { employees } from "../../hr/fundamentals/employees";
import { zMoney12_2Positive, zMoney12_2PositiveOptionalNullable } from "../_zodShared";

/**
 * Retention Bonuses - One-time bonuses to retain key employees.
 * Tracks approval, payment status, and payable dates.
 */
export const retentionBonusStatuses = ["DRAFT", "APPROVED", "PAID", "CANCELLED"] as const;

export const retentionBonusStatusEnum = payrollSchema.enum("retention_bonus_status", [...retentionBonusStatuses]);

export const RetentionBonusStatusSchema = z.enum(retentionBonusStatuses);
export type RetentionBonusStatus = z.infer<typeof RetentionBonusStatusSchema>;

export const retentionBonuses = payrollSchema.table(
  "retention_bonuses",
  {
    bonusId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    amount: numeric({ precision: 12, scale: 2 }).notNull(),
    payableDate: date().notNull(),
    reason: text(),
    status: retentionBonusStatusEnum().notNull().default("DRAFT"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_retention_bonuses_tenant").on(t.tenantId),
    index("idx_retention_bonuses_employee").on(t.tenantId, t.employeeId),
    index("idx_retention_bonuses_status").on(t.tenantId, t.status),
    index("idx_retention_bonuses_payable_date").on(t.tenantId, t.payableDate),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_retention_bonuses_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.employeeId],
      foreignColumns: [employees.employeeId],
      name: "fk_retention_bonuses_employee",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_retention_bonuses_amount",
      sql`${t.amount} > 0`
    ),
  ]
);

export const RetentionBonusIdSchema = z.number().int().positive().brand<"RetentionBonusId">();
export type RetentionBonusId = z.infer<typeof RetentionBonusIdSchema>;

export const retentionBonusSelectSchema = createSelectSchema(retentionBonuses);

export const retentionBonusInsertSchema = createInsertSchema(retentionBonuses, {
  tenantId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  amount: zMoney12_2Positive(),
  payableDate: z.coerce.date(),
  reason: z.string().max(1000).optional().nullable(),
  status: RetentionBonusStatusSchema.optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const retentionBonusUpdateSchema = createUpdateSchema(retentionBonuses, {
  amount: zMoney12_2PositiveOptionalNullable(),
  payableDate: z.coerce.date().optional(),
  reason: z.string().max(1000).optional().nullable(),
  status: RetentionBonusStatusSchema.optional(),
  updatedBy: z.number().int().positive().optional(),
})
  .omit({ tenantId: true, employeeId: true });

export type RetentionBonus = typeof retentionBonuses.$inferSelect;
export type NewRetentionBonus = typeof retentionBonuses.$inferInsert;
