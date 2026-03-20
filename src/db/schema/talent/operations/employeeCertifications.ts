import { integer, text, date, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { talentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { certifications } from "../fundamentals/certifications";

/**
 * Employee Certifications - Certifications held by employees.
 * Circular FK note: employeeId and verifiedBy FKs added via custom SQL.
 *
 * Verification: `verifiedBy` / `verificationDate` are paired; neither is set while `status = PENDING_VERIFICATION`.
 * (No `COMPLETED` status on this table — use learning.certification_awards for award lifecycle if needed.)
 */
export const employeeCertificationStatuses = ["ACTIVE", "EXPIRED", "REVOKED", "PENDING_VERIFICATION"] as const;

export const employeeCertificationStatusEnum = talentSchema.enum(
  "employee_certification_status",
  [...employeeCertificationStatuses]
);

export const employeeCertificationStatusZodEnum = createSelectSchema(employeeCertificationStatusEnum);

export const employeeCertifications = talentSchema.table(
  "employee_certifications",
  {
    employeeCertificationId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    certificationId: integer().notNull(),
    certificationCodeSnapshot: text().notNull(),
    certificationNameSnapshot: text().notNull(),
    issuingOrganizationSnapshot: text().notNull(),
    certificationNumber: text(),
    issuedDate: date().notNull(),
    expiryDate: date(),
    verifiedBy: integer(),
    verificationDate: date(),
    status: employeeCertificationStatusEnum().notNull().default("ACTIVE"),
    notes: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_employee_certifications_tenant").on(t.tenantId),
    index("idx_employee_certifications_employee").on(t.tenantId, t.employeeId),
    index("idx_employee_certifications_certification").on(t.tenantId, t.certificationId),
    index("idx_employee_certifications_status").on(t.tenantId, t.status),
    index("idx_employee_certifications_verified_reporting")
      .on(t.tenantId, t.verificationDate)
      .where(
        sql`${t.deletedAt} IS NULL AND ${t.verifiedBy} IS NOT NULL AND ${t.verificationDate} IS NOT NULL`
      ),
    uniqueIndex("uq_employee_certifications_active")
      .on(t.tenantId, t.employeeId, t.certificationId)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_employee_certifications_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.certificationId],
      foreignColumns: [certifications.certificationId],
      name: "fk_employee_certifications_certification",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_employee_certifications_dates",
      sql`${t.expiryDate} IS NULL OR ${t.issuedDate} IS NULL OR ${t.expiryDate} >= ${t.issuedDate}`
    ),
    check(
      "chk_employee_certifications_verification_consistency",
      sql`((${t.verifiedBy} IS NULL) = (${t.verificationDate} IS NULL)) AND
          (${t.status}::text != 'PENDING_VERIFICATION' OR (${t.verifiedBy} IS NULL AND ${t.verificationDate} IS NULL))`
    ),
  ]
);

export const EmployeeCertificationIdSchema = z.number().int().brand<"EmployeeCertificationId">();
export type EmployeeCertificationId = z.infer<typeof EmployeeCertificationIdSchema>;

export const employeeCertificationSelectSchema = createSelectSchema(employeeCertifications);

export const employeeCertificationInsertSchema = createInsertSchema(employeeCertifications, {
  certificationCodeSnapshot: z.string().min(1).max(50),
  certificationNameSnapshot: z.string().min(1).max(200),
  issuingOrganizationSnapshot: z.string().min(1).max(200),
  certificationNumber: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

export const employeeCertificationUpdateSchema = createUpdateSchema(employeeCertifications);

export type EmployeeCertification = typeof employeeCertifications.$inferSelect;
export type NewEmployeeCertification = typeof employeeCertifications.$inferInsert;
