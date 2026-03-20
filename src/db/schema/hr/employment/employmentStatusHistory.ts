import { integer, text, date, index, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { hrSchema } from "../_schema";
import { appendOnlyTimestampColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { employeeStatusEnum } from "../fundamentals/employees";

/**
 * Employment Status History - Temporal tracking of employee status changes.
 * Append-only table for audit trail of status transitions.
 * Circular FK note: employeeId and changedBy FKs added via custom SQL.
 */
export const employmentStatusHistory = hrSchema.table(
  "employment_status_history",
  {
    statusHistoryId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    previousStatus: employeeStatusEnum(),
    newStatus: employeeStatusEnum().notNull(),
    effectiveDate: date().notNull(),
    reason: text(),
    changedBy: integer(),
    ...appendOnlyTimestampColumns,
  },
  (t) => [
    index("idx_employment_status_history_tenant").on(t.tenantId),
    index("idx_employment_status_history_employee").on(t.tenantId, t.employeeId),
    index("idx_employment_status_history_date").on(t.tenantId, t.employeeId, t.effectiveDate),
    index("idx_employment_status_history_status").on(t.tenantId, t.newStatus),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_employment_status_history_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const EmploymentStatusHistoryIdSchema = z.number().int().brand<"EmploymentStatusHistoryId">();
export type EmploymentStatusHistoryId = z.infer<typeof EmploymentStatusHistoryIdSchema>;

export const employmentStatusHistorySelectSchema = createSelectSchema(employmentStatusHistory);

export const employmentStatusHistoryInsertSchema = createInsertSchema(employmentStatusHistory, {
  reason: z.string().max(1000).optional(),
});

export type EmploymentStatusHistory = typeof employmentStatusHistory.$inferSelect;
export type NewEmploymentStatusHistory = typeof employmentStatusHistory.$inferInsert;
