import { cache } from "react";
import { and, eq, gt, isNull, or, sql } from "drizzle-orm";
import { withTenantContext } from "@afenda/db/session";
import { permissions, rolePermissions, userPermissions, userRoles } from "@afenda/db/schema";

export {
  eligibilityForModel,
  eligibilityToConditionContext,
  type UserEligibility,
} from "./permission-utils";

/** Dev fallback when DB is unreachable or empty (local without migrate). */
const PHASE1_DEV_FALLBACK_KEYS = new Set<string>([
  "employee.view",
  "employee.create",
  "employee.update",
  "employee.delete",
  "organization.view",
  "organization.manage",
]);

async function fetchUserPermissionKeysFromDb(
  tenantId: number,
  userId: number
): Promise<Set<string>> {
  try {
    return await withTenantContext({ tenantId, userId }, async (tx) => {
      const fromRoles = await tx
        .select({ key: permissions.key })
        .from(userRoles)
        .innerJoin(
          rolePermissions,
          and(
            eq(rolePermissions.roleId, userRoles.roleId),
            eq(rolePermissions.tenantId, userRoles.tenantId)
          )
        )
        .innerJoin(permissions, eq(permissions.permissionId, rolePermissions.permissionId))
        .where(
          and(
            eq(userRoles.userId, userId),
            eq(userRoles.tenantId, tenantId),
            isNull(permissions.deletedAt),
            or(isNull(userRoles.expiresAt), gt(userRoles.expiresAt, sql`now()`))
          )
        );

      const fromDirect = await tx
        .select({ key: permissions.key })
        .from(userPermissions)
        .innerJoin(permissions, eq(permissions.permissionId, userPermissions.permissionId))
        .where(
          and(
            eq(userPermissions.userId, userId),
            eq(userPermissions.tenantId, tenantId),
            isNull(permissions.deletedAt)
          )
        );

      const keys = new Set<string>();
      for (const row of fromRoles) keys.add(row.key);
      for (const row of fromDirect) keys.add(row.key);
      return keys;
    });
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[permission-service] permission query failed; using dev fallback keys", err);
      return new Set(PHASE1_DEV_FALLBACK_KEYS);
    }
    return new Set();
  }
}

/**
 * Per-request deduplication across layout + pages (React `cache` — not ISR).
 * Never use `unstable_cache` for permission keys.
 */
export const loadPermissionKeys = cache(
  async (tenantId: number, userId: number): Promise<Set<string>> => {
    return fetchUserPermissionKeysFromDb(tenantId, userId);
  }
);

export async function loadPermissionKeyList(tenantId: number, userId: number): Promise<string[]> {
  const keys = await loadPermissionKeys(tenantId, userId);
  return [...keys];
}
