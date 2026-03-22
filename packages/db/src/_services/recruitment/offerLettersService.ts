import { eq } from "drizzle-orm";
import type { Database } from "@db/db";
import { applications } from "@db/schema-hrm/recruitment/operations/applications";
import {
  offerLetterInsertSchema,
  offerLetters,
  type NewOfferLetter,
  type OfferLetter,
} from "@db/schema-hrm/recruitment/operations/offerLetters";

/** Thrown when `tenantId` on the insert does not match `applications.tenantId`. */
export class OfferLetterTenantMismatchError extends Error {
  readonly code = "OFFER_LETTER_TENANT_MISMATCH" as const;

  constructor(message: string) {
    super(message);
    this.name = "OfferLetterTenantMismatchError";
  }
}

export type CreateOfferLetterInput = Omit<NewOfferLetter, "offerLetterId">;

/**
 * Inserts an offer letter only if `row.tenantId` matches `applications.tenantId` for `applicationId`.
 * Rows are parsed with `offerLetterInsertSchema` before insert.
 */
export async function createOfferLetter(
  dbOrTx: Database,
  row: CreateOfferLetterInput
): Promise<OfferLetter> {
  const parsed = offerLetterInsertSchema.parse(row);
  const { tenantId, applicationId } = parsed;

  const [application] = await dbOrTx
    .select({ tenantId: applications.tenantId })
    .from(applications)
    .where(eq(applications.applicationId, applicationId))
    .limit(1);

  if (!application) {
    throw new Error("Application not found for offer letter");
  }
  if (application.tenantId !== tenantId) {
    throw new OfferLetterTenantMismatchError("Application tenant mismatch");
  }

  const [created] = await dbOrTx.insert(offerLetters).values(parsed).returning();
  if (!created) {
    throw new Error("Offer letter insert returned no row");
  }
  return created;
}
