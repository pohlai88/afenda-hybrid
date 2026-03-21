import { integer, text, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { coreSchema } from "./tenants";
import { tenants } from "./tenants";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../_shared";

/**
 * DB trigger `core.trg_organizations_same_tenant_parent` enforces that
 * `parent_organization_id` (when set) references a row with the same `tenant_id`.
 * Applied via migration SQL (see `src/db/migrations` after `pnpm db:generate`).
 */
export const organizationTypes = ["COMPANY", "DIVISION", "DEPARTMENT", "UNIT", "TEAM"] as const;

export const organizationStatuses = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;

export const organizationTypeEnum = coreSchema.enum("organization_type", [...organizationTypes]);

export const organizationStatusEnum = coreSchema.enum("organization_status", [...organizationStatuses]);

// Zod enum schemas for runtime validation (from drizzle-orm/zod)
export const organizationTypeZodEnum = createSelectSchema(organizationTypeEnum);
export const organizationStatusZodEnum = createSelectSchema(organizationStatusEnum);

export const organizations = coreSchema.table(
  "organizations",
  {
    organizationId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(), // Explicit tenantId for precise FK control (not using mixin)
    orgCode: text().notNull(),
    ...nameColumn,
    parentOrganizationId: integer(),
    orgType: organizationTypeEnum().notNull().default("DEPARTMENT"),
    status: organizationStatusEnum().notNull().default("ACTIVE"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_organizations_tenant").on(t.tenantId),
    index("idx_organizations_parent").on(t.tenantId, t.parentOrganizationId),
    index("idx_organizations_type").on(t.tenantId, t.orgType),
    uniqueIndex("uq_organizations_code")
      .on(t.tenantId, sql`lower(${t.orgCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_organizations_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.parentOrganizationId],
      foreignColumns: [t.organizationId],
      name: "fk_organizations_parent",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const OrganizationIdSchema = z.number().int().brand<"OrganizationId">();
export type OrganizationId = z.infer<typeof OrganizationIdSchema>;

export const organizationSelectSchema = createSelectSchema(organizations);

export const organizationInsertSchema = createInsertSchema(organizations, {
  orgCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  name: z.string().min(1).max(200),
});

export const organizationUpdateSchema = createUpdateSchema(organizations);

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
