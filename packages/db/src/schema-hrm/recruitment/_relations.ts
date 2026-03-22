import { defineRelations } from "drizzle-orm";
import { candidates } from "./fundamentals/candidates";
import { applications } from "./operations/applications";
import { backgroundChecks } from "./operations/backgroundChecks";
import { candidateSalaryBackfillIssues } from "./operations/candidateSalaryBackfillIssues";
import { exitInterviews } from "./operations/exitInterviews";
import { interviewFeedback } from "./operations/interviewFeedback";
import { interviewRounds } from "./operations/interviewRounds";
import { interviewSchedules } from "./operations/interviewSchedules";
import { interviews } from "./operations/interviews";
import { jobRequisitions } from "./operations/jobRequisitions";
import { offboardingChecklists } from "./operations/offboardingChecklists";
import { offerLetters } from "./operations/offerLetters";
import { onboardingChecklists } from "./operations/onboardingChecklists";
import { probationEvaluations } from "./operations/probationEvaluations";
import { staffingPlanDetails } from "./operations/staffingPlanDetails";
import { staffingPlans } from "./operations/staffingPlans";
import { currencies } from "../../schema-platform/core/currencies";
import { tenants } from "../../schema-platform/core/tenants";
import { departments } from "../hr/fundamentals/departments";
import { employees } from "../hr/fundamentals/employees";
import { positions } from "../hr/fundamentals/positions";
import { persons } from "../hr/people/persons";

export const recruitmentRelations = defineRelations(
  {
    applications,
    backgroundChecks,
    candidateSalaryBackfillIssues,
    candidates,
    exitInterviews,
    interviewFeedback,
    interviewRounds,
    interviewSchedules,
    interviews,
    jobRequisitions,
    offboardingChecklists,
    offerLetters,
    onboardingChecklists,
    probationEvaluations,
    staffingPlanDetails,
    staffingPlans,
    currencies,
    departments,
    employees,
    persons,
    positions,
    tenants,
  },
  (r) => ({
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
      interviewSchedules: r.many.interviewSchedules({
        from: r.applications.applicationId,
        to: r.interviewSchedules.applicationId,
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

    candidates: {
      tenant: r.one.tenants({
        from: r.candidates.tenantId,
        to: r.tenants.tenantId,
      }),
      convertedEmployee: r.one.employees({
        from: r.candidates.convertedEmployeeId,
        to: r.employees.employeeId,
        optional: true,
      }),
      expectedSalaryCurrency: r.one.currencies({
        from: r.candidates.expectedSalaryCurrencyId,
        to: r.currencies.currencyId,
        optional: true,
      }),
      person: r.one.persons({
        from: r.candidates.personId,
        to: r.persons.personId,
        optional: true,
      }),
      applications: r.many.applications({
        from: r.candidates.candidateId,
        to: r.applications.candidateId,
      }),
      backgroundChecks: r.many.backgroundChecks({
        from: r.candidates.candidateId,
        to: r.backgroundChecks.candidateId,
      }),
      candidateSalaryBackfillIssues: r.many.candidateSalaryBackfillIssues({
        from: r.candidates.candidateId,
        to: r.candidateSalaryBackfillIssues.candidateId,
      }),
    },

    exitInterviews: {
      tenant: r.one.tenants({
        from: r.exitInterviews.tenantId,
        to: r.tenants.tenantId,
      }),
      conductedByEmployee: r.one.employees({
        from: r.exitInterviews.conductedByEmployeeId,
        to: r.employees.employeeId,
        optional: true,
      }),
      employee: r.one.employees({
        from: r.exitInterviews.employeeId,
        to: r.employees.employeeId,
        alias: "exit_interviews_employee",
      }),
      linkedOffboardingChecklist: r.one.offboardingChecklists({
        from: r.exitInterviews.linkedOffboardingChecklistId,
        to: r.offboardingChecklists.offboardingChecklistId,
      }),
    },

    interviewFeedback: {
      interview: r.one.interviewSchedules({
        from: r.interviewFeedback.interviewId,
        to: r.interviewSchedules.interviewId,
      }),
      interviewer: r.one.employees({
        from: r.interviewFeedback.interviewerId,
        to: r.employees.employeeId,
      }),
    },

    interviewRounds: {
      tenant: r.one.tenants({
        from: r.interviewRounds.tenantId,
        to: r.tenants.tenantId,
      }),
      requisition: r.one.jobRequisitions({
        from: r.interviewRounds.requisitionId,
        to: r.jobRequisitions.requisitionId,
        optional: true,
      }),
      interviewSchedules: r.many.interviewSchedules({
        from: r.interviewRounds.roundId,
        to: r.interviewSchedules.roundId,
      }),
    },

    interviewSchedules: {
      tenant: r.one.tenants({
        from: r.interviewSchedules.tenantId,
        to: r.tenants.tenantId,
      }),
      application: r.one.applications({
        from: r.interviewSchedules.applicationId,
        to: r.applications.applicationId,
      }),
      interviewer: r.one.employees({
        from: r.interviewSchedules.interviewerId,
        to: r.employees.employeeId,
        optional: true,
      }),
      round: r.one.interviewRounds({
        from: r.interviewSchedules.roundId,
        to: r.interviewRounds.roundId,
      }),
      interviewFeedback: r.many.interviewFeedback({
        from: r.interviewSchedules.interviewId,
        to: r.interviewFeedback.interviewId,
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

    jobRequisitions: {
      tenant: r.one.tenants({
        from: r.jobRequisitions.tenantId,
        to: r.tenants.tenantId,
      }),
      approver: r.one.employees({
        from: r.jobRequisitions.approvedBy,
        to: r.employees.employeeId,
        optional: true,
      }),
      currency: r.one.currencies({
        from: r.jobRequisitions.currencyId,
        to: r.currencies.currencyId,
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
        alias: "job_requisitions_hiring_manager",
      }),
      position: r.one.positions({
        from: r.jobRequisitions.positionId,
        to: r.positions.positionId,
        optional: true,
      }),
      applications: r.many.applications({
        from: r.jobRequisitions.requisitionId,
        to: r.applications.requisitionId,
      }),
      interviewRounds: r.many.interviewRounds({
        from: r.jobRequisitions.requisitionId,
        to: r.interviewRounds.requisitionId,
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
      exitInterviews: r.many.exitInterviews({
        from: r.offboardingChecklists.offboardingChecklistId,
        to: r.exitInterviews.linkedOffboardingChecklistId,
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
      approver: r.one.employees({
        from: r.offerLetters.approvedBy,
        to: r.employees.employeeId,
        optional: true,
      }),
      currency: r.one.currencies({
        from: r.offerLetters.currencyId,
        to: r.currencies.currencyId,
      }),
      position: r.one.positions({
        from: r.offerLetters.positionId,
        to: r.positions.positionId,
        optional: true,
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
        alias: "probation_evaluations_evaluator",
      }),
    },

    staffingPlanDetails: {
      department: r.one.departments({
        from: r.staffingPlanDetails.departmentId,
        to: r.departments.departmentId,
        optional: true,
      }),
      plan: r.one.staffingPlans({
        from: r.staffingPlanDetails.planId,
        to: r.staffingPlans.planId,
      }),
      position: r.one.positions({
        from: r.staffingPlanDetails.positionId,
        to: r.positions.positionId,
        optional: true,
      }),
    },

    staffingPlans: {
      tenant: r.one.tenants({
        from: r.staffingPlans.tenantId,
        to: r.tenants.tenantId,
      }),
      staffingPlanDetails: r.many.staffingPlanDetails({
        from: r.staffingPlans.planId,
        to: r.staffingPlanDetails.planId,
      }),
    },
  })
);
