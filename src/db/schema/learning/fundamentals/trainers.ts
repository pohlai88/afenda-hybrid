import { integer, text, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { learningSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../_shared";
import { tenants } from "../../core/tenants";

/**
 * Trainers - Instructor profiles (internal or external).
 * Circular FK note: employeeId FK added via custom SQL for internal trainers.
 */
export const trainerTypes = ["INTERNAL", "EXTERNAL", "VENDOR"] as const;

export const trainerTypeEnum = learningSchema.enum("trainer_type", [...trainerTypes]);

export const trainerTypeZodEnum = createSelectSchema(trainerTypeEnum);

export const trainerStatuses = ["ACTIVE", "INACTIVE", "ON_LEAVE"] as const;

export const trainerStatusEnum = learningSchema.enum("trainer_status", [...trainerStatuses]);

export const trainerStatusZodEnum = createSelectSchema(trainerStatusEnum);

export const trainers = learningSchema.table(
  "trainers",
  {
    trainerId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    trainerCode: text().notNull(),
    ...nameColumn,
    trainerType: trainerTypeEnum().notNull().default("INTERNAL"),
    employeeId: integer(),
    email: text(),
    phone: text(),
    specializations: text(),
    bio: text(),
    status: trainerStatusEnum().notNull().default("ACTIVE"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_trainers_tenant").on(t.tenantId),
    index("idx_trainers_type").on(t.tenantId, t.trainerType),
    index("idx_trainers_employee").on(t.tenantId, t.employeeId),
    index("idx_trainers_status").on(t.tenantId, t.status),
    uniqueIndex("uq_trainers_code")
      .on(t.tenantId, sql`lower(${t.trainerCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_trainers_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const TrainerIdSchema = z.number().int().brand<"TrainerId">();
export type TrainerId = z.infer<typeof TrainerIdSchema>;

export const trainerSelectSchema = createSelectSchema(trainers);

export const trainerInsertSchema = createInsertSchema(trainers, {
  trainerCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  name: z.string().min(1).max(200),
  email: z.email().optional(),
  phone: z.string().max(30).optional(),
  specializations: z.string().max(1000).optional(),
  bio: z.string().max(2000).optional(),
});

export const trainerUpdateSchema = createUpdateSchema(trainers);

export type Trainer = typeof trainers.$inferSelect;
export type NewTrainer = typeof trainers.$inferInsert;
