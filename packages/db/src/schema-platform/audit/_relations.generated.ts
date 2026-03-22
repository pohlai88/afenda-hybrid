import { defineRelations } from "drizzle-orm";
import { auditTrail } from "./auditTrail";
import { retentionExecutions, retentionPolicies } from "./retentionPolicy";
import { tenants } from "../core/tenants";

export const auditRelations = defineRelations(
  {
    auditTrail,
    retentionExecutions,
    retentionPolicies,
    tenants,
  },
  (r) => ({
    auditTrail: {
      tenant: r.one.tenants({
        from: r.auditTrail.tenantId,
        to: r.tenants.tenantId,
      }),
    },

    retentionExecutions: {
      policy: r.one.retentionPolicies({
        from: r.retentionExecutions.policyId,
        to: r.retentionPolicies.policyId,
      }),
    },

    retentionPolicies: {
      tenant: r.one.tenants({
        from: r.retentionPolicies.tenantId,
        to: r.tenants.tenantId,
        optional: true,
      }),
      retentionExecutions: r.many.retentionExecutions({
        from: r.retentionPolicies.policyId,
        to: r.retentionExecutions.policyId,
      }),
    },
  })
);
