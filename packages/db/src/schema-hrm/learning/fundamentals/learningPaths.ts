import {
  integer,
  text,
  smallint,
  index,
  uniqueIndex,
  foreignKey,
  check,
} from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { learningSchema } from "../_schema";
import {
  catalogCodeInputSchema,
  longTextSchema,
  nameSchema,
  nullableOptional,
  pathEstimatedHoursSchema,
  shortLabel500Schema,
} from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";

/**
 * Learning Paths - Ordered course roadmaps for career development.
 */
export const pathStatuses = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;

export const pathStatusEnum = learningSchema.enum("path_status", [...pathStatuses]);

/** Zod: explicit enum; keep aligned with `pathStatuses` / Postgres. */
export const pathStatusZodEnum = z.enum(pathStatuses);

export const learningPaths = learningSchema.table(
  "learning_paths",
  {
    learningPathId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    pathCode: text().notNull(),
    ...nameColumn,
    description: text(),
    targetAudience: text(),
    estimatedHours: smallint(),
    status: pathStatusEnum().notNull().default("DRAFT"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_learning_paths_tenant").on(t.tenantId),
    index("idx_learning_paths_status").on(t.tenantId, t.status),
    uniqueIndex("uq_learning_paths_code")
      .on(t.tenantId, sql`lower(${t.pathCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_learning_paths_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check("chk_learning_paths_hours", sql`${t.estimatedHours} IS NULL OR ${t.estimatedHours} > 0`),
  ]
);

export const LearningPathIdSchema = z.number().int().brand<"LearningPathId">();
export type LearningPathId = z.infer<typeof LearningPathIdSchema>;

/** Read model: trust DB + `chk_learning_paths_hours`; use insert/update for write rules. */
export const learningPathSelectSchema = createSelectSchema(learningPaths);

export const learningPathInsertSchema = createInsertSchema(learningPaths, {
  pathCode: catalogCodeInputSchema,
  name: nameSchema,
  description: longTextSchema.optional(),
  targetAudience: shortLabel500Schema.optional(),
  estimatedHours: pathEstimatedHoursSchema.optional(),
  status: pathStatusZodEnum.optional(),
});

/**
 * Patch semantics: `.optional()` = omit or set. `nullableOptional`, `dateNullableOptionalSchema`, and
 * `timestamptzNullableOptionalSchema` additionally allow explicitly clearing nullable columns to SQL NULL.
 */
export const learningPathUpdateSchema = createUpdateSchema(learningPaths, {
  pathCode: catalogCodeInputSchema.optional(),
  name: nameSchema.optional(),
  description: nullableOptional(longTextSchema),
  targetAudience: nullableOptional(shortLabel500Schema),
  estimatedHours: nullableOptional(pathEstimatedHoursSchema),
  status: pathStatusZodEnum.optional(),
});

export type LearningPath = typeof learningPaths.$inferSelect;
export type NewLearningPath = typeof learningPaths.$inferInsert;
