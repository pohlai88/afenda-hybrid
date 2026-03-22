import { integer, text, date, index, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { recruitmentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { candidates } from "../fundamentals/candidates";

/**
 * Background checks (`recruitment.background_checks`) — verification work per candidate.
 *
 * **Tenancy:** `tenantId` should match the referenced `candidates.tenantId`; PostgreSQL does not enforce
 * that equality. Validate in the service layer before insert (see `createBackgroundCheck`).
 *
 * **Result vs status:** `result` should only be set when `status` is **`COMPLETED`** — enforced in Zod
 * (`backgroundCheckInsertSchema` / `backgroundCheckUpdateSchema`). Product may store `findings` while in
 * `IN_PROGRESS`; terminal disposition lives in `result` once complete.
 *
 * **documentPath:** Storage key or URL as returned by your file/scan pipeline; normalize and validate
 * shape (URL vs relative key) at the service layer if you need stricter rules than max length.
 *
 * Audit: `createdBy` / `updatedBy` are required via `auditColumns` (set in the service / API layer).
 */
export const checkTypes = [
  "IDENTITY",
  "EMPLOYMENT",
  "EDUCATION",
  "CRIMINAL",
  "CREDIT",
  "REFERENCE",
  "DRUG_TEST",
  "OTHER",
] as const;

export const checkTypeEnum = recruitmentSchema.enum("check_type", [...checkTypes]);

export const CheckTypeSchema = z.enum(checkTypes);
export type CheckType = z.infer<typeof CheckTypeSchema>;

export const checkStatuses = [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
] as const;

export const checkStatusEnum = recruitmentSchema.enum("check_status", [...checkStatuses]);

export const CheckStatusSchema = z.enum(checkStatuses);
export type CheckStatus = z.infer<typeof CheckStatusSchema>;

export const checkResults = ["CLEAR", "FLAGGED", "DISCREPANCY", "FAILED", "INCONCLUSIVE"] as const;

export const checkResultEnum = recruitmentSchema.enum("check_result", [...checkResults]);

export const CheckResultSchema = z.enum(checkResults);
export type CheckResult = z.infer<typeof CheckResultSchema>;

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
    /** List per candidate by recency: `WHERE tenantId AND candidateId ORDER BY requestedDate DESC`. */
    index("idx_background_checks_candidate_requested_date").on(
      t.tenantId,
      t.candidateId,
      t.requestedDate
    ),
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

function refineBackgroundCheckResultVsStatus(
  data: Record<string, unknown>,
  ctx: z.RefinementCtx,
  mode: "insert" | "update"
) {
  const status = data.status;
  const hasResult = Object.prototype.hasOwnProperty.call(data, "result");
  const result = hasResult ? data.result : undefined;

  if (result != null && status !== "COMPLETED") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        mode === "update"
          ? "When setting result, status must be COMPLETED in the same update"
          : "Result can only be set when status is COMPLETED",
      path: ["result"],
    });
  }
}

export const backgroundCheckInsertSchema = createInsertSchema(backgroundChecks, {
  checkType: CheckTypeSchema,
  /** Omit to use DB default `PENDING`. */
  status: CheckStatusSchema.optional(),
  result: CheckResultSchema.optional().nullable(),
  tenantId: z.number().int().positive(),
  candidateId: z.number().int().positive(),
  vendorName: z.string().max(200).optional(),
  findings: z.string().max(4000).optional(),
  documentPath: z.string().max(500).optional(),
}).superRefine((row, ctx) =>
  refineBackgroundCheckResultVsStatus(row as Record<string, unknown>, ctx, "insert")
);

export const backgroundCheckUpdateSchema = createUpdateSchema(backgroundChecks, {
  checkType: CheckTypeSchema.optional(),
  status: CheckStatusSchema.optional(),
  result: CheckResultSchema.optional().nullable(),
  tenantId: z.number().int().positive().optional(),
  candidateId: z.number().int().positive().optional(),
  vendorName: z.string().max(200).optional().nullable(),
  findings: z.string().max(4000).optional().nullable(),
  documentPath: z.string().max(500).optional().nullable(),
  completedDate: z.string().optional().nullable(),
}).superRefine((row, ctx) => {
  const data = row as Record<string, unknown>;
  refineBackgroundCheckResultVsStatus(data, ctx, "update");
});

export type BackgroundCheck = typeof backgroundChecks.$inferSelect;
export type NewBackgroundCheck = typeof backgroundChecks.$inferInsert;
