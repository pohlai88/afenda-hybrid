import { integer, text, date, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";

/**
 * Absence Records - Unplanned absence tracking (no-show, emergency, etc.).
 * Circular FK note: employeeId and recordedBy FKs added via custom SQL.
 */
export const absenceTypes = ["NO_SHOW", "EMERGENCY", "MEDICAL", "FAMILY", "WEATHER", "OTHER"] as const;

export const absenceTypeEnum = hrSchema.enum("absence_type", [...absenceTypes]);

export const absenceTypeZodEnum = createSelectSchema(absenceTypeEnum);

export const absenceStatuses = ["RECORDED", "EXCUSED", "UNEXCUSED", "CONVERTED_TO_LEAVE"] as const;

export const absenceStatusEnum = hrSchema.enum("absence_status", [...absenceStatuses]);

export const absenceStatusZodEnum = createSelectSchema(absenceStatusEnum);

export const absenceRecords = hrSchema.table(
  "absence_records",
  {
    absenceRecordId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    absenceDate: date().notNull(),
    absenceType: absenceTypeEnum().notNull(),
    status: absenceStatusEnum().notNull().default("RECORDED"),
    reason: text(),
    recordedBy: integer(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_absence_records_tenant").on(t.tenantId),
    index("idx_absence_records_employee").on(t.tenantId, t.employeeId),
    index("idx_absence_records_date").on(t.tenantId, t.absenceDate),
    index("idx_absence_records_type").on(t.tenantId, t.absenceType),
    index("idx_absence_records_status").on(t.tenantId, t.status),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_absence_records_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_absence_records_date",
      sql`${t.absenceDate} <= CURRENT_DATE`
    ),
  ]
);

export const AbsenceRecordIdSchema = z.number().int().brand<"AbsenceRecordId">();
export type AbsenceRecordId = z.infer<typeof AbsenceRecordIdSchema>;

export const absenceRecordSelectSchema = createSelectSchema(absenceRecords);

export const absenceRecordInsertSchema = createInsertSchema(absenceRecords, {
  reason: z.string().max(1000).optional(),
});

export const absenceRecordUpdateSchema = createUpdateSchema(absenceRecords);

export type AbsenceRecord = typeof absenceRecords.$inferSelect;
export type NewAbsenceRecord = typeof absenceRecords.$inferInsert;
