import { sql } from "drizzle-orm";
import { date, foreignKey, index, integer, text, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { auditColumns, nameColumn, softDeleteColumns, timestampColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { benefitsSchema } from "../_schema";
import { dateValue } from "../_zodShared";

/**
 * Benefits Providers - External insurance companies and service providers.
 * Audit columns are required in the database and must be set by the API or service layer.
 */
export const providerStatuses = ["ACTIVE", "INACTIVE", "SUSPENDED"] as const;

export const providerStatusEnum = benefitsSchema.enum("provider_status", [...providerStatuses]);

export const ProviderStatusSchema = z.enum(providerStatuses);
export type ProviderStatus = z.infer<typeof ProviderStatusSchema>;

/**
 * Table `benefits_providers` — third-party carriers / administrators; tenant-scoped; contract dates optional.
 */
export const benefitsProviders = benefitsSchema.table(
  "benefits_providers",
  {
    providerId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    // providerCode: unique per tenant (case-insensitive, soft-delete aware)
    providerCode: text().notNull(),
    ...nameColumn,
    contactPerson: text(),
    email: text(),
    phone: text(),
    address: text(),
    website: text(),
    contractNumber: text(),
    contractStartDate: date(),
    contractEndDate: date(),
    /** Lifecycle: `ACTIVE` | `INACTIVE` | `SUSPENDED`. */
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

export const BenefitsProviderIdSchema = z.number().int().positive().brand<"BenefitsProviderId">();
export type BenefitsProviderId = z.infer<typeof BenefitsProviderIdSchema>;

export const benefitsProviderSelectSchema = createSelectSchema(benefitsProviders);

export const benefitsProviderInsertSchema = createInsertSchema(benefitsProviders, {
  tenantId: z.number().int().positive(),
  providerCode: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  name: z.string().min(1).max(200),
  contactPerson: z.string().max(200).optional(),
  email: z.email().optional(),
  phone: z.string().max(30).optional(),
  address: z.string().max(500).optional(),
  website: z.string().url().max(255).optional(),
  contractNumber: z.string().max(100).optional(),
  contractStartDate: z.coerce.date().optional().nullable(),
  contractEndDate: z.coerce.date().optional().nullable(),
  status: ProviderStatusSchema.optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
}).superRefine((data, ctx) => {
  if (data.contractStartDate == null || data.contractEndDate == null) return;
  const a = dateValue(data.contractStartDate);
  const b = dateValue(data.contractEndDate);
  if (Number.isNaN(a) || Number.isNaN(b)) {
    ctx.addIssue({
      code: "custom",
      message: "contractStartDate and contractEndDate must be valid dates",
      path: ["contractEndDate"],
    });
    return;
  }
  if (b < a) {
    ctx.addIssue({
      code: "custom",
      message: "contractEndDate must be on or after contractStartDate",
      path: ["contractEndDate"],
    });
  }
});

export const benefitsProviderUpdateSchema = createUpdateSchema(benefitsProviders, {
  providerCode: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed")
    .optional(),
  name: z.string().min(1).max(200).optional(),
  contactPerson: z.string().max(200).optional().nullable(),
  email: z.email().optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  website: z.string().url().max(255).optional().nullable(),
  contractNumber: z.string().max(100).optional().nullable(),
  contractStartDate: z.coerce.date().optional().nullable(),
  contractEndDate: z.coerce.date().optional().nullable(),
  status: ProviderStatusSchema.optional(),
}).superRefine((data, ctx) => {
  if (data.contractStartDate === undefined && data.contractEndDate === undefined) return;
  if (
    data.contractStartDate === undefined ||
    data.contractEndDate === undefined ||
    data.contractStartDate === null ||
    data.contractEndDate === null
  ) {
    return;
  }
  const a = dateValue(data.contractStartDate);
  const b = dateValue(data.contractEndDate);
  if (Number.isNaN(a) || Number.isNaN(b)) {
    ctx.addIssue({
      code: "custom",
      message: "contractStartDate and contractEndDate must be valid dates",
      path: ["contractEndDate"],
    });
    return;
  }
  if (b < a) {
    ctx.addIssue({
      code: "custom",
      message: "contractEndDate must be on or after contractStartDate",
      path: ["contractEndDate"],
    });
  }
});

export type BenefitsProvider = typeof benefitsProviders.$inferSelect;
export type NewBenefitsProvider = typeof benefitsProviders.$inferInsert;
