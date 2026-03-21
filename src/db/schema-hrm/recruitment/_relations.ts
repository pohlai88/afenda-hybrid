import { defineRelations } from "drizzle-orm";
import { tenants } from "../../schema-platform/core/tenants";
import { currencies } from "../../schema-platform/core/currencies";
import { persons } from "../hr/people/persons";
import { employees } from "../hr/fundamentals/employees";
import { departments } from "../hr/fundamentals/departments";
import { positions } from "../hr/fundamentals/positions";
import { candidates } from "./fundamentals/candidates";
import { jobRequisitions } from "./operations/jobRequisitions";
import { applications } from "./operations/applications";
import { interviews } from "./operations/interviews";
import { offerLetters } from "./operations/offerLetters";
import { backgroundChecks } from "./operations/backgroundChecks";
import { onboardingChecklists } from "./operations/onboardingChecklists";
import { offboardingChecklists } from "./operations/offboardingChecklists";
import { exitInterviews } from "./operations/exitInterviews";
import { probationEvaluations } from "./operations/probationEvaluations";
import { candidateSalaryBackfillIssues } from "./operations/candidateSalaryBackfillIssues";

export const recruitmentRelations = defineRelations(
  {
    tenants,
    currencies,
    persons,
    employees,
    departments,
    positions,
    candidates,
    jobRequisitions,
    applications,
    interviews,
    offerLetters,
    backgroundChecks,
    onboardingChecklists,
    offboardingChecklists,
    exitInterviews,
    probationEvaluations,
    candidateSalaryBackfillIssues,
  },
  (r) => ({
    candidates: {
      tenant: r.one.tenants({
        from: r.candidates.tenantId,
        to: r.tenants.tenantId,
      }),
      person: r.one.persons({
        from: r.candidates.personId,
        to: r.persons.personId,
        optional: true,
      }),
      convertedEmployee: r.one.employees({
        from: r.candidates.convertedEmployeeId,
        to: r.employees.employeeId,
        optional: true,
      }),
      referrer: r.one.employees({
        from: r.candidates.referredBy,
        to: r.employees.employeeId,
        optional: true,
        alias: "candidate_referrer",
      }),
      applications: r.many.applications({
        from: r.candidates.candidateId,
        to: r.applications.candidateId,
      }),
      backgroundChecks: r.many.backgroundChecks({
        from: r.candidates.candidateId,
        to: r.backgroundChecks.candidateId,
      }),
      salaryBackfillIssues: r.many.candidateSalaryBackfillIssues({
        from: r.candidates.candidateId,
        to: r.candidateSalaryBackfillIssues.candidateId,
      }),
      expectedSalaryCurrency: r.one.currencies({
        from: r.candidates.expectedSalaryCurrencyId,
        to: r.currencies.currencyId,
        optional: true,
      }),
    },
    jobRequisitions: {
      tenant: r.one.tenants({
        from: r.jobRequisitions.tenantId,
        to: r.tenants.tenantId,
      }),
      position: r.one.positions({
        from: r.jobRequisitions.positionId,
        to: r.positions.positionId,
        optional: true,
      }),
      department: r.one.departments({
        from: r.jobRequisitions.departmentId,
        to: r.departments.departmentId,
        optional: true,
      }),
      hiringManager: r.one.employees({
        from: r.jobRequisitions.hiringManagerId,
        to: r.employees.employeeId,
        optional: true,
      }),
      currency: r.one.currencies({
        from: r.jobRequisitions.currencyId,
        to: r.currencies.currencyId,
        optional: true,
      }),
      approver: r.one.employees({
        from: r.jobRequisitions.approvedBy,
        to: r.employees.employeeId,
        optional: true,
        alias: "requisition_approver",
      }),
      applications: r.many.applications({
        from: r.jobRequisitions.requisitionId,
        to: r.applications.requisitionId,
      }),
    },
    applications: {
      tenant: r.one.tenants({
        from: r.applications.tenantId,
        to: r.tenants.tenantId,
      }),
      candidate: r.one.candidates({
        from: r.applications.candidateId,
        to: r.candidates.candidateId,
      }),
      requisition: r.one.jobRequisitions({
        from: r.applications.requisitionId,
        to: r.jobRequisitions.requisitionId,
      }),
      interviews: r.many.interviews({
        from: r.applications.applicationId,
        to: r.interviews.applicationId,
      }),
      offerLetters: r.many.offerLetters({
        from: r.applications.applicationId,
        to: r.offerLetters.applicationId,
      }),
    },
    interviews: {
      tenant: r.one.tenants({
        from: r.interviews.tenantId,
        to: r.tenants.tenantId,
      }),
      application: r.one.applications({
        from: r.interviews.applicationId,
        to: r.applications.applicationId,
      }),
      interviewer: r.one.employees({
        from: r.interviews.interviewerId,
        to: r.employees.employeeId,
      }),
    },
    offerLetters: {
      tenant: r.one.tenants({
        from: r.offerLetters.tenantId,
        to: r.tenants.tenantId,
      }),
      application: r.one.applications({
        from: r.offerLetters.applicationId,
        to: r.applications.applicationId,
      }),
      position: r.one.positions({
        from: r.offerLetters.positionId,
        to: r.positions.positionId,
        optional: true,
      }),
      currency: r.one.currencies({
        from: r.offerLetters.currencyId,
        to: r.currencies.currencyId,
      }),
      approver: r.one.employees({
        from: r.offerLetters.approvedBy,
        to: r.employees.employeeId,
        optional: true,
        alias: "offer_approver",
      }),
    },
    backgroundChecks: {
      tenant: r.one.tenants({
        from: r.backgroundChecks.tenantId,
        to: r.tenants.tenantId,
      }),
      candidate: r.one.candidates({
        from: r.backgroundChecks.candidateId,
        to: r.candidates.candidateId,
      }),
    },
    onboardingChecklists: {
      tenant: r.one.tenants({
        from: r.onboardingChecklists.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.onboardingChecklists.employeeId,
        to: r.employees.employeeId,
      }),
      assignee: r.one.employees({
        from: r.onboardingChecklists.assignedTo,
        to: r.employees.employeeId,
        optional: true,
        alias: "onboarding_assignee",
      }),
    },
    offboardingChecklists: {
      tenant: r.one.tenants({
        from: r.offboardingChecklists.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.offboardingChecklists.employeeId,
        to: r.employees.employeeId,
      }),
      assignee: r.one.employees({
        from: r.offboardingChecklists.assignedTo,
        to: r.employees.employeeId,
        optional: true,
        alias: "offboarding_assignee",
      }),
      exitInterview: r.one.exitInterviews({
        from: r.offboardingChecklists.offboardingChecklistId,
        to: r.exitInterviews.linkedOffboardingChecklistId,
        optional: true,
      }),
    },
    exitInterviews: {
      tenant: r.one.tenants({
        from: r.exitInterviews.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.exitInterviews.employeeId,
        to: r.employees.employeeId,
      }),
      conductor: r.one.employees({
        from: r.exitInterviews.conductedByEmployeeId,
        to: r.employees.employeeId,
        optional: true,
        alias: "exit_interview_conductor",
      }),
      linkedChecklist: r.one.offboardingChecklists({
        from: r.exitInterviews.linkedOffboardingChecklistId,
        to: r.offboardingChecklists.offboardingChecklistId,
      }),
    },
    probationEvaluations: {
      tenant: r.one.tenants({
        from: r.probationEvaluations.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.probationEvaluations.employeeId,
        to: r.employees.employeeId,
      }),
      evaluator: r.one.employees({
        from: r.probationEvaluations.evaluatorId,
        to: r.employees.employeeId,
        alias: "probation_evaluator",
      }),
    },
    candidateSalaryBackfillIssues: {
      tenant: r.one.tenants({
        from: r.candidateSalaryBackfillIssues.tenantId,
        to: r.tenants.tenantId,
      }),
      candidate: r.one.candidates({
        from: r.candidateSalaryBackfillIssues.candidateId,
        to: r.candidates.candidateId,
      }),
    },
  })
);
