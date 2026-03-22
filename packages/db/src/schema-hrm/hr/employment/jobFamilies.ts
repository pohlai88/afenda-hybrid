import { integer, text, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import { nullableOptional } from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";

/**
 * Job Families - Groups of related job roles (e.g., Engineering, Finance, HR).
 * Used for career pathing, compensation analysis, and organizational design.
 */
export const jobFamilyStatuses = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;

export const jobFamilyStatusEnum = hrSchema.enum("job_family_status", [...jobFamilyStatuses]);

export const jobFamilyStatusZodEnum = z.enum(jobFamilyStatuses);

export const jobFamilies = hrSchema.table(
  "job_families",
  {
    jobFamilyId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    familyCode: text().notNull(),
    ...nameColumn,
    description: text(),
    status: jobFamilyStatusEnum().notNull().default("ACTIVE"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_job_families_tenant").on(t.tenantId),
    index("idx_job_families_status").on(t.tenantId, t.status),
    uniqueIndex("uq_job_families_code")
      .on(t.tenantId, sql`lower(${t.familyCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_job_families_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const JobFamilyIdSchema = z.number().int().brand<"JobFamilyId">();
export type JobFamilyId = z.infer<typeof JobFamilyIdSchema>;

export const jobFamilySelectSchema = createSelectSchema(jobFamilies);

export const jobFamilyInsertSchema = createInsertSchema(jobFamilies, {
  familyCode: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

export const jobFamilyUpdateSchema = createUpdateSchema(jobFamilies, {
  familyCode: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed")
    .optional(),
  name: z.string().min(1).max(200).optional(),
  description: nullableOptional(z.string().max(2000)),
});

export type JobFamily = typeof jobFamilies.$inferSelect;
export type NewJobFamily = typeof jobFamilies.$inferInsert;
