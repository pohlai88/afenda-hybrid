import { pgSchema, integer, text, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { timestampColumns, softDeleteColumns, nameColumn } from "../_shared";

export const coreSchema = pgSchema("core");

export const tenantStatuses = ["ACTIVE", "SUSPENDED", "CLOSED"] as const;

export const tenantStatusEnum = coreSchema.enum("tenant_status", [...tenantStatuses]);

// Zod enum schema for runtime validation (from drizzle-orm/zod)
export const tenantStatusZodEnum = createSelectSchema(tenantStatusEnum);

export const tenants = coreSchema.table(
  "tenants",
  {
    tenantId: integer().primaryKey().generatedAlwaysAsIdentity(), // Explicit PK, not using mixin for clarity
    tenantCode: text().notNull(),
    ...nameColumn,
    status: tenantStatusEnum().notNull().default("ACTIVE"),
    settings: jsonb().$type<TenantSettings>(),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (t) => [
    uniqueIndex("uq_tenants_code")
      .on(sql`lower(${t.tenantCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    index("idx_tenants_status").on(t.status),
    index("idx_tenants_code").on(t.tenantCode),
  ]
);

export interface TenantSettings {
  theme?: string;
  locale?: string;
  timezone?: string;
  features?: Record<string, boolean>;
}

// Zod schema for TenantSettings JSONB validation
export const tenantSettingsSchema = z.object({
  theme: z.string().optional(),
  locale: z.string().min(2).max(10).optional(), // e.g., "en", "en-US"
  timezone: z.string().optional(), // e.g., "America/New_York"
  features: z.record(z.string(), z.boolean()).optional(),
}).strict();

export const TenantIdSchema = z.number().int().brand<"TenantId">();
export type TenantId = z.infer<typeof TenantIdSchema>;

export const tenantSelectSchema = createSelectSchema(tenants);

export const tenantInsertSchema = createInsertSchema(tenants, {
  tenantCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  name: z.string().min(1).max(200),
  settings: tenantSettingsSchema.optional(),
});

export const tenantUpdateSchema = createUpdateSchema(tenants);

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
