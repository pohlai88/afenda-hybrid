import { integer, text, numeric, boolean, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../_shared";
import { tenants } from "../../core/tenants";

/**
 * Earnings Types - Salary, overtime, bonus, commission types.
 * Configures how different earnings are calculated and taxed.
 */
export const earningsCategories = ["SALARY", "OVERTIME", "BONUS", "COMMISSION", "ALLOWANCE", "INCENTIVE", "OTHER"] as const;

export const earningsCategoryEnum = payrollSchema.enum("earnings_category", [...earningsCategories]);

export const earningsCategoryZodEnum = createSelectSchema(earningsCategoryEnum);

export const earningsTypeStatuses = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;

export const earningsTypeStatusEnum = payrollSchema.enum("earnings_type_status", [...earningsTypeStatuses]);

export const earningsTypeStatusZodEnum = createSelectSchema(earningsTypeStatusEnum);

export const earningsTypes = payrollSchema.table(
  "earnings_types",
  {
    earningsTypeId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    earningsCode: text().notNull(),
    ...nameColumn,
    category: earningsCategoryEnum().notNull(),
    description: text(),
    defaultRate: numeric({ precision: 5, scale: 2 }),
    isTaxable: boolean().notNull().default(true),
    isPensionable: boolean().notNull().default(true),
    status: earningsTypeStatusEnum().notNull().default("ACTIVE"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_earnings_types_tenant").on(t.tenantId),
    index("idx_earnings_types_category").on(t.tenantId, t.category),
    index("idx_earnings_types_status").on(t.tenantId, t.status),
    uniqueIndex("uq_earnings_types_code")
      .on(t.tenantId, sql`lower(${t.earningsCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_earnings_types_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_earnings_types_rate",
      sql`${t.defaultRate} IS NULL OR ${t.defaultRate} >= 0`
    ),
  ]
);

export const EarningsTypeIdSchema = z.number().int().brand<"EarningsTypeId">();
export type EarningsTypeId = z.infer<typeof EarningsTypeIdSchema>;

export const earningsTypeSelectSchema = createSelectSchema(earningsTypes);

export const earningsTypeInsertSchema = createInsertSchema(earningsTypes, {
  earningsCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  defaultRate: z.string().optional(),
});

export const earningsTypeUpdateSchema = createUpdateSchema(earningsTypes);

export type EarningsType = typeof earningsTypes.$inferSelect;
export type NewEarningsType = typeof earningsTypes.$inferInsert;
