import { and, eq, isNull } from "drizzle-orm";
import type { Database } from "@db/db";
import {
  employeeCertifications,
  type EmployeeCertification,
  type NewEmployeeCertification,
} from "@db/schema-hrm/talent/operations/employeeCertifications";
import { certifications } from "@db/schema-hrm/talent/fundamentals/certifications";

type SnapshotManagedFields =
  | "certificationCodeSnapshot"
  | "certificationNameSnapshot"
  | "issuingOrganizationSnapshot";

export type CreateEmployeeCertificationInput = Omit<NewEmployeeCertification, SnapshotManagedFields>;

/**
 * Creates employee certification records with immutable certification snapshots
 * copied from the certification master row at write time.
 */
export async function createEmployeeCertificationWithSnapshot(
  db: Database,
  input: CreateEmployeeCertificationInput
): Promise<EmployeeCertification> {
  const [certificationMaster] = await db
    .select({
      certificationCode: certifications.certificationCode,
      name: certifications.name,
      issuingOrganization: certifications.issuingOrganization,
    })
    .from(certifications)
    .where(
      and(
        eq(certifications.tenantId, input.tenantId),
        eq(certifications.certificationId, input.certificationId),
        isNull(certifications.deletedAt)
      )
    )
    .limit(1);

  if (!certificationMaster) {
    throw new Error(
      `Certification ${input.certificationId} not found for tenant ${input.tenantId}`
    );
  }

  const [created] = await db
    .insert(employeeCertifications)
    .values({
      ...input,
      certificationCodeSnapshot: certificationMaster.certificationCode,
      certificationNameSnapshot: certificationMaster.name,
      issuingOrganizationSnapshot: certificationMaster.issuingOrganization,
    })
    .returning();

  return created;
}
