import { sql } from "drizzle-orm";
import {
  check,
  date,
  foreignKey,
  index,
  integer,
  numeric,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { auditColumns, softDeleteColumns, timestampColumns } from "../../../_shared";
import { currencies } from "../../../schema-platform/core/currencies";
import { tenants } from "../../../schema-platform/core/tenants";
import { benefitsSchema } from "../_schema";
import { dateValue, nonNegativeDecimalString, positiveDecimalString } from "../_zodShared";
import { benefitEnrollments } from "./benefitEnrollments";

/**
 * Claims Records - Insurance claims history.
 * Circular FK note: employeeId FK added via custom SQL.
 * Audit columns are required in the database and must be set by the API or service layer.
 */
export const claimStatuses = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "PARTIALLY_APPROVED",
  "REJECTED",
  "PAID",
  "CANCELLED",
] as const;

export const claimStatusEnum = benefitsSchema.enum("claim_status", [...claimStatuses]);

export const ClaimStatusSchema = z.enum(claimStatuses);
export type ClaimStatus = z.infer<typeof ClaimStatusSchema>;

function parseDecimal(s: string | undefined | null): number | null {
  if (s === undefined || s === null || s === "") return null;
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * Table `claims_records` — claim against an enrollment; amounts + lifecycle; `employeeId` / `reviewedBy` FKs via custom SQL.
 */
export const claimsRecords = benefitsSchema.table(
  "claims_records",
  {
    claimRecordId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    enrollmentId: integer().notNull(),
    employeeId: integer().notNull(),
    claimNumber: text().notNull(),
    claimDate: date().notNull(),
    serviceDate: date().notNull(),
    claimAmount: numeric({ precision: 10, scale: 2 }).notNull(),
    approvedAmount: numeric({ precision: 10, scale: 2 }),
    currencyId: integer().notNull(),
    description: text().notNull(),
    providerName: text(),
    receiptPath: text(),
    /** Lifecycle: draft → review → approval / payment / rejection. */
    status: claimStatusEnum().notNull().default("DRAFT"),
    reviewedBy: integer(),
    reviewedAt: timestamp({ withTimezone: true }),
    paidAt: timestamp({ withTimezone: true }),
    rejectionReason: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_claims_records_tenant").on(t.tenantId),
    index("idx_claims_records_tenant_op_date").on(t.tenantId, t.status, t.reviewedAt),
    index("idx_claims_records_enrollment").on(t.tenantId, t.enrollmentId),
    index("idx_claims_records_employee").on(t.tenantId, t.employeeId),
    index("idx_claims_records_date").on(t.tenantId, t.claimDate),
    index("idx_claims_records_status").on(t.tenantId, t.status),
    uniqueIndex("uq_claims_records_number")
      .on(t.tenantId, sql`lower(${t.claimNumber})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_claims_records_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.enrollmentId],
      foreignColumns: [benefitEnrollments.enrollmentId],
      name: "fk_claims_records_enrollment",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.currencyId],
      foreignColumns: [currencies.currencyId],
      name: "fk_claims_records_currency",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check("chk_claims_records_amount", sql`${t.claimAmount} > 0`),
    check(
      "chk_claims_records_approved_amount",
      sql`${t.approvedAmount} IS NULL OR (${t.approvedAmount} >= 0 AND ${t.approvedAmount} <= ${t.claimAmount})`
    ),
    check("chk_claims_records_service_date", sql`${t.serviceDate} <= ${t.claimDate}`),
  ]
);

export const ClaimRecordIdSchema = z.number().int().positive().brand<"ClaimRecordId">();
export type ClaimRecordId = z.infer<typeof ClaimRecordIdSchema>;

export const claimRecordSelectSchema = createSelectSchema(claimsRecords);

export const claimRecordInsertSchema = createInsertSchema(claimsRecords, {
  tenantId: z.number().int().positive(),
  enrollmentId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  currencyId: z.number().int().positive(),
  claimNumber: z.string().min(1).max(50),
  claimDate: z.coerce.date(),
  serviceDate: z.coerce.date(),
  claimAmount: positiveDecimalString,
  approvedAmount: nonNegativeDecimalString.optional(),
  description: z.string().min(1).max(1000),
  providerName: z.string().max(200).optional(),
  receiptPath: z.string().max(500).optional(),
  status: ClaimStatusSchema.optional(),
  reviewedBy: z.number().int().positive().optional(),
  reviewedAt: z.coerce.date().optional().nullable(),
  paidAt: z.coerce.date().optional().nullable(),
  rejectionReason: z.string().max(1000).optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
}).superRefine((data, ctx) => {
  const claim = parseDecimal(data.claimAmount);
  if (claim === null) {
    ctx.addIssue({
      code: "custom",
      message: "claimAmount must be a valid positive decimal",
      path: ["claimAmount"],
    });
    return;
  }

  const svc = dateValue(data.serviceDate);
  const cd = dateValue(data.claimDate);
  if (!Number.isNaN(svc) && !Number.isNaN(cd) && svc > cd) {
    ctx.addIssue({
      code: "custom",
      message: "serviceDate must be on or before claimDate",
      path: ["serviceDate"],
    });
  }

  const approved = parseDecimal(data.approvedAmount);
  if (approved !== null && approved > claim) {
    ctx.addIssue({
      code: "custom",
      message: "approvedAmount must not exceed claimAmount",
      path: ["approvedAmount"],
    });
  }

  const st = data.status ?? "DRAFT";

  if (st === "REJECTED") {
    const rr = data.rejectionReason?.trim() ?? "";
    if (rr.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "rejectionReason is required when status is REJECTED",
        path: ["rejectionReason"],
      });
    }
  }

  if (st === "APPROVED" || st === "PARTIALLY_APPROVED") {
    if (
      data.approvedAmount === undefined ||
      data.approvedAmount === null ||
      String(data.approvedAmount).trim() === ""
    ) {
      ctx.addIssue({
        code: "custom",
        message: "approvedAmount is required when status is APPROVED or PARTIALLY_APPROVED",
        path: ["approvedAmount"],
      });
    } else if (approved !== null && approved > claim) {
      ctx.addIssue({
        code: "custom",
        message: "approvedAmount must not exceed claimAmount",
        path: ["approvedAmount"],
      });
    }
  }

  if (st === "PAID") {
    if (data.paidAt == null) {
      ctx.addIssue({
        code: "custom",
        message: "paidAt is required when status is PAID",
        path: ["paidAt"],
      });
    }
    if (
      data.approvedAmount === undefined ||
      data.approvedAmount === null ||
      String(data.approvedAmount).trim() === ""
    ) {
      ctx.addIssue({
        code: "custom",
        message: "approvedAmount is required when status is PAID",
        path: ["approvedAmount"],
      });
    }
  }
});

export const claimRecordUpdateSchema = createUpdateSchema(claimsRecords, {
  claimNumber: z.string().min(1).max(50).optional(),
  claimDate: z.coerce.date().optional(),
  serviceDate: z.coerce.date().optional(),
  claimAmount: positiveDecimalString.optional(),
  approvedAmount: nonNegativeDecimalString.optional().nullable(),
  description: z.string().min(1).max(1000).optional(),
  providerName: z.string().max(200).optional().nullable(),
  receiptPath: z.string().max(500).optional().nullable(),
  status: ClaimStatusSchema.optional(),
  reviewedBy: z.number().int().positive().optional().nullable(),
  reviewedAt: z.coerce.date().optional().nullable(),
  paidAt: z.coerce.date().optional().nullable(),
  rejectionReason: z.string().max(1000).optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.claimDate !== undefined && data.serviceDate !== undefined) {
    const svc = dateValue(data.serviceDate);
    const cd = dateValue(data.claimDate);
    if (!Number.isNaN(svc) && !Number.isNaN(cd) && svc > cd) {
      ctx.addIssue({
        code: "custom",
        message: "serviceDate must be on or before claimDate",
        path: ["serviceDate"],
      });
    }
  }

  const claimStr = data.claimAmount;
  const approvedStr =
    data.approvedAmount === undefined
      ? undefined
      : data.approvedAmount === null
        ? null
        : String(data.approvedAmount);
  const claim = claimStr !== undefined ? parseDecimal(claimStr) : null;
  const approved =
    approvedStr === undefined ? undefined : approvedStr === null ? null : parseDecimal(approvedStr);

  if (
    claim !== null &&
    claim !== undefined &&
    approved !== null &&
    approved !== undefined &&
    approved > claim
  ) {
    ctx.addIssue({
      code: "custom",
      message: "approvedAmount must not exceed claimAmount",
      path: ["approvedAmount"],
    });
  }

  if (data.status === undefined) return;

  if (data.status === "REJECTED") {
    const rr =
      data.rejectionReason === undefined || data.rejectionReason === null
        ? ""
        : String(data.rejectionReason).trim();
    if (rr.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "rejectionReason is required when status is REJECTED",
        path: ["rejectionReason"],
      });
    }
  }

  if (data.status === "APPROVED" || data.status === "PARTIALLY_APPROVED") {
    if (
      data.approvedAmount === undefined ||
      data.approvedAmount === null ||
      String(data.approvedAmount).trim() === ""
    ) {
      ctx.addIssue({
        code: "custom",
        message: "approvedAmount is required when status is APPROVED or PARTIALLY_APPROVED",
        path: ["approvedAmount"],
      });
    }
  }

  if (data.status === "PAID") {
    if (data.paidAt === undefined || data.paidAt === null) {
      ctx.addIssue({
        code: "custom",
        message: "paidAt is required when status is PAID",
        path: ["paidAt"],
      });
    }
    if (
      data.approvedAmount === undefined ||
      data.approvedAmount === null ||
      String(data.approvedAmount).trim() === ""
    ) {
      ctx.addIssue({
        code: "custom",
        message: "approvedAmount is required when status is PAID",
        path: ["approvedAmount"],
      });
    }
  }
});

export type ClaimRecord = typeof claimsRecords.$inferSelect;
export type NewClaimRecord = typeof claimsRecords.$inferInsert;
