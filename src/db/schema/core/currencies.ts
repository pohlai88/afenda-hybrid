import { integer, text, smallint, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { coreSchema } from "./tenants";
import { timestampColumns, softDeleteColumns } from "../_shared";

/**
 * Currencies - Global reference data for ISO 4217 currency codes.
 * NOT tenant-scoped - shared across all tenants as reference data.
 * Used by payroll, compensation, expense claims, and financial reporting.
 */
export const currencyStatuses = ["ACTIVE", "INACTIVE"] as const;

export const currencyStatusEnum = coreSchema.enum("currency_status", [...currencyStatuses]);

export const currencyStatusZodEnum = createSelectSchema(currencyStatusEnum);

export const currencies = coreSchema.table(
  "currencies",
  {
    currencyId: integer().primaryKey().generatedAlwaysAsIdentity(),
    currencyCode: text().notNull(),
    name: text().notNull(),
    symbol: text().notNull(),
    decimalPlaces: smallint().notNull().default(2),
    status: currencyStatusEnum().notNull().default("ACTIVE"),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (t) => [
    uniqueIndex("uq_currencies_code")
      .on(sql`upper(${t.currencyCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    index("idx_currencies_status").on(t.status),
  ]
);

export const CurrencyIdSchema = z.number().int().brand<"CurrencyId">();
export type CurrencyId = z.infer<typeof CurrencyIdSchema>;

export const currencySelectSchema = createSelectSchema(currencies);

export const currencyInsertSchema = createInsertSchema(currencies, {
  currencyCode: z.string().length(3).regex(/^[A-Z]{3}$/, "Must be ISO 4217 3-letter code"),
  name: z.string().min(1).max(100),
  symbol: z.string().min(1).max(10),
  decimalPlaces: z.number().int().min(0).max(4),
});

export const currencyUpdateSchema = createUpdateSchema(currencies);

export type Currency = typeof currencies.$inferSelect;
export type NewCurrency = typeof currencies.$inferInsert;
