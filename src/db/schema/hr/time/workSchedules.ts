import { integer, text, numeric, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../_shared";
import { tenants } from "../../core/tenants";

/**
 * Work Schedules - Shift patterns and working hour templates.
 * Used for attendance tracking, overtime calculation, and payroll.
 */
export const scheduleTypes = ["FIXED", "ROTATING", "FLEXIBLE", "COMPRESSED", "SPLIT"] as const;

export const scheduleTypeEnum = hrSchema.enum("schedule_type", [...scheduleTypes]);

export const scheduleTypeZodEnum = createSelectSchema(scheduleTypeEnum);

export const scheduleStatuses = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;

export const scheduleStatusEnum = hrSchema.enum("schedule_status", [...scheduleStatuses]);

export const scheduleStatusZodEnum = createSelectSchema(scheduleStatusEnum);

export const workSchedules = hrSchema.table(
  "work_schedules",
  {
    scheduleId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    scheduleCode: text().notNull(),
    ...nameColumn,
    scheduleType: scheduleTypeEnum().notNull().default("FIXED"),
    weeklyHours: numeric({ precision: 4, scale: 1 }).notNull().default("40.0"),
    description: text(),
    status: scheduleStatusEnum().notNull().default("ACTIVE"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_work_schedules_tenant").on(t.tenantId),
    index("idx_work_schedules_type").on(t.tenantId, t.scheduleType),
    index("idx_work_schedules_status").on(t.tenantId, t.status),
    uniqueIndex("uq_work_schedules_code")
      .on(t.tenantId, sql`lower(${t.scheduleCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_work_schedules_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const WorkScheduleIdSchema = z.number().int().brand<"WorkScheduleId">();
export type WorkScheduleId = z.infer<typeof WorkScheduleIdSchema>;

export const workScheduleSelectSchema = createSelectSchema(workSchedules);

export const workScheduleInsertSchema = createInsertSchema(workSchedules, {
  scheduleCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  name: z.string().min(1).max(200),
  weeklyHours: z.string().refine((val) => {
    const num = parseFloat(val);
    return num > 0 && num <= 168;
  }, "Weekly hours must be between 0 and 168"),
  description: z.string().max(1000).optional(),
});

export const workScheduleUpdateSchema = createUpdateSchema(workSchedules);

export type WorkSchedule = typeof workSchedules.$inferSelect;
export type NewWorkSchedule = typeof workSchedules.$inferInsert;
