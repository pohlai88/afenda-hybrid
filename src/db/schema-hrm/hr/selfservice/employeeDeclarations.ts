import { integer, text, date, timestamp, smallint, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import { hrBounds, nullableOptional, timestamptzWireNullableOptionalSchema } from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";

/**
 * Employee Declarations - Tax and compliance forms submitted by employees.
 * Circular FK note: employeeId and verifiedBy FKs added via custom SQL.
 */
export const declarationTypes = ["TAX_DECLARATION", "INVESTMENT_PROOF", "RENT_DECLARATION", "INSURANCE_PROOF", "DEPENDENT_DECLARATION", "COMPLIANCE_ACKNOWLEDGMENT", "OTHER"] as const;

export const declarationTypeEnum = hrSchema.enum("declaration_type", [...declarationTypes]);

export const declarationTypeZodEnum = z.enum(declarationTypes);

export const declarationStatuses = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "VERIFIED", "REJECTED", "EXPIRED"] as const;

export const declarationStatusEnum = hrSchema.enum("declaration_status", [...declarationStatuses]);

export const declarationStatusZodEnum = z.enum(declarationStatuses);

export const employeeDeclarations = hrSchema.table(
  "employee_declarations",
  {
    declarationId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    declarationType: declarationTypeEnum().notNull(),
    fiscalYear: smallint().notNull(),
    declarationData: text(),
    documentPath: text(),
    submittedAt: timestamp({ withTimezone: true }),
    status: declarationStatusEnum().notNull().default("DRAFT"),
    verifiedBy: integer(),
    verifiedAt: timestamp({ withTimezone: true }),
    rejectionReason: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_employee_declarations_tenant").on(t.tenantId),
    index("idx_employee_declarations_tenant_op_date").on(t.tenantId, t.status, t.submittedAt),
    index("idx_employee_declarations_employee").on(t.tenantId, t.employeeId),
    index("idx_employee_declarations_type").on(t.tenantId, t.declarationType),
    index("idx_employee_declarations_year").on(t.tenantId, t.fiscalYear),
    index("idx_employee_declarations_status").on(t.tenantId, t.status),
    uniqueIndex("uq_employee_declarations_employee_type_year")
      .on(t.tenantId, t.employeeId, t.declarationType, t.fiscalYear)
      .where(sql`${t.deletedAt} IS NULL AND ${t.status} NOT IN ('REJECTED', 'EXPIRED')`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_employee_declarations_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_employee_declarations_year",
      sql`${t.fiscalYear} >= 2000 AND ${t.fiscalYear} <= 2100`
    ),
  ]
);

export const EmployeeDeclarationIdSchema = z.number().int().brand<"EmployeeDeclarationId">();
export type EmployeeDeclarationId = z.infer<typeof EmployeeDeclarationIdSchema>;

export const employeeDeclarationSelectSchema = createSelectSchema(employeeDeclarations);

export const employeeDeclarationInsertSchema = createInsertSchema(employeeDeclarations, {
  fiscalYear: z.number().int().min(2000).max(2100),
  declarationData: z.string().max(10000).optional(),
  documentPath: z.string().max(500).optional(),
  rejectionReason: z.string().max(hrBounds.notesMax).optional(),
});

export const employeeDeclarationUpdateSchema = createUpdateSchema(employeeDeclarations, {
  fiscalYear: z.number().int().min(2000).max(2100).optional(),
  declarationData: nullableOptional(z.string().max(10000)),
  documentPath: nullableOptional(z.string().max(500)),
  submittedAt: timestamptzWireNullableOptionalSchema,
  verifiedBy: nullableOptional(z.number().int()),
  verifiedAt: timestamptzWireNullableOptionalSchema,
  rejectionReason: nullableOptional(z.string().max(hrBounds.notesMax)),
});

export type EmployeeDeclaration = typeof employeeDeclarations.$inferSelect;
export type NewEmployeeDeclaration = typeof employeeDeclarations.$inferInsert;
