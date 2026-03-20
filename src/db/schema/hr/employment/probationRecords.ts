import { integer, text, date, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";

/**
 * Probation Records - Evaluation period tracking and outcomes.
 * Circular FK note: employeeId and reviewedBy FKs added via custom SQL.
 */
export const probationOutcomes = ["PENDING", "PASSED", "EXTENDED", "FAILED", "CANCELLED"] as const;

export const probationOutcomeEnum = hrSchema.enum("probation_outcome", [...probationOutcomes]);

export const probationOutcomeZodEnum = createSelectSchema(probationOutcomeEnum);

export const probationRecords = hrSchema.table(
  "probation_records",
  {
    probationRecordId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    startDate: date().notNull(),
    originalEndDate: date().notNull(),
    extendedEndDate: date(),
    actualEndDate: date(),
    outcome: probationOutcomeEnum().notNull().default("PENDING"),
    reviewedBy: integer(),
    reviewDate: date(),
    reviewNotes: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_probation_records_tenant").on(t.tenantId),
    index("idx_probation_records_employee").on(t.tenantId, t.employeeId),
    index("idx_probation_records_outcome").on(t.tenantId, t.outcome),
    index("idx_probation_records_dates").on(t.tenantId, t.startDate, t.originalEndDate),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_probation_records_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_probation_records_original_dates",
      sql`${t.originalEndDate} >= ${t.startDate}`
    ),
    check(
      "chk_probation_records_extended_dates",
      sql`${t.extendedEndDate} IS NULL OR ${t.extendedEndDate} >= ${t.originalEndDate}`
    ),
    check(
      "chk_probation_records_actual_dates",
      sql`${t.actualEndDate} IS NULL OR ${t.actualEndDate} >= ${t.startDate}`
    ),
  ]
);

export const ProbationRecordIdSchema = z.number().int().brand<"ProbationRecordId">();
export type ProbationRecordId = z.infer<typeof ProbationRecordIdSchema>;

export const probationRecordSelectSchema = createSelectSchema(probationRecords);

export const probationRecordInsertSchema = createInsertSchema(probationRecords, {
  reviewNotes: z.string().max(4000).optional(),
});

export const probationRecordUpdateSchema = createUpdateSchema(probationRecords);

export type ProbationRecord = typeof probationRecords.$inferSelect;
export type NewProbationRecord = typeof probationRecords.$inferInsert;
