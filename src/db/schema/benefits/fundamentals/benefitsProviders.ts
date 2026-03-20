import { integer, text, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { benefitsSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../_shared";
import { tenants } from "../../core/tenants";

/**
 * Benefits Providers - External insurance companies and service providers.
 */
export const providerStatuses = ["ACTIVE", "INACTIVE", "SUSPENDED"] as const;

export const providerStatusEnum = benefitsSchema.enum("provider_status", [...providerStatuses]);

export const providerStatusZodEnum = createSelectSchema(providerStatusEnum);

export const benefitsProviders = benefitsSchema.table(
  "benefits_providers",
  {
    providerId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    providerCode: text().notNull(),
    ...nameColumn,
    contactPerson: text(),
    email: text(),
    phone: text(),
    address: text(),
    website: text(),
    contractNumber: text(),
    contractStartDate: text(),
    contractEndDate: text(),
    status: providerStatusEnum().notNull().default("ACTIVE"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_benefits_providers_tenant").on(t.tenantId),
    index("idx_benefits_providers_status").on(t.tenantId, t.status),
    uniqueIndex("uq_benefits_providers_code")
      .on(t.tenantId, sql`lower(${t.providerCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_benefits_providers_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const BenefitsProviderIdSchema = z.number().int().brand<"BenefitsProviderId">();
export type BenefitsProviderId = z.infer<typeof BenefitsProviderIdSchema>;

export const benefitsProviderSelectSchema = createSelectSchema(benefitsProviders);

export const benefitsProviderInsertSchema = createInsertSchema(benefitsProviders, {
  providerCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  name: z.string().min(1).max(200),
  contactPerson: z.string().max(200).optional(),
  email: z.email().optional(),
  phone: z.string().max(30).optional(),
  address: z.string().max(500).optional(),
  website: z.string().url().max(255).optional(),
  contractNumber: z.string().max(100).optional(),
});

export const benefitsProviderUpdateSchema = createUpdateSchema(benefitsProviders);

export type BenefitsProvider = typeof benefitsProviders.$inferSelect;
export type NewBenefitsProvider = typeof benefitsProviders.$inferInsert;
