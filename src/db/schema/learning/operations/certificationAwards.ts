import { integer, text, date, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { learningSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";

/**
 * Certification Awards - Credentials earned by employees.
 * Circular FK note: employeeId and certificationId (talent.certifications) FKs added via custom SQL.
 */
export const awardStatuses = ["ACTIVE", "EXPIRED", "REVOKED", "PENDING_RENEWAL"] as const;

export const awardStatusEnum = learningSchema.enum("award_status", [...awardStatuses]);

export const awardStatusZodEnum = createSelectSchema(awardStatusEnum);

export const certificationAwards = learningSchema.table(
  "certification_awards",
  {
    awardId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    certificationId: integer().notNull(),
    awardDate: date().notNull(),
    expiryDate: date(),
    certificateNumber: text(),
    certificateUrl: text(),
    status: awardStatusEnum().notNull().default("ACTIVE"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_certification_awards_tenant").on(t.tenantId),
    index("idx_certification_awards_employee").on(t.tenantId, t.employeeId),
    index("idx_certification_awards_certification").on(t.tenantId, t.certificationId),
    index("idx_certification_awards_status").on(t.tenantId, t.status),
    index("idx_certification_awards_expiry").on(t.tenantId, t.expiryDate),
    uniqueIndex("uq_certification_awards_certificate")
      .on(t.tenantId, t.certificateNumber)
      .where(sql`${t.deletedAt} IS NULL AND ${t.certificateNumber} IS NOT NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_certification_awards_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_certification_awards_expiry",
      sql`${t.expiryDate} IS NULL OR ${t.expiryDate} >= ${t.awardDate}`
    ),
  ]
);

export const CertificationAwardIdSchema = z.number().int().brand<"CertificationAwardId">();
export type CertificationAwardId = z.infer<typeof CertificationAwardIdSchema>;

export const certificationAwardSelectSchema = createSelectSchema(certificationAwards);

export const certificationAwardInsertSchema = createInsertSchema(certificationAwards, {
  certificateNumber: z.string().max(100).optional(),
  certificateUrl: z.string().url().max(500).optional(),
});

export const certificationAwardUpdateSchema = createUpdateSchema(certificationAwards);

export type CertificationAward = typeof certificationAwards.$inferSelect;
export type NewCertificationAward = typeof certificationAwards.$inferInsert;
