import { integer, date, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import {
  dateNullableOptionalSchema,
  dateStringSchema,
  refineOptionalIsoEndOnOrAfterStart,
  refineReportingLineNotSelf,
} from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";

/**
 * Reporting Lines - Manager-subordinate relationships with effective dating.
 * Supports multiple report types (direct, dotted, functional).
 * Circular FK note: employeeId and managerId FKs added via custom SQL.
 */
export const reportTypes = ["DIRECT", "DOTTED", "FUNCTIONAL", "ADMINISTRATIVE"] as const;

export const reportTypeEnum = hrSchema.enum("report_type", [...reportTypes]);

export const reportTypeZodEnum = z.enum(reportTypes);

export const reportingLines = hrSchema.table(
  "reporting_lines",
  {
    reportingLineId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    managerId: integer().notNull(),
    reportType: reportTypeEnum().notNull().default("DIRECT"),
    effectiveFrom: date().notNull(),
    effectiveTo: date(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_reporting_lines_tenant").on(t.tenantId),
    index("idx_reporting_lines_employee").on(t.tenantId, t.employeeId),
    index("idx_reporting_lines_manager").on(t.tenantId, t.managerId),
    index("idx_reporting_lines_type").on(t.tenantId, t.reportType),
    index("idx_reporting_lines_effective").on(t.tenantId, t.employeeId, t.effectiveFrom),
    uniqueIndex("uq_reporting_lines_active")
      .on(t.tenantId, t.employeeId, t.reportType)
      .where(sql`${t.deletedAt} IS NULL AND ${t.effectiveTo} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_reporting_lines_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_reporting_lines_effective_range",
      sql`${t.effectiveTo} IS NULL OR ${t.effectiveTo} >= ${t.effectiveFrom}`
    ),
    check("chk_reporting_lines_not_self", sql`${t.employeeId} != ${t.managerId}`),
  ]
);

export const ReportingLineIdSchema = z.number().int().brand<"ReportingLineId">();
export type ReportingLineId = z.infer<typeof ReportingLineIdSchema>;

export const reportingLineSelectSchema = createSelectSchema(reportingLines);

export const reportingLineInsertSchema = createInsertSchema(reportingLines).superRefine(
  (data, ctx) => {
    refineReportingLineNotSelf(data, ctx);
    refineOptionalIsoEndOnOrAfterStart(data as Record<string, unknown>, ctx, {
      startKey: "effectiveFrom",
      endKey: "effectiveTo",
      issuePath: "effectiveTo",
    });
  }
);

export const reportingLineUpdateSchema = createUpdateSchema(reportingLines, {
  managerId: z.number().int().optional(),
  effectiveFrom: dateStringSchema.optional(),
  effectiveTo: dateNullableOptionalSchema,
}).superRefine((data, ctx) => {
  refineReportingLineNotSelf(data, ctx);
  refineOptionalIsoEndOnOrAfterStart(data as Record<string, unknown>, ctx, {
    startKey: "effectiveFrom",
    endKey: "effectiveTo",
    issuePath: "effectiveTo",
  });
});

export type ReportingLine = typeof reportingLines.$inferSelect;
export type NewReportingLine = typeof reportingLines.$inferInsert;
