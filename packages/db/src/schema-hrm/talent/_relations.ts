import { defineRelations } from "drizzle-orm";
import { certifications } from "./fundamentals/certifications";
import { competencyFrameworks } from "./fundamentals/competencyFrameworks";
import { competencySkills } from "./fundamentals/competencySkills";
import { skills } from "./fundamentals/skills";
import { talentPools } from "./fundamentals/talentPools";
import { appraisalCycles } from "./operations/appraisalCycles";
import { appraisalGoals } from "./operations/appraisalGoals";
import { appraisalKras } from "./operations/appraisalKras";
import { appraisalTemplateGoals } from "./operations/appraisalTemplateGoals";
import { appraisalTemplates } from "./operations/appraisalTemplates";
import { appraisals } from "./operations/appraisals";
import { caseLinks } from "./operations/caseLinks";
import { disciplinaryActions } from "./operations/disciplinaryActions";
import { employeeCertifications } from "./operations/employeeCertifications";
import { employeeSkills } from "./operations/employeeSkills";
import { goalTracking } from "./operations/goalTracking";
import { grievanceRecords } from "./operations/grievanceRecords";
import { performanceGoals } from "./operations/performanceGoals";
import { performanceReviewGoals } from "./operations/performanceReviewGoals";
import { performanceReviews } from "./operations/performanceReviews";
import { promotionRecords } from "./operations/promotionRecords";
import { successionPlans } from "./operations/successionPlans";
import { talentPoolMemberships } from "./operations/talentPoolMemberships";
import { currencies } from "../../schema-platform/core/currencies";
import { tenants } from "../../schema-platform/core/tenants";
import { jobGrades } from "../hr/employment/jobGrades";
import { jobRoles } from "../hr/employment/jobRoles";
import { employees } from "../hr/fundamentals/employees";
import { positions } from "../hr/fundamentals/positions";

export const talentRelations = defineRelations(
  {
    appraisalCycles,
    appraisalGoals,
    appraisalKras,
    appraisalTemplateGoals,
    appraisalTemplates,
    appraisals,
    caseLinks,
    certifications,
    competencyFrameworks,
    competencySkills,
    disciplinaryActions,
    employeeCertifications,
    employeeSkills,
    goalTracking,
    grievanceRecords,
    performanceGoals,
    performanceReviewGoals,
    performanceReviews,
    promotionRecords,
    skills,
    successionPlans,
    talentPoolMemberships,
    talentPools,
    currencies,
    employees,
    jobGrades,
    jobRoles,
    positions,
    tenants,
  },
  (r) => ({
    appraisalCycles: {
      tenant: r.one.tenants({
        from: r.appraisalCycles.tenantId,
        to: r.tenants.tenantId,
      }),
      appraisals: r.many.appraisals({
        from: r.appraisalCycles.cycleId,
        to: r.appraisals.cycleId,
      }),
    },

    appraisalGoals: {
      appraisal: r.one.appraisals({
        from: r.appraisalGoals.appraisalId,
        to: r.appraisals.appraisalId,
      }),
      kra: r.one.appraisalKras({
        from: r.appraisalGoals.kraId,
        to: r.appraisalKras.kraId,
        optional: true,
      }),
    },

    appraisalKras: {
      tenant: r.one.tenants({
        from: r.appraisalKras.tenantId,
        to: r.tenants.tenantId,
      }),
      jobRole: r.one.jobRoles({
        from: r.appraisalKras.jobRoleId,
        to: r.jobRoles.jobRoleId,
        optional: true,
      }),
      position: r.one.positions({
        from: r.appraisalKras.positionId,
        to: r.positions.positionId,
        optional: true,
      }),
      appraisalGoals: r.many.appraisalGoals({
        from: r.appraisalKras.kraId,
        to: r.appraisalGoals.kraId,
      }),
    },

    appraisalTemplateGoals: {
      template: r.one.appraisalTemplates({
        from: r.appraisalTemplateGoals.templateId,
        to: r.appraisalTemplates.templateId,
      }),
    },

    appraisalTemplates: {
      tenant: r.one.tenants({
        from: r.appraisalTemplates.tenantId,
        to: r.tenants.tenantId,
      }),
      appraisalTemplateGoals: r.many.appraisalTemplateGoals({
        from: r.appraisalTemplates.templateId,
        to: r.appraisalTemplateGoals.templateId,
      }),
      appraisals: r.many.appraisals({
        from: r.appraisalTemplates.templateId,
        to: r.appraisals.templateId,
      }),
    },

    appraisals: {
      tenant: r.one.tenants({
        from: r.appraisals.tenantId,
        to: r.tenants.tenantId,
      }),
      cycle: r.one.appraisalCycles({
        from: r.appraisals.cycleId,
        to: r.appraisalCycles.cycleId,
      }),
      employee: r.one.employees({
        from: r.appraisals.employeeId,
        to: r.employees.employeeId,
        alias: "appraisals_employee",
      }),
      reviewer: r.one.employees({
        from: r.appraisals.reviewerId,
        to: r.employees.employeeId,
        optional: true,
      }),
      template: r.one.appraisalTemplates({
        from: r.appraisals.templateId,
        to: r.appraisalTemplates.templateId,
      }),
      appraisalGoals: r.many.appraisalGoals({
        from: r.appraisals.appraisalId,
        to: r.appraisalGoals.appraisalId,
      }),
    },

    caseLinks: {
      tenant: r.one.tenants({
        from: r.caseLinks.tenantId,
        to: r.tenants.tenantId,
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
      jobRole: r.one.jobRoles({
        from: r.competencyFrameworks.jobRoleId,
        to: r.jobRoles.jobRoleId,
        optional: true,
      }),
      position: r.one.positions({
        from: r.competencyFrameworks.positionId,
        to: r.positions.positionId,
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

    disciplinaryActions: {
      tenant: r.one.tenants({
        from: r.disciplinaryActions.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.disciplinaryActions.employeeId,
        to: r.employees.employeeId,
        alias: "disciplinary_actions_employee",
      }),
      issuer: r.one.employees({
        from: r.disciplinaryActions.issuedBy,
        to: r.employees.employeeId,
      }),
      witness: r.one.employees({
        from: r.disciplinaryActions.witnessId,
        to: r.employees.employeeId,
        optional: true,
        alias: "disciplinary_actions_witness",
      }),
    },

    employeeCertifications: {
      tenant: r.one.tenants({
        from: r.employeeCertifications.tenantId,
        to: r.tenants.tenantId,
      }),
      certification: r.one.certifications({
        from: r.employeeCertifications.certificationId,
        to: r.certifications.certificationId,
      }),
      employee: r.one.employees({
        from: r.employeeCertifications.employeeId,
        to: r.employees.employeeId,
        alias: "employee_certifications_employee",
      }),
      verifier: r.one.employees({
        from: r.employeeCertifications.verifiedBy,
        to: r.employees.employeeId,
        optional: true,
      }),
    },

    employeeSkills: {
      tenant: r.one.tenants({
        from: r.employeeSkills.tenantId,
        to: r.tenants.tenantId,
      }),
      assessor: r.one.employees({
        from: r.employeeSkills.assessedBy,
        to: r.employees.employeeId,
        optional: true,
        alias: "employee_skills_assessed",
      }),
      employee: r.one.employees({
        from: r.employeeSkills.employeeId,
        to: r.employees.employeeId,
      }),
      skill: r.one.skills({
        from: r.employeeSkills.skillId,
        to: r.skills.skillId,
      }),
    },

    goalTracking: {
      tenant: r.one.tenants({
        from: r.goalTracking.tenantId,
        to: r.tenants.tenantId,
      }),
      goal: r.one.performanceGoals({
        from: r.goalTracking.goalId,
        to: r.performanceGoals.goalId,
      }),
    },

    grievanceRecords: {
      tenant: r.one.tenants({
        from: r.grievanceRecords.tenantId,
        to: r.tenants.tenantId,
      }),
      againstEmployee: r.one.employees({
        from: r.grievanceRecords.againstEmployeeId,
        to: r.employees.employeeId,
        optional: true,
        alias: "grievance_records_against_employee",
      }),
      employee: r.one.employees({
        from: r.grievanceRecords.employeeId,
        to: r.employees.employeeId,
      }),
      resolver: r.one.employees({
        from: r.grievanceRecords.resolvedBy,
        to: r.employees.employeeId,
        optional: true,
        alias: "grievance_records_resolved",
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
      performanceReviewGoals: r.many.performanceReviewGoals({
        from: r.performanceGoals.goalId,
        to: r.performanceReviewGoals.goalId,
      }),
    },

    performanceReviewGoals: {
      tenant: r.one.tenants({
        from: r.performanceReviewGoals.tenantId,
        to: r.tenants.tenantId,
      }),
      goal: r.one.performanceGoals({
        from: r.performanceReviewGoals.goalId,
        to: r.performanceGoals.goalId,
      }),
      review: r.one.performanceReviews({
        from: r.performanceReviewGoals.reviewId,
        to: r.performanceReviews.reviewId,
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
        alias: "performance_reviews_employee",
      }),
      reviewer: r.one.employees({
        from: r.performanceReviews.reviewerId,
        to: r.employees.employeeId,
      }),
      performanceReviewGoals: r.many.performanceReviewGoals({
        from: r.performanceReviews.reviewId,
        to: r.performanceReviewGoals.reviewId,
      }),
    },

    promotionRecords: {
      tenant: r.one.tenants({
        from: r.promotionRecords.tenantId,
        to: r.tenants.tenantId,
      }),
      approver: r.one.employees({
        from: r.promotionRecords.approvedBy,
        to: r.employees.employeeId,
        optional: true,
      }),
      currency: r.one.currencies({
        from: r.promotionRecords.currencyId,
        to: r.currencies.currencyId,
        optional: true,
      }),
      employee: r.one.employees({
        from: r.promotionRecords.employeeId,
        to: r.employees.employeeId,
        alias: "promotion_records_employee",
      }),
      fromGrade: r.one.jobGrades({
        from: r.promotionRecords.fromGradeId,
        to: r.jobGrades.jobGradeId,
        optional: true,
        alias: "promotion_records_from_grade",
      }),
      fromPosition: r.one.positions({
        from: r.promotionRecords.fromPositionId,
        to: r.positions.positionId,
        optional: true,
        alias: "promotion_records_from_position",
      }),
      toGrade: r.one.jobGrades({
        from: r.promotionRecords.toGradeId,
        to: r.jobGrades.jobGradeId,
        optional: true,
      }),
      toPosition: r.one.positions({
        from: r.promotionRecords.toPositionId,
        to: r.positions.positionId,
        optional: true,
      }),
    },

    skills: {
      tenant: r.one.tenants({
        from: r.skills.tenantId,
        to: r.tenants.tenantId,
      }),
      parent: r.one.skills({
        from: r.skills.parentSkillId,
        to: r.skills.skillId,
        optional: true,
      }),
      competencySkills: r.many.competencySkills({
        from: r.skills.skillId,
        to: r.competencySkills.skillId,
      }),
      employeeSkills: r.many.employeeSkills({
        from: r.skills.skillId,
        to: r.employeeSkills.skillId,
      }),
      skills: r.many.skills({
        from: r.skills.skillId,
        to: r.skills.parentSkillId,
      }),
    },

    successionPlans: {
      tenant: r.one.tenants({
        from: r.successionPlans.tenantId,
        to: r.tenants.tenantId,
      }),
      incumbent: r.one.employees({
        from: r.successionPlans.incumbentId,
        to: r.employees.employeeId,
        optional: true,
      }),
      position: r.one.positions({
        from: r.successionPlans.positionId,
        to: r.positions.positionId,
      }),
      successor: r.one.employees({
        from: r.successionPlans.successorId,
        to: r.employees.employeeId,
        alias: "succession_plans_successor",
      }),
    },

    talentPoolMemberships: {
      tenant: r.one.tenants({
        from: r.talentPoolMemberships.tenantId,
        to: r.tenants.tenantId,
      }),
      employee: r.one.employees({
        from: r.talentPoolMemberships.employeeId,
        to: r.employees.employeeId,
      }),
      nominator: r.one.employees({
        from: r.talentPoolMemberships.nominatedBy,
        to: r.employees.employeeId,
        optional: true,
        alias: "talent_pool_memberships_nominator",
      }),
      talentPool: r.one.talentPools({
        from: r.talentPoolMemberships.talentPoolId,
        to: r.talentPools.talentPoolId,
      }),
    },

    talentPools: {
      tenant: r.one.tenants({
        from: r.talentPools.tenantId,
        to: r.tenants.tenantId,
      }),
      talentPoolMemberships: r.many.talentPoolMemberships({
        from: r.talentPools.talentPoolId,
        to: r.talentPoolMemberships.talentPoolId,
      }),
    },
  })
);
