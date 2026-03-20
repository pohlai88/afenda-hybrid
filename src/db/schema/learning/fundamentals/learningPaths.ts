import { integer, text, smallint, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { learningSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../_shared";
import { tenants } from "../../core/tenants";

/**
 * Learning Paths - Ordered course roadmaps for career development.
 */
export const pathStatuses = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;

export const pathStatusEnum = learningSchema.enum("path_status", [...pathStatuses]);

export const pathStatusZodEnum = createSelectSchema(pathStatusEnum);

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
    check(
      "chk_learning_paths_hours",
      sql`${t.estimatedHours} IS NULL OR ${t.estimatedHours} > 0`
    ),
  ]
);

export const LearningPathIdSchema = z.number().int().brand<"LearningPathId">();
export type LearningPathId = z.infer<typeof LearningPathIdSchema>;

export const learningPathSelectSchema = createSelectSchema(learningPaths);

export const learningPathInsertSchema = createInsertSchema(learningPaths, {
  pathCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  targetAudience: z.string().max(500).optional(),
  estimatedHours: z.number().int().min(1).max(1000).optional(),
});

export const learningPathUpdateSchema = createUpdateSchema(learningPaths);

export type LearningPath = typeof learningPaths.$inferSelect;
export type NewLearningPath = typeof learningPaths.$inferInsert;
