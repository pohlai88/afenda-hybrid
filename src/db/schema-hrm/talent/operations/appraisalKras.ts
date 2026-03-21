import { integer, text, index, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { talentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { positions } from "../../hr/fundamentals/positions";
import { jobRoles } from "../../hr/employment/jobRoles";

/**
 * Appraisal KRAs - Key Result Areas master data.
 * Defines standard KRAs that can be linked to positions or job roles.
 */
export const appraisalKras = talentSchema.table(
  "appraisal_kras",
  {
    kraId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    ...nameColumn,
    description: text().notNull(),
    positionId: integer(),
    jobRoleId: integer(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_appraisal_kras_tenant").on(t.tenantId),
    index("idx_appraisal_kras_position").on(t.tenantId, t.positionId),
    index("idx_appraisal_kras_job_role").on(t.tenantId, t.jobRoleId),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_appraisal_kras_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.positionId],
      foreignColumns: [positions.positionId],
      name: "fk_appraisal_kras_position",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.jobRoleId],
      foreignColumns: [jobRoles.jobRoleId],
      name: "fk_appraisal_kras_job_role",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const AppraisalKraIdSchema = z.number().int().positive().brand<"AppraisalKraId">();
export type AppraisalKraId = z.infer<typeof AppraisalKraIdSchema>;

export const appraisalKraSelectSchema = createSelectSchema(appraisalKras);

export const appraisalKraInsertSchema = createInsertSchema(appraisalKras, {
  tenantId: z.number().int().positive(),
  name: z.string().min(1).max(200),
  description: z.string().min(10).max(2000),
  positionId: z.number().int().positive().optional().nullable(),
  jobRoleId: z.number().int().positive().optional().nullable(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const appraisalKraUpdateSchema = createUpdateSchema(appraisalKras, {
  name: z.string().min(1).max(200).optional(),
  description: z.string().min(10).max(2000).optional(),
  positionId: z.number().int().positive().optional().nullable(),
  jobRoleId: z.number().int().positive().optional().nullable(),
  updatedBy: z.number().int().positive().optional(),
})
  .omit({ tenantId: true });

export type AppraisalKra = typeof appraisalKras.$inferSelect;
export type NewAppraisalKra = typeof appraisalKras.$inferInsert;
