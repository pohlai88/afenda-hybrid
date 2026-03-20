import { integer, text, date, numeric, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { learningSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { currencies } from "../../core/currencies";
import { trainingSessions } from "./trainingSessions";

/**
 * Training Cost Records - Budget tracking for training sessions.
 */
export const costCategories = ["TRAINER_FEE", "VENUE", "MATERIALS", "TRAVEL", "CATERING", "EQUIPMENT", "CERTIFICATION", "OTHER"] as const;

export const costCategoryEnum = learningSchema.enum("cost_category", [...costCategories]);

export const costCategoryZodEnum = createSelectSchema(costCategoryEnum);

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
    check(
      "chk_training_cost_records_amount",
      sql`${t.amount} > 0`
    ),
  ]
);

export const TrainingCostRecordIdSchema = z.number().int().brand<"TrainingCostRecordId">();
export type TrainingCostRecordId = z.infer<typeof TrainingCostRecordIdSchema>;

export const trainingCostRecordSelectSchema = createSelectSchema(trainingCostRecords);

export const trainingCostRecordInsertSchema = createInsertSchema(trainingCostRecords, {
  description: z.string().min(1).max(500),
  amount: z.string().refine((val) => parseFloat(val) > 0, "Amount must be positive"),
  invoiceNumber: z.string().max(100).optional(),
  vendorName: z.string().max(200).optional(),
});

export const trainingCostRecordUpdateSchema = createUpdateSchema(trainingCostRecords);

export type TrainingCostRecord = typeof trainingCostRecords.$inferSelect;
export type NewTrainingCostRecord = typeof trainingCostRecords.$inferInsert;
