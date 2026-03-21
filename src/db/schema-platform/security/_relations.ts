/**
 * Security domain relational graph for Drizzle 1.0 RQB (`db.query.*`).
 *
 * - **Tenancy**: every entity links to `tenants`.
 * - **Users ↔ roles**: via `userRoles`; `assignedByUser` uses alias `user_roles_assigned_by` to disambiguate the second join to `users`.
 * - **Service principals**: tenant only (no user FK today).
 *
 * @see README.md in this folder for conventions and test locations.
 */
import { defineRelations } from "drizzle-orm";
import { tenants } from "../core/tenants";
import { roles } from "./roles";
import { servicePrincipals } from "./servicePrincipals";
import { userRoles } from "./userRoles";
import { users } from "./users";

export const securityRelations = defineRelations(
  { users, tenants, roles, userRoles, servicePrincipals },
  (r) => ({
    users: {
      tenant: r.one.tenants({
        from: r.users.tenantId,
        to: r.tenants.tenantId,
      }),
      userRoles: r.many.userRoles({
        from: r.users.userId,
        to: r.userRoles.userId,
      }),
    },
    roles: {
      tenant: r.one.tenants({
        from: r.roles.tenantId,
        to: r.tenants.tenantId,
      }),
      userRoles: r.many.userRoles({
        from: r.roles.roleId,
        to: r.userRoles.roleId,
      }),
    },
    userRoles: {
      user: r.one.users({
        from: r.userRoles.userId,
        to: r.users.userId,
      }),
      role: r.one.roles({
        from: r.userRoles.roleId,
        to: r.roles.roleId,
      }),
      tenant: r.one.tenants({
        from: r.userRoles.tenantId,
        to: r.tenants.tenantId,
      }),
      assignedByUser: r.one.users({
        from: r.userRoles.assignedBy,
        to: r.users.userId,
        alias: "user_roles_assigned_by",
      }),
    },
    servicePrincipals: {
      tenant: r.one.tenants({
        from: r.servicePrincipals.tenantId,
        to: r.tenants.tenantId,
      }),
    },
  })
);
