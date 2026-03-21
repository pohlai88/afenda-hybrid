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
  refineEmployeeTransferHasChangeOnInsert,
} from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";

/**
 * Employee Transfers - Department, location, and position change records.
 * Circular FK note: employeeId, fromDepartmentId, toDepartmentId, fromLocationId, toLocationId, fromPositionId, toPositionId FKs added via custom SQL.
 */
export const transferStatuses = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
  "CANCELLED",
] as const;

export const transferStatusEnum = hrSchema.enum("transfer_status", [...transferStatuses]);

export const transferStatusZodEnum = z.enum(transferStatuses);

export const transferTypes = [
  "DEPARTMENT",
  "LOCATION",
  "POSITION",
  "LATERAL",
  "PROMOTION",
  "DEMOTION",
] as const;

export const transferTypeEnum = hrSchema.enum("transfer_type", [...transferTypes]);

export const transferTypeZodEnum = z.enum(transferTypes);

export const employeeTransfers = hrSchema.table(
  "employee_transfers",
  {
    transferId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    transferType: transferTypeEnum().notNull(),
    fromDepartmentId: integer(),
    toDepartmentId: integer(),
    fromLocationId: integer(),
    toLocationId: integer(),
    fromPositionId: integer(),
    toPositionId: integer(),
    effectiveDate: date().notNull(),
    reason: text(),
    status: transferStatusEnum().notNull().default("PENDING"),
    approvedBy: integer(),
    approvalDate: date(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_employee_transfers_tenant").on(t.tenantId),
    index("idx_employee_transfers_employee").on(t.tenantId, t.employeeId),
    index("idx_employee_transfers_status").on(t.tenantId, t.status),
    index("idx_employee_transfers_type").on(t.tenantId, t.transferType),
    index("idx_employee_transfers_effective").on(t.tenantId, t.effectiveDate),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_employee_transfers_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_employee_transfers_has_change",
      sql`${t.fromDepartmentId} IS DISTINCT FROM ${t.toDepartmentId} OR
          ${t.fromLocationId} IS DISTINCT FROM ${t.toLocationId} OR
          ${t.fromPositionId} IS DISTINCT FROM ${t.toPositionId}`
    ),
  ]
);

export const EmployeeTransferIdSchema = z.number().int().brand<"EmployeeTransferId">();
export type EmployeeTransferId = z.infer<typeof EmployeeTransferIdSchema>;

export const employeeTransferSelectSchema = createSelectSchema(employeeTransfers);

export const employeeTransferInsertSchema = createInsertSchema(employeeTransfers, {
  reason: z.string().max(hrBounds.reasonMax).optional(),
}).superRefine((data, ctx) => refineEmployeeTransferHasChangeOnInsert(data, ctx));

export const employeeTransferUpdateSchema = createUpdateSchema(employeeTransfers, {
  effectiveDate: dateStringSchema.optional(),
  reason: nullableOptional(z.string().max(hrBounds.reasonMax)),
  approvedBy: nullableOptional(z.number().int()),
  approvalDate: dateNullableOptionalSchema,
  fromDepartmentId: nullableOptional(z.number().int()),
  toDepartmentId: nullableOptional(z.number().int()),
  fromLocationId: nullableOptional(z.number().int()),
  toLocationId: nullableOptional(z.number().int()),
  fromPositionId: nullableOptional(z.number().int()),
  toPositionId: nullableOptional(z.number().int()),
});

export type EmployeeTransfer = typeof employeeTransfers.$inferSelect;
export type NewEmployeeTransfer = typeof employeeTransfers.$inferInsert;
