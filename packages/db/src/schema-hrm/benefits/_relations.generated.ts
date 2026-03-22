import { defineRelations } from "drizzle-orm";
import { benefitPlans } from "./fundamentals/benefitPlans";
import { benefitsProviders } from "./fundamentals/benefitsProviders";
import { benefitApplicationDetails } from "./operations/benefitApplicationDetails";
import { benefitApplications } from "./operations/benefitApplications";
import { benefitEnrollments } from "./operations/benefitEnrollments";
import { benefitLedgerEntries } from "./operations/benefitLedgerEntries";
import { claimsRecords } from "./operations/claimsRecords";
import { dependentCoverages } from "./operations/dependentCoverages";
import { currencies } from "../../schema-platform/core/currencies";
import { tenants } from "../../schema-platform/core/tenants";
import { employees } from "../hr/fundamentals/employees";
import { dependents } from "../hr/people/dependents";

export const benefitsRelations = defineRelations(
  {
    benefitApplicationDetails,
    benefitApplications,
    benefitEnrollments,
    benefitLedgerEntries,
    benefitPlans,
    benefitsProviders,
    claimsRecords,
    dependentCoverages,
    currencies,
    dependents,
    employees,
    tenants,
  },
  (r) => ({
    benefitApplicationDetails: {
      application: r.one.benefitApplications({
        from: r.benefitApplicationDetails.applicationId,
        to: r.benefitApplications.applicationId,
      }),
      benefitPlan: r.one.benefitPlans({
        from: r.benefitApplicationDetails.benefitPlanId,
        to: r.benefitPlans.benefitPlanId,
      }),
    },

    benefitApplications: {
      tenant: r.one.tenants({
        from: r.benefitApplications.tenantId,
        to: r.tenants.tenantId,
      }),
      benefitPlan: r.one.benefitPlans({
        from: r.benefitApplications.benefitPlanId,
        to: r.benefitPlans.benefitPlanId,
      }),
      employee: r.one.employees({
        from: r.benefitApplications.employeeId,
        to: r.employees.employeeId,
      }),
      benefitApplicationDetails: r.many.benefitApplicationDetails({
        from: r.benefitApplications.applicationId,
        to: r.benefitApplicationDetails.applicationId,
      }),
    },

    benefitEnrollments: {
      tenant: r.one.tenants({
        from: r.benefitEnrollments.tenantId,
        to: r.tenants.tenantId,
      }),
      benefitPlan: r.one.benefitPlans({
        from: r.benefitEnrollments.benefitPlanId,
        to: r.benefitPlans.benefitPlanId,
      }),
      employee: r.one.employees({
        from: r.benefitEnrollments.employeeId,
        to: r.employees.employeeId,
      }),
      benefitLedgerEntries: r.many.benefitLedgerEntries({
        from: r.benefitEnrollments.enrollmentId,
        to: r.benefitLedgerEntries.enrollmentId,
      }),
      claimsRecords: r.many.claimsRecords({
        from: r.benefitEnrollments.enrollmentId,
        to: r.claimsRecords.enrollmentId,
      }),
      dependentCoverages: r.many.dependentCoverages({
        from: r.benefitEnrollments.enrollmentId,
        to: r.dependentCoverages.enrollmentId,
      }),
    },

    benefitLedgerEntries: {
      enrollment: r.one.benefitEnrollments({
        from: r.benefitLedgerEntries.enrollmentId,
        to: r.benefitEnrollments.enrollmentId,
      }),
    },

    benefitPlans: {
      tenant: r.one.tenants({
        from: r.benefitPlans.tenantId,
        to: r.tenants.tenantId,
      }),
      currency: r.one.currencies({
        from: r.benefitPlans.currencyId,
        to: r.currencies.currencyId,
        optional: true,
      }),
      provider: r.one.benefitsProviders({
        from: r.benefitPlans.providerId,
        to: r.benefitsProviders.providerId,
        optional: true,
      }),
      benefitApplicationDetails: r.many.benefitApplicationDetails({
        from: r.benefitPlans.benefitPlanId,
        to: r.benefitApplicationDetails.benefitPlanId,
      }),
      benefitApplications: r.many.benefitApplications({
        from: r.benefitPlans.benefitPlanId,
        to: r.benefitApplications.benefitPlanId,
      }),
      benefitEnrollments: r.many.benefitEnrollments({
        from: r.benefitPlans.benefitPlanId,
        to: r.benefitEnrollments.benefitPlanId,
      }),
    },

    benefitsProviders: {
      tenant: r.one.tenants({
        from: r.benefitsProviders.tenantId,
        to: r.tenants.tenantId,
      }),
      benefitPlans: r.many.benefitPlans({
        from: r.benefitsProviders.providerId,
        to: r.benefitPlans.providerId,
      }),
    },

    claimsRecords: {
      tenant: r.one.tenants({
        from: r.claimsRecords.tenantId,
        to: r.tenants.tenantId,
      }),
      currency: r.one.currencies({
        from: r.claimsRecords.currencyId,
        to: r.currencies.currencyId,
      }),
      employee: r.one.employees({
        from: r.claimsRecords.employeeId,
        to: r.employees.employeeId,
      }),
      enrollment: r.one.benefitEnrollments({
        from: r.claimsRecords.enrollmentId,
        to: r.benefitEnrollments.enrollmentId,
      }),
      reviewer: r.one.employees({
        from: r.claimsRecords.reviewedBy,
        to: r.employees.employeeId,
        optional: true,
        alias: "claims_records_reviewer",
      }),
    },

    dependentCoverages: {
      tenant: r.one.tenants({
        from: r.dependentCoverages.tenantId,
        to: r.tenants.tenantId,
      }),
      dependent: r.one.dependents({
        from: r.dependentCoverages.dependentId,
        to: r.dependents.dependentId,
      }),
      enrollment: r.one.benefitEnrollments({
        from: r.dependentCoverages.enrollmentId,
        to: r.benefitEnrollments.enrollmentId,
      }),
    },
  })
);
