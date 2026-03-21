/**
 * Ensures `securityRelations.userRoles.assignedByUser` (alias user_roles_assigned_by) resolves via RQB.
 * Run: pnpm vitest run --config vitest.db.config.ts src/db/__tests__/user-roles-assigned-by-relation.test.ts
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { tenants } from "../schema-platform/core/tenants";
import { users } from "../schema-platform/security/users";
import { roles } from "../schema-platform/security/roles";
import { userRoles } from "../schema-platform/security/userRoles";

describe("user_roles assignedByUser relation (contract)", () => {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  let tenantId: number;
  let assignerUserId: number;
  let assigneeUserId: number;
  let roleId: number;

  beforeAll(async () => {
    const [t] = await db
      .insert(tenants)
      .values({
        tenantCode: `UR_AB_${suffix}`,
        name: "Relation test tenant",
        status: "ACTIVE",
      })
      .returning();
    tenantId = t.tenantId;

    const [assigner] = await db
      .insert(users)
      .values({
        tenantId,
        email: `assigner.${suffix}@test.local`,
        displayName: "Assigner",
        createdBy: 1,
        updatedBy: 1,
      })
      .returning();
    assignerUserId = assigner.userId;

    const [assignee] = await db
      .insert(users)
      .values({
        tenantId,
        email: `assignee.${suffix}@test.local`,
        displayName: "Assignee",
        createdBy: assignerUserId,
        updatedBy: assignerUserId,
      })
      .returning();
    assigneeUserId = assignee.userId;

    const [role] = await db
      .insert(roles)
      .values({
        tenantId,
        roleCode: `ROLE_${suffix}`,
        name: "Test role",
        createdBy: assignerUserId,
        updatedBy: assignerUserId,
      })
      .returning();
    roleId = role.roleId;

    await db.insert(userRoles).values({
      userId: assigneeUserId,
      roleId,
      tenantId,
      assignedBy: assignerUserId,
    });
  });

  afterAll(async () => {
    await db.delete(userRoles).where(eq(userRoles.tenantId, tenantId));
    await db.delete(roles).where(eq(roles.tenantId, tenantId));
    await db.delete(users).where(eq(users.tenantId, tenantId));
    await db.delete(tenants).where(eq(tenants.tenantId, tenantId));
  });

  it("loads assignedByUser distinct from user on the same row", async () => {
    const row = await db.query.userRoles.findFirst({
      where: {
        AND: [{ userId: { eq: assigneeUserId } }, { roleId: { eq: roleId } }],
      },
      with: {
        user: true,
        assignedByUser: true,
      },
    });

    expect(row).toBeDefined();
    if (!row?.user || !row.assignedByUser) {
      expect.fail("expected userRoles row with user and assignedByUser relations loaded");
    }
    expect(row.user.userId).toBe(assigneeUserId);
    expect(row.assignedByUser.userId).toBe(assignerUserId);
    expect(row.assignedByUser.userId).not.toBe(row.user.userId);
  });
});
