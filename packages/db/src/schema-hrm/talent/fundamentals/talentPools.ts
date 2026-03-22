import { integer, text, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { talentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";

/**
 * Talent Pools - High-potential employee groups for succession planning.
 */
export const poolStatuses = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;

export const poolStatusEnum = talentSchema.enum("pool_status", [...poolStatuses]);

export const poolStatusZodEnum = createSelectSchema(poolStatusEnum);

export const talentPools = talentSchema.table(
  "talent_pools",
  {
    talentPoolId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    poolCode: text().notNull(),
    ...nameColumn,
    description: text(),
    criteria: text(),
    status: poolStatusEnum().notNull().default("ACTIVE"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_talent_pools_tenant").on(t.tenantId),
    index("idx_talent_pools_status").on(t.tenantId, t.status),
    uniqueIndex("uq_talent_pools_code")
      .on(t.tenantId, sql`lower(${t.poolCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_talent_pools_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const TalentPoolIdSchema = z.number().int().brand<"TalentPoolId">();
export type TalentPoolId = z.infer<typeof TalentPoolIdSchema>;

export const talentPoolSelectSchema = createSelectSchema(talentPools);

export const talentPoolInsertSchema = createInsertSchema(talentPools, {
  poolCode: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  criteria: z.string().max(2000).optional(),
});

export const talentPoolUpdateSchema = createUpdateSchema(talentPools);

export type TalentPool = typeof talentPools.$inferSelect;
export type NewTalentPool = typeof talentPools.$inferInsert;
