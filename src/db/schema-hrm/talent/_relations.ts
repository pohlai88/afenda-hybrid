import { defineRelations } from "drizzle-orm";
import { tenants } from "../../schema-platform/core/tenants";
import { currencies } from "../../schema-platform/core/currencies";
import { employees } from "../hr/fundamentals/employees";
import { positions } from "../hr/fundamentals/positions";
import { jobGrades } from "../hr/employment/jobGrades";
import { jobRoles } from "../hr/employment/jobRoles";
import { skills } from "./fundamentals/skills";
import { certifications } from "./fundamentals/certifications";
import { competencyFrameworks } from "./fundamentals/competencyFrameworks";
import { competencySkills } from "./fundamentals/competencySkills";
import { talentPools } from "./fundamentals/talentPools";
import { employeeSkills } from "./operations/employeeSkills";
import { employeeCertifications } from "./operations/employeeCertifications";
import { performanceReviews } from "./operations/performanceReviews";
import { performanceGoals } from "./operations/performanceGoals";
import { performanceReviewGoals } from "./operations/performanceReviewGoals";
import { goalTracking } from "./operations/goalTracking";
import { talentPoolMemberships } from "./operations/talentPoolMemberships";
import { promotionRecords } from "./operations/promotionRecords";
import { successionPlans } from "./operations/successionPlans";
import { disciplinaryActions } from "./operations/disciplinaryActions";
import { grievanceRecords } from "./operations/grievanceRecords";
import { caseLinks } from "./operations/caseLinks";

export const talentRelations = defineRelations(
  {
    tenants,
    currencies,
    employees,
    positions,
    jobGrades,
    jobRoles,
    skills,
    certifications,
    competencyFrameworks,
    competencySkills,
    talentPools,
    employeeSkills,
    employeeCertifications,
    performanceReviews,
    performanceGoals,
    performanceReviewGoals,
    goalTracking,
    talentPoolMemberships,
    promotionRecords,
    successionPlans,
    disciplinaryActions,
    grievanceRecords,
    caseLinks,
  },
  (r) => ({
    skills: {
      tenant: r.one.tenants({
        from: r.skills.tenantId,
        to: r.tenants.tenantId,
      }),
      parent: r.one.skills({
        from: r.skills.parentSkillId,
        to: r.skills.skillId,
        optional: true,
        alias: "skill_parent",
      }),
      childSkills: r.many.skills({
        from: r.skills.skillId,
        to: r.skills.parentSkillId,
        alias: "skill_children",
      }),
      competencyLinks: r.many.competencySkills({
        from: r.skills.skillId,
        to: r.competencySkills.skillId,
      }),
      employeeSkills: r.many.employeeSkills({
        from: r.skills.skillId,
        to: r.employeeSkills.skillId,
      }),
    },
    certifications: {
      tenant: r.one.tenants({
        from: r.certifications.tenantId,
        to: r.tenants.tenantId,
      }),
      employeeCertifications: r.many.employeeCertifications({
        from: r.certifications.certificationId,
        to: r.employeeCertifications.certificationId,
      }),
    },
    competencyFrameworks: {
      tenant: r.one.tenants({
        from: r.competencyFrameworks.tenantId,
        to: r.tenants.tenantId,
      }),
      position: r.one.positions({
        from: r.competencyFrameworks.positionId,
        to: r.positions.positionId,
        optional: true,
      }),
      jobRole: r.one.jobRoles({
        from: r.competencyFrameworks.jobRoleId,
        to: r.jobRoles.jobRoleId,
        optional: true,
      }),
      competencySkills: r.many.competencySkills({
        from: r.competencyFrameworks.frameworkId,
        to: r.competencySkills.frameworkId,
      }),
    },
    competencySkills: {
      tenant: r.one.tenants({
        from: r.competencySkills.tenantId,
        to: r.tenants.tenantId,
      }),
      framework: r.one.competencyFrameworks({
        from: r.competencySkills.frameworkId,
        to: r.competencyFrameworks.frameworkId,
      }),
      skill: r.one.skills({
        from: r.competencySkills.skillId,
        to: r.skills.skillId,
      }),
    },
    talentPools: {
      tenant: r.one.tenants({
        from: r.talentPools.tenantId,
        to: r.tenants.tenantId,
      }),
      memberships: r.many.talentPoolMemberships({
        from: r.talentPools.talentPoolId,
        to: r.talentPoolMemberships.talentPoolId,
      }),
    },
    employees: {
      employeeSkills: r.many.employeeSkills({
        from: r.employees.employeeId,
        to: r.employeeSkills.employeeId,
      }),
      employeeCertifications: r.many.employeeCertifications({
        from: r.employees.employeeId,
        to: r.employeeCertifications.employeeId,
      }),
      performanceReviews: r.many.performanceReviews({
        from: r.employees.employeeId,
        to: r.performanceReviews.employeeId,
      }),
      performanceReviewsAsReviewer: r.many.performanceReviews({
        from: r.employees.employeeId,
        to: r.performanceReviews.reviewerId,
        alias: "performance_reviews_as_reviewer",
      }),
      performanceGoals: r.many.performanceGoals({
        from: r.employees.employeeId,
        to: r.performanceGoals.employeeId,
      }),
      talentPoolMemberships: r.many.talentPoolMemberships({
        from: r.employees.employeeId,
        to: r.talentPoolMemberships.employeeId,
      }),
      promotionRecords: r.many.promotionRecords({
        from: r.employees.employeeId,
        to: r.promotionRecords.employeeId,
      }),
      successionPlansAsSuccessor: r.many.successionPlans({
        from: r.employees.employeeId,
        to: r.successionPlans.successorId,
        alias: "succession_as_successor",
      }),
      successionPlansAsIncumbent: r.many.successionPlans({
        from: r.employees.employeeId,
        to: r.successionPlans.incumbentId,
        alias: "succession_as_incumbent",
      }),
      grievanceRecords: r.many.grievanceRecords({
        from: r.employees.employeeId,
        to: r.grievanceRecords.employeeId,
      }),
      grievanceRecordsAgainst: r.many.grievanceRecords({
        from: r.employees.employeeId,
        to: r.grievanceRecords.againstEmployeeId,
        alias: "grievance_against_employee",
      }),
      grievanceRecordsAssigned: r.many.grievanceRecords({
        from: r.employees.employeeId,
        to: r.grievanceRecords.assignedTo,
        alias: "grievance_assigned_to",
      }),
      grievanceRecordsResolved: r.many.grievanceRecords({
        from: r.employees.employeeId,
        to: r.grievanceRecords.resolvedBy,
        alias: "grievance_resolved_by",
      }),
      disciplinaryActions: r.many.disciplinaryActions({
        from: r.employees.employeeId,
        to: r.disciplinaryActions.employeeId,
      }),
      disciplinaryActionsIssued: r.many.disciplinaryActions({
        from: r.employees.employeeId,
        to: r.disciplinaryActions.issuedBy,
        alias: "disciplinary_issued_by",
      }),
      disciplinaryActionsWitnessed: r.many.disciplinaryActions({
        from: r.employees.employeeId,
        to: r.disciplinaryActions.witnessId,
        alias: "disciplinary_witness",
      }),
    },
    employeeSkills: {
      tenant: r.one.tenants({
        from: r.employeeSkills.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.employeeSkills.employeeId,
        to: r.employees.employeeId,
      }),
      skill: r.one.skills({
        from: r.employeeSkills.skillId,
        to: r.skills.skillId,
      }),
      assessor: r.one.employees({
        from: r.employeeSkills.assessedBy,
        to: r.employees.employeeId,
        optional: true,
        alias: "skill_assessor",
      }),
    },
    employeeCertifications: {
      tenant: r.one.tenants({
        from: r.employeeCertifications.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.employeeCertifications.employeeId,
        to: r.employees.employeeId,
      }),
      certification: r.one.certifications({
        from: r.employeeCertifications.certificationId,
        to: r.certifications.certificationId,
      }),
      verifier: r.one.employees({
        from: r.employeeCertifications.verifiedBy,
        to: r.employees.employeeId,
        optional: true,
        alias: "certification_verifier",
      }),
    },
    performanceReviews: {
      tenant: r.one.tenants({
        from: r.performanceReviews.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.performanceReviews.employeeId,
        to: r.employees.employeeId,
      }),
      reviewer: r.one.employees({
        from: r.performanceReviews.reviewerId,
        to: r.employees.employeeId,
        alias: "performance_reviewer",
      }),
      reviewGoals: r.many.performanceReviewGoals({
        from: r.performanceReviews.reviewId,
        to: r.performanceReviewGoals.reviewId,
      }),
    },
    performanceGoals: {
      tenant: r.one.tenants({
        from: r.performanceGoals.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.performanceGoals.employeeId,
        to: r.employees.employeeId,
      }),
      goalTracking: r.many.goalTracking({
        from: r.performanceGoals.goalId,
        to: r.goalTracking.goalId,
      }),
      reviewGoals: r.many.performanceReviewGoals({
        from: r.performanceGoals.goalId,
        to: r.performanceReviewGoals.goalId,
      }),
    },
    performanceReviewGoals: {
      tenant: r.one.tenants({
        from: r.performanceReviewGoals.tenantId,
        to: r.tenants.tenantId,
      }),
      review: r.one.performanceReviews({
        from: r.performanceReviewGoals.reviewId,
        to: r.performanceReviews.reviewId,
      }),
      goal: r.one.performanceGoals({
        from: r.performanceReviewGoals.goalId,
        to: r.performanceGoals.goalId,
      }),
    },
    goalTracking: {
      goal: r.one.performanceGoals({
        from: r.goalTracking.goalId,
        to: r.performanceGoals.goalId,
      }),
    },
    talentPoolMemberships: {
      tenant: r.one.tenants({
        from: r.talentPoolMemberships.tenantId,
        to: r.tenants.tenantId,
      }),
      pool: r.one.talentPools({
        from: r.talentPoolMemberships.talentPoolId,
        to: r.talentPools.talentPoolId,
      }),
      employee: r.one.employees({
        from: r.talentPoolMemberships.employeeId,
        to: r.employees.employeeId,
      }),
      nominator: r.one.employees({
        from: r.talentPoolMemberships.nominatedBy,
        to: r.employees.employeeId,
        optional: true,
        alias: "pool_nominator",
      }),
    },
    promotionRecords: {
      tenant: r.one.tenants({
        from: r.promotionRecords.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.promotionRecords.employeeId,
        to: r.employees.employeeId,
      }),
      fromPosition: r.one.positions({
        from: r.promotionRecords.fromPositionId,
        to: r.positions.positionId,
        optional: true,
        alias: "promotion_from_position",
      }),
      toPosition: r.one.positions({
        from: r.promotionRecords.toPositionId,
        to: r.positions.positionId,
        optional: true,
        alias: "promotion_to_position",
      }),
      fromGrade: r.one.jobGrades({
        from: r.promotionRecords.fromGradeId,
        to: r.jobGrades.jobGradeId,
        optional: true,
      }),
      toGrade: r.one.jobGrades({
        from: r.promotionRecords.toGradeId,
        to: r.jobGrades.jobGradeId,
        optional: true,
        alias: "promotion_to_grade",
      }),
      currency: r.one.currencies({
        from: r.promotionRecords.currencyId,
        to: r.currencies.currencyId,
        optional: true,
      }),
      approver: r.one.employees({
        from: r.promotionRecords.approvedBy,
        to: r.employees.employeeId,
        optional: true,
        alias: "promotion_approver",
      }),
    },
    successionPlans: {
      tenant: r.one.tenants({
        from: r.successionPlans.tenantId,
        to: r.tenants.tenantId,
      }),
      position: r.one.positions({
        from: r.successionPlans.positionId,
        to: r.positions.positionId,
      }),
      incumbent: r.one.employees({
        from: r.successionPlans.incumbentId,
        to: r.employees.employeeId,
        optional: true,
      }),
      successor: r.one.employees({
        from: r.successionPlans.successorId,
        to: r.employees.employeeId,
        alias: "succession_successor",
      }),
    },
    grievanceRecords: {
      tenant: r.one.tenants({
        from: r.grievanceRecords.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.grievanceRecords.employeeId,
        to: r.employees.employeeId,
      }),
      againstEmployee: r.one.employees({
        from: r.grievanceRecords.againstEmployeeId,
        to: r.employees.employeeId,
        optional: true,
        alias: "grievance_against",
      }),
      assignee: r.one.employees({
        from: r.grievanceRecords.assignedTo,
        to: r.employees.employeeId,
        optional: true,
        alias: "grievance_assignee",
      }),
      resolver: r.one.employees({
        from: r.grievanceRecords.resolvedBy,
        to: r.employees.employeeId,
        optional: true,
      }),
      outgoingCaseLinks: r.many.caseLinks({
        from: r.grievanceRecords.grievanceRecordId,
        to: r.caseLinks.sourceId,
      }),
      incomingCaseLinks: r.many.caseLinks({
        from: r.grievanceRecords.grievanceRecordId,
        to: r.caseLinks.targetId,
      }),
    },
    disciplinaryActions: {
      tenant: r.one.tenants({
        from: r.disciplinaryActions.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.disciplinaryActions.employeeId,
        to: r.employees.employeeId,
      }),
      issuer: r.one.employees({
        from: r.disciplinaryActions.issuedBy,
        to: r.employees.employeeId,
        alias: "disciplinary_issuer",
      }),
      witness: r.one.employees({
        from: r.disciplinaryActions.witnessId,
        to: r.employees.employeeId,
        optional: true,
      }),
      outgoingCaseLinks: r.many.caseLinks({
        from: r.disciplinaryActions.disciplinaryActionId,
        to: r.caseLinks.sourceId,
      }),
      incomingCaseLinks: r.many.caseLinks({
        from: r.disciplinaryActions.disciplinaryActionId,
        to: r.caseLinks.targetId,
      }),
    },
    caseLinks: {
      tenant: r.one.tenants({
        from: r.caseLinks.tenantId,
        to: r.tenants.tenantId,
      }),
    },
  })
);
