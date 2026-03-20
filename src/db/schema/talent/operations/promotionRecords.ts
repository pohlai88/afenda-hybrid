import { integer, text, date, numeric, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { talentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { currencies } from "../../core/currencies";

/**
 * Promotion Records - Grade/role advancement tracking.
 * Circular FK note: employeeId, fromPosition, toPosition, fromGrade, toGrade, approvedBy FKs added via custom SQL.
 */
export const promotionStatuses = ["PENDING", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED"] as const;

export const promotionStatusEnum = talentSchema.enum("promotion_status", [...promotionStatuses]);

export const promotionStatusZodEnum = createSelectSchema(promotionStatusEnum);

export const promotionRecords = talentSchema.table(
  "promotion_records",
  {
    promotionRecordId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    fromPositionId: integer(),
    toPositionId: integer(),
    fromGradeId: integer(),
    toGradeId: integer(),
    effectiveDate: date().notNull(),
    salaryIncrease: numeric({ precision: 12, scale: 2 }),
    salaryIncreasePercent: numeric({ precision: 5, scale: 2 }),
    currencyId: integer(),
    reason: text(),
    status: promotionStatusEnum().notNull().default("PENDING"),
    approvedBy: integer(),
    approvedAt: date(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_promotion_records_tenant").on(t.tenantId),
    index("idx_promotion_records_employee").on(t.tenantId, t.employeeId),
    index("idx_promotion_records_status").on(t.tenantId, t.status),
    index("idx_promotion_records_date").on(t.tenantId, t.effectiveDate),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_promotion_records_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.currencyId],
      foreignColumns: [currencies.currencyId],
      name: "fk_promotion_records_currency",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_promotion_records_salary_increase",
      sql`${t.salaryIncrease} IS NULL OR ${t.salaryIncrease} >= 0`
    ),
    check(
      "chk_promotion_records_salary_percent",
      sql`${t.salaryIncreasePercent} IS NULL OR ${t.salaryIncreasePercent} >= 0`
    ),
  ]
);

export const PromotionRecordIdSchema = z.number().int().brand<"PromotionRecordId">();
export type PromotionRecordId = z.infer<typeof PromotionRecordIdSchema>;

export const promotionRecordSelectSchema = createSelectSchema(promotionRecords);

export const promotionRecordInsertSchema = createInsertSchema(promotionRecords, {
  salaryIncrease: z.string().optional(),
  salaryIncreasePercent: z.string().optional(),
  reason: z.string().max(2000).optional(),
});

export const promotionRecordUpdateSchema = createUpdateSchema(promotionRecords);

export type PromotionRecord = typeof promotionRecords.$inferSelect;
export type NewPromotionRecord = typeof promotionRecords.$inferInsert;
