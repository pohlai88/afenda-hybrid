import { integer, text, date, index, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { talentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";

/**
 * Disciplinary Actions - Misconduct records and corrective actions.
 * Circular FK note: employeeId, issuedBy, witnessId FKs added via custom SQL.
 */
export const disciplinaryTypes = ["VERBAL_WARNING", "WRITTEN_WARNING", "FINAL_WARNING", "SUSPENSION", "DEMOTION", "TERMINATION", "OTHER"] as const;

export const disciplinaryTypeEnum = talentSchema.enum("disciplinary_type", [...disciplinaryTypes]);

export const disciplinaryTypeZodEnum = createSelectSchema(disciplinaryTypeEnum);

export const disciplinaryStatuses = ["DRAFT", "ISSUED", "ACKNOWLEDGED", "APPEALED", "RESOLVED", "EXPIRED"] as const;

export const disciplinaryStatusEnum = talentSchema.enum("disciplinary_status", [...disciplinaryStatuses]);

export const disciplinaryStatusZodEnum = createSelectSchema(disciplinaryStatusEnum);

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
});

export const disciplinaryActionUpdateSchema = createUpdateSchema(disciplinaryActions);

export type DisciplinaryAction = typeof disciplinaryActions.$inferSelect;
export type NewDisciplinaryAction = typeof disciplinaryActions.$inferInsert;
