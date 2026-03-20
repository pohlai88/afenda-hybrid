import { integer, text, date, numeric, timestamp, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { benefitsSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { currencies } from "../../core/currencies";
import { benefitEnrollments } from "./benefitEnrollments";

/**
 * Claims Records - Insurance claims history.
 * Circular FK note: employeeId FK added via custom SQL.
 */
export const claimStatuses = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "PARTIALLY_APPROVED", "REJECTED", "PAID", "CANCELLED"] as const;

export const claimStatusEnum = benefitsSchema.enum("claim_status", [...claimStatuses]);

export const claimStatusZodEnum = createSelectSchema(claimStatusEnum);

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
    check(
      "chk_claims_records_amount",
      sql`${t.claimAmount} > 0`
    ),
    check(
      "chk_claims_records_approved_amount",
      sql`${t.approvedAmount} IS NULL OR (${t.approvedAmount} >= 0 AND ${t.approvedAmount} <= ${t.claimAmount})`
    ),
    check(
      "chk_claims_records_service_date",
      sql`${t.serviceDate} <= ${t.claimDate}`
    ),
  ]
);

export const ClaimRecordIdSchema = z.number().int().brand<"ClaimRecordId">();
export type ClaimRecordId = z.infer<typeof ClaimRecordIdSchema>;

export const claimRecordSelectSchema = createSelectSchema(claimsRecords);

export const claimRecordInsertSchema = createInsertSchema(claimsRecords, {
  claimNumber: z.string().min(1).max(50),
  claimAmount: z.string().refine((val) => parseFloat(val) > 0, "Claim amount must be positive"),
  approvedAmount: z.string().optional(),
  description: z.string().min(1).max(1000),
  providerName: z.string().max(200).optional(),
  receiptPath: z.string().max(500).optional(),
  rejectionReason: z.string().max(1000).optional(),
});

export const claimRecordUpdateSchema = createUpdateSchema(claimsRecords);

export type ClaimRecord = typeof claimsRecords.$inferSelect;
export type NewClaimRecord = typeof claimsRecords.$inferInsert;
