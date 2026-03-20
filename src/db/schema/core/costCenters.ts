import { integer, text, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { coreSchema, tenants } from "./tenants";
import { legalEntities } from "./legalEntities";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../_shared";

/**
 * Cost Centers - Financial allocation units for budgeting and expense tracking.
 * Hierarchical structure allows parent-child relationships.
 * Linked to legal entities for financial reporting boundaries.
 */
export const costCenterStatuses = ["ACTIVE", "INACTIVE", "CLOSED"] as const;

export const costCenterStatusEnum = coreSchema.enum("cost_center_status", [...costCenterStatuses]);

export const costCenterStatusZodEnum = createSelectSchema(costCenterStatusEnum);

export const costCenters = coreSchema.table(
  "cost_centers",
  {
    costCenterId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    costCenterCode: text().notNull(),
    ...nameColumn,
    legalEntityId: integer(),
    parentCostCenterId: integer(),
    description: text(),
    status: costCenterStatusEnum().notNull().default("ACTIVE"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_cost_centers_tenant").on(t.tenantId),
    index("idx_cost_centers_legal_entity").on(t.tenantId, t.legalEntityId),
    index("idx_cost_centers_parent").on(t.tenantId, t.parentCostCenterId),
    uniqueIndex("uq_cost_centers_code")
      .on(t.tenantId, sql`lower(${t.costCenterCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_cost_centers_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.legalEntityId],
      foreignColumns: [legalEntities.legalEntityId],
      name: "fk_cost_centers_legal_entity",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.parentCostCenterId],
      foreignColumns: [t.costCenterId],
      name: "fk_cost_centers_parent",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const CostCenterIdSchema = z.number().int().brand<"CostCenterId">();
export type CostCenterId = z.infer<typeof CostCenterIdSchema>;

export const costCenterSelectSchema = createSelectSchema(costCenters);

export const costCenterInsertSchema = createInsertSchema(costCenters, {
  costCenterCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
});

export const costCenterUpdateSchema = createUpdateSchema(costCenters);

export type CostCenter = typeof costCenters.$inferSelect;
export type NewCostCenter = typeof costCenters.$inferInsert;
