/**
 * Pure permission utility functions — safe for client components.
 * No DB imports, no server-only code.
 */

import type { ConditionContext } from "@afenda/view-engine";
import { MODEL_PERMISSION_RULES } from "./model-registry";

export interface UserEligibility {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canCreate: boolean;
}

function hasAny(keys: Set<string>, candidates: readonly string[]): boolean {
  return candidates.some((k) => keys.has(k));
}

/**
 * Compute eligibility for a model based on permission keys.
 * Pure function — safe for client components.
 */
export function eligibilityForModel(keys: ReadonlySet<string>, modelName: string): UserEligibility {
  const r = MODEL_PERMISSION_RULES.get(modelName);
  if (!r) {
    return {
      canRead: false,
      canWrite: false,
      canDelete: false,
      canCreate: false,
    };
  }
  return {
    canRead: hasAny(keys as Set<string>, r.read),
    canWrite: hasAny(keys as Set<string>, r.write),
    canCreate: hasAny(keys as Set<string>, r.create),
    canDelete: hasAny(keys as Set<string>, r.delete),
  };
}

/**
 * Convert eligibility to view-engine ConditionContext.
 * Pure function — safe for client components.
 */
export function eligibilityToConditionContext(
  eligibility: UserEligibility,
  userId: number
): ConditionContext {
  return {
    uid: userId,
    today: new Date().toISOString().slice(0, 10),
    eligibilityCanRead: eligibility.canRead,
    eligibilityCanWrite: eligibility.canWrite,
    eligibilityCanDelete: eligibility.canDelete,
    eligibilityCanCreate: eligibility.canCreate,
  };
}
