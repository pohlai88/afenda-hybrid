import { integer, text, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { talentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../_shared";
import { tenants } from "../../core/tenants";

/**
 * Competency Frameworks - Required skills per role/position.
 * Circular FK note: positionId and jobRoleId FKs added via custom SQL.
 */
export const frameworkStatuses = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;

export const frameworkStatusEnum = talentSchema.enum("framework_status", [...frameworkStatuses]);

export const frameworkStatusZodEnum = createSelectSchema(frameworkStatusEnum);

export const competencyFrameworks = talentSchema.table(
  "competency_frameworks",
  {
    frameworkId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    frameworkCode: text().notNull(),
    ...nameColumn,
    description: text(),
    positionId: integer(),
    jobRoleId: integer(),
    status: frameworkStatusEnum().notNull().default("DRAFT"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_competency_frameworks_tenant").on(t.tenantId),
    index("idx_competency_frameworks_position").on(t.tenantId, t.positionId),
    index("idx_competency_frameworks_role").on(t.tenantId, t.jobRoleId),
    index("idx_competency_frameworks_status").on(t.tenantId, t.status),
    uniqueIndex("uq_competency_frameworks_code")
      .on(t.tenantId, sql`lower(${t.frameworkCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_competency_frameworks_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const CompetencyFrameworkIdSchema = z.number().int().brand<"CompetencyFrameworkId">();
export type CompetencyFrameworkId = z.infer<typeof CompetencyFrameworkIdSchema>;

export const competencyFrameworkSelectSchema = createSelectSchema(competencyFrameworks);

export const competencyFrameworkInsertSchema = createInsertSchema(competencyFrameworks, {
  frameworkCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

export const competencyFrameworkUpdateSchema = createUpdateSchema(competencyFrameworks);

export type CompetencyFramework = typeof competencyFrameworks.$inferSelect;
export type NewCompetencyFramework = typeof competencyFrameworks.$inferInsert;
