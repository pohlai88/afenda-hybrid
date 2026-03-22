import {
  integer,
  text,
  date,
  timestamp,
  numeric,
  index,
  uniqueIndex,
  foreignKey,
  check,
} from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { recruitmentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { currencies } from "../../../schema-platform/core/currencies";
import { applications } from "./applications";

/**
 * Offer letters — pipeline rows tied to a specific application (not directly to `candidates`).
 * Resolve profile via `application` → `applications.candidateId`. See `docs/hcm/recruitment-candidate-databank.md` §0.
 *
 * **Tenancy:** `tenantId` should match `applications.tenantId` for `applicationId`; PostgreSQL does not enforce
 * that equality. Use `createOfferLetter` in `_services/recruitment/offerLettersService.ts` for application-layer creates.
 *
 * **Lifecycle vs columns (Zod, insert/update):**
 * - **`DECLINED`:** requires non-empty **`declineReason`** and **`respondedAt`**.
 * - Non-empty **`declineReason`** is only allowed when **`status` is `DECLINED`**.
 * - **`APPROVED`:** requires **`approvedBy`** and **`approvedAt`**.
 * - **`SENT`:** requires **`sentAt`**.
 * - **`ACCEPTED`:** requires **`respondedAt`**.
 *
 * **Listing by application + start:** `idx_offer_letters_application_start` supports filtering/sorting by offer start date per application.
 *
 * Circular FK note: `positionId`, `approvedBy` → HR/users via custom SQL if used — validate in the app when wiring those domains.
 *
 * Audit: `createdBy` / `updatedBy` are required via `auditColumns` (set in the service / API layer).
 */
export const offerStatuses = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "SENT",
  "ACCEPTED",
  "DECLINED",
  "NEGOTIATING",
  "EXPIRED",
  "WITHDRAWN",
] as const;

export const offerStatusEnum = recruitmentSchema.enum("offer_status", [...offerStatuses]);

/** Stricter than `createSelectSchema(enum)` for inserts/updates — single source of truth with `offerStatuses`. */
export const OfferStatusSchema = z.enum(offerStatuses);
export type OfferStatus = z.infer<typeof OfferStatusSchema>;

export const offerLetters = recruitmentSchema.table(
  "offer_letters",
  {
    offerLetterId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    applicationId: integer().notNull(),
    offerCode: text().notNull(),
    positionId: integer(),
    baseSalary: numeric({ precision: 12, scale: 2 }).notNull(),
    currencyId: integer().notNull(),
    signingBonus: numeric({ precision: 12, scale: 2 }),
    startDate: date().notNull(),
    expiryDate: date().notNull(),
    benefits: text(),
    terms: text(),
    status: offerStatusEnum().notNull().default("DRAFT"),
    approvedBy: integer(),
    approvedAt: timestamp({ withTimezone: true }),
    sentAt: timestamp({ withTimezone: true }),
    respondedAt: timestamp({ withTimezone: true }),
    declineReason: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_offer_letters_tenant").on(t.tenantId),
    index("idx_offer_letters_tenant_op_date").on(t.tenantId, t.status, t.approvedAt),
    index("idx_offer_letters_application").on(t.tenantId, t.applicationId),
    /** Per application, by proposed start date. */
    index("idx_offer_letters_application_start").on(t.tenantId, t.applicationId, t.startDate),
    index("idx_offer_letters_position").on(t.tenantId, t.positionId),
    index("idx_offer_letters_status").on(t.tenantId, t.status),
    uniqueIndex("uq_offer_letters_code")
      .on(t.tenantId, sql`lower(${t.offerCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_offer_letters_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.applicationId],
      foreignColumns: [applications.applicationId],
      name: "fk_offer_letters_application",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.currencyId],
      foreignColumns: [currencies.currencyId],
      name: "fk_offer_letters_currency",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check("chk_offer_letters_salary", sql`${t.baseSalary} > 0`),
    check("chk_offer_letters_bonus", sql`${t.signingBonus} IS NULL OR ${t.signingBonus} >= 0`),
    check("chk_offer_letters_expiry", sql`${t.expiryDate} >= ${t.startDate}`),
  ]
);

export const OfferLetterIdSchema = z.number().int().brand<"OfferLetterId">();
export type OfferLetterId = z.infer<typeof OfferLetterIdSchema>;

export const offerLetterSelectSchema = createSelectSchema(offerLetters);

function declineReasonNonEmpty(data: Record<string, unknown>): boolean {
  if (!Object.prototype.hasOwnProperty.call(data, "declineReason")) return false;
  const dr = data.declineReason;
  return dr != null && String(dr).trim() !== "";
}

/** Insert / full-row validation when `status` is present in the object. */
function refineOfferLetterLifecycleInsert(data: Record<string, unknown>, ctx: z.RefinementCtx) {
  const status = data.status;
  if (declineReasonNonEmpty(data) && status !== "DECLINED") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "declineReason may only be set when status is DECLINED",
      path: ["declineReason"],
    });
  }

  if (status === "DECLINED") {
    if (!declineReasonNonEmpty(data)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "declineReason is required when status is DECLINED",
        path: ["declineReason"],
      });
    }
    if (data.respondedAt == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "respondedAt is required when status is DECLINED",
        path: ["respondedAt"],
      });
    }
  }

  if (status === "APPROVED") {
    if (data.approvedBy == null || data.approvedAt == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "approvedBy and approvedAt are required when status is APPROVED",
        path: ["approvedBy"],
      });
    }
  }

  if (status === "SENT") {
    if (data.sentAt == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "sentAt is required when status is SENT",
        path: ["sentAt"],
      });
    }
  }

  if (status === "ACCEPTED") {
    if (data.respondedAt == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "respondedAt is required when status is ACCEPTED",
        path: ["respondedAt"],
      });
    }
  }
}

function refineOfferLetterLifecycleUpdate(data: Record<string, unknown>, ctx: z.RefinementCtx) {
  if (Object.prototype.hasOwnProperty.call(data, "declineReason") && declineReasonNonEmpty(data)) {
    if (!Object.prototype.hasOwnProperty.call(data, "status") || data.status !== "DECLINED") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "declineReason may only be set when status is DECLINED in the same update",
        path: ["declineReason"],
      });
    }
  }

  if (!Object.prototype.hasOwnProperty.call(data, "status")) return;

  const status = data.status;

  if (status === "DECLINED") {
    if (
      !Object.prototype.hasOwnProperty.call(data, "declineReason") ||
      !declineReasonNonEmpty(data)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "declineReason is required in the same update when status is DECLINED",
        path: ["declineReason"],
      });
    }
    if (!Object.prototype.hasOwnProperty.call(data, "respondedAt") || data.respondedAt == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "respondedAt is required in the same update when status is DECLINED",
        path: ["respondedAt"],
      });
    }
  }

  if (status === "APPROVED") {
    if (
      !Object.prototype.hasOwnProperty.call(data, "approvedBy") ||
      data.approvedBy == null ||
      !Object.prototype.hasOwnProperty.call(data, "approvedAt") ||
      data.approvedAt == null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "approvedBy and approvedAt are required in the same update when status is APPROVED",
        path: ["approvedBy"],
      });
    }
  }

  if (status === "SENT") {
    if (!Object.prototype.hasOwnProperty.call(data, "sentAt") || data.sentAt == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "sentAt is required in the same update when status is SENT",
        path: ["sentAt"],
      });
    }
  }

  if (status === "ACCEPTED") {
    if (!Object.prototype.hasOwnProperty.call(data, "respondedAt") || data.respondedAt == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "respondedAt is required in the same update when status is ACCEPTED",
        path: ["respondedAt"],
      });
    }
  }
}

export const offerLetterInsertSchema = createInsertSchema(offerLetters, {
  /** Omit to use DB default `DRAFT`. */
  status: OfferStatusSchema.optional(),
  tenantId: z.number().int().positive(),
  applicationId: z.number().int().positive(),
  currencyId: z.number().int().positive(),
  positionId: z.number().int().positive().optional(),
  approvedBy: z.number().int().positive().optional(),
  offerCode: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  baseSalary: z.string().refine((val) => parseFloat(val) > 0, "Base salary must be positive"),
  signingBonus: z
    .string()
    .optional()
    .refine(
      (val) => val === undefined || val === "" || parseFloat(val) >= 0,
      "Signing bonus must be non-negative"
    ),
  benefits: z.string().max(4000).optional(),
  terms: z.string().max(10000).optional(),
  declineReason: z.string().max(1000).optional(),
}).superRefine((row, ctx) => refineOfferLetterLifecycleInsert(row as Record<string, unknown>, ctx));

export const offerLetterUpdateSchema = createUpdateSchema(offerLetters, {
  status: OfferStatusSchema.optional(),
  tenantId: z.number().int().positive().optional(),
  applicationId: z.number().int().positive().optional(),
  currencyId: z.number().int().positive().optional(),
  positionId: z.number().int().positive().optional().nullable(),
  approvedBy: z.number().int().positive().optional().nullable(),
  offerCode: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed")
    .optional(),
  baseSalary: z
    .string()
    .refine((val) => parseFloat(val) > 0, "Base salary must be positive")
    .optional(),
  signingBonus: z
    .string()
    .optional()
    .refine(
      (val) => val === undefined || val === "" || parseFloat(val) >= 0,
      "Signing bonus must be non-negative"
    ),
  benefits: z.string().max(4000).optional(),
  terms: z.string().max(10000).optional(),
  declineReason: z.string().max(1000).optional(),
}).superRefine((row, ctx) => refineOfferLetterLifecycleUpdate(row as Record<string, unknown>, ctx));

export type OfferLetter = typeof offerLetters.$inferSelect;
export type NewOfferLetter = typeof offerLetters.$inferInsert;
