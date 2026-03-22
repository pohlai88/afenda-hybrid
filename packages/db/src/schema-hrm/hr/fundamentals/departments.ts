import { integer, text, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import { nullableOptional } from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { organizations } from "../../../schema-platform/core/organizations";
import { legalEntities } from "../../../schema-platform/core/legalEntities";
import { costCenters } from "../../../schema-platform/core/costCenters";

/**
 * Departments - Organizational units for headcount and cost allocation.
 *
 * Circular FK note: headEmployeeId FK is added via custom SQL in migrations
 * to avoid circular import dependencies between departments ↔ employees.
 * Relations are defined in hr/_relations.ts for query convenience.
 */
export const departmentStatuses = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;

export const departmentStatusEnum = hrSchema.enum("department_status", [...departmentStatuses]);

export const departmentStatusZodEnum = z.enum(departmentStatuses);

export const departments = hrSchema.table(
  "departments",
  {
    departmentId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    departmentCode: text().notNull(),
    ...nameColumn,
    organizationId: integer(),
    legalEntityId: integer(),
    costCenterId: integer(),
    parentDepartmentId: integer(),
    headEmployeeId: integer(),
    description: text(),
    status: departmentStatusEnum().notNull().default("ACTIVE"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_departments_tenant").on(t.tenantId),
    index("idx_departments_status").on(t.tenantId, t.status),
    index("idx_departments_created").on(t.tenantId, t.createdAt),
    index("idx_departments_organization").on(t.tenantId, t.organizationId),
    index("idx_departments_legal_entity").on(t.tenantId, t.legalEntityId),
    index("idx_departments_cost_center").on(t.tenantId, t.costCenterId),
    index("idx_departments_parent").on(t.tenantId, t.parentDepartmentId),
    index("idx_departments_head").on(t.tenantId, t.headEmployeeId),
    uniqueIndex("uq_departments_code")
      .on(t.tenantId, sql`lower(${t.departmentCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_departments_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organizations.organizationId],
      name: "fk_departments_organization",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.legalEntityId],
      foreignColumns: [legalEntities.legalEntityId],
      name: "fk_departments_legal_entity",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.costCenterId],
      foreignColumns: [costCenters.costCenterId],
      name: "fk_departments_cost_center",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.parentDepartmentId],
      foreignColumns: [t.departmentId],
      name: "fk_departments_parent",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const DepartmentIdSchema = z.number().int().brand<"DepartmentId">();
export type DepartmentId = z.infer<typeof DepartmentIdSchema>;

export const departmentSelectSchema = createSelectSchema(departments);

export const departmentInsertSchema = createInsertSchema(departments, {
  departmentCode: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

export const departmentUpdateSchema = createUpdateSchema(departments, {
  departmentCode: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed")
    .optional(),
  name: z.string().min(1).max(200).optional(),
  organizationId: nullableOptional(z.number().int()),
  legalEntityId: nullableOptional(z.number().int()),
  costCenterId: nullableOptional(z.number().int()),
  parentDepartmentId: nullableOptional(z.number().int()),
  headEmployeeId: nullableOptional(z.number().int()),
  description: nullableOptional(z.string().max(2000)),
});

export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;
