import { integer, text, smallint, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../_shared";
import { tenants } from "../../core/tenants";
import { regions } from "../../core/regions";

/**
 * Holiday Calendars - Public holiday calendars by region and year.
 * Used for leave calculation and attendance tracking.
 */
export const holidayCalendarStatuses = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;

export const holidayCalendarStatusEnum = hrSchema.enum("holiday_calendar_status", [...holidayCalendarStatuses]);

export const holidayCalendarStatusZodEnum = createSelectSchema(holidayCalendarStatusEnum);

export const holidayCalendars = hrSchema.table(
  "holiday_calendars",
  {
    calendarId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    calendarCode: text().notNull(),
    ...nameColumn,
    regionId: integer(),
    year: smallint().notNull(),
    description: text(),
    status: holidayCalendarStatusEnum().notNull().default("DRAFT"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_holiday_calendars_tenant").on(t.tenantId),
    index("idx_holiday_calendars_region").on(t.tenantId, t.regionId),
    index("idx_holiday_calendars_year").on(t.tenantId, t.year),
    index("idx_holiday_calendars_status").on(t.tenantId, t.status),
    uniqueIndex("uq_holiday_calendars_code")
      .on(t.tenantId, sql`lower(${t.calendarCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    uniqueIndex("uq_holiday_calendars_region_year")
      .on(t.tenantId, t.regionId, t.year)
      .where(sql`${t.deletedAt} IS NULL AND ${t.regionId} IS NOT NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_holiday_calendars_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.regionId],
      foreignColumns: [regions.regionId],
      name: "fk_holiday_calendars_region",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const HolidayCalendarIdSchema = z.number().int().brand<"HolidayCalendarId">();
export type HolidayCalendarId = z.infer<typeof HolidayCalendarIdSchema>;

export const holidayCalendarSelectSchema = createSelectSchema(holidayCalendars);

export const holidayCalendarInsertSchema = createInsertSchema(holidayCalendars, {
  calendarCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  name: z.string().min(1).max(200),
  year: z.number().int().min(2000).max(2100),
  description: z.string().max(1000).optional(),
});

export const holidayCalendarUpdateSchema = createUpdateSchema(holidayCalendars);

export type HolidayCalendar = typeof holidayCalendars.$inferSelect;
export type NewHolidayCalendar = typeof holidayCalendars.$inferInsert;
