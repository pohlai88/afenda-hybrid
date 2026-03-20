import { integer, text, date, smallint, numeric, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { talentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";

/**
 * Performance Reviews - Periodic employee evaluations.
 * Circular FK note: employeeId and reviewerId FKs added via custom SQL.
 */
export const reviewTypes = ["ANNUAL", "SEMI_ANNUAL", "QUARTERLY", "PROBATION", "PROJECT", "AD_HOC"] as const;

export const reviewTypeEnum = talentSchema.enum("review_type", [...reviewTypes]);

export const reviewTypeZodEnum = createSelectSchema(reviewTypeEnum);

export const reviewStatuses = ["DRAFT", "SELF_ASSESSMENT", "MANAGER_REVIEW", "CALIBRATION", "COMPLETED", "ACKNOWLEDGED"] as const;

export const reviewStatusEnum = talentSchema.enum("review_status", [...reviewStatuses]);

export const reviewStatusZodEnum = createSelectSchema(reviewStatusEnum);

export const performanceReviews = talentSchema.table(
  "performance_reviews",
  {
    reviewId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    reviewerId: integer().notNull(),
    reviewType: reviewTypeEnum().notNull(),
    reviewPeriodStart: date().notNull(),
    reviewPeriodEnd: date().notNull(),
    selfRating: smallint(),
    managerRating: smallint(),
    finalRating: smallint(),
    overallScore: numeric({ precision: 3, scale: 2 }),
    strengths: text(),
    areasForImprovement: text(),
    managerComments: text(),
    employeeComments: text(),
    status: reviewStatusEnum().notNull().default("DRAFT"),
    completedDate: date(),
    acknowledgedDate: date(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_performance_reviews_tenant").on(t.tenantId),
    index("idx_performance_reviews_employee").on(t.tenantId, t.employeeId),
    index("idx_performance_reviews_reviewer").on(t.tenantId, t.reviewerId),
    index("idx_performance_reviews_type").on(t.tenantId, t.reviewType),
    index("idx_performance_reviews_status").on(t.tenantId, t.status),
    index("idx_performance_reviews_period").on(t.tenantId, t.reviewPeriodStart, t.reviewPeriodEnd),
    uniqueIndex("uq_performance_reviews_employee_period")
      .on(t.tenantId, t.employeeId, t.reviewType, t.reviewPeriodStart, t.reviewPeriodEnd)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_performance_reviews_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_performance_reviews_period",
      sql`${t.reviewPeriodEnd} >= ${t.reviewPeriodStart}`
    ),
    check(
      "chk_performance_reviews_ratings",
      sql`(${t.selfRating} IS NULL OR (${t.selfRating} >= 1 AND ${t.selfRating} <= 5)) AND
          (${t.managerRating} IS NULL OR (${t.managerRating} >= 1 AND ${t.managerRating} <= 5)) AND
          (${t.finalRating} IS NULL OR (${t.finalRating} >= 1 AND ${t.finalRating} <= 5))`
    ),
    check(
      "chk_performance_reviews_score",
      sql`${t.overallScore} IS NULL OR (${t.overallScore} >= 0 AND ${t.overallScore} <= 5)`
    ),
  ]
);

export const PerformanceReviewIdSchema = z.number().int().brand<"PerformanceReviewId">();
export type PerformanceReviewId = z.infer<typeof PerformanceReviewIdSchema>;

export const performanceReviewSelectSchema = createSelectSchema(performanceReviews);

export const performanceReviewInsertSchema = createInsertSchema(performanceReviews, {
  selfRating: z.number().int().min(1).max(5).optional(),
  managerRating: z.number().int().min(1).max(5).optional(),
  finalRating: z.number().int().min(1).max(5).optional(),
  overallScore: z.string().optional(),
  strengths: z.string().max(4000).optional(),
  areasForImprovement: z.string().max(4000).optional(),
  managerComments: z.string().max(4000).optional(),
  employeeComments: z.string().max(4000).optional(),
});

export const performanceReviewUpdateSchema = createUpdateSchema(performanceReviews);

export type PerformanceReview = typeof performanceReviews.$inferSelect;
export type NewPerformanceReview = typeof performanceReviews.$inferInsert;
