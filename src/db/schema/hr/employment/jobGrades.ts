import { integer, text, numeric, smallint, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../_shared";
import { tenants } from "../../core/tenants";
import { currencies } from "../../core/currencies";

/**
 * Job Grades - Pay band classification with salary ranges.
 * Used for compensation benchmarking and career progression.
 */
export const jobGradeStatuses = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;

export const jobGradeStatusEnum = hrSchema.enum("job_grade_status", [...jobGradeStatuses]);

export const jobGradeStatusZodEnum = createSelectSchema(jobGradeStatusEnum);

export const jobGrades = hrSchema.table(
  "job_grades",
  {
    jobGradeId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    gradeCode: text().notNull(),
    ...nameColumn,
    level: smallint().notNull(),
    minSalary: numeric({ precision: 12, scale: 2 }),
    midSalary: numeric({ precision: 12, scale: 2 }),
    maxSalary: numeric({ precision: 12, scale: 2 }),
    currencyId: integer(),
    description: text(),
    status: jobGradeStatusEnum().notNull().default("ACTIVE"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_job_grades_tenant").on(t.tenantId),
    index("idx_job_grades_level").on(t.tenantId, t.level),
    index("idx_job_grades_status").on(t.tenantId, t.status),
    uniqueIndex("uq_job_grades_code")
      .on(t.tenantId, sql`lower(${t.gradeCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    uniqueIndex("uq_job_grades_level")
      .on(t.tenantId, t.level)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_job_grades_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.currencyId],
      foreignColumns: [currencies.currencyId],
      name: "fk_job_grades_currency",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_job_grades_salary_range",
      sql`${t.minSalary} IS NULL OR ${t.maxSalary} IS NULL OR ${t.minSalary} <= ${t.maxSalary}`
    ),
    check(
      "chk_job_grades_mid_salary",
      sql`${t.midSalary} IS NULL OR (
        (${t.minSalary} IS NULL OR ${t.midSalary} >= ${t.minSalary}) AND
        (${t.maxSalary} IS NULL OR ${t.midSalary} <= ${t.maxSalary})
      )`
    ),
    check(
      "chk_job_grades_salary_positive",
      sql`(${t.minSalary} IS NULL OR ${t.minSalary} >= 0) AND
          (${t.midSalary} IS NULL OR ${t.midSalary} >= 0) AND
          (${t.maxSalary} IS NULL OR ${t.maxSalary} >= 0)`
    ),
    check(
      "chk_job_grades_level_positive",
      sql`${t.level} >= 1`
    ),
  ]
);

export const JobGradeIdSchema = z.number().int().brand<"JobGradeId">();
export type JobGradeId = z.infer<typeof JobGradeIdSchema>;

export const jobGradeSelectSchema = createSelectSchema(jobGrades);

export const jobGradeInsertSchema = createInsertSchema(jobGrades, {
  gradeCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  name: z.string().min(1).max(200),
  level: z.number().int().min(1).max(100),
  minSalary: z.string().optional(),
  midSalary: z.string().optional(),
  maxSalary: z.string().optional(),
  description: z.string().max(1000).optional(),
});

export const jobGradeUpdateSchema = createUpdateSchema(jobGrades);

export type JobGrade = typeof jobGrades.$inferSelect;
export type NewJobGrade = typeof jobGrades.$inferInsert;
