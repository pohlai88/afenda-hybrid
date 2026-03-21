import {
  integer,
  text,
  date,
  timestamp,
  numeric,
  index,
  uniqueIndex,
  foreignKey,
  check,
} from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { talentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { currencies } from "../../../schema-platform/core/currencies";

/**
 * Promotion Records - Grade/role advancement tracking.
 * Circular FK note: employeeId, fromPositionId, toPositionId, fromGradeId, toGradeId FKs added via custom SQL.
 *
 * Lifecycle: `approvedBy` / `approvedAt` are both NULL or both set, and only non-NULL when `status` is
 * `APPROVED` or `COMPLETED` (enforced with CHECK — no trigger). `effectiveDate` may be in the past
 * (retroactive promotions). Preflight: `docs/preflight-promotion-records-approval.sql`.
 */
export const promotionStatuses = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
  "CANCELLED",
] as const;

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
    approvedAt: timestamp({ withTimezone: true }),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_promotion_records_tenant").on(t.tenantId),
    index("idx_promotion_records_tenant_op_date").on(t.tenantId, t.status, t.approvedAt),
    index("idx_promotion_records_employee").on(t.tenantId, t.employeeId),
    index("idx_promotion_records_status").on(t.tenantId, t.status),
    index("idx_promotion_records_date").on(t.tenantId, t.effectiveDate),
    index("idx_promotion_records_approved_at").on(t.tenantId, t.approvedAt),
    index("idx_promotion_records_approved_reporting")
      .on(t.tenantId, t.employeeId)
      .where(
        sql`${t.deletedAt} IS NULL AND ${t.status} = ${sql.raw(`'APPROVED'::"talent"."promotion_status"`)}`
      ),
    index("idx_promotion_records_completed_reporting")
      .on(t.tenantId, t.employeeId, t.effectiveDate)
      .where(
        sql`${t.deletedAt} IS NULL AND ${t.status} = ${sql.raw(`'COMPLETED'::"talent"."promotion_status"`)}`
      ),
    uniqueIndex("uq_promotion_records_employee_effective")
      .on(t.tenantId, t.employeeId, t.effectiveDate)
      .where(sql`${t.deletedAt} IS NULL`),
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
    check(
      "chk_promotion_records_approval_consistency",
      sql`((${t.approvedBy} IS NULL) = (${t.approvedAt} IS NULL)) AND
          (${t.status}::text NOT IN ('APPROVED', 'COMPLETED') OR (${t.approvedBy} IS NOT NULL AND ${t.approvedAt} IS NOT NULL))`
    ),
  ]
);

export const PromotionRecordIdSchema = z.number().int().brand<"PromotionRecordId">();
export type PromotionRecordId = z.infer<typeof PromotionRecordIdSchema>;

export const promotionRecordSelectSchema = createSelectSchema(promotionRecords);

export const promotionRecordInsertSchema = createInsertSchema(promotionRecords, {
  /** Matches `numeric(12,2)` */
  salaryIncrease: z.coerce.number().nonnegative().optional(),
  /** Matches `numeric(5,2)` (e.g. percent points) */
  salaryIncreasePercent: z.coerce.number().nonnegative().max(999.99).optional(),
  reason: z.string().max(2000).optional(),
});

export const promotionRecordUpdateSchema = createUpdateSchema(promotionRecords, {
  salaryIncrease: z.coerce.number().nonnegative().optional(),
  salaryIncreasePercent: z.coerce.number().nonnegative().max(999.99).optional(),
  reason: z.string().max(2000).optional(),
});

export type PromotionRecord = typeof promotionRecords.$inferSelect;
export type NewPromotionRecord = typeof promotionRecords.$inferInsert;
