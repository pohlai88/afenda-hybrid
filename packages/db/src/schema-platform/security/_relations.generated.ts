import { defineRelations } from "drizzle-orm";
import { permissions, rolePermissions, userPermissions } from "./permissions";
import { policies } from "./policies";
import { roles } from "./roles";
import { servicePrincipals } from "./servicePrincipals";
import { userPreferences } from "./userPreferences";
import { userRoles } from "./userRoles";
import { userSessions } from "./userSessions";
import { users } from "./users";
import { tenants } from "../core/tenants";

export const securityRelations = defineRelations(
  {
    permissions,
    policies,
    rolePermissions,
    roles,
    servicePrincipals,
    userPermissions,
    userPreferences,
    userRoles,
    userSessions,
    users,
    tenants,
  },
  (r) => ({
    permissions: {
      tenant: r.one.tenants({
        from: r.permissions.tenantId,
        to: r.tenants.tenantId,
      }),
      rolePermissions: r.many.rolePermissions({
        from: r.permissions.permissionId,
        to: r.rolePermissions.permissionId,
      }),
      userPermissions: r.many.userPermissions({
        from: r.permissions.permissionId,
        to: r.userPermissions.permissionId,
      }),
    },

    policies: {
      tenant: r.one.tenants({
        from: r.policies.tenantId,
        to: r.tenants.tenantId,
      }),
    },

    rolePermissions: {
      tenant: r.one.tenants({
        from: r.rolePermissions.tenantId,
        to: r.tenants.tenantId,
      }),
      permission: r.one.permissions({
        from: r.rolePermissions.permissionId,
        to: r.permissions.permissionId,
      }),
      role: r.one.roles({
        from: r.rolePermissions.roleId,
        to: r.roles.roleId,
      }),
    },

    roles: {
      tenant: r.one.tenants({
        from: r.roles.tenantId,
        to: r.tenants.tenantId,
      }),
      rolePermissions: r.many.rolePermissions({
        from: r.roles.roleId,
        to: r.rolePermissions.roleId,
      }),
      userRoles: r.many.userRoles({
        from: r.roles.roleId,
        to: r.userRoles.roleId,
      }),
    },

    servicePrincipals: {
      tenant: r.one.tenants({
        from: r.servicePrincipals.tenantId,
        to: r.tenants.tenantId,
      }),
    },

    userPermissions: {
      tenant: r.one.tenants({
        from: r.userPermissions.tenantId,
        to: r.tenants.tenantId,
      }),
      permission: r.one.permissions({
        from: r.userPermissions.permissionId,
        to: r.permissions.permissionId,
      }),
      user: r.one.users({
        from: r.userPermissions.userId,
        to: r.users.userId,
      }),
    },

    userPreferences: {
      tenant: r.one.tenants({
        from: r.userPreferences.tenantId,
        to: r.tenants.tenantId,
      }),
      user: r.one.users({
        from: r.userPreferences.userId,
        to: r.users.userId,
      }),
    },

    userRoles: {
      tenant: r.one.tenants({
        from: r.userRoles.tenantId,
        to: r.tenants.tenantId,
      }),
      assignedByUser: r.one.users({
        from: r.userRoles.assignedBy,
        to: r.users.userId,
        alias: "user_roles_assigner",
      }),
      role: r.one.roles({
        from: r.userRoles.roleId,
        to: r.roles.roleId,
      }),
      user: r.one.users({
        from: r.userRoles.userId,
        to: r.users.userId,
        alias: "user_roles_user",
      }),
    },

    userSessions: {
      tenant: r.one.tenants({
        from: r.userSessions.tenantId,
        to: r.tenants.tenantId,
      }),
      user: r.one.users({
        from: r.userSessions.userId,
        to: r.users.userId,
      }),
    },

    users: {
      tenant: r.one.tenants({
        from: r.users.tenantId,
        to: r.tenants.tenantId,
      }),
      assignedByUserRoles: r.many.userRoles({
        from: r.users.userId,
        to: r.userRoles.assignedBy,
        alias: "users_assigner",
      }),
      userPermissions: r.many.userPermissions({
        from: r.users.userId,
        to: r.userPermissions.userId,
      }),
      userPreferences: r.many.userPreferences({
        from: r.users.userId,
        to: r.userPreferences.userId,
      }),
      userSessions: r.many.userSessions({
        from: r.users.userId,
        to: r.userSessions.userId,
      }),
      userUserRoles: r.many.userRoles({
        from: r.users.userId,
        to: r.userRoles.userId,
        alias: "users_user",
      }),
    },
  })
);
