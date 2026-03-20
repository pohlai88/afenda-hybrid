import { integer, text, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { coreSchema, tenants } from "./tenants";
import { currencies } from "./currencies";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../_shared";

/**
 * Legal Entities - Registered business units for taxation and regulatory reporting.
 * Each legal entity represents a distinct legal structure (e.g., subsidiary, branch).
 * Used for payroll processing, tax reporting, and compliance.
 */
export const legalEntityStatuses = ["ACTIVE", "INACTIVE", "DISSOLVED"] as const;

export const legalEntityStatusEnum = coreSchema.enum("legal_entity_status", [...legalEntityStatuses]);

export const legalEntityStatusZodEnum = createSelectSchema(legalEntityStatusEnum);

export const legalEntities = coreSchema.table(
  "legal_entities",
  {
    legalEntityId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    legalEntityCode: text().notNull(),
    ...nameColumn,
    registrationNumber: text(),
    taxId: text(),
    country: text().notNull(),
    defaultCurrencyId: integer(),
    address: text(),
    status: legalEntityStatusEnum().notNull().default("ACTIVE"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_legal_entities_tenant").on(t.tenantId),
    index("idx_legal_entities_country").on(t.tenantId, t.country),
    uniqueIndex("uq_legal_entities_code")
      .on(t.tenantId, sql`lower(${t.legalEntityCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    uniqueIndex("uq_legal_entities_tax_id")
      .on(t.tenantId, t.taxId)
      .where(sql`${t.deletedAt} IS NULL AND ${t.taxId} IS NOT NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_legal_entities_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.defaultCurrencyId],
      foreignColumns: [currencies.currencyId],
      name: "fk_legal_entities_currency",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const LegalEntityIdSchema = z.number().int().brand<"LegalEntityId">();
export type LegalEntityId = z.infer<typeof LegalEntityIdSchema>;

export const legalEntitySelectSchema = createSelectSchema(legalEntities);

export const legalEntityInsertSchema = createInsertSchema(legalEntities, {
  legalEntityCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  name: z.string().min(1).max(200),
  registrationNumber: z.string().max(100).optional(),
  taxId: z.string().max(100).optional(),
  country: z.string().length(2).regex(/^[A-Z]{2}$/, "Must be ISO 3166-1 alpha-2 country code"),
  address: z.string().max(500).optional(),
});

export const legalEntityUpdateSchema = createUpdateSchema(legalEntities);

export type LegalEntity = typeof legalEntities.$inferSelect;
export type NewLegalEntity = typeof legalEntities.$inferInsert;
