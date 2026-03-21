import { integer, text, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { coreSchema } from "./tenants";
import { timestampColumns, softDeleteColumns, nameColumn } from "../../_shared";

export const regionTypes = [
  "CONTINENT",
  "COUNTRY",
  "STATE",
  "PROVINCE",
  "CITY",
  "DISTRICT",
  "CUSTOM",
] as const;

export const regionStatuses = ["ACTIVE", "INACTIVE"] as const;

export const regionTypeEnum = coreSchema.enum("region_type", [...regionTypes]);

export const regionStatusEnum = coreSchema.enum("region_status", [...regionStatuses]);

// Zod enum schemas for runtime validation (from drizzle-orm/zod)
export const regionTypeZodEnum = createSelectSchema(regionTypeEnum);
export const regionStatusZodEnum = createSelectSchema(regionStatusEnum);

export const regions = coreSchema.table(
  "regions",
  {
    regionId: integer().primaryKey().generatedAlwaysAsIdentity(),
    regionCode: text().notNull(),
    ...nameColumn,
    parentRegionId: integer(),
    regionType: regionTypeEnum().notNull().default("COUNTRY"),
    status: regionStatusEnum().notNull().default("ACTIVE"),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (t) => [
    uniqueIndex("uq_regions_code")
      .on(sql`lower(${t.regionCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    index("idx_regions_parent").on(t.parentRegionId),
    index("idx_regions_type").on(t.regionType),
    foreignKey({
      columns: [t.parentRegionId],
      foreignColumns: [t.regionId],
      name: "fk_regions_parent",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const RegionIdSchema = z.number().int().brand<"RegionId">();
export type RegionId = z.infer<typeof RegionIdSchema>;

export const regionSelectSchema = createSelectSchema(regions);

export const regionInsertSchema = createInsertSchema(regions, {
  regionCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  name: z.string().min(1).max(200),
});

export const regionUpdateSchema = createUpdateSchema(regions);

export type Region = typeof regions.$inferSelect;
export type NewRegion = typeof regions.$inferInsert;
