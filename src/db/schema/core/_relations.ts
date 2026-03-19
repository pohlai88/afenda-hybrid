import { defineRelations } from "drizzle-orm";
import { tenants } from "./tenants";
import { organizations } from "./organizations";
import { regions } from "./regions";
import { locations } from "./locations";
import { users } from "../security/users";
import { roles } from "../security/roles";
import { servicePrincipals } from "../security/servicePrincipals";
import { employees } from "../hr/fundamentals/employees";

export const coreRelations = defineRelations(
  { tenants, users, employees, organizations, regions, locations, roles, servicePrincipals },
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
    },
  })
);
