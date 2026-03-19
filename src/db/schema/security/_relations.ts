import { defineRelations } from "drizzle-orm";
import { users } from "./users";
import { roles } from "./roles";
import { userRoles } from "./userRoles";
import { servicePrincipals } from "./servicePrincipals";
import { tenants } from "../core/tenants";

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
