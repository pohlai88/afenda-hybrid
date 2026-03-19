import { defineRelations } from "drizzle-orm";
import { employees } from "./fundamentals/employees";
import { tenants } from "../core/tenants";

export const hrRelations = defineRelations({ employees, tenants }, (r) => ({
  employees: {
    tenant: r.one.tenants({
      from: r.employees.tenantId,
      to: r.tenants.tenantId,
    }),
  },
}));
