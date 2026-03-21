import { defineRelations } from "drizzle-orm";
import { tenants } from "./tenants";
import { currencies } from "./currencies";
import { legalEntities } from "./legalEntities";
import { costCenters } from "./costCenters";
import { organizations } from "./organizations";
import { regions } from "./regions";
import { locations } from "./locations";
import { users } from "../security/users";
import { roles } from "../security/roles";
import { servicePrincipals } from "../security/servicePrincipals";
import { employees } from "../../schema-hrm/hr/fundamentals/employees";
import { departments } from "../../schema-hrm/hr/fundamentals/departments";

export const coreRelations = defineRelations(
  {
    tenants,
    currencies,
    legalEntities,
    costCenters,
    users,
    employees,
    departments,
    organizations,
    regions,
    locations,
    roles,
    servicePrincipals,
  },
  (r) => ({
    tenants: {
      users: r.many.users({
        from: r.tenants.tenantId,
        to: r.users.tenantId,
      }),
      employees: r.many.employees({
        from: r.tenants.tenantId,
        to: r.employees.tenantId,
      }),
      departments: r.many.departments({
        from: r.tenants.tenantId,
        to: r.departments.tenantId,
      }),
      organizations: r.many.organizations({
        from: r.tenants.tenantId,
        to: r.organizations.tenantId,
      }),
      locations: r.many.locations({
        from: r.tenants.tenantId,
        to: r.locations.tenantId,
      }),
      roles: r.many.roles({
        from: r.tenants.tenantId,
        to: r.roles.tenantId,
      }),
      servicePrincipals: r.many.servicePrincipals({
        from: r.tenants.tenantId,
        to: r.servicePrincipals.tenantId,
      }),
      legalEntities: r.many.legalEntities({
        from: r.tenants.tenantId,
        to: r.legalEntities.tenantId,
      }),
      costCenters: r.many.costCenters({
        from: r.tenants.tenantId,
        to: r.costCenters.tenantId,
      }),
    },
    currencies: {},
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
        alias: "cost_center_parent",
      }),
      children: r.many.costCenters({
        from: r.costCenters.costCenterId,
        to: r.costCenters.parentCostCenterId,
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
      children: r.many.organizations({
        from: r.organizations.organizationId,
        to: r.organizations.parentOrganizationId,
      }),
      departments: r.many.departments({
        from: r.organizations.organizationId,
        to: r.departments.organizationId,
      }),
    },
    regions: {
      parent: r.one.regions({
        from: r.regions.parentRegionId,
        to: r.regions.regionId,
        optional: true,
      }),
      children: r.many.regions({
        from: r.regions.regionId,
        to: r.regions.parentRegionId,
      }),
      locations: r.many.locations({
        from: r.regions.regionId,
        to: r.locations.regionId,
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
  })
);
