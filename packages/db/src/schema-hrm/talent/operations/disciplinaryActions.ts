import { integer, text, date, index, foreignKey, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { talentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";

/**
 * Disciplinary Actions - Misconduct records and corrective actions.
 *
 * Note: `employeeId`, `issuedBy`, and `witnessId` are not yet FK-enforced in
 * migrations (avoid circular dependency / ordering with `hr.employees`). When
 * those constraints land, extend `talentContracts.disciplinary_actions` in
 * `talent-contracts.test.ts` so they cannot drift.
 */
export const disciplinaryTypes = [
  "VERBAL_WARNING",
  "WRITTEN_WARNING",
  "FINAL_WARNING",
  "SUSPENSION",
  "DEMOTION",
  "TERMINATION",
  "OTHER",
] as const;

export const disciplinaryTypeEnum = talentSchema.enum("disciplinary_type", [...disciplinaryTypes]);

export const disciplinaryTypeZodEnum = createSelectSchema(disciplinaryTypeEnum);

export const disciplinaryStatuses = [
  "DRAFT",
  "ISSUED",
  "ACKNOWLEDGED",
  "APPEALED",
  "RESOLVED",
  "EXPIRED",
] as const;

export const disciplinaryStatusEnum = talentSchema.enum("disciplinary_status", [
  ...disciplinaryStatuses,
]);

export const disciplinaryStatusZodEnum = createSelectSchema(disciplinaryStatusEnum);

/** Calendar-day instant (UTC) for comparing Drizzle `date` values from Zod (ISO string or Date). */
function dateToUtcDayMs(value: unknown): number | null {
  if (value == null) return null;
  if (value instanceof Date) {
    return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    const ymd = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
    if (ymd) {
      return Date.UTC(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
    }
    const d = new Date(trimmed);
    if (Number.isNaN(d.getTime())) return null;
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  }
  return null;
}

export const disciplinaryActions = talentSchema.table(
  "disciplinary_actions",
  {
    disciplinaryActionId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    actionType: disciplinaryTypeEnum().notNull(),
    incidentDate: date().notNull(),
    issueDate: date().notNull(),
    description: text().notNull(),
    policyViolated: text(),
    correctiveAction: text(),
    issuedBy: integer().notNull(),
    witnessId: integer(),
    employeeResponse: text(),
    acknowledgedDate: date(),
    expiryDate: date(),
    status: disciplinaryStatusEnum().notNull().default("DRAFT"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_disciplinary_actions_tenant").on(t.tenantId),
    index("idx_disciplinary_actions_employee").on(t.tenantId, t.employeeId),
    index("idx_disciplinary_actions_type").on(t.tenantId, t.actionType),
    index("idx_disciplinary_actions_status").on(t.tenantId, t.status),
    index("idx_disciplinary_actions_date").on(t.tenantId, t.incidentDate),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_disciplinary_actions_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_disciplinary_actions_issue_after_incident",
      sql`${t.issueDate} >= ${t.incidentDate}`
    ),
    check(
      "chk_disciplinary_actions_expiry_after_issue",
      sql`${t.expiryDate} IS NULL OR ${t.expiryDate} >= ${t.issueDate}`
    ),
  ]
);

export const DisciplinaryActionIdSchema = z.number().int().brand<"DisciplinaryActionId">();
export type DisciplinaryActionId = z.infer<typeof DisciplinaryActionIdSchema>;

export const disciplinaryActionSelectSchema = createSelectSchema(disciplinaryActions);

export const disciplinaryActionInsertSchema = createInsertSchema(disciplinaryActions, {
  description: z.string().min(1).max(4000),
  policyViolated: z.string().max(1000).optional(),
  correctiveAction: z.string().max(2000).optional(),
  employeeResponse: z.string().max(4000).optional(),
}).superRefine((row, ctx) => {
  const incidentMs = dateToUtcDayMs(row.incidentDate);
  const issueMs = dateToUtcDayMs(row.issueDate);
  if (incidentMs != null && issueMs != null && issueMs < incidentMs) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Issue date must be on or after incident date",
      path: ["issueDate"],
    });
  }

  const expiryMs = dateToUtcDayMs(row.expiryDate);
  if (expiryMs != null && issueMs != null && expiryMs < issueMs) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Expiry date must be on or after issue date when set",
      path: ["expiryDate"],
    });
  }
});

export const disciplinaryActionUpdateSchema = createUpdateSchema(disciplinaryActions).superRefine(
  (row, ctx) => {
    if (row.incidentDate !== undefined && row.issueDate !== undefined) {
      const incidentMs = dateToUtcDayMs(row.incidentDate);
      const issueMs = dateToUtcDayMs(row.issueDate);
      if (incidentMs != null && issueMs != null && issueMs < incidentMs) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Issue date must be on or after incident date",
          path: ["issueDate"],
        });
      }
    }

    if (row.expiryDate !== undefined && row.expiryDate != null && row.issueDate !== undefined) {
      const issueMs = dateToUtcDayMs(row.issueDate);
      const expiryMs = dateToUtcDayMs(row.expiryDate);
      if (issueMs != null && expiryMs != null && expiryMs < issueMs) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Expiry date must be on or after issue date when set",
          path: ["expiryDate"],
        });
      }
    }
  }
);

export type DisciplinaryAction = typeof disciplinaryActions.$inferSelect;
export type NewDisciplinaryAction = typeof disciplinaryActions.$inferInsert;
