import { integer, text, uuid, timestamp, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../_shared";
import { tenants } from "../core/tenants";
import { securitySchema } from "./users";

export const servicePrincipalStatuses = ["ACTIVE", "INACTIVE", "REVOKED"] as const;

export const servicePrincipalStatusEnum = securitySchema.enum("service_principal_status", [
  ...servicePrincipalStatuses,
]);

export const servicePrincipalStatusZodEnum = createSelectSchema(servicePrincipalStatusEnum);

export const servicePrincipals = securitySchema.table(
  "service_principals",
  {
    servicePrincipalId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(), // FK to core.tenants - tenant isolation
    clientId: uuid().notNull().defaultRandom(),
    ...nameColumn,
    description: text(),
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

export const ServicePrincipalIdSchema = z.number().int().brand<"ServicePrincipalId">();
export type ServicePrincipalId = z.infer<typeof ServicePrincipalIdSchema>;

export const servicePrincipalSelectSchema = createSelectSchema(servicePrincipals);

export const servicePrincipalInsertSchema = createInsertSchema(servicePrincipals, {
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

export const servicePrincipalUpdateSchema = createUpdateSchema(servicePrincipals);

export type ServicePrincipal = typeof servicePrincipals.$inferSelect;
export type NewServicePrincipal = typeof servicePrincipals.$inferInsert;
