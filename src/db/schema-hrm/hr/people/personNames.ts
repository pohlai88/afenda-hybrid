import { integer, text, date, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import {
  dateNullableOptionalSchema,
  dateStringSchema,
  nullableOptional,
  refineOptionalIsoEndOnOrAfterStart,
} from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { persons } from "./persons";

/**
 * Person Names - Multiple name formats and languages per person.
 * Supports legal name, preferred name, former names with effective dating.
 */
export const nameTypes = ["LEGAL", "PREFERRED", "FORMER", "MAIDEN", "ALIAS"] as const;

export const nameTypeEnum = hrSchema.enum("name_type", [...nameTypes]);

export const nameTypeZodEnum = z.enum(nameTypes);

export const personNames = hrSchema.table(
  "person_names",
  {
    personNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    personId: integer().notNull(),
    nameType: nameTypeEnum().notNull().default("LEGAL"),
    firstName: text().notNull(),
    middleName: text(),
    lastName: text().notNull(),
    suffix: text(),
    effectiveFrom: date().notNull(),
    effectiveTo: date(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_person_names_tenant").on(t.tenantId),
    index("idx_person_names_person").on(t.tenantId, t.personId),
    index("idx_person_names_type").on(t.tenantId, t.personId, t.nameType),
    index("idx_person_names_effective").on(t.tenantId, t.personId, t.effectiveFrom),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_person_names_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.personId],
      foreignColumns: [persons.personId],
      name: "fk_person_names_person",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    check(
      "chk_person_names_effective_range",
      sql`${t.effectiveTo} IS NULL OR ${t.effectiveTo} >= ${t.effectiveFrom}`
    ),
  ]
);

export const PersonNameIdSchema = z.number().int().brand<"PersonNameId">();
export type PersonNameId = z.infer<typeof PersonNameIdSchema>;

export const personNameSelectSchema = createSelectSchema(personNames);

export const personNameInsertSchema = createInsertSchema(personNames, {
  firstName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(1).max(100),
  suffix: z.string().max(20).optional(),
}).superRefine((data, ctx) =>
  refineOptionalIsoEndOnOrAfterStart(data as Record<string, unknown>, ctx, {
    startKey: "effectiveFrom",
    endKey: "effectiveTo",
    issuePath: "effectiveTo",
  })
);

export const personNameUpdateSchema = createUpdateSchema(personNames, {
  firstName: z.string().min(1).max(100).optional(),
  middleName: nullableOptional(z.string().max(100)),
  lastName: z.string().min(1).max(100).optional(),
  suffix: nullableOptional(z.string().max(20)),
  effectiveFrom: dateStringSchema.optional(),
  effectiveTo: dateNullableOptionalSchema,
}).superRefine((data, ctx) =>
  refineOptionalIsoEndOnOrAfterStart(data as Record<string, unknown>, ctx, {
    startKey: "effectiveFrom",
    endKey: "effectiveTo",
    issuePath: "effectiveTo",
  })
);

export type PersonName = typeof personNames.$inferSelect;
export type NewPersonName = typeof personNames.$inferInsert;
