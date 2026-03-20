import { integer, text, date, boolean, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { persons } from "./persons";

/**
 * National Identifiers - Passport, tax ID, SSN, and other government-issued IDs.
 * Sensitive data - should be encrypted at rest in production.
 */
export const identifierTypes = ["PASSPORT", "TAX_ID", "SSN", "NATIONAL_ID", "DRIVER_LICENSE", "WORK_PERMIT", "VISA", "OTHER"] as const;

export const identifierTypeEnum = hrSchema.enum("identifier_type", [...identifierTypes]);

export const identifierTypeZodEnum = createSelectSchema(identifierTypeEnum);

export const nationalIdentifiers = hrSchema.table(
  "national_identifiers",
  {
    nationalIdentifierId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    personId: integer().notNull(),
    identifierType: identifierTypeEnum().notNull(),
    identifierValue: text().notNull(),
    issuingCountry: text(),
    issueDate: date(),
    expiryDate: date(),
    isPrimary: boolean().notNull().default(false),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_national_identifiers_tenant").on(t.tenantId),
    index("idx_national_identifiers_person").on(t.tenantId, t.personId),
    index("idx_national_identifiers_type").on(t.tenantId, t.personId, t.identifierType),
    index("idx_national_identifiers_expiry").on(t.tenantId, t.expiryDate),
    uniqueIndex("uq_national_identifiers_value")
      .on(t.tenantId, t.identifierType, t.issuingCountry, sql`${t.identifierValue}`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_national_identifiers_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.personId],
      foreignColumns: [persons.personId],
      name: "fk_national_identifiers_person",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    check(
      "chk_national_identifiers_dates",
      sql`${t.expiryDate} IS NULL OR ${t.issueDate} IS NULL OR ${t.expiryDate} >= ${t.issueDate}`
    ),
  ]
);

export const NationalIdentifierIdSchema = z.number().int().brand<"NationalIdentifierId">();
export type NationalIdentifierId = z.infer<typeof NationalIdentifierIdSchema>;

export const nationalIdentifierSelectSchema = createSelectSchema(nationalIdentifiers);

export const nationalIdentifierInsertSchema = createInsertSchema(nationalIdentifiers, {
  identifierValue: z.string().min(1).max(100),
  issuingCountry: z.string().length(2).regex(/^[A-Z]{2}$/, "Must be ISO 3166-1 alpha-2 country code").optional(),
});

export const nationalIdentifierUpdateSchema = createUpdateSchema(nationalIdentifiers);

export type NationalIdentifier = typeof nationalIdentifiers.$inferSelect;
export type NewNationalIdentifier = typeof nationalIdentifiers.$inferInsert;
