import { integer, text, date, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import {
  dateNullableOptionalSchema,
  dateStringSchema,
  hrBounds,
  nullableOptional,
  refineHireDateMin,
  refineTerminatedRequiresTerminationDate,
  refineTerminationOnOrAfterHire,
} from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { locations } from "../../../schema-platform/core/locations";
import { legalEntities } from "../../../schema-platform/core/legalEntities";
import { tenantIsolationPolicies, serviceBypassPolicy } from "../../../_rls";

/**
 * Employees - Work relationship entity linking a person to an organization.
 * Identity data (name, contact, DOB) is stored in hr.persons and related tables.
 *
 * Circular FK note: personId, departmentId, and positionId FKs are added via custom SQL
 * in migrations to avoid circular import dependencies.
 * Relations are defined in hr/_relations.ts for query convenience.
 */
export const employeeStatuses = [
  "ACTIVE",
  "ON_LEAVE",
  "TERMINATED",
  "SUSPENDED",
  "PENDING",
  "PROBATION",
] as const;

export const employeeStatusEnum = hrSchema.enum("employee_status", [...employeeStatuses]);

/** Zod: explicit enum for insert/update; keep aligned with `employeeStatuses` / Postgres. */
export const employeeStatusZodEnum = z.enum(employeeStatuses);

export const employees = hrSchema.table(
  "employees",
  {
    employeeId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    personId: integer().notNull(),
    employeeCode: text().notNull(),
    hireDate: date().notNull(),
    terminationDate: date(),
    departmentId: integer(),
    positionId: integer(),
    managerId: integer(),
    locationId: integer(),
    /** Legal entity that processes payroll / statutory filings for this employment (optional). */
    payrollLegalEntityId: integer(),
    status: employeeStatusEnum().notNull().default("PENDING"),
    notes: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_employees_tenant").on(t.tenantId),
    index("idx_employees_person").on(t.tenantId, t.personId),
    index("idx_employees_status").on(t.tenantId, t.status),
    index("idx_employees_created").on(t.tenantId, t.createdAt),
    index("idx_employees_department").on(t.tenantId, t.departmentId),
    index("idx_employees_position").on(t.tenantId, t.positionId),
    index("idx_employees_manager").on(t.tenantId, t.managerId),
    index("idx_employees_location").on(t.tenantId, t.locationId),
    index("idx_employees_payroll_legal_entity").on(t.tenantId, t.payrollLegalEntityId),
    index("idx_employees_hire_date").on(t.tenantId, t.hireDate),
    uniqueIndex("uq_employees_code")
      .on(t.tenantId, sql`lower(${t.employeeCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_employees_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.managerId],
      foreignColumns: [t.employeeId],
      name: "fk_employees_manager",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.locationId],
      foreignColumns: [locations.locationId],
      name: "fk_employees_location",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.payrollLegalEntityId],
      foreignColumns: [legalEntities.legalEntityId],
      name: "fk_employees_payroll_legal_entity",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check("chk_employees_hire_date", sql`${t.hireDate} >= '1900-01-01'`),
    check(
      "chk_employees_termination_after_hire",
      sql`${t.terminationDate} IS NULL OR ${t.terminationDate} >= ${t.hireDate}`
    ),
    check(
      "chk_employees_terminated_status",
      sql`${t.status} != 'TERMINATED' OR ${t.terminationDate} IS NOT NULL`
    ),
    // RLS policies for tenant isolation
    ...tenantIsolationPolicies("employees"),
    serviceBypassPolicy("employees"),
  ]
);

export const EmployeeIdSchema = z.number().int().brand<"EmployeeId">();
export type EmployeeId = z.infer<typeof EmployeeIdSchema>;

export const employeeSelectSchema = createSelectSchema(employees);

export const employeeInsertSchema = createInsertSchema(employees, {
  employeeCode: z
    .string()
    .min(hrBounds.employeeCodeMin)
    .max(hrBounds.employeeCodeMax)
    .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  notes: z.string().max(hrBounds.notesMax).optional(),
}).superRefine((data, ctx) => {
  refineHireDateMin(data, ctx);
  refineTerminationOnOrAfterHire(data, ctx);
  refineTerminatedRequiresTerminationDate(data, ctx);
});

/**
 * Partial updates: nullable columns (`terminationDate`, FKs, `notes`) accept explicit `null` to clear.
 * `hireDate` is omit or set value only (not nullable in DB).
 */
export const employeeUpdateSchema = createUpdateSchema(employees, {
  employeeCode: z
    .string()
    .min(hrBounds.employeeCodeMin)
    .max(hrBounds.employeeCodeMax)
    .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed")
    .optional(),
  hireDate: dateStringSchema.optional(),
  terminationDate: dateNullableOptionalSchema,
  departmentId: nullableOptional(z.number().int()),
  positionId: nullableOptional(z.number().int()),
  managerId: nullableOptional(z.number().int()),
  locationId: nullableOptional(z.number().int()),
  payrollLegalEntityId: nullableOptional(z.number().int()),
  notes: nullableOptional(z.string().max(hrBounds.notesMax)),
}).superRefine((data, ctx) => {
  refineHireDateMin(data, ctx);
  refineTerminationOnOrAfterHire(data, ctx);
  refineTerminatedRequiresTerminationDate(data, ctx);
});

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
