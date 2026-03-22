import { integer, text, index, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { recruitmentSchema } from "../_schema";
import { timestampColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";
import { jobRequisitions } from "./jobRequisitions";

/**
 * Interview Rounds - Standardized interview stages for job requisitions.
 * Defines the interview process structure (phone screen, technical, behavioral, etc.).
 */
export const roundInterviewTypes = [
  "PHONE",
  "VIDEO",
  "IN_PERSON",
  "TECHNICAL",
  "BEHAVIORAL",
  "PANEL",
  "CASE_STUDY",
] as const;

export const roundInterviewTypeEnum = recruitmentSchema.enum("round_interview_type", [
  ...roundInterviewTypes,
]);

export const RoundInterviewTypeSchema = z.enum(roundInterviewTypes);
export type RoundInterviewType = z.infer<typeof RoundInterviewTypeSchema>;

export const interviewRounds = recruitmentSchema.table(
  "interview_rounds",
  {
    roundId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    requisitionId: integer(),
    name: text().notNull(),
    sequenceNumber: integer().notNull(),
    interviewType: roundInterviewTypeEnum().notNull(),
    ...timestampColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_interview_rounds_tenant").on(t.tenantId),
    index("idx_interview_rounds_requisition").on(t.tenantId, t.requisitionId),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_interview_rounds_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.requisitionId],
      foreignColumns: [jobRequisitions.requisitionId],
      name: "fk_interview_rounds_requisition",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    check("chk_interview_rounds_sequence", sql`${t.sequenceNumber} > 0`),
  ]
);

export const InterviewRoundIdSchema = z.number().int().positive().brand<"InterviewRoundId">();
export type InterviewRoundId = z.infer<typeof InterviewRoundIdSchema>;

export const interviewRoundSelectSchema = createSelectSchema(interviewRounds);

export const interviewRoundInsertSchema = createInsertSchema(interviewRounds, {
  tenantId: z.number().int().positive(),
  requisitionId: z.number().int().positive().optional().nullable(),
  name: z.string().min(1).max(200),
  sequenceNumber: z.number().int().positive(),
  interviewType: RoundInterviewTypeSchema,
  createdBy: z.number().int().positive(),
  updatedBy: z.number().int().positive(),
});

export const interviewRoundUpdateSchema = createUpdateSchema(interviewRounds, {
  name: z.string().min(1).max(200).optional(),
  sequenceNumber: z.number().int().positive().optional(),
  interviewType: RoundInterviewTypeSchema.optional(),
  updatedBy: z.number().int().positive().optional(),
}).omit({ tenantId: true, requisitionId: true });

export type InterviewRound = typeof interviewRounds.$inferSelect;
export type NewInterviewRound = typeof interviewRounds.$inferInsert;
