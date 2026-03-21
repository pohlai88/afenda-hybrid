import { integer, text, numeric, smallint, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import {
  hrBounds,
  nullableOptional,
  positionFteStringSchema,
  positionSalaryStringSchema,
  refinePositionSalaryOrderAndBounds,
} from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";

/**
 * Positions - Budgeted headcount slots within departments.
 *
 * Circular FK note: departmentId, jobRoleId, jobGradeId FKs are added via custom SQL
 * in migrations to avoid circular import dependencies.
 * Relations are defined in hr/_relations.ts for query convenience.
 */
export const positionStatuses = ["ACTIVE", "INACTIVE", "ARCHIVED", "FROZEN"] as const;

export const positionStatusEnum = hrSchema.enum("position_status", [...positionStatuses]);

export const positionStatusZodEnum = z.enum(positionStatuses);

export const positions = hrSchema.table(
  "positions",
  {
    positionId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    positionCode: text().notNull(),
    ...nameColumn,
    description: text(),
    departmentId: integer(),
    jobRoleId: integer(),
    jobGradeId: integer(),
    headcount: smallint().notNull().default(1),
    fte: numeric({ precision: 3, scale: 2 }).notNull().default("1.00"),
    minSalary: numeric({ precision: 12, scale: 2 }),
    maxSalary: numeric({ precision: 12, scale: 2 }),
    status: positionStatusEnum().notNull().default("ACTIVE"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_positions_tenant").on(t.tenantId),
    index("idx_positions_department").on(t.tenantId, t.departmentId),
    index("idx_positions_job_role").on(t.tenantId, t.jobRoleId),
    index("idx_positions_job_grade").on(t.tenantId, t.jobGradeId),
    index("idx_positions_status").on(t.tenantId, t.status),
    index("idx_positions_created").on(t.tenantId, t.createdAt),
    uniqueIndex("uq_positions_code")
      .on(t.tenantId, sql`lower(${t.positionCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_positions_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_positions_salary_range",
      sql`${t.minSalary} IS NULL OR ${t.maxSalary} IS NULL OR ${t.minSalary} <= ${t.maxSalary}`
    ),
    check(
      "chk_positions_salary_positive",
      sql`(${t.minSalary} IS NULL OR ${t.minSalary} >= 0) AND (${t.maxSalary} IS NULL OR ${t.maxSalary} >= 0)`
    ),
    check(
      "chk_positions_headcount",
      sql`${t.headcount} >= 0`
    ),
    check(
      "chk_positions_fte",
      sql`${t.fte} > 0 AND ${t.fte} <= 1`
    ),
  ]
);

export const PositionIdSchema = z.number().int().brand<"PositionId">();
export type PositionId = z.infer<typeof PositionIdSchema>;

export const positionSelectSchema = createSelectSchema(positions);

export const positionInsertSchema = createInsertSchema(positions, {
  positionCode: z
    .string()
    .min(hrBounds.positionCodeMin)
    .max(hrBounds.positionCodeMax)
    .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  /** Omit to use table default `1` (`chk_positions_headcount`). */
  headcount: z.number().int().min(0).max(hrBounds.positionHeadcountMax).optional(),
  /** Omit to use table default `1.00` (`chk_positions_fte`). */
  fte: positionFteStringSchema.optional(),
  minSalary: positionSalaryStringSchema.optional(),
  maxSalary: positionSalaryStringSchema.optional(),
}).superRefine((data, ctx) => refinePositionSalaryOrderAndBounds(data, ctx));

/** Nullable FKs and salary bands can be cleared to SQL NULL via `nullableOptional`. */
export const positionUpdateSchema = createUpdateSchema(positions, {
  positionCode: z
    .string()
    .min(hrBounds.positionCodeMin)
    .max(hrBounds.positionCodeMax)
    .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed")
    .optional(),
  name: z.string().min(1).max(200).optional(),
  description: nullableOptional(z.string().max(2000)),
  departmentId: nullableOptional(z.number().int()),
  jobRoleId: nullableOptional(z.number().int()),
  jobGradeId: nullableOptional(z.number().int()),
  headcount: z.number().int().min(0).max(hrBounds.positionHeadcountMax).optional(),
  fte: positionFteStringSchema.optional(),
  minSalary: nullableOptional(positionSalaryStringSchema),
  maxSalary: nullableOptional(positionSalaryStringSchema),
}).superRefine((data, ctx) => refinePositionSalaryOrderAndBounds(data, ctx));

export type Position = typeof positions.$inferSelect;
export type NewPosition = typeof positions.$inferInsert;
