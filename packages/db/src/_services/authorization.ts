import { and, eq, sql } from "drizzle-orm";
import { db } from "../db";
import {
  permissions,
  rolePermissions,
  userPermissions,
} from "../schema-platform/security/permissions";
import { policies, PolicyRule } from "../schema-platform/security/policies";
import { userRoles } from "../schema-platform/security/userRoles";
import { roles } from "../schema-platform/security/roles";

/**
 * Authorization context passed to the can() function.
 */
export interface AuthContext {
  userId: number;
  tenantId: number;
  departmentId?: number;
  roles?: string[];
}

/**
 * Resource context for policy condition evaluation.
 */
export interface ResourceContext {
  ownerId?: number;
  departmentId?: number;
  [key: string]: unknown;
}

/**
 * Result of an authorization check.
 */
export interface AuthResult {
  allowed: boolean;
  reason?: string;
  matchedPolicy?: string;
}

/**
 * Evaluates a single policy rule condition.
 */
function evaluateCondition(
  rule: PolicyRule,
  user: AuthContext,
  resource?: ResourceContext
): boolean {
  const resolveValue = (val: unknown): unknown => {
    if (typeof val !== "string") return val;

    const templateMatch = val.match(/^\$\{(.+)\}$/);
    if (!templateMatch) return val;

    const path = templateMatch[1];
    const [obj, ...props] = path.split(".");

    let target: Record<string, unknown> | undefined;
    if (obj === "user") target = user as unknown as Record<string, unknown>;
    else if (obj === "resource") target = resource as unknown as Record<string, unknown>;

    if (!target) return val;

    let current: unknown = target;
    for (const prop of props) {
      if (current == null || typeof current !== "object") return undefined;
      current = (current as Record<string, unknown>)[prop];
    }
    return current;
  };

  const fieldValue = resolveValue(`\${${rule.field}}`);
  const compareValue = resolveValue(rule.value);

  switch (rule.operator) {
    case "eq":
      return fieldValue === compareValue;
    case "ne":
      return fieldValue !== compareValue;
    case "gt":
      return (
        typeof fieldValue === "number" &&
        typeof compareValue === "number" &&
        fieldValue > compareValue
      );
    case "gte":
      return (
        typeof fieldValue === "number" &&
        typeof compareValue === "number" &&
        fieldValue >= compareValue
      );
    case "lt":
      return (
        typeof fieldValue === "number" &&
        typeof compareValue === "number" &&
        fieldValue < compareValue
      );
    case "lte":
      return (
        typeof fieldValue === "number" &&
        typeof compareValue === "number" &&
        fieldValue <= compareValue
      );
    case "in":
      return Array.isArray(compareValue) && compareValue.includes(fieldValue);
    case "nin":
      return Array.isArray(compareValue) && !compareValue.includes(fieldValue);
    case "contains":
      return (
        typeof fieldValue === "string" &&
        typeof compareValue === "string" &&
        fieldValue.includes(compareValue)
      );
    case "startsWith":
      return (
        typeof fieldValue === "string" &&
        typeof compareValue === "string" &&
        fieldValue.startsWith(compareValue)
      );
    case "endsWith":
      return (
        typeof fieldValue === "string" &&
        typeof compareValue === "string" &&
        fieldValue.endsWith(compareValue)
      );
    default:
      return false;
  }
}

/**
 * Evaluates all conditions in a policy.
 */
function evaluateConditions(
  conditions: PolicyRule[],
  user: AuthContext,
  resource?: ResourceContext
): boolean {
  if (conditions.length === 0) return true;

  let result = evaluateCondition(conditions[0], user, resource);

  for (let i = 1; i < conditions.length; i++) {
    const rule = conditions[i];
    const ruleResult = evaluateCondition(rule, user, resource);

    if (rule.logic === "or") {
      result = result || ruleResult;
    } else {
      result = result && ruleResult;
    }
  }

  return result;
}

/**
 * Three-layer authorization check.
 *
 * Evaluation order:
 * 1. Direct user permissions (user_permissions table)
 * 2. Role-based permissions (user_roles -> role_permissions -> permissions)
 * 3. Dynamic policies (policies table, priority-ordered, with condition evaluation)
 *
 * Deny-by-default: If no permission or policy grants access, the request is denied.
 *
 * @param user - The authenticated user context
 * @param resource - The resource being accessed (e.g., "leave", "payroll")
 * @param action - The action being performed (e.g., "approve", "view")
 * @param resourceContext - Optional context about the specific resource instance
 * @returns AuthResult indicating whether access is allowed
 */
export async function can(
  user: AuthContext,
  resource: string,
  action: string,
  resourceContext?: ResourceContext
): Promise<AuthResult> {
  const permissionKey = `${resource}.${action}`;

  // Layer 1: Check direct user permissions
  const directPermission = await db
    .select({ permissionId: userPermissions.permissionId })
    .from(userPermissions)
    .innerJoin(permissions, eq(permissions.permissionId, userPermissions.permissionId))
    .where(
      and(
        eq(userPermissions.tenantId, user.tenantId),
        eq(userPermissions.userId, user.userId),
        eq(permissions.key, permissionKey),
        sql`${permissions.deletedAt} IS NULL`
      )
    )
    .limit(1);

  if (directPermission.length > 0) {
    return {
      allowed: true,
      reason: "Direct user permission",
    };
  }

  // Layer 2: Check role-based permissions
  const rolePermission = await db
    .select({ permissionId: rolePermissions.permissionId })
    .from(userRoles)
    .innerJoin(rolePermissions, eq(rolePermissions.roleId, userRoles.roleId))
    .innerJoin(permissions, eq(permissions.permissionId, rolePermissions.permissionId))
    .where(
      and(
        eq(userRoles.tenantId, user.tenantId),
        eq(userRoles.userId, user.userId),
        eq(permissions.key, permissionKey),
        sql`${permissions.deletedAt} IS NULL`
      )
    )
    .limit(1);

  if (rolePermission.length > 0) {
    return {
      allowed: true,
      reason: "Role-based permission",
    };
  }

  // Layer 3: Check dynamic policies
  // Get user's role codes for policy matching
  let userRoleCodes: string[] = user.roles || [];
  if (userRoleCodes.length === 0) {
    const userRolesResult = await db
      .select({ roleCode: roles.roleCode })
      .from(userRoles)
      .innerJoin(roles, eq(roles.roleId, userRoles.roleId))
      .where(
        and(
          eq(userRoles.tenantId, user.tenantId),
          eq(userRoles.userId, user.userId),
          sql`${roles.deletedAt} IS NULL`
        )
      );
    userRoleCodes = userRolesResult.map((r) => r.roleCode);
  }

  // Fetch applicable policies (sorted by priority DESC)
  const applicablePolicies = await db
    .select()
    .from(policies)
    .where(
      and(
        eq(policies.tenantId, user.tenantId),
        eq(policies.resource, resource),
        eq(policies.enabled, true),
        sql`${policies.deletedAt} IS NULL`,
        sql`${action} = ANY(${policies.actions})`
      )
    )
    .orderBy(sql`${policies.priority} DESC`);

  for (const policy of applicablePolicies) {
    // Check if policy applies to user's roles (null roles = applies to all)
    if (policy.roles && policy.roles.length > 0) {
      const hasMatchingRole = policy.roles.some((r) => userRoleCodes.includes(r));
      if (!hasMatchingRole) continue;
    }

    // Evaluate conditions
    const conditions = (policy.conditions as PolicyRule[]) || [];
    const conditionsMet = evaluateConditions(conditions, user, resourceContext);

    if (conditionsMet) {
      return {
        allowed: policy.effect === "allow",
        reason: policy.effect === "allow" ? "Policy allowed" : "Policy denied",
        matchedPolicy: policy.policyCode,
      };
    }
  }

  // Deny by default
  return {
    allowed: false,
    reason: "No permission or policy grants access",
  };
}

/**
 * Batch check multiple permissions for a user.
 * More efficient than calling can() multiple times.
 */
export async function canMany(
  user: AuthContext,
  checks: Array<{ resource: string; action: string; resourceContext?: ResourceContext }>
): Promise<Map<string, AuthResult>> {
  const results = new Map<string, AuthResult>();

  for (const check of checks) {
    const key = `${check.resource}.${check.action}`;
    const result = await can(user, check.resource, check.action, check.resourceContext);
    results.set(key, result);
  }

  return results;
}

/**
 * Check if user has any of the specified permissions.
 */
export async function canAny(
  user: AuthContext,
  checks: Array<{ resource: string; action: string }>
): Promise<boolean> {
  for (const check of checks) {
    const result = await can(user, check.resource, check.action);
    if (result.allowed) return true;
  }
  return false;
}

/**
 * Check if user has all of the specified permissions.
 */
export async function canAll(
  user: AuthContext,
  checks: Array<{ resource: string; action: string }>
): Promise<boolean> {
  for (const check of checks) {
    const result = await can(user, check.resource, check.action);
    if (!result.allowed) return false;
  }
  return true;
}
