import { integer, text, date, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";

/**
 * Persons - Legal identity independent of employment.
 * A person can have multiple employments (rehires, concurrent jobs).
 * Identity data (name, contact, address) is stored in related tables.
 */
export const genders = ["MALE", "FEMALE", "NON_BINARY", "PREFER_NOT_TO_SAY", "OTHER"] as const;

export const genderEnum = hrSchema.enum("gender", [...genders]);

export const genderZodEnum = createSelectSchema(genderEnum);

export const maritalStatuses = ["SINGLE", "MARRIED", "DIVORCED", "WIDOWED", "SEPARATED", "DOMESTIC_PARTNERSHIP", "OTHER"] as const;

export const maritalStatusEnum = hrSchema.enum("marital_status", [...maritalStatuses]);

export const maritalStatusZodEnum = createSelectSchema(maritalStatusEnum);

export const personStatuses = ["ACTIVE", "INACTIVE", "DECEASED"] as const;

export const personStatusEnum = hrSchema.enum("person_status", [...personStatuses]);

export const personStatusZodEnum = createSelectSchema(personStatusEnum);

export const persons = hrSchema.table(
  "persons",
  {
    personId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    personCode: text().notNull(),
    dateOfBirth: date(),
    gender: genderEnum(),
    maritalStatus: maritalStatusEnum(),
    nationality: text(),
    primaryLanguage: text(),
    photoUrl: text(),
    status: personStatusEnum().notNull().default("ACTIVE"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_persons_tenant").on(t.tenantId),
    index("idx_persons_status").on(t.tenantId, t.status),
    index("idx_persons_nationality").on(t.tenantId, t.nationality),
    uniqueIndex("uq_persons_code")
      .on(t.tenantId, sql`lower(${t.personCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_persons_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const PersonIdSchema = z.number().int().brand<"PersonId">();
export type PersonId = z.infer<typeof PersonIdSchema>;

export const personSelectSchema = createSelectSchema(persons);

export const personInsertSchema = createInsertSchema(persons, {
  personCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  nationality: z.string().length(2).regex(/^[A-Z]{2}$/, "Must be ISO 3166-1 alpha-2 country code").optional(),
  primaryLanguage: z.string().min(2).max(10).optional(),
  photoUrl: z.string().url().max(500).optional(),
});

export const personUpdateSchema = createUpdateSchema(persons);

export type Person = typeof persons.$inferSelect;
export type NewPerson = typeof persons.$inferInsert;
