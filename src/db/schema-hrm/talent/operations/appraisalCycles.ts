import { integer, text, date, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { talentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";

/**
 * Appraisal Cycles - Organization-wide performance appraisal periods.
 * Defines the timeframe and status for conducting performance reviews.
 */
export const appraisalCycleStatuses = ["DRAFT", "OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

export const appraisalCycleStatusEnum = talentSchema.enum("appraisal_cycle_status", [...appraisalCycleStatuses]);

export const AppraisalCycleStatusSchema = z.enum(appraisalCycleStatuses);
export type AppraisalCycleStatus = z.infer<typeof AppraisalCycleStatusSchema>;

export const appraisalCycles = talentSchema.table(
  "appraisal_cycles",
  {
    cycleId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    cycleCode: text().notNull(),
    ...nameColumn,
    description: text(),
    startDate: date().notNull(),
    endDate: date().notNull(),
    status: appraisalCycleStatusEnum().notNull().default("DRAFT"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_appraisal_cycles_tenant").on(t.tenantId),
    index("idx_appraisal_cycles_status").on(t.tenantId, t.status),
    index("idx_appraisal_cycles_dates").on(t.tenantId, t.startDate, t.endDate),
    uniqueIndex("uq_appraisal_cycles_code")
      .on(t.tenantId, sql`lower(${t.cycleCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_appraisal_cycles_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_appraisal_cycles_date_range",
      sql`${t.endDate} >= ${t.startDate}`
    ),
  ]
);

export const AppraisalCycleIdSchema = z.number().int().positive().brand<"AppraisalCycleId">();
export type AppraisalCycleId = z.infer<typeof AppraisalCycleIdSchema>;

const cycleCodeSchema = z
  .string()
  .min(2)
  .max(50)
  .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed")
  .transform((s) => s.toUpperCase());

export const appraisalCycleSelectSchema = createSelectSchema(appraisalCycles);

export const appraisalCycleInsertSchema = createInsertSchema(appraisalCycles, {
  tenantId: z.number().int().positive(),
  cycleCode: cycleCodeSchema,
  name: z.string().min(1).max(200),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: AppraisalCycleStatusSchema.optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
}).superRefine((data, ctx) => {
  if (data.endDate < data.startDate) {
    ctx.addIssue({
      code: "custom",
      message: "endDate must be on or after startDate",
      path: ["endDate"],
    });
  }
});

export const appraisalCycleUpdateSchema = createUpdateSchema(appraisalCycles, {
  cycleCode: cycleCodeSchema.optional(),
  name: z.string().min(1).max(200).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: AppraisalCycleStatusSchema.optional(),
  updatedBy: z.number().int().positive().optional(),
})
  .omit({ tenantId: true });

export type AppraisalCycle = typeof appraisalCycles.$inferSelect;
export type NewAppraisalCycle = typeof appraisalCycles.$inferInsert;
