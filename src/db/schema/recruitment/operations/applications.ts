import { integer, text, date, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { recruitmentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { candidates } from "../fundamentals/candidates";
import { jobRequisitions } from "./jobRequisitions";

/**
 * Applications - Candidate job applications.
 */
export const applicationStatuses = ["SUBMITTED", "SCREENING", "SHORTLISTED", "INTERVIEWING", "OFFER_PENDING", "OFFER_EXTENDED", "HIRED", "REJECTED", "WITHDRAWN"] as const;

export const applicationStatusEnum = recruitmentSchema.enum("application_status", [...applicationStatuses]);

export const applicationStatusZodEnum = createSelectSchema(applicationStatusEnum);

export const applications = recruitmentSchema.table(
  "applications",
  {
    applicationId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    candidateId: integer().notNull(),
    requisitionId: integer().notNull(),
    applicationDate: date().notNull(),
    coverLetter: text(),
    resumeVersion: text(),
    status: applicationStatusEnum().notNull().default("SUBMITTED"),
    rejectionReason: text(),
    withdrawalReason: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_applications_tenant").on(t.tenantId),
    index("idx_applications_candidate").on(t.tenantId, t.candidateId),
    index("idx_applications_requisition").on(t.tenantId, t.requisitionId),
    index("idx_applications_status").on(t.tenantId, t.status),
    index("idx_applications_date").on(t.tenantId, t.applicationDate),
    uniqueIndex("uq_applications_candidate_requisition")
      .on(t.tenantId, t.candidateId, t.requisitionId)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_applications_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.candidateId],
      foreignColumns: [candidates.candidateId],
      name: "fk_applications_candidate",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.requisitionId],
      foreignColumns: [jobRequisitions.requisitionId],
      name: "fk_applications_requisition",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const ApplicationIdSchema = z.number().int().brand<"ApplicationId">();
export type ApplicationId = z.infer<typeof ApplicationIdSchema>;

export const applicationSelectSchema = createSelectSchema(applications);

export const applicationInsertSchema = createInsertSchema(applications, {
  coverLetter: z.string().max(10000).optional(),
  resumeVersion: z.string().max(500).optional(),
  rejectionReason: z.string().max(1000).optional(),
  withdrawalReason: z.string().max(1000).optional(),
});

export const applicationUpdateSchema = createUpdateSchema(applications);

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
