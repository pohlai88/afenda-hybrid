import { integer, text, date, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { hrSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, tenantScopedColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { sql } from "drizzle-orm";

export const employeeStatusEnum = hrSchema.enum("employee_status", [
  "ACTIVE",
  "ON_LEAVE",
  "TERMINATED",
  "PENDING",
]);

export const employees = hrSchema.table(
  "employees",
  {
    employeeId: integer().primaryKey().generatedAlwaysAsIdentity(),
    ...tenantScopedColumns,
    employeeCode: text().notNull(),
    firstName: text().notNull(),
    lastName: text().notNull(),
    email: text().notNull(),
    hireDate: date().notNull(),
    status: employeeStatusEnum().notNull().default("PENDING"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_employees_tenant").on(t.tenantId),
    index("idx_employees_status").on(t.tenantId, t.status),
    uniqueIndex("uq_employees_code")
      .on(t.tenantId, t.employeeCode)
      .where(sql`${t.deletedAt} IS NULL`),
    uniqueIndex("uq_employees_email")
      .on(t.tenantId, t.email)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_employees_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const EmployeeId = z.number().int().brand<"EmployeeId">();
export type EmployeeId = z.infer<typeof EmployeeId>;

export const employeeSelectSchema = createSelectSchema(employees);

export const employeeInsertSchema = createInsertSchema(employees, {
  email: z.string().email(),
  firstName: z.string().max(100),
  lastName: z.string().max(100),
  employeeCode: z.string().max(50),
});

export const employeeUpdateSchema = createUpdateSchema(employees);

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
