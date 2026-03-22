import { integer, text, date, numeric, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { learningSchema } from "../_schema";
import {
  dateStringSchema,
  invoiceNumberSchema,
  nullableOptional,
  positiveMoney10_2StringSchema,
  trainingCostDescriptionSchema,
  vendorNameSchema,
} from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { currencies } from "../../../schema-platform/core/currencies";
import { trainingSessions } from "./trainingSessions";

/**
 * Training Cost Records - Budget tracking for training sessions.
 */
export const costCategories = [
  "TRAINER_FEE",
  "VENUE",
  "MATERIALS",
  "TRAVEL",
  "CATERING",
  "EQUIPMENT",
  "CERTIFICATION",
  "OTHER",
] as const;

export const costCategoryEnum = learningSchema.enum("cost_category", [...costCategories]);

export const costCategoryZodEnum = z.enum(costCategories);

export const trainingCostRecords = learningSchema.table(
  "training_cost_records",
  {
    costRecordId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    sessionId: integer().notNull(),
    costCategory: costCategoryEnum().notNull(),
    description: text().notNull(),
    amount: numeric({ precision: 10, scale: 2 }).notNull(),
    currencyId: integer().notNull(),
    costDate: date().notNull(),
    invoiceNumber: text(),
    vendorName: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_training_cost_records_tenant").on(t.tenantId),
    index("idx_training_cost_records_session").on(t.tenantId, t.sessionId),
    index("idx_training_cost_records_category").on(t.tenantId, t.costCategory),
    index("idx_training_cost_records_date").on(t.tenantId, t.costDate),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_training_cost_records_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.sessionId],
      foreignColumns: [trainingSessions.sessionId],
      name: "fk_training_cost_records_session",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.currencyId],
      foreignColumns: [currencies.currencyId],
      name: "fk_training_cost_records_currency",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check("chk_training_cost_records_amount", sql`${t.amount} > 0`),
  ]
);

export const TrainingCostRecordIdSchema = z.number().int().brand<"TrainingCostRecordId">();
export type TrainingCostRecordId = z.infer<typeof TrainingCostRecordIdSchema>;

/** Read model: trust DB + amount `CHECK`; use insert/update for write rules. */
export const trainingCostRecordSelectSchema = createSelectSchema(trainingCostRecords);

export const trainingCostRecordInsertSchema = createInsertSchema(trainingCostRecords, {
  costCategory: costCategoryZodEnum,
  description: trainingCostDescriptionSchema,
  amount: positiveMoney10_2StringSchema,
  costDate: dateStringSchema,
  invoiceNumber: invoiceNumberSchema.optional(),
  vendorName: vendorNameSchema.optional(),
});

/**
 * Patch semantics: `.optional()` = omit or set. `nullableOptional`, `dateNullableOptionalSchema`, and
 * `timestamptzNullableOptionalSchema` additionally allow explicitly clearing nullable columns to SQL NULL.
 */
export const trainingCostRecordUpdateSchema = createUpdateSchema(trainingCostRecords, {
  costCategory: costCategoryZodEnum.optional(),
  description: trainingCostDescriptionSchema.optional(),
  amount: nullableOptional(positiveMoney10_2StringSchema),
  invoiceNumber: nullableOptional(invoiceNumberSchema),
  vendorName: nullableOptional(vendorNameSchema),
  costDate: dateStringSchema.optional(),
});

export type TrainingCostRecord = typeof trainingCostRecords.$inferSelect;
export type NewTrainingCostRecord = typeof trainingCostRecords.$inferInsert;
