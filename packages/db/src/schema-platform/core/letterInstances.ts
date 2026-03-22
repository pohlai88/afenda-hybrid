import { integer, text, timestamp, index, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { coreSchema } from "./tenants";
import { timestampColumns, auditColumns } from "../../_shared";
import { tenants } from "./tenants";
import { letterTemplates } from "./letterTemplates";
import { employees } from "../../schema-hrm/hr/fundamentals/employees";

/**
 * Letter Instances - Generated letters for specific employees.
 * Tracks letter generation, delivery, and acknowledgment status.
 */
export const letterInstanceStatuses = ["DRAFT", "GENERATED", "SENT", "ACKNOWLEDGED"] as const;

export const letterInstanceStatusEnum = coreSchema.enum("letter_instance_status", [
  ...letterInstanceStatuses,
]);

export const LetterInstanceStatusSchema = z.enum(letterInstanceStatuses);
export type LetterInstanceStatus = z.infer<typeof LetterInstanceStatusSchema>;

/**
 * letter_instances — generated letters from templates for employees; delivery and acknowledgment.
 */
export const letterInstances = coreSchema.table(
  "letter_instances",
  {
    instanceId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    templateId: integer().notNull(),
    employeeId: integer().notNull(),
    generatedContent: text().notNull(),
    generatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    sentAt: timestamp({ withTimezone: true }),
    acknowledgedAt: timestamp({ withTimezone: true }),
    // status: letter_instance_status — DRAFT (default), GENERATED, SENT, ACKNOWLEDGED
    status: letterInstanceStatusEnum().notNull().default("DRAFT"),
    ...timestampColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_letter_instances_tenant").on(t.tenantId),
    index("idx_letter_instances_template").on(t.tenantId, t.templateId),
    index("idx_letter_instances_employee").on(t.tenantId, t.employeeId),
    index("idx_letter_instances_status").on(t.tenantId, t.status),
    index("idx_letter_instances_generated_at").on(t.generatedAt),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_letter_instances_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.templateId],
      foreignColumns: [letterTemplates.templateId],
      name: "fk_letter_instances_template",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.employeeId],
      foreignColumns: [employees.employeeId],
      name: "fk_letter_instances_employee",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const LetterInstanceIdSchema = z.number().int().positive().brand<"LetterInstanceId">();
export type LetterInstanceId = z.infer<typeof LetterInstanceIdSchema>;

export const letterInstanceSelectSchema = createSelectSchema(letterInstances);

export const letterInstanceInsertSchema = createInsertSchema(letterInstances, {
  tenantId: z.number().int().positive(),
  templateId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  generatedContent: z.string().min(1).max(100000),
  status: LetterInstanceStatusSchema.optional(),
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const letterInstanceUpdateSchema = createUpdateSchema(letterInstances, {
  generatedContent: z.string().min(1).max(100000).optional(),
  status: LetterInstanceStatusSchema.optional(),
  updatedBy: z.number().int().positive().optional(),
}).omit({ tenantId: true, templateId: true, employeeId: true });

export type LetterInstance = typeof letterInstances.$inferSelect;
export type NewLetterInstance = typeof letterInstances.$inferInsert;
