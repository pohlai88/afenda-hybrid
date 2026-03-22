import { sql } from "drizzle-orm";
import { check, date, foreignKey, index, integer, text, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { auditColumns, softDeleteColumns, timestampColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { benefitsSchema } from "../_schema";
import { dateValue } from "../_zodShared";
import { benefitEnrollments } from "./benefitEnrollments";

/**
 * Dependent Coverages - Covered family members under benefit enrollments.
 * Circular FK note: dependentId FK added via custom SQL (references hr.dependents).
 * Audit columns are required in the database and must be set by the API or service layer.
 */
export const coverageStatuses = ["ACTIVE", "SUSPENDED", "TERMINATED"] as const;

export const coverageStatusEnum = benefitsSchema.enum("coverage_status", [...coverageStatuses]);

/** Zod enum for `dependent_coverages.status` (not enrollment `coverageLevel`). */
export const CoverageStatusSchema = z.enum(coverageStatuses);
export type CoverageStatus = z.infer<typeof CoverageStatusSchema>;

/**
 * Table `dependent_coverages` — dependent on an enrollment; `dependentId` FK via custom SQL; cascade delete with enrollment.
 */
export const dependentCoverages = benefitsSchema.table(
  "dependent_coverages",
  {
    dependentCoverageId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    enrollmentId: integer().notNull(),
    dependentId: integer().notNull(),
    effectiveFrom: date().notNull(),
    effectiveTo: date(),
    /** Lifecycle: `ACTIVE` | `SUSPENDED` | `TERMINATED`. */
    status: coverageStatusEnum().notNull().default("ACTIVE"),
    terminationReason: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_dependent_coverages_tenant").on(t.tenantId),
    index("idx_dependent_coverages_enrollment").on(t.tenantId, t.enrollmentId),
    index("idx_dependent_coverages_dependent").on(t.tenantId, t.dependentId),
    index("idx_dependent_coverages_status").on(t.tenantId, t.status),
    uniqueIndex("uq_dependent_coverages_active")
      .on(t.tenantId, t.enrollmentId, t.dependentId)
      .where(sql`${t.deletedAt} IS NULL AND ${t.status} = 'ACTIVE' AND ${t.effectiveTo} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_dependent_coverages_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.enrollmentId],
      foreignColumns: [benefitEnrollments.enrollmentId],
      name: "fk_dependent_coverages_enrollment",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    check(
      "chk_dependent_coverages_effective_range",
      sql`${t.effectiveTo} IS NULL OR ${t.effectiveTo} >= ${t.effectiveFrom}`
    ),
  ]
);

export const DependentCoverageIdSchema = z.number().int().positive().brand<"DependentCoverageId">();
export type DependentCoverageId = z.infer<typeof DependentCoverageIdSchema>;

export const dependentCoverageSelectSchema = createSelectSchema(dependentCoverages);

export const dependentCoverageInsertSchema = createInsertSchema(dependentCoverages, {
  tenantId: z.number().int().positive(),
  enrollmentId: z.number().int().positive(),
  dependentId: z.number().int().positive(),
  effectiveFrom: z.coerce.date(),
  effectiveTo: z.coerce.date().optional().nullable(),
  status: CoverageStatusSchema.optional(),
  terminationReason: z.string().max(500).optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
}).superRefine((data, ctx) => {
  if (data.effectiveTo != null) {
    const fromT = dateValue(data.effectiveFrom);
    const toT = dateValue(data.effectiveTo);
    if (Number.isNaN(fromT) || Number.isNaN(toT)) {
      ctx.addIssue({
        code: "custom",
        message: "effectiveFrom and effectiveTo must be valid dates",
        path: ["effectiveTo"],
      });
      return;
    }
    if (toT < fromT) {
      ctx.addIssue({
        code: "custom",
        message: "effectiveTo must be on or after effectiveFrom",
        path: ["effectiveTo"],
      });
    }
  }
  const st = data.status ?? "ACTIVE";
  if (st === "TERMINATED") {
    const tr = data.terminationReason?.trim() ?? "";
    if (tr.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "terminationReason is required when status is TERMINATED",
        path: ["terminationReason"],
      });
    }
  }
});

export const dependentCoverageUpdateSchema = createUpdateSchema(dependentCoverages, {
  effectiveFrom: z.coerce.date().optional(),
  effectiveTo: z.coerce.date().optional().nullable(),
  status: CoverageStatusSchema.optional(),
  terminationReason: z.string().max(500).optional().nullable(),
}).superRefine((data, ctx) => {
  if (
    data.effectiveFrom !== undefined &&
    data.effectiveTo !== undefined &&
    data.effectiveTo !== null
  ) {
    const fromT = dateValue(data.effectiveFrom);
    const toT = dateValue(data.effectiveTo);
    if (!Number.isNaN(fromT) && !Number.isNaN(toT) && toT < fromT) {
      ctx.addIssue({
        code: "custom",
        message: "effectiveTo must be on or after effectiveFrom",
        path: ["effectiveTo"],
      });
    }
  }
  if (data.status === "TERMINATED") {
    const tr =
      data.terminationReason === undefined || data.terminationReason === null
        ? ""
        : String(data.terminationReason).trim();
    if (tr.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "terminationReason is required when status is TERMINATED",
        path: ["terminationReason"],
      });
    }
  }
});

export type DependentCoverage = typeof dependentCoverages.$inferSelect;
export type NewDependentCoverage = typeof dependentCoverages.$inferInsert;
