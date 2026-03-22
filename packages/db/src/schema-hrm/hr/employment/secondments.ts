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
  refineSecondmentActualEndOnOrAfterStart,
  refineSecondmentHostPatchNotAllNull,
  refineSecondmentAtLeastOneHostOnInsert,
  refineSecondmentOriginalEndOnOrAfterStart,
} from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";

/**
 * Secondments - Temporary reassignments to different departments, locations, or entities.
 * Circular FK note: employeeId, hostDepartmentId, hostLocationId, hostLegalEntityId FKs added via custom SQL.
 */
export const secondmentStatuses = [
  "PENDING",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
  "EXTENDED",
] as const;

export const secondmentStatusEnum = hrSchema.enum("secondment_status", [...secondmentStatuses]);

export const secondmentStatusZodEnum = z.enum(secondmentStatuses);

export const secondments = hrSchema.table(
  "secondments",
  {
    secondmentId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    hostDepartmentId: integer(),
    hostLocationId: integer(),
    hostLegalEntityId: integer(),
    startDate: date().notNull(),
    originalEndDate: date().notNull(),
    actualEndDate: date(),
    reason: text(),
    status: secondmentStatusEnum().notNull().default("PENDING"),
    approvedBy: integer(),
    approvalDate: date(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_secondments_tenant").on(t.tenantId),
    index("idx_secondments_employee").on(t.tenantId, t.employeeId),
    index("idx_secondments_status").on(t.tenantId, t.status),
    index("idx_secondments_dates").on(t.tenantId, t.startDate, t.originalEndDate),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_secondments_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check("chk_secondments_dates", sql`${t.originalEndDate} >= ${t.startDate}`),
    check(
      "chk_secondments_actual_date",
      sql`${t.actualEndDate} IS NULL OR ${t.actualEndDate} >= ${t.startDate}`
    ),
    check(
      "chk_secondments_has_host",
      sql`${t.hostDepartmentId} IS NOT NULL OR ${t.hostLocationId} IS NOT NULL OR ${t.hostLegalEntityId} IS NOT NULL`
    ),
  ]
);

export const SecondmentIdSchema = z.number().int().brand<"SecondmentId">();
export type SecondmentId = z.infer<typeof SecondmentIdSchema>;

export const secondmentSelectSchema = createSelectSchema(secondments);

export const secondmentInsertSchema = createInsertSchema(secondments, {
  reason: z.string().max(hrBounds.reasonMax).optional(),
}).superRefine((data, ctx) => {
  refineSecondmentOriginalEndOnOrAfterStart(data, ctx);
  refineSecondmentActualEndOnOrAfterStart(data, ctx);
  refineSecondmentAtLeastOneHostOnInsert(data, ctx);
});

export const secondmentUpdateSchema = createUpdateSchema(secondments, {
  startDate: dateStringSchema.optional(),
  originalEndDate: dateStringSchema.optional(),
  actualEndDate: dateNullableOptionalSchema,
  hostDepartmentId: nullableOptional(z.number().int()),
  hostLocationId: nullableOptional(z.number().int()),
  hostLegalEntityId: nullableOptional(z.number().int()),
  reason: nullableOptional(z.string().max(hrBounds.reasonMax)),
  approvedBy: nullableOptional(z.number().int()),
  approvalDate: dateNullableOptionalSchema,
}).superRefine((data, ctx) => {
  refineSecondmentOriginalEndOnOrAfterStart(data, ctx);
  refineSecondmentActualEndOnOrAfterStart(data, ctx);
  refineSecondmentHostPatchNotAllNull(data, ctx);
});

export type Secondment = typeof secondments.$inferSelect;
export type NewSecondment = typeof secondments.$inferInsert;
