import { integer, text, smallint, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { persons } from "./persons";

/**
 * Emergency Contacts - Next of kin and emergency contact information.
 * Priority field determines contact order in emergencies.
 */
export const emergencyRelationships = ["SPOUSE", "PARENT", "CHILD", "SIBLING", "RELATIVE", "FRIEND", "COLLEAGUE", "OTHER"] as const;

export const emergencyRelationshipEnum = hrSchema.enum("emergency_relationship", [...emergencyRelationships]);

export const emergencyRelationshipZodEnum = createSelectSchema(emergencyRelationshipEnum);

export const emergencyContacts = hrSchema.table(
  "emergency_contacts",
  {
    emergencyContactId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    personId: integer().notNull(),
    name: text().notNull(),
    relationship: emergencyRelationshipEnum().notNull(),
    phone: text().notNull(),
    alternatePhone: text(),
    email: text(),
    address: text(),
    priority: smallint().notNull().default(1),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_emergency_contacts_tenant").on(t.tenantId),
    index("idx_emergency_contacts_person").on(t.tenantId, t.personId),
    index("idx_emergency_contacts_priority").on(t.tenantId, t.personId, t.priority),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_emergency_contacts_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.personId],
      foreignColumns: [persons.personId],
      name: "fk_emergency_contacts_person",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    check(
      "chk_emergency_contacts_priority",
      sql`${t.priority} >= 1 AND ${t.priority} <= 10`
    ),
  ]
);

export const EmergencyContactIdSchema = z.number().int().brand<"EmergencyContactId">();
export type EmergencyContactId = z.infer<typeof EmergencyContactIdSchema>;

export const emergencyContactSelectSchema = createSelectSchema(emergencyContacts);

export const emergencyContactInsertSchema = createInsertSchema(emergencyContacts, {
  name: z.string().min(1).max(200),
  phone: z.string().min(1).max(30),
  alternatePhone: z.string().max(30).optional(),
  email: z.email().optional(),
  address: z.string().max(500).optional(),
  priority: z.number().int().min(1).max(10),
});

export const emergencyContactUpdateSchema = createUpdateSchema(emergencyContacts);

export type EmergencyContact = typeof emergencyContacts.$inferSelect;
export type NewEmergencyContact = typeof emergencyContacts.$inferInsert;
