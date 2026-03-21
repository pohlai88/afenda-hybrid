import { sql } from "drizzle-orm";
import { foreignKey, index, integer, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { auditColumns, nameColumn, softDeleteColumns, timestampColumns } from "../../_shared";
import { tenants } from "../core/tenants";
import { securitySchema } from "./users";

// --- Enums (PG + Zod) ---

export const servicePrincipalStatuses = ["ACTIVE", "INACTIVE", "REVOKED"] as const;

export const servicePrincipalStatusEnum = securitySchema.enum("service_principal_status", [
  ...servicePrincipalStatuses,
]);

export const ServicePrincipalStatusSchema = z.enum(servicePrincipalStatuses);
export type ServicePrincipalStatus = z.infer<typeof ServicePrincipalStatusSchema>;

// --- Tables ---

/**
 * Machine / integration identity (client credentials). Audit columns are required in the database and must be set by the API or service layer.
 */
export const servicePrincipals = securitySchema.table(
  "service_principals",
  {
    servicePrincipalId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(), // FK to core.tenants - tenant isolation
    clientId: uuid().notNull().defaultRandom(),
    ...nameColumn,
    description: text(),
    /** Principal lifecycle: `ACTIVE` | `INACTIVE` | `REVOKED`. */
    status: servicePrincipalStatusEnum().notNull().default("ACTIVE"),
    lastUsedAt: timestamp({ withTimezone: true }),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_service_principals_tenant").on(t.tenantId),
    uniqueIndex("uq_service_principals_client_id")
      .on(t.clientId)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_service_principals_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

// --- Zod: ids + row shapes ---

/** Explicit `clientId` when not using the column default (`gen_random_uuid()`). */
export const ServicePrincipalClientIdSchema = z.string().uuid();

export const ServicePrincipalIdSchema = z.number().int().positive().brand<"ServicePrincipalId">();
export type ServicePrincipalId = z.infer<typeof ServicePrincipalIdSchema>;

export const servicePrincipalSelectSchema = createSelectSchema(servicePrincipals);

export const servicePrincipalInsertSchema = createInsertSchema(servicePrincipals, {
  tenantId: z.number().int().positive(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: ServicePrincipalStatusSchema.optional(),
  clientId: ServicePrincipalClientIdSchema.optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const servicePrincipalUpdateSchema = createUpdateSchema(servicePrincipals, {
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  status: ServicePrincipalStatusSchema.optional(),
  lastUsedAt: z.coerce.date().optional().nullable(),
});

export type ServicePrincipal = typeof servicePrincipals.$inferSelect;
export type NewServicePrincipal = typeof servicePrincipals.$inferInsert;
