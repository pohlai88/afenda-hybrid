import { integer, text, date, numeric, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { hrSchema } from "../_schema";
import {
  contractWorkingHoursStringSchema,
  dateNullableOptionalSchema,
  dateStringSchema,
  hrBounds,
  nullableOptional,
  refineContractEndOnOrAfterStart,
  refineContractWorkingHoursString,
  refineNoticePeriodDaysNonNegative,
  refineProbationEndOnOrAfterStart,
} from "../_zodShared";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";

/**
 * Employment Contracts - Legal agreement terms between employer and employee.
 * Circular FK note: employeeId FK added via custom SQL to avoid circular imports.
 */
export const contractTypes = ["PERMANENT", "FIXED_TERM", "CONTRACTOR", "INTERN", "TEMPORARY", "PART_TIME", "PROBATIONARY"] as const;

export const contractTypeEnum = hrSchema.enum("contract_type", [...contractTypes]);

export const contractTypeZodEnum = z.enum(contractTypes);

export const contractStatuses = ["DRAFT", "ACTIVE", "EXPIRED", "TERMINATED", "SUSPENDED"] as const;

export const contractStatusEnum = hrSchema.enum("contract_status", [...contractStatuses]);

export const contractStatusZodEnum = z.enum(contractStatuses);

export const employmentContracts = hrSchema.table(
  "employment_contracts",
  {
    contractId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    contractCode: text().notNull(),
    contractType: contractTypeEnum().notNull(),
    startDate: date().notNull(),
    endDate: date(),
    probationEndDate: date(),
    noticePeriodDays: integer().default(30),
    workingHoursPerWeek: numeric({ precision: 4, scale: 1 }),
    status: contractStatusEnum().notNull().default("DRAFT"),
    terms: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_employment_contracts_tenant").on(t.tenantId),
    index("idx_employment_contracts_employee").on(t.tenantId, t.employeeId),
    index("idx_employment_contracts_type").on(t.tenantId, t.contractType),
    index("idx_employment_contracts_status").on(t.tenantId, t.status),
    index("idx_employment_contracts_created").on(t.tenantId, t.createdAt),
    index("idx_employment_contracts_dates").on(t.tenantId, t.startDate, t.endDate),
    uniqueIndex("uq_employment_contracts_code")
      .on(t.tenantId, sql`lower(${t.contractCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_employment_contracts_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_employment_contracts_dates",
      sql`${t.endDate} IS NULL OR ${t.endDate} >= ${t.startDate}`
    ),
    check(
      "chk_employment_contracts_probation",
      sql`${t.probationEndDate} IS NULL OR ${t.probationEndDate} >= ${t.startDate}`
    ),
    check(
      "chk_employment_contracts_notice_period",
      sql`${t.noticePeriodDays} IS NULL OR ${t.noticePeriodDays} >= 0`
    ),
    check(
      "chk_employment_contracts_hours",
      sql`${t.workingHoursPerWeek} IS NULL OR (${t.workingHoursPerWeek} > 0 AND ${t.workingHoursPerWeek} <= 168)`
    ),
  ]
);

export const EmploymentContractIdSchema = z.number().int().brand<"EmploymentContractId">();
export type EmploymentContractId = z.infer<typeof EmploymentContractIdSchema>;

export const employmentContractSelectSchema = createSelectSchema(employmentContracts);

export const employmentContractInsertSchema = createInsertSchema(employmentContracts, {
  contractCode: z
    .string()
    .min(hrBounds.contractCodeMin)
    .max(hrBounds.contractCodeMax)
    .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  noticePeriodDays: z.number().int().min(0).max(365).optional(),
  workingHoursPerWeek: contractWorkingHoursStringSchema.optional(),
  terms: z.string().max(10000).optional(),
}).superRefine((data, ctx) => {
  refineContractEndOnOrAfterStart(data, ctx);
  refineProbationEndOnOrAfterStart(data, ctx);
  refineNoticePeriodDaysNonNegative(data, ctx);
  refineContractWorkingHoursString(data, ctx);
});

export const employmentContractUpdateSchema = createUpdateSchema(employmentContracts, {
  contractCode: z
    .string()
    .min(hrBounds.contractCodeMin)
    .max(hrBounds.contractCodeMax)
    .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed")
    .optional(),
  startDate: dateStringSchema.optional(),
  endDate: dateNullableOptionalSchema,
  probationEndDate: dateNullableOptionalSchema,
  noticePeriodDays: nullableOptional(z.number().int().min(0).max(365)),
  workingHoursPerWeek: nullableOptional(contractWorkingHoursStringSchema),
  terms: nullableOptional(z.string().max(10000)),
}).superRefine((data, ctx) => {
  refineContractEndOnOrAfterStart(data, ctx);
  refineProbationEndOnOrAfterStart(data, ctx);
  refineNoticePeriodDaysNonNegative(data, ctx);
  refineContractWorkingHoursString(data, ctx);
});

export type EmploymentContract = typeof employmentContracts.$inferSelect;
export type NewEmploymentContract = typeof employmentContracts.$inferInsert;
