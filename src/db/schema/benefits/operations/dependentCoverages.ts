import { integer, text, date, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { benefitsSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { benefitEnrollments } from "./benefitEnrollments";

/**
 * Dependent Coverages - Covered family members under benefit enrollments.
 * Circular FK note: dependentId FK added via custom SQL (references hr.dependents).
 */
export const coverageStatuses = ["ACTIVE", "SUSPENDED", "TERMINATED"] as const;

export const coverageStatusEnum = benefitsSchema.enum("coverage_status", [...coverageStatuses]);

export const coverageStatusZodEnum = createSelectSchema(coverageStatusEnum);

export const dependentCoverages = benefitsSchema.table(
  "dependent_coverages",
  {
    dependentCoverageId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    enrollmentId: integer().notNull(),
    dependentId: integer().notNull(),
    effectiveFrom: date().notNull(),
    effectiveTo: date(),
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

export const DependentCoverageIdSchema = z.number().int().brand<"DependentCoverageId">();
export type DependentCoverageId = z.infer<typeof DependentCoverageIdSchema>;

export const dependentCoverageSelectSchema = createSelectSchema(dependentCoverages);

export const dependentCoverageInsertSchema = createInsertSchema(dependentCoverages, {
  terminationReason: z.string().max(500).optional(),
});

export const dependentCoverageUpdateSchema = createUpdateSchema(dependentCoverages);

export type DependentCoverage = typeof dependentCoverages.$inferSelect;
export type NewDependentCoverage = typeof dependentCoverages.$inferInsert;
