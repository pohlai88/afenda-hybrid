import { integer, text, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../_shared";
import { tenants } from "../../core/tenants";
import { jobFamilies } from "./jobFamilies";

/**
 * Job Roles - Functional responsibilities and job descriptions.
 * Linked to job families for career pathing.
 */
export const jobRoleStatuses = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;

export const jobRoleStatusEnum = hrSchema.enum("job_role_status", [...jobRoleStatuses]);

export const jobRoleStatusZodEnum = createSelectSchema(jobRoleStatusEnum);

export const jobRoles = hrSchema.table(
  "job_roles",
  {
    jobRoleId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    roleCode: text().notNull(),
    ...nameColumn,
    description: text(),
    jobFamilyId: integer(),
    responsibilities: text(),
    qualifications: text(),
    status: jobRoleStatusEnum().notNull().default("ACTIVE"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_job_roles_tenant").on(t.tenantId),
    index("idx_job_roles_family").on(t.tenantId, t.jobFamilyId),
    index("idx_job_roles_status").on(t.tenantId, t.status),
    uniqueIndex("uq_job_roles_code")
      .on(t.tenantId, sql`lower(${t.roleCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_job_roles_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.jobFamilyId],
      foreignColumns: [jobFamilies.jobFamilyId],
      name: "fk_job_roles_family",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const JobRoleIdSchema = z.number().int().brand<"JobRoleId">();
export type JobRoleId = z.infer<typeof JobRoleIdSchema>;

export const jobRoleSelectSchema = createSelectSchema(jobRoles);

export const jobRoleInsertSchema = createInsertSchema(jobRoles, {
  roleCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  responsibilities: z.string().max(4000).optional(),
  qualifications: z.string().max(4000).optional(),
});

export const jobRoleUpdateSchema = createUpdateSchema(jobRoles);

export type JobRole = typeof jobRoles.$inferSelect;
export type NewJobRole = typeof jobRoles.$inferInsert;
