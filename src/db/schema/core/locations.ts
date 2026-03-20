import { integer, text, varchar, index, uniqueIndex, foreignKey, numeric, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { coreSchema } from "./tenants";
import { tenants } from "./tenants";
import { regions } from "./regions";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../_shared";

export const locationStatuses = ["ACTIVE", "INACTIVE", "CLOSED"] as const;

export const locationStatusEnum = coreSchema.enum("location_status", [...locationStatuses]);

// Zod enum schema for runtime validation (from drizzle-orm/zod)
export const locationStatusZodEnum = createSelectSchema(locationStatusEnum);

export const locations = coreSchema.table(
  "locations",
  {
    locationId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(), // Explicit tenantId for precise FK control (not using mixin)
    locationCode: text().notNull(),
    ...nameColumn,
    regionId: integer(), // Nullable: locations may exist without regional classification
    address: text(), // Nullable: street address may be confidential or unavailable
    city: text().notNull(), // Required: every location must have a city for basic geographic context
    postalCode: varchar({ length: 32 }), // Nullable: postal codes may not exist in all regions/countries
    latitude: numeric({ precision: 9, scale: 6, mode: "number" }),
    longitude: numeric({ precision: 9, scale: 6, mode: "number" }),
    status: locationStatusEnum().notNull().default("ACTIVE"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_locations_tenant").on(t.tenantId),
    index("idx_locations_region").on(t.tenantId, t.regionId),
    index("idx_locations_city").on(t.tenantId, t.city),
    uniqueIndex("uq_locations_code")
      .on(t.tenantId, sql`lower(${t.locationCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_locations_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.regionId],
      foreignColumns: [regions.regionId],
      name: "fk_locations_region",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check("chk_locations_latitude", sql`${t.latitude} IS NULL OR (${t.latitude} >= -90 AND ${t.latitude} <= 90)`),
    check("chk_locations_longitude", sql`${t.longitude} IS NULL OR (${t.longitude} >= -180 AND ${t.longitude} <= 180)`),
  ]
);

export const LocationIdSchema = z.number().int().brand<"LocationId">();
export type LocationId = z.infer<typeof LocationIdSchema>;

export const locationSelectSchema = createSelectSchema(locations);

export const locationInsertSchema = createInsertSchema(locations, {
  locationCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  name: z.string().min(1).max(200),
  city: z.string().min(1).max(120), // Required field
  address: z.string().max(500).optional(),
  postalCode: z.string().max(32).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const locationUpdateSchema = createUpdateSchema(locations);

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
