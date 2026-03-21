import { eq } from "drizzle-orm";
import type { Database } from "@db/db";
import { candidates } from "@db/schema-hrm/recruitment/fundamentals/candidates";
import {
  backgroundCheckInsertSchema,
  backgroundChecks,
  type BackgroundCheck,
  type NewBackgroundCheck,
} from "@db/schema-hrm/recruitment/operations/backgroundChecks";

/** Thrown when `tenantId` on the insert does not match `candidates.tenantId`. */
export class BackgroundCheckTenantMismatchError extends Error {
  readonly code = "BACKGROUND_CHECK_TENANT_MISMATCH" as const;

  constructor(message: string) {
    super(message);
    this.name = "BackgroundCheckTenantMismatchError";
  }
}

export type CreateBackgroundCheckInput = Omit<NewBackgroundCheck, "backgroundCheckId">;

/**
 * Inserts a background check only if `row.tenantId` matches `candidates.tenantId` for `candidateId`.
 * PostgreSQL does not enforce cross-FK tenant equality; this is the application-layer guardrail.
 * Rows are parsed with {@link backgroundCheckInsertSchema} before insert (result/status rules, ids, etc.).
 */
export async function createBackgroundCheck(
  dbOrTx: Database,
  row: CreateBackgroundCheckInput,
): Promise<BackgroundCheck> {
  const parsed = backgroundCheckInsertSchema.parse(row);
  const { tenantId, candidateId } = parsed;

  const [candidate] = await dbOrTx
    .select({ tenantId: candidates.tenantId })
    .from(candidates)
    .where(eq(candidates.candidateId, candidateId))
    .limit(1);

  if (!candidate) {
    throw new Error("Candidate not found for background check");
  }
  if (candidate.tenantId !== tenantId) {
    throw new BackgroundCheckTenantMismatchError("Candidate tenant mismatch");
  }

  const [created] = await dbOrTx.insert(backgroundChecks).values(parsed).returning();
  if (!created) {
    throw new Error("Background check insert returned no row");
  }
  return created;
}
