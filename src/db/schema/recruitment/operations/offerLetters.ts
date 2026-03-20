import { integer, text, date, numeric, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { recruitmentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { currencies } from "../../core/currencies";
import { applications } from "./applications";

/**
 * Offer Letters - Employment proposals to candidates.
 * Circular FK note: positionId, approvedBy FKs added via custom SQL.
 */
export const offerStatuses = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "SENT", "ACCEPTED", "DECLINED", "NEGOTIATING", "EXPIRED", "WITHDRAWN"] as const;

export const offerStatusEnum = recruitmentSchema.enum("offer_status", [...offerStatuses]);

export const offerStatusZodEnum = createSelectSchema(offerStatusEnum);

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
    approvedAt: date(),
    sentAt: date(),
    respondedAt: date(),
    declineReason: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_offer_letters_tenant").on(t.tenantId),
    index("idx_offer_letters_application").on(t.tenantId, t.applicationId),
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
    check(
      "chk_offer_letters_salary",
      sql`${t.baseSalary} > 0`
    ),
    check(
      "chk_offer_letters_bonus",
      sql`${t.signingBonus} IS NULL OR ${t.signingBonus} >= 0`
    ),
    check(
      "chk_offer_letters_expiry",
      sql`${t.expiryDate} >= ${t.startDate}`
    ),
  ]
);

export const OfferLetterIdSchema = z.number().int().brand<"OfferLetterId">();
export type OfferLetterId = z.infer<typeof OfferLetterIdSchema>;

export const offerLetterSelectSchema = createSelectSchema(offerLetters);

export const offerLetterInsertSchema = createInsertSchema(offerLetters, {
  offerCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  baseSalary: z.string().refine((val) => parseFloat(val) > 0, "Base salary must be positive"),
  signingBonus: z.string().optional(),
  benefits: z.string().max(4000).optional(),
  terms: z.string().max(10000).optional(),
  declineReason: z.string().max(1000).optional(),
});

export const offerLetterUpdateSchema = createUpdateSchema(offerLetters);

export type OfferLetter = typeof offerLetters.$inferSelect;
export type NewOfferLetter = typeof offerLetters.$inferInsert;
