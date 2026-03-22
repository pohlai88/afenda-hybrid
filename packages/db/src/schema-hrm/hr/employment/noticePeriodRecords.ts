import { integer, text, date, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import {
  dateNullableOptionalSchema,
  dateStringSchema,
  hrBounds,
  nullableOptional,
  refineNoticeActualLastOnOrAfterNoticeDate,
  refineNoticeExpectedLastOnOrAfterNoticeDate,
} from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";

/**
 * Notice Period Records - Termination notice tracking.
 * Circular FK note: employeeId and approvedBy FKs added via custom SQL.
 */
export const noticeInitiators = ["EMPLOYEE", "EMPLOYER", "MUTUAL"] as const;

export const noticeInitiatorEnum = hrSchema.enum("notice_initiator", [...noticeInitiators]);

export const noticeInitiatorZodEnum = z.enum(noticeInitiators);

export const noticeStatuses = ["PENDING", "ACTIVE", "COMPLETED", "WITHDRAWN", "WAIVED"] as const;

export const noticeStatusEnum = hrSchema.enum("notice_status", [...noticeStatuses]);

export const noticeStatusZodEnum = z.enum(noticeStatuses);

export const noticePeriodRecords = hrSchema.table(
  "notice_period_records",
  {
    noticePeriodRecordId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    initiatedBy: noticeInitiatorEnum().notNull(),
    noticeDate: date().notNull(),
    requiredNoticeDays: integer().notNull(),
    actualLastDay: date(),
    expectedLastDay: date().notNull(),
    status: noticeStatusEnum().notNull().default("PENDING"),
    reason: text(),
    approvedBy: integer(),
    approvalDate: date(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_notice_period_records_tenant").on(t.tenantId),
    index("idx_notice_period_records_employee").on(t.tenantId, t.employeeId),
    index("idx_notice_period_records_status").on(t.tenantId, t.status),
    index("idx_notice_period_records_dates").on(t.tenantId, t.noticeDate, t.expectedLastDay),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_notice_period_records_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check("chk_notice_period_records_expected_date", sql`${t.expectedLastDay} >= ${t.noticeDate}`),
    check(
      "chk_notice_period_records_actual_date",
      sql`${t.actualLastDay} IS NULL OR ${t.actualLastDay} >= ${t.noticeDate}`
    ),
    check("chk_notice_period_records_notice_days", sql`${t.requiredNoticeDays} >= 0`),
  ]
);

export const NoticePeriodRecordIdSchema = z.number().int().brand<"NoticePeriodRecordId">();
export type NoticePeriodRecordId = z.infer<typeof NoticePeriodRecordIdSchema>;

export const noticePeriodRecordSelectSchema = createSelectSchema(noticePeriodRecords);

export const noticePeriodRecordInsertSchema = createInsertSchema(noticePeriodRecords, {
  requiredNoticeDays: z.number().int().min(0).max(365),
  reason: z.string().max(hrBounds.reasonMax).optional(),
}).superRefine((data, ctx) => {
  refineNoticeExpectedLastOnOrAfterNoticeDate(data, ctx);
  refineNoticeActualLastOnOrAfterNoticeDate(data, ctx);
});

export const noticePeriodRecordUpdateSchema = createUpdateSchema(noticePeriodRecords, {
  noticeDate: dateStringSchema.optional(),
  expectedLastDay: dateStringSchema.optional(),
  actualLastDay: dateNullableOptionalSchema,
  requiredNoticeDays: z.number().int().min(0).max(365).optional(),
  reason: nullableOptional(z.string().max(hrBounds.reasonMax)),
  approvedBy: nullableOptional(z.number().int()),
  approvalDate: dateNullableOptionalSchema,
}).superRefine((data, ctx) => {
  refineNoticeExpectedLastOnOrAfterNoticeDate(data, ctx);
  refineNoticeActualLastOnOrAfterNoticeDate(data, ctx);
});

export type NoticePeriodRecord = typeof noticePeriodRecords.$inferSelect;
export type NewNoticePeriodRecord = typeof noticePeriodRecords.$inferInsert;
