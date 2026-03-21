import { integer, text, date, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import {
  dateNullableOptionalSchema,
  dateStringSchema,
  nullableOptional,
  refineOptionalIsoEndOnOrAfterStart,
} from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";

/**
 * Asset Assignments - Device and equipment issuance to employees.
 * Circular FK note: employeeId and issuedBy FKs added via custom SQL.
 */
export const assetTypes = ["LAPTOP", "DESKTOP", "MOBILE", "TABLET", "MONITOR", "KEYBOARD", "MOUSE", "HEADSET", "ID_CARD", "ACCESS_CARD", "VEHICLE", "FURNITURE", "OTHER"] as const;

export const assetTypeEnum = hrSchema.enum("asset_type", [...assetTypes]);

export const assetTypeZodEnum = z.enum(assetTypes);

export const assetConditions = ["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"] as const;

export const assetConditionEnum = hrSchema.enum("asset_condition", [...assetConditions]);

export const assetConditionZodEnum = z.enum(assetConditions);

export const assignmentStatuses = ["ASSIGNED", "RETURNED", "LOST", "DAMAGED", "TRANSFERRED"] as const;

export const assignmentStatusEnum = hrSchema.enum("assignment_status", [...assignmentStatuses]);

export const assignmentStatusZodEnum = z.enum(assignmentStatuses);

export const assetAssignments = hrSchema.table(
  "asset_assignments",
  {
    assignmentId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    assetType: assetTypeEnum().notNull(),
    assetTag: text().notNull(),
    assetName: text().notNull(),
    serialNumber: text(),
    manufacturer: text(),
    model: text(),
    conditionAtIssue: assetConditionEnum().notNull().default("NEW"),
    conditionAtReturn: assetConditionEnum(),
    issuedDate: date().notNull(),
    expectedReturnDate: date(),
    actualReturnDate: date(),
    issuedBy: integer(),
    status: assignmentStatusEnum().notNull().default("ASSIGNED"),
    notes: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_asset_assignments_tenant").on(t.tenantId),
    index("idx_asset_assignments_employee").on(t.tenantId, t.employeeId),
    index("idx_asset_assignments_type").on(t.tenantId, t.assetType),
    index("idx_asset_assignments_status").on(t.tenantId, t.status),
    uniqueIndex("uq_asset_assignments_tag")
      .on(t.tenantId, sql`lower(${t.assetTag})`)
      .where(sql`${t.deletedAt} IS NULL AND ${t.status} = 'ASSIGNED'`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_asset_assignments_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_asset_assignments_return_date",
      sql`${t.actualReturnDate} IS NULL OR ${t.actualReturnDate} >= ${t.issuedDate}`
    ),
  ]
);

export const AssetAssignmentIdSchema = z.number().int().brand<"AssetAssignmentId">();
export type AssetAssignmentId = z.infer<typeof AssetAssignmentIdSchema>;

export const assetAssignmentSelectSchema = createSelectSchema(assetAssignments);

export const assetAssignmentInsertSchema = createInsertSchema(assetAssignments, {
  assetTag: z.string().min(1).max(100),
  assetName: z.string().min(1).max(200),
  serialNumber: z.string().max(100).optional(),
  manufacturer: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  issuedDate: dateStringSchema,
  expectedReturnDate: dateStringSchema.optional(),
  actualReturnDate: dateStringSchema.optional(),
}).superRefine((data, ctx) =>
  refineOptionalIsoEndOnOrAfterStart(data as Record<string, unknown>, ctx, {
    startKey: "issuedDate",
    endKey: "actualReturnDate",
    issuePath: "actualReturnDate",
    message: "actualReturnDate must be on or after issuedDate when set",
  })
);

export const assetAssignmentUpdateSchema = createUpdateSchema(assetAssignments, {
  assetTag: z.string().min(1).max(100).optional(),
  assetName: z.string().min(1).max(200).optional(),
  serialNumber: nullableOptional(z.string().max(100)),
  manufacturer: nullableOptional(z.string().max(100)),
  model: nullableOptional(z.string().max(100)),
  issuedDate: dateStringSchema.optional(),
  expectedReturnDate: dateNullableOptionalSchema,
  actualReturnDate: dateNullableOptionalSchema,
  conditionAtReturn: nullableOptional(assetConditionZodEnum),
  issuedBy: nullableOptional(z.number().int()),
  notes: nullableOptional(z.string().max(1000)),
}).superRefine((data, ctx) =>
  refineOptionalIsoEndOnOrAfterStart(data as Record<string, unknown>, ctx, {
    startKey: "issuedDate",
    endKey: "actualReturnDate",
    issuePath: "actualReturnDate",
    message: "actualReturnDate must be on or after issuedDate when set",
  })
);

export type AssetAssignment = typeof assetAssignments.$inferSelect;
export type NewAssetAssignment = typeof assetAssignments.$inferInsert;
