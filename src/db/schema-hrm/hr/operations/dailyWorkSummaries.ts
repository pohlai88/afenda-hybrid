import { integer, date, text, index, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import { timestampColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { employees } from "../fundamentals/employees";

/**
 * Daily Work Summaries - Employee daily work logs and activity summaries.
 * Simple logging table for tracking daily work activities and accomplishments.
 */
export const dailyWorkSummaries = hrSchema.table(
  "daily_work_summaries",
  {
    summaryId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    summaryDate: date().notNull(),
    content: text().notNull(),
    ...timestampColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_daily_work_summaries_tenant").on(t.tenantId),
    index("idx_daily_work_summaries_employee").on(t.tenantId, t.employeeId),
    index("idx_daily_work_summaries_date").on(t.tenantId, t.summaryDate),
    index("idx_daily_work_summaries_employee_date").on(t.tenantId, t.employeeId, t.summaryDate),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_daily_work_summaries_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.employeeId],
      foreignColumns: [employees.employeeId],
      name: "fk_daily_work_summaries_employee",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const DailyWorkSummaryIdSchema = z.number().int().positive().brand<"DailyWorkSummaryId">();
export type DailyWorkSummaryId = z.infer<typeof DailyWorkSummaryIdSchema>;

export const dailyWorkSummarySelectSchema = createSelectSchema(dailyWorkSummaries);

export const dailyWorkSummaryInsertSchema = createInsertSchema(dailyWorkSummaries, {
  tenantId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  summaryDate: z.coerce.date(),
  content: z.string().min(10).max(5000),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const dailyWorkSummaryUpdateSchema = createUpdateSchema(dailyWorkSummaries, {
  content: z.string().min(10).max(5000).optional(),
  updatedBy: z.number().int().positive().optional(),
})
  .omit({ tenantId: true, employeeId: true, summaryDate: true });

export type DailyWorkSummary = typeof dailyWorkSummaries.$inferSelect;
export type NewDailyWorkSummary = typeof dailyWorkSummaries.$inferInsert;
