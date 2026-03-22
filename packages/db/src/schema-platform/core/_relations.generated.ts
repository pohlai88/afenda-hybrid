import { defineRelations } from "drizzle-orm";
import { announcementAudiences } from "./announcementAudiences";
import { announcementPosts } from "./announcementPosts";
import { appModules } from "./appModules";
import { attachments } from "./attachments";
import { costCenters } from "./costCenters";
import { currencies } from "./currencies";
import { dashboardWidgets } from "./dashboardWidgets";
import { emailLogs } from "./emailLogs";
import { emailTemplates } from "./emailTemplates";
import { legalEntities } from "./legalEntities";
import { letterInstances } from "./letterInstances";
import { letterTemplates } from "./letterTemplates";
import { locations } from "./locations";
import { menuItems } from "./menuItems";
import { notificationChannels } from "./notificationChannels";
import { notificationDeliveries } from "./notificationDeliveries";
import { notificationSubscriptions } from "./notificationSubscriptions";
import { notificationTemplates } from "./notificationTemplates";
import { notifications } from "./notifications";
import { organizations } from "./organizations";
import { regions } from "./regions";
import { tenants } from "./tenants";
import { workflowActionLogs } from "./workflowActionLogs";
import { workflowDefinitions } from "./workflowDefinitions";
import { workflowInstances } from "./workflowInstances";
import { workflowStates } from "./workflowStates";
import { workflowTransitionRules } from "./workflowTransitionRules";
import { workflowTransitions } from "./workflowTransitions";
import { employees } from "../../schema-hrm/hr/fundamentals/employees";
import { roles } from "../security/roles";
import { users } from "../security/users";

export const coreRelations = defineRelations(
  {
    announcementAudiences,
    announcementPosts,
    appModules,
    attachments,
    costCenters,
    currencies,
    dashboardWidgets,
    emailLogs,
    emailTemplates,
    legalEntities,
    letterInstances,
    letterTemplates,
    locations,
    menuItems,
    notificationChannels,
    notificationDeliveries,
    notificationSubscriptions,
    notificationTemplates,
    notifications,
    organizations,
    regions,
    tenants,
    workflowActionLogs,
    workflowDefinitions,
    workflowInstances,
    workflowStates,
    workflowTransitionRules,
    workflowTransitions,
    employees,
    roles,
    users,
  },
  (r) => ({
    announcementAudiences: {
      announcement: r.one.announcementPosts({
        from: r.announcementAudiences.announcementId,
        to: r.announcementPosts.announcementId,
      }),
    },

    announcementPosts: {
      tenant: r.one.tenants({
        from: r.announcementPosts.tenantId,
        to: r.tenants.tenantId,
      }),
      announcementAudiences: r.many.announcementAudiences({
        from: r.announcementPosts.announcementId,
        to: r.announcementAudiences.announcementId,
      }),
    },

    appModules: {
      tenant: r.one.tenants({
        from: r.appModules.tenantId,
        to: r.tenants.tenantId,
      }),
      dashboardWidgets: r.many.dashboardWidgets({
        from: r.appModules.appModuleId,
        to: r.dashboardWidgets.appModuleId,
      }),
      menuItems: r.many.menuItems({
        from: r.appModules.appModuleId,
        to: r.menuItems.appModuleId,
      }),
    },

    attachments: {
      tenant: r.one.tenants({
        from: r.attachments.tenantId,
        to: r.tenants.tenantId,
      }),
    },

    costCenters: {
      tenant: r.one.tenants({
        from: r.costCenters.tenantId,
        to: r.tenants.tenantId,
      }),
      legalEntity: r.one.legalEntities({
        from: r.costCenters.legalEntityId,
        to: r.legalEntities.legalEntityId,
        optional: true,
      }),
      parent: r.one.costCenters({
        from: r.costCenters.parentCostCenterId,
        to: r.costCenters.costCenterId,
        optional: true,
      }),
      costCenters: r.many.costCenters({
        from: r.costCenters.costCenterId,
        to: r.costCenters.parentCostCenterId,
      }),
    },

    currencies: {
      legalEntities: r.many.legalEntities({
        from: r.currencies.currencyId,
        to: r.legalEntities.defaultCurrencyId,
      }),
    },

    dashboardWidgets: {
      tenant: r.one.tenants({
        from: r.dashboardWidgets.tenantId,
        to: r.tenants.tenantId,
      }),
      appModule: r.one.appModules({
        from: r.dashboardWidgets.appModuleId,
        to: r.appModules.appModuleId,
        optional: true,
      }),
    },

    emailLogs: {
      tenant: r.one.tenants({
        from: r.emailLogs.tenantId,
        to: r.tenants.tenantId,
      }),
      template: r.one.emailTemplates({
        from: r.emailLogs.templateId,
        to: r.emailTemplates.templateId,
        optional: true,
      }),
    },

    emailTemplates: {
      tenant: r.one.tenants({
        from: r.emailTemplates.tenantId,
        to: r.tenants.tenantId,
      }),
      emailLogs: r.many.emailLogs({
        from: r.emailTemplates.templateId,
        to: r.emailLogs.templateId,
      }),
    },

    legalEntities: {
      tenant: r.one.tenants({
        from: r.legalEntities.tenantId,
        to: r.tenants.tenantId,
      }),
      defaultCurrency: r.one.currencies({
        from: r.legalEntities.defaultCurrencyId,
        to: r.currencies.currencyId,
        optional: true,
      }),
      costCenters: r.many.costCenters({
        from: r.legalEntities.legalEntityId,
        to: r.costCenters.legalEntityId,
      }),
      employees: r.many.employees({
        from: r.legalEntities.legalEntityId,
        to: r.employees.payrollLegalEntityId,
      }),
    },

    letterInstances: {
      tenant: r.one.tenants({
        from: r.letterInstances.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.letterInstances.employeeId,
        to: r.employees.employeeId,
      }),
      template: r.one.letterTemplates({
        from: r.letterInstances.templateId,
        to: r.letterTemplates.templateId,
      }),
    },

    letterTemplates: {
      tenant: r.one.tenants({
        from: r.letterTemplates.tenantId,
        to: r.tenants.tenantId,
      }),
      letterInstances: r.many.letterInstances({
        from: r.letterTemplates.templateId,
        to: r.letterInstances.templateId,
      }),
    },

    locations: {
      tenant: r.one.tenants({
        from: r.locations.tenantId,
        to: r.tenants.tenantId,
      }),
      region: r.one.regions({
        from: r.locations.regionId,
        to: r.regions.regionId,
        optional: true,
      }),
      employees: r.many.employees({
        from: r.locations.locationId,
        to: r.employees.locationId,
      }),
    },

    menuItems: {
      tenant: r.one.tenants({
        from: r.menuItems.tenantId,
        to: r.tenants.tenantId,
      }),
      appModule: r.one.appModules({
        from: r.menuItems.appModuleId,
        to: r.appModules.appModuleId,
      }),
      parent: r.one.menuItems({
        from: r.menuItems.parentMenuItemId,
        to: r.menuItems.menuItemId,
        optional: true,
      }),
      menuItems: r.many.menuItems({
        from: r.menuItems.menuItemId,
        to: r.menuItems.parentMenuItemId,
      }),
    },

    notificationChannels: {
      tenant: r.one.tenants({
        from: r.notificationChannels.tenantId,
        to: r.tenants.tenantId,
      }),
    },

    notificationDeliveries: {
      notification: r.one.notifications({
        from: r.notificationDeliveries.notificationId,
        to: r.notifications.notificationId,
      }),
    },

    notificationSubscriptions: {
      user: r.one.users({
        from: r.notificationSubscriptions.userId,
        to: r.users.userId,
      }),
    },

    notificationTemplates: {
      tenant: r.one.tenants({
        from: r.notificationTemplates.tenantId,
        to: r.tenants.tenantId,
      }),
      notifications: r.many.notifications({
        from: r.notificationTemplates.templateId,
        to: r.notifications.templateId,
      }),
    },

    notifications: {
      tenant: r.one.tenants({
        from: r.notifications.tenantId,
        to: r.tenants.tenantId,
      }),
      recipientUser: r.one.users({
        from: r.notifications.recipientUserId,
        to: r.users.userId,
      }),
      template: r.one.notificationTemplates({
        from: r.notifications.templateId,
        to: r.notificationTemplates.templateId,
        optional: true,
      }),
      notificationDeliveries: r.many.notificationDeliveries({
        from: r.notifications.notificationId,
        to: r.notificationDeliveries.notificationId,
      }),
    },

    organizations: {
      tenant: r.one.tenants({
        from: r.organizations.tenantId,
        to: r.tenants.tenantId,
      }),
      parent: r.one.organizations({
        from: r.organizations.parentOrganizationId,
        to: r.organizations.organizationId,
        optional: true,
      }),
      organizations: r.many.organizations({
        from: r.organizations.organizationId,
        to: r.organizations.parentOrganizationId,
      }),
    },

    regions: {
      parent: r.one.regions({
        from: r.regions.parentRegionId,
        to: r.regions.regionId,
        optional: true,
      }),
      locations: r.many.locations({
        from: r.regions.regionId,
        to: r.locations.regionId,
      }),
      regions: r.many.regions({
        from: r.regions.regionId,
        to: r.regions.parentRegionId,
      }),
    },

    tenants: {
      announcementPosts: r.many.announcementPosts({
        from: r.tenants.tenantId,
        to: r.announcementPosts.tenantId,
      }),
      appModules: r.many.appModules({
        from: r.tenants.tenantId,
        to: r.appModules.tenantId,
      }),
      attachments: r.many.attachments({
        from: r.tenants.tenantId,
        to: r.attachments.tenantId,
      }),
      costCenters: r.many.costCenters({
        from: r.tenants.tenantId,
        to: r.costCenters.tenantId,
      }),
      dashboardWidgets: r.many.dashboardWidgets({
        from: r.tenants.tenantId,
        to: r.dashboardWidgets.tenantId,
      }),
      emailLogs: r.many.emailLogs({
        from: r.tenants.tenantId,
        to: r.emailLogs.tenantId,
      }),
      emailTemplates: r.many.emailTemplates({
        from: r.tenants.tenantId,
        to: r.emailTemplates.tenantId,
      }),
      employees: r.many.employees({
        from: r.tenants.tenantId,
        to: r.employees.tenantId,
      }),
      legalEntities: r.many.legalEntities({
        from: r.tenants.tenantId,
        to: r.legalEntities.tenantId,
      }),
      letterInstances: r.many.letterInstances({
        from: r.tenants.tenantId,
        to: r.letterInstances.tenantId,
      }),
      letterTemplates: r.many.letterTemplates({
        from: r.tenants.tenantId,
        to: r.letterTemplates.tenantId,
      }),
      locations: r.many.locations({
        from: r.tenants.tenantId,
        to: r.locations.tenantId,
      }),
      menuItems: r.many.menuItems({
        from: r.tenants.tenantId,
        to: r.menuItems.tenantId,
      }),
      notificationChannels: r.many.notificationChannels({
        from: r.tenants.tenantId,
        to: r.notificationChannels.tenantId,
      }),
      notificationTemplates: r.many.notificationTemplates({
        from: r.tenants.tenantId,
        to: r.notificationTemplates.tenantId,
      }),
      notifications: r.many.notifications({
        from: r.tenants.tenantId,
        to: r.notifications.tenantId,
      }),
      organizations: r.many.organizations({
        from: r.tenants.tenantId,
        to: r.organizations.tenantId,
      }),
      roles: r.many.roles({
        from: r.tenants.tenantId,
        to: r.roles.tenantId,
      }),
      users: r.many.users({
        from: r.tenants.tenantId,
        to: r.users.tenantId,
      }),
      workflowDefinitions: r.many.workflowDefinitions({
        from: r.tenants.tenantId,
        to: r.workflowDefinitions.tenantId,
      }),
      workflowInstances: r.many.workflowInstances({
        from: r.tenants.tenantId,
        to: r.workflowInstances.tenantId,
      }),
    },

    workflowActionLogs: {
      actor: r.one.users({
        from: r.workflowActionLogs.actorId,
        to: r.users.userId,
      }),
      fromState: r.one.workflowStates({
        from: r.workflowActionLogs.fromStateId,
        to: r.workflowStates.stateId,
      }),
      instance: r.one.workflowInstances({
        from: r.workflowActionLogs.instanceId,
        to: r.workflowInstances.instanceId,
      }),
      toState: r.one.workflowStates({
        from: r.workflowActionLogs.toStateId,
        to: r.workflowStates.stateId,
        alias: "workflow_action_logs_to_state",
      }),
      transition: r.one.workflowTransitions({
        from: r.workflowActionLogs.transitionId,
        to: r.workflowTransitions.transitionId,
        optional: true,
      }),
    },

    workflowDefinitions: {
      tenant: r.one.tenants({
        from: r.workflowDefinitions.tenantId,
        to: r.tenants.tenantId,
      }),
      workflowInstances: r.many.workflowInstances({
        from: r.workflowDefinitions.workflowId,
        to: r.workflowInstances.workflowId,
      }),
      workflowStates: r.many.workflowStates({
        from: r.workflowDefinitions.workflowId,
        to: r.workflowStates.workflowId,
      }),
      workflowTransitions: r.many.workflowTransitions({
        from: r.workflowDefinitions.workflowId,
        to: r.workflowTransitions.workflowId,
      }),
    },

    workflowInstances: {
      tenant: r.one.tenants({
        from: r.workflowInstances.tenantId,
        to: r.tenants.tenantId,
      }),
      currentState: r.one.workflowStates({
        from: r.workflowInstances.currentStateId,
        to: r.workflowStates.stateId,
      }),
      workflow: r.one.workflowDefinitions({
        from: r.workflowInstances.workflowId,
        to: r.workflowDefinitions.workflowId,
      }),
      workflowActionLogs: r.many.workflowActionLogs({
        from: r.workflowInstances.instanceId,
        to: r.workflowActionLogs.instanceId,
      }),
    },

    workflowStates: {
      workflow: r.one.workflowDefinitions({
        from: r.workflowStates.workflowId,
        to: r.workflowDefinitions.workflowId,
      }),
      fromStateWorkflowActionLogs: r.many.workflowActionLogs({
        from: r.workflowStates.stateId,
        to: r.workflowActionLogs.fromStateId,
        alias: "workflow_states_from_state",
      }),
      fromStateWorkflowTransitions: r.many.workflowTransitions({
        from: r.workflowStates.stateId,
        to: r.workflowTransitions.fromStateId,
        alias: "workflow_states_from_state",
      }),
      toStateWorkflowActionLogs: r.many.workflowActionLogs({
        from: r.workflowStates.stateId,
        to: r.workflowActionLogs.toStateId,
        alias: "workflow_states_to_state",
      }),
      toStateWorkflowTransitions: r.many.workflowTransitions({
        from: r.workflowStates.stateId,
        to: r.workflowTransitions.toStateId,
        alias: "workflow_states_to_state",
      }),
      workflowInstances: r.many.workflowInstances({
        from: r.workflowStates.stateId,
        to: r.workflowInstances.currentStateId,
      }),
    },

    workflowTransitionRules: {
      transition: r.one.workflowTransitions({
        from: r.workflowTransitionRules.transitionId,
        to: r.workflowTransitions.transitionId,
      }),
    },

    workflowTransitions: {
      fromState: r.one.workflowStates({
        from: r.workflowTransitions.fromStateId,
        to: r.workflowStates.stateId,
      }),
      requiredRole: r.one.roles({
        from: r.workflowTransitions.requiredRoleId,
        to: r.roles.roleId,
        optional: true,
      }),
      toState: r.one.workflowStates({
        from: r.workflowTransitions.toStateId,
        to: r.workflowStates.stateId,
        alias: "workflow_transitions_to_state",
      }),
      workflow: r.one.workflowDefinitions({
        from: r.workflowTransitions.workflowId,
        to: r.workflowDefinitions.workflowId,
      }),
      workflowActionLogs: r.many.workflowActionLogs({
        from: r.workflowTransitions.transitionId,
        to: r.workflowActionLogs.transitionId,
      }),
      workflowTransitionRules: r.many.workflowTransitionRules({
        from: r.workflowTransitions.transitionId,
        to: r.workflowTransitionRules.transitionId,
      }),
    },
  })
);
