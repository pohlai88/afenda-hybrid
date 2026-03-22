import {
  integer,
  text,
  boolean,
  timestamp,
  index,
  uniqueIndex,
  foreignKey,
} from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import { timestamptzWireNullableOptionalSchema } from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { persons } from "./persons";

/**
 * Contact Methods - Phone numbers, emails, and other contact information.
 * Supports multiple contact methods per person with primary designation.
 */
export const contactTypes = [
  "EMAIL",
  "PHONE",
  "MOBILE",
  "WORK_PHONE",
  "WORK_EMAIL",
  "FAX",
  "SOCIAL",
] as const;

export const contactTypeEnum = hrSchema.enum("contact_type", [...contactTypes]);

export const contactTypeZodEnum = z.enum(contactTypes);

export const contactMethods = hrSchema.table(
  "contact_methods",
  {
    contactMethodId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    personId: integer().notNull(),
    contactType: contactTypeEnum().notNull(),
    value: text().notNull(),
    isPrimary: boolean().notNull().default(false),
    isVerified: boolean().notNull().default(false),
    verifiedAt: timestamp({ withTimezone: true }),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_contact_methods_tenant").on(t.tenantId),
    index("idx_contact_methods_person").on(t.tenantId, t.personId),
    index("idx_contact_methods_type").on(t.tenantId, t.personId, t.contactType),
    uniqueIndex("uq_contact_methods_primary")
      .on(t.tenantId, t.personId, t.contactType)
      .where(sql`${t.deletedAt} IS NULL AND ${t.isPrimary} = true`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_contact_methods_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.personId],
      foreignColumns: [persons.personId],
      name: "fk_contact_methods_person",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ]
);

export const ContactMethodIdSchema = z.number().int().brand<"ContactMethodId">();
export type ContactMethodId = z.infer<typeof ContactMethodIdSchema>;

export const contactMethodSelectSchema = createSelectSchema(contactMethods);

export const contactMethodInsertSchema = createInsertSchema(contactMethods, {
  value: z.string().min(1).max(255),
});

export const contactMethodUpdateSchema = createUpdateSchema(contactMethods, {
  value: z.string().min(1).max(255).optional(),
  verifiedAt: timestamptzWireNullableOptionalSchema,
});

export type ContactMethod = typeof contactMethods.$inferSelect;
export type NewContactMethod = typeof contactMethods.$inferInsert;
