import { integer, text, date, boolean, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { persons } from "./persons";

/**
 * Addresses - Residential, mailing, and emergency addresses.
 * Supports effective dating for address history.
 */
export const addressTypes = ["RESIDENTIAL", "MAILING", "EMERGENCY", "WORK", "TEMPORARY"] as const;

export const addressTypeEnum = hrSchema.enum("address_type", [...addressTypes]);

export const addressTypeZodEnum = createSelectSchema(addressTypeEnum);

export const addresses = hrSchema.table(
  "addresses",
  {
    addressId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    personId: integer().notNull(),
    addressType: addressTypeEnum().notNull(),
    street1: text().notNull(),
    street2: text(),
    city: text().notNull(),
    stateProvince: text(),
    postalCode: text(),
    country: text().notNull(),
    isPrimary: boolean().notNull().default(false),
    effectiveFrom: date().notNull(),
    effectiveTo: date(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_addresses_tenant").on(t.tenantId),
    index("idx_addresses_person").on(t.tenantId, t.personId),
    index("idx_addresses_type").on(t.tenantId, t.personId, t.addressType),
    index("idx_addresses_effective").on(t.tenantId, t.personId, t.effectiveFrom),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_addresses_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.personId],
      foreignColumns: [persons.personId],
      name: "fk_addresses_person",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    check(
      "chk_addresses_effective_range",
      sql`${t.effectiveTo} IS NULL OR ${t.effectiveTo} >= ${t.effectiveFrom}`
    ),
  ]
);

export const AddressIdSchema = z.number().int().brand<"AddressId">();
export type AddressId = z.infer<typeof AddressIdSchema>;

export const addressSelectSchema = createSelectSchema(addresses);

export const addressInsertSchema = createInsertSchema(addresses, {
  street1: z.string().min(1).max(255),
  street2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  stateProvince: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().length(2).regex(/^[A-Z]{2}$/, "Must be ISO 3166-1 alpha-2 country code"),
});

export const addressUpdateSchema = createUpdateSchema(addresses);

export type Address = typeof addresses.$inferSelect;
export type NewAddress = typeof addresses.$inferInsert;
