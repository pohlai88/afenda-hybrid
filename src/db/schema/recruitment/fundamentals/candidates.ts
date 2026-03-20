import { integer, text, date, numeric, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { recruitmentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { currencies } from "../../core/currencies";

/**
 * Candidates - Applicant profiles.
 * Links to hr.persons when hired.
 * Circular FK note: personId (hr.persons) and convertedEmployeeId FKs added via custom SQL.
 */
export const candidateSources = ["JOB_BOARD", "REFERRAL", "CAREER_SITE", "SOCIAL_MEDIA", "AGENCY", "UNIVERSITY", "INTERNAL", "OTHER"] as const;

export const candidateSourceEnum = recruitmentSchema.enum("candidate_source", [...candidateSources]);

export const candidateSourceZodEnum = createSelectSchema(candidateSourceEnum);

export const candidateStatuses = ["NEW", "SCREENING", "INTERVIEWING", "OFFER", "HIRED", "REJECTED", "WITHDRAWN", "ON_HOLD"] as const;

export const candidateStatusEnum = recruitmentSchema.enum("candidate_status", [...candidateStatuses]);

export const candidateStatusZodEnum = createSelectSchema(candidateStatusEnum);

export const expectedSalaryPeriods = ["MONTHLY", "BIWEEKLY", "WEEKLY", "SEMI_MONTHLY", "ANNUAL"] as const;

export const expectedSalaryPeriodEnum = recruitmentSchema.enum("expected_salary_period", [
  ...expectedSalaryPeriods,
]);

export const expectedSalaryPeriodZodEnum = createSelectSchema(expectedSalaryPeriodEnum);

export const candidates = recruitmentSchema.table(
  "candidates",
  {
    candidateId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    candidateCode: text().notNull(),
    firstName: text().notNull(),
    middleName: text(),
    lastName: text().notNull(),
    email: text().notNull(),
    phone: text(),
    linkedinUrl: text(),
    resumePath: text(),
    source: candidateSourceEnum().notNull().default("JOB_BOARD"),
    referredBy: integer(),
    currentCompany: text(),
    currentTitle: text(),
    /** @deprecated Use expectedSalaryAmount + currency + period */
    expectedSalary: text(),
    expectedSalaryAmount: numeric({ precision: 14, scale: 2 }),
    expectedSalaryCurrencyId: integer(),
    expectedSalaryPeriod: expectedSalaryPeriodEnum(),
    availableFrom: date(),
    personId: integer(),
    convertedEmployeeId: integer(),
    status: candidateStatusEnum().notNull().default("NEW"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_candidates_tenant").on(t.tenantId),
    index("idx_candidates_source").on(t.tenantId, t.source),
    index("idx_candidates_status").on(t.tenantId, t.status),
    index("idx_candidates_person").on(t.tenantId, t.personId),
    uniqueIndex("uq_candidates_code")
      .on(t.tenantId, sql`lower(${t.candidateCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    uniqueIndex("uq_candidates_email")
      .on(t.tenantId, sql`lower(${t.email})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_candidates_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.expectedSalaryCurrencyId],
      foreignColumns: [currencies.currencyId],
      name: "fk_candidates_expected_salary_currency",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export const CandidateIdSchema = z.number().int().brand<"CandidateId">();
export type CandidateId = z.infer<typeof CandidateIdSchema>;

export const candidateSelectSchema = createSelectSchema(candidates);

export const candidateInsertSchema = createInsertSchema(candidates, {
  candidateCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  firstName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(1).max(100),
  email: z.email(),
  phone: z.string().max(30).optional(),
  linkedinUrl: z.string().url().max(255).optional(),
  resumePath: z.string().max(500).optional(),
  currentCompany: z.string().max(200).optional(),
  currentTitle: z.string().max(200).optional(),
  expectedSalary: z.string().max(100).optional(),
  expectedSalaryPeriod: expectedSalaryPeriodZodEnum.optional(),
});

export const candidateUpdateSchema = createUpdateSchema(candidates);

export type Candidate = typeof candidates.$inferSelect;
export type NewCandidate = typeof candidates.$inferInsert;
