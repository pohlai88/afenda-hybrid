import { integer, text, date, index, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { recruitmentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { candidates } from "../fundamentals/candidates";

/**
 * Background Checks - Verification results for candidates.
 */
export const checkTypes = ["IDENTITY", "EMPLOYMENT", "EDUCATION", "CRIMINAL", "CREDIT", "REFERENCE", "DRUG_TEST", "OTHER"] as const;

export const checkTypeEnum = recruitmentSchema.enum("check_type", [...checkTypes]);

export const checkTypeZodEnum = createSelectSchema(checkTypeEnum);

export const checkStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED", "CANCELLED"] as const;

export const checkStatusEnum = recruitmentSchema.enum("check_status", [...checkStatuses]);

export const checkStatusZodEnum = createSelectSchema(checkStatusEnum);

export const checkResults = ["CLEAR", "FLAGGED", "DISCREPANCY", "FAILED", "INCONCLUSIVE"] as const;

export const checkResultEnum = recruitmentSchema.enum("check_result", [...checkResults]);

export const checkResultZodEnum = createSelectSchema(checkResultEnum);

export const backgroundChecks = recruitmentSchema.table(
  "background_checks",
  {
    backgroundCheckId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    candidateId: integer().notNull(),
    checkType: checkTypeEnum().notNull(),
    vendorName: text(),
    requestedDate: date().notNull(),
    completedDate: date(),
    status: checkStatusEnum().notNull().default("PENDING"),
    result: checkResultEnum(),
    findings: text(),
    documentPath: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_background_checks_tenant").on(t.tenantId),
    index("idx_background_checks_candidate").on(t.tenantId, t.candidateId),
    index("idx_background_checks_type").on(t.tenantId, t.checkType),
    index("idx_background_checks_status").on(t.tenantId, t.status),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_background_checks_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.candidateId],
      foreignColumns: [candidates.candidateId],
      name: "fk_background_checks_candidate",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ]
);

export const BackgroundCheckIdSchema = z.number().int().brand<"BackgroundCheckId">();
export type BackgroundCheckId = z.infer<typeof BackgroundCheckIdSchema>;

export const backgroundCheckSelectSchema = createSelectSchema(backgroundChecks);

export const backgroundCheckInsertSchema = createInsertSchema(backgroundChecks, {
  vendorName: z.string().max(200).optional(),
  findings: z.string().max(4000).optional(),
  documentPath: z.string().max(500).optional(),
});

export const backgroundCheckUpdateSchema = createUpdateSchema(backgroundChecks);

export type BackgroundCheck = typeof backgroundChecks.$inferSelect;
export type NewBackgroundCheck = typeof backgroundChecks.$inferInsert;
