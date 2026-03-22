import { integer, text, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { learningSchema } from "../_schema";
import {
  catalogCodeInputSchema,
  emailOptionalSchema,
  emailSchema,
  longTextSchema,
  nameSchema,
  nullableOptional,
  trainerPhoneSchema,
  trainerSpecializationsSchema,
} from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";

/**
 * Trainers - Instructor profiles (internal or external).
 * Circular FK note: employeeId FK added via custom SQL for internal trainers.
 */
export const trainerTypes = ["INTERNAL", "EXTERNAL", "VENDOR"] as const;

export const trainerTypeEnum = learningSchema.enum("trainer_type", [...trainerTypes]);

export const trainerTypeZodEnum = z.enum(trainerTypes);

export const trainerStatuses = ["ACTIVE", "INACTIVE", "ON_LEAVE"] as const;

export const trainerStatusEnum = learningSchema.enum("trainer_status", [...trainerStatuses]);

export const trainerStatusZodEnum = z.enum(trainerStatuses);

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
  trainerCode: catalogCodeInputSchema,
  name: nameSchema,
  email: emailOptionalSchema,
  phone: trainerPhoneSchema.optional(),
  specializations: trainerSpecializationsSchema.optional(),
  bio: longTextSchema.optional(),
  trainerType: trainerTypeZodEnum.optional(),
  status: trainerStatusZodEnum.optional(),
});

/**
 * Patch semantics: `.optional()` = omit or set. `nullableOptional`, `dateNullableOptionalSchema`, and
 * `timestamptzNullableOptionalSchema` additionally allow explicitly clearing nullable columns to SQL NULL.
 */
export const trainerUpdateSchema = createUpdateSchema(trainers, {
  trainerCode: catalogCodeInputSchema.optional(),
  name: nameSchema.optional(),
  email: nullableOptional(emailSchema),
  phone: nullableOptional(trainerPhoneSchema),
  specializations: nullableOptional(trainerSpecializationsSchema),
  bio: nullableOptional(longTextSchema),
  employeeId: nullableOptional(z.number().int()),
  trainerType: trainerTypeZodEnum.optional(),
  status: trainerStatusZodEnum.optional(),
});

export type Trainer = typeof trainers.$inferSelect;
export type NewTrainer = typeof trainers.$inferInsert;
