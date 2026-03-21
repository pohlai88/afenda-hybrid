import { integer, text, boolean, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { payrollSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { earningsTypes } from "./earningsTypes";
import { deductionTypes } from "./deductionTypes";

/**
 * Pay Components - Salary elements (base, allowance, bonus, etc.).
 * Master data for configuring payroll calculations.
 */
export const payComponentTypes = ["EARNING", "DEDUCTION", "BENEFIT", "REIMBURSEMENT"] as const;

export const payComponentTypeEnum = payrollSchema.enum("pay_component_type", [...payComponentTypes]);

export const PayComponentTypeSchema = z.enum(payComponentTypes);
export type PayComponentType = z.infer<typeof PayComponentTypeSchema>;

export const payComponentStatuses = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;

export const payComponentStatusEnum = payrollSchema.enum("pay_component_status", [...payComponentStatuses]);

export const PayComponentStatusSchema = z.enum(payComponentStatuses);
export type PayComponentStatus = z.infer<typeof PayComponentStatusSchema>;

const componentCodeSchema = z
  .string()
  .min(2)
  .max(50)
  .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed")
  .transform((s) => s.toUpperCase());

function hasMasterId(v: unknown): v is number {
  return v !== undefined && v !== null && typeof v === "number";
}

function refinePayComponentMasterLinks(
  componentType: PayComponentType,
  earningsTypeId: unknown,
  deductionTypeId: unknown,
  ctx: z.RefinementCtx,
): void {
  const hasE = hasMasterId(earningsTypeId);
  const hasD = hasMasterId(deductionTypeId);

  if (hasE && hasD) {
    ctx.addIssue({
      code: "custom",
      message: "Cannot set both earningsTypeId and deductionTypeId",
      path: ["deductionTypeId"],
    });
    return;
  }

  if (componentType === "EARNING") {
    if (!hasE) {
      ctx.addIssue({
        code: "custom",
        message: "earningsTypeId is required when componentType is EARNING",
        path: ["earningsTypeId"],
      });
    }
    if (hasD) {
      ctx.addIssue({
        code: "custom",
        message: "deductionTypeId must not be set when componentType is EARNING",
        path: ["deductionTypeId"],
      });
    }
    return;
  }

  if (componentType === "DEDUCTION") {
    if (!hasD) {
      ctx.addIssue({
        code: "custom",
        message: "deductionTypeId is required when componentType is DEDUCTION",
        path: ["deductionTypeId"],
      });
    }
    if (hasE) {
      ctx.addIssue({
        code: "custom",
        message: "earningsTypeId must not be set when componentType is DEDUCTION",
        path: ["earningsTypeId"],
      });
    }
    return;
  }

  if (componentType === "BENEFIT" || componentType === "REIMBURSEMENT") {
    if (hasE) {
      ctx.addIssue({
        code: "custom",
        message: "earningsTypeId must not be set for BENEFIT or REIMBURSEMENT components",
        path: ["earningsTypeId"],
      });
    }
    if (hasD) {
      ctx.addIssue({
        code: "custom",
        message: "deductionTypeId must not be set for BENEFIT or REIMBURSEMENT components",
        path: ["deductionTypeId"],
      });
    }
  }
}

/**
 * Table `pay_components` — tenant catalog; unique `componentCode` (case-insensitive) among non-deleted rows; at most one of earnings/deduction master FK.
 */
export const payComponents = payrollSchema.table(
  "pay_components",
  {
    payComponentId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    /** Normalized to uppercase in Zod insert/update for consistent storage and uniqueness. */
    componentCode: text().notNull(),
    ...nameColumn,
    componentType: payComponentTypeEnum().notNull(),
    description: text(),
    isTaxable: boolean().notNull().default(true),
    isRecurring: boolean().notNull().default(true),
    affectsGrossPay: boolean().notNull().default(true),
    earningsTypeId: integer(),
    deductionTypeId: integer(),
    /** Lifecycle: `ACTIVE` | `INACTIVE` | `ARCHIVED`. */
    status: payComponentStatusEnum().notNull().default("ACTIVE"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_pay_components_tenant").on(t.tenantId),
    index("idx_pay_components_type").on(t.tenantId, t.componentType),
    index("idx_pay_components_status").on(t.tenantId, t.status),
    index("idx_pay_components_earnings_type").on(t.tenantId, t.earningsTypeId),
    index("idx_pay_components_deduction_type").on(t.tenantId, t.deductionTypeId),
    uniqueIndex("uq_pay_components_code")
      .on(t.tenantId, sql`lower(${t.componentCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_pay_components_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.earningsTypeId],
      foreignColumns: [earningsTypes.earningsTypeId],
      name: "fk_pay_components_earnings_type",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.deductionTypeId],
      foreignColumns: [deductionTypes.deductionTypeId],
      name: "fk_pay_components_deduction_type",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_pay_components_single_master",
      sql`NOT (${t.earningsTypeId} IS NOT NULL AND ${t.deductionTypeId} IS NOT NULL)`
    ),
  ]
);

export const PayComponentIdSchema = z.number().int().positive().brand<"PayComponentId">();
export type PayComponentId = z.infer<typeof PayComponentIdSchema>;

export const payComponentSelectSchema = createSelectSchema(payComponents);

export const payComponentInsertSchema = createInsertSchema(payComponents, {
  tenantId: z.number().int().positive(),
  componentCode: componentCodeSchema,
  name: z.string().min(1).max(200),
  componentType: PayComponentTypeSchema,
  description: z.string().max(1000).optional(),
  isTaxable: z.boolean().optional(),
  isRecurring: z.boolean().optional(),
  affectsGrossPay: z.boolean().optional(),
  earningsTypeId: z.number().int().positive().optional(),
  deductionTypeId: z.number().int().positive().optional(),
  status: PayComponentStatusSchema.optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
}).superRefine((data, ctx) => {
  refinePayComponentMasterLinks(data.componentType, data.earningsTypeId, data.deductionTypeId, ctx);
});

/** Patch payload: `tenantId` is immutable. Master-link rules apply when `componentType` and/or master ids appear in the patch. */
export const payComponentUpdateSchema = createUpdateSchema(payComponents, {
  componentCode: componentCodeSchema.optional(),
  name: z.string().min(1).max(200).optional(),
  componentType: PayComponentTypeSchema.optional(),
  description: z.string().max(1000).optional().nullable(),
  isTaxable: z.boolean().optional(),
  isRecurring: z.boolean().optional(),
  affectsGrossPay: z.boolean().optional(),
  earningsTypeId: z.number().int().positive().optional().nullable(),
  deductionTypeId: z.number().int().positive().optional().nullable(),
  status: PayComponentStatusSchema.optional(),
})
  .omit({ tenantId: true })
  .superRefine((data, ctx) => {
    const e = data.earningsTypeId;
    const d = data.deductionTypeId;
    const ePresent = e !== undefined && e !== null;
    const dPresent = d !== undefined && d !== null;

    if (ePresent && dPresent) {
      ctx.addIssue({
        code: "custom",
        message: "Cannot set both earningsTypeId and deductionTypeId",
        path: ["deductionTypeId"],
      });
      return;
    }

    const ty = data.componentType;
    if (ty === undefined) return;

    if (ty === "EARNING") {
      if (dPresent) {
        ctx.addIssue({
          code: "custom",
          message: "deductionTypeId must not be set when componentType is EARNING",
          path: ["deductionTypeId"],
        });
      }
      if (!ePresent) {
        ctx.addIssue({
          code: "custom",
          message: "earningsTypeId is required in the patch when componentType is EARNING",
          path: ["earningsTypeId"],
        });
      }
      return;
    }

    if (ty === "DEDUCTION") {
      if (ePresent) {
        ctx.addIssue({
          code: "custom",
          message: "earningsTypeId must not be set when componentType is DEDUCTION",
          path: ["earningsTypeId"],
        });
      }
      if (!dPresent) {
        ctx.addIssue({
          code: "custom",
          message: "deductionTypeId is required in the patch when componentType is DEDUCTION",
          path: ["deductionTypeId"],
        });
      }
      return;
    }

    if (ty === "BENEFIT" || ty === "REIMBURSEMENT") {
      if (ePresent) {
        ctx.addIssue({
          code: "custom",
          message: "earningsTypeId must not be set for BENEFIT or REIMBURSEMENT components",
          path: ["earningsTypeId"],
        });
      }
      if (dPresent) {
        ctx.addIssue({
          code: "custom",
          message: "deductionTypeId must not be set for BENEFIT or REIMBURSEMENT components",
          path: ["deductionTypeId"],
        });
      }
    }
  });

export type PayComponent = typeof payComponents.$inferSelect;
export type NewPayComponent = typeof payComponents.$inferInsert;
