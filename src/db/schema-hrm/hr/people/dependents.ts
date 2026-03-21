import { integer, text, date, boolean, index, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { hrSchema } from "../_schema";
import { dateNullableOptionalSchema, nullableOptional } from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { persons, genderEnum, genderZodEnum } from "./persons";

/**
 * Dependents - Family members for benefits enrollment and tax purposes.
 * Links to persons table for the employee, stores dependent info directly.
 */
export const dependentRelationships = ["SPOUSE", "CHILD", "PARENT", "DOMESTIC_PARTNER", "STEPCHILD", "FOSTER_CHILD", "OTHER"] as const;

export const dependentRelationshipEnum = hrSchema.enum("dependent_relationship", [...dependentRelationships]);

export const dependentRelationshipZodEnum = z.enum(dependentRelationships);

export const dependentStatuses = ["ACTIVE", "INACTIVE", "DECEASED"] as const;

export const dependentStatusEnum = hrSchema.enum("dependent_status", [...dependentStatuses]);

export const dependentStatusZodEnum = z.enum(dependentStatuses);

export const dependents = hrSchema.table(
  "dependents",
  {
    dependentId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    personId: integer().notNull(),
    firstName: text().notNull(),
    middleName: text(),
    lastName: text().notNull(),
    dateOfBirth: date(),
    gender: genderEnum(),
    relationship: dependentRelationshipEnum().notNull(),
    nationalId: text(),
    isStudent: boolean().notNull().default(false),
    isDisabled: boolean().notNull().default(false),
    status: dependentStatusEnum().notNull().default("ACTIVE"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_dependents_tenant").on(t.tenantId),
    index("idx_dependents_person").on(t.tenantId, t.personId),
    index("idx_dependents_relationship").on(t.tenantId, t.personId, t.relationship),
    index("idx_dependents_status").on(t.tenantId, t.status),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_dependents_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.personId],
      foreignColumns: [persons.personId],
      name: "fk_dependents_person",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ]
);

export const DependentIdSchema = z.number().int().brand<"DependentId">();
export type DependentId = z.infer<typeof DependentIdSchema>;

export const dependentSelectSchema = createSelectSchema(dependents);

export const dependentInsertSchema = createInsertSchema(dependents, {
  firstName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(1).max(100),
  nationalId: z.string().max(50).optional(),
});

export const dependentUpdateSchema = createUpdateSchema(dependents, {
  firstName: z.string().min(1).max(100).optional(),
  middleName: nullableOptional(z.string().max(100)),
  lastName: z.string().min(1).max(100).optional(),
  dateOfBirth: dateNullableOptionalSchema,
  gender: nullableOptional(genderZodEnum),
  nationalId: nullableOptional(z.string().max(50)),
});

export type Dependent = typeof dependents.$inferSelect;
export type NewDependent = typeof dependents.$inferInsert;
