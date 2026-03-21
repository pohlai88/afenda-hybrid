/**
 * Benefits relational graph for Drizzle RQB (`db.query.*`).
 * Wired with security (and other domains later) in `src/db/db.ts`.
 *
 * Optional `one` relations: `benefitPlans.provider`, `benefitPlans.currency`, `claimsRecords.reviewer`.
 * Contract tests: `src/db/__tests__/benefits-optional-relations.test.ts`.
 */
import { defineRelations } from "drizzle-orm";
import { tenants } from "../../schema-platform/core/tenants";
import { currencies } from "../../schema-platform/core/currencies";
import { employees } from "../hr/fundamentals/employees";
import { dependents } from "../hr/people/dependents";
import { benefitPlans } from "./fundamentals/benefitPlans";
import { benefitsProviders } from "./fundamentals/benefitsProviders";
import { benefitEnrollments } from "./operations/benefitEnrollments";
import { dependentCoverages } from "./operations/dependentCoverages";
import { claimsRecords } from "./operations/claimsRecords";

export const benefitsRelations = defineRelations(
  {
    tenants,
    currencies,
    employees,
    dependents,
    benefitsProviders,
    benefitPlans,
    benefitEnrollments,
    dependentCoverages,
    claimsRecords,
  },
  (r) => ({
    benefitsProviders: {
      tenant: r.one.tenants({
        from: r.benefitsProviders.tenantId,
        to: r.tenants.tenantId,
      }),
      plans: r.many.benefitPlans({
        from: r.benefitsProviders.providerId,
        to: r.benefitPlans.providerId,
      }),
    },
    benefitPlans: {
      tenant: r.one.tenants({
        from: r.benefitPlans.tenantId,
        to: r.tenants.tenantId,
      }),
      provider: r.one.benefitsProviders({
        from: r.benefitPlans.providerId,
        to: r.benefitsProviders.providerId,
        optional: true,
      }),
      currency: r.one.currencies({
        from: r.benefitPlans.currencyId,
        to: r.currencies.currencyId,
        optional: true,
      }),
      enrollments: r.many.benefitEnrollments({
        from: r.benefitPlans.benefitPlanId,
        to: r.benefitEnrollments.benefitPlanId,
      }),
    },
    benefitEnrollments: {
      tenant: r.one.tenants({
        from: r.benefitEnrollments.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.benefitEnrollments.employeeId,
        to: r.employees.employeeId,
      }),
      plan: r.one.benefitPlans({
        from: r.benefitEnrollments.benefitPlanId,
        to: r.benefitPlans.benefitPlanId,
      }),
      dependentCoverages: r.many.dependentCoverages({
        from: r.benefitEnrollments.enrollmentId,
        to: r.dependentCoverages.enrollmentId,
      }),
      claimsRecords: r.many.claimsRecords({
        from: r.benefitEnrollments.enrollmentId,
        to: r.claimsRecords.enrollmentId,
      }),
    },
    dependentCoverages: {
      tenant: r.one.tenants({
        from: r.dependentCoverages.tenantId,
        to: r.tenants.tenantId,
      }),
      enrollment: r.one.benefitEnrollments({
        from: r.dependentCoverages.enrollmentId,
        to: r.benefitEnrollments.enrollmentId,
      }),
      dependent: r.one.dependents({
        from: r.dependentCoverages.dependentId,
        to: r.dependents.dependentId,
      }),
    },
    claimsRecords: {
      tenant: r.one.tenants({
        from: r.claimsRecords.tenantId,
        to: r.tenants.tenantId,
      }),
      enrollment: r.one.benefitEnrollments({
        from: r.claimsRecords.enrollmentId,
        to: r.benefitEnrollments.enrollmentId,
      }),
      employee: r.one.employees({
        from: r.claimsRecords.employeeId,
        to: r.employees.employeeId,
      }),
      currency: r.one.currencies({
        from: r.claimsRecords.currencyId,
        to: r.currencies.currencyId,
      }),
      reviewer: r.one.employees({
        from: r.claimsRecords.reviewedBy,
        to: r.employees.employeeId,
        optional: true,
        alias: "claims_reviewer",
      }),
    },
  })
);
