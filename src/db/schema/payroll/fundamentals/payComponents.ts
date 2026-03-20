import { integer, text, boolean, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../_shared";
import { tenants } from "../../core/tenants";

/**
 * Pay Components - Salary elements (base, allowance, bonus, etc.).
 * Master data for configuring payroll calculations.
 */
export const payComponentTypes = ["EARNING", "DEDUCTION", "BENEFIT", "REIMBURSEMENT"] as const;

export const payComponentTypeEnum = payrollSchema.enum("pay_component_type", [...payComponentTypes]);

export const payComponentTypeZodEnum = createSelectSchema(payComponentTypeEnum);

export const payComponentStatuses = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;

export const payComponentStatusEnum = payrollSchema.enum("pay_component_status", [...payComponentStatuses]);

export const payComponentStatusZodEnum = createSelectSchema(payComponentStatusEnum);

export const payComponents = payrollSchema.table(
  "pay_components",
  {
    payComponentId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    componentCode: text().notNull(),
    ...nameColumn,
    componentType: payComponentTypeEnum().notNull(),
    description: text(),
    isTaxable: boolean().notNull().default(true),
    isRecurring: boolean().notNull().default(true),
    affectsGrossPay: boolean().notNull().default(true),
    status: payComponentStatusEnum().notNull().default("ACTIVE"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_pay_components_tenant").on(t.tenantId),
    index("idx_pay_components_type").on(t.tenantId, t.componentType),
    index("idx_pay_components_status").on(t.tenantId, t.status),
    uniqueIndex("uq_pay_components_code")
      .on(t.tenantId, sql`lower(${t.componentCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_pay_components_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const PayComponentIdSchema = z.number().int().brand<"PayComponentId">();
export type PayComponentId = z.infer<typeof PayComponentIdSchema>;

export const payComponentSelectSchema = createSelectSchema(payComponents);

export const payComponentInsertSchema = createInsertSchema(payComponents, {
  componentCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
});

export const payComponentUpdateSchema = createUpdateSchema(payComponents);

export type PayComponent = typeof payComponents.$inferSelect;
export type NewPayComponent = typeof payComponents.$inferInsert;
