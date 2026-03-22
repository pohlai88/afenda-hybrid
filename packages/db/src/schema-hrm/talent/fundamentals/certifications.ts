import {
  integer,
  text,
  smallint,
  index,
  uniqueIndex,
  foreignKey,
  check,
} from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { talentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";

/**
 * Certifications - Professional credentials master data.
 */
export const certificationStatuses = ["ACTIVE", "INACTIVE", "DEPRECATED"] as const;

export const certificationStatusEnum = talentSchema.enum("certification_status", [
  ...certificationStatuses,
]);

export const certificationStatusZodEnum = createSelectSchema(certificationStatusEnum);

export const certifications = talentSchema.table(
  "certifications",
  {
    certificationId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    certificationCode: text().notNull(),
    ...nameColumn,
    issuingOrganization: text().notNull(),
    description: text(),
    validityMonths: smallint(),
    url: text(),
    status: certificationStatusEnum().notNull().default("ACTIVE"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_certifications_tenant").on(t.tenantId),
    index("idx_certifications_issuer").on(t.tenantId, t.issuingOrganization),
    index("idx_certifications_status").on(t.tenantId, t.status),
    uniqueIndex("uq_certifications_code")
      .on(t.tenantId, sql`lower(${t.certificationCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_certifications_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_certifications_validity",
      sql`${t.validityMonths} IS NULL OR ${t.validityMonths} > 0`
    ),
  ]
);

export const CertificationIdSchema = z.number().int().brand<"CertificationId">();
export type CertificationId = z.infer<typeof CertificationIdSchema>;

export const certificationSelectSchema = createSelectSchema(certifications);

export const certificationInsertSchema = createInsertSchema(certifications, {
  certificationCode: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  name: z.string().min(1).max(200),
  issuingOrganization: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  validityMonths: z.number().int().min(1).max(120).optional(),
  url: z.string().url().max(500).optional(),
});

export const certificationUpdateSchema = createUpdateSchema(certifications);

export type Certification = typeof certifications.$inferSelect;
export type NewCertification = typeof certifications.$inferInsert;
