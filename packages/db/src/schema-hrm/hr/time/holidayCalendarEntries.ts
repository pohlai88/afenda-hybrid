import { integer, text, date, boolean, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import { dateStringSchema, nullableOptional } from "../_zodShared";
import { timestampColumns, softDeleteColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { holidayCalendars } from "./holidayCalendars";

/**
 * Holiday Calendar Entries - Individual holiday dates within a calendar.
 * tenantId is denormalized from parent calendar for RLS enforcement.
 */
export const holidayCalendarEntries = hrSchema.table(
  "holiday_calendar_entries",
  {
    entryId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    calendarId: integer().notNull(),
    holidayDate: date().notNull(),
    name: text().notNull(),
    isHalfDay: boolean().notNull().default(false),
    description: text(),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (t) => [
    index("idx_holiday_calendar_entries_tenant").on(t.tenantId),
    index("idx_holiday_calendar_entries_calendar").on(t.tenantId, t.calendarId),
    index("idx_holiday_calendar_entries_date").on(t.tenantId, t.calendarId, t.holidayDate),
    uniqueIndex("uq_holiday_calendar_entries_date")
      .on(t.tenantId, t.calendarId, t.holidayDate)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_holiday_calendar_entries_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.calendarId],
      foreignColumns: [holidayCalendars.calendarId],
      name: "fk_holiday_calendar_entries_calendar",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ]
);

export const HolidayCalendarEntryIdSchema = z.number().int().brand<"HolidayCalendarEntryId">();
export type HolidayCalendarEntryId = z.infer<typeof HolidayCalendarEntryIdSchema>;

export const holidayCalendarEntrySelectSchema = createSelectSchema(holidayCalendarEntries);

export const holidayCalendarEntryInsertSchema = createInsertSchema(holidayCalendarEntries, {
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
});

export const holidayCalendarEntryUpdateSchema = createUpdateSchema(holidayCalendarEntries, {
  holidayDate: dateStringSchema.optional(),
  name: z.string().min(1).max(200).optional(),
  description: nullableOptional(z.string().max(500)),
});

export type HolidayCalendarEntry = typeof holidayCalendarEntries.$inferSelect;
export type NewHolidayCalendarEntry = typeof holidayCalendarEntries.$inferInsert;
