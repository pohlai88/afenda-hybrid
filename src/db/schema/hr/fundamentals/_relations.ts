import { defineRelations } from "drizzle-orm";
import { employees } from "./employees";
import { tenants } from "../../core/tenants";

export const hrFundamentalsRelations = defineRelations({ employees, tenants }, (r) => ({
  employees: {
    tenant: r.one.tenants({
      from: r.employees.tenantId,
      to: r.tenants.tenantId,
    }),
  },
}));
