import { defineRelations } from "drizzle-orm";
import { tenants } from "../core/tenants";
import { currencies } from "../core/currencies";
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
import { performanceReviews } from "./operations/performanceReviews";
import { performanceGoals } from "./operations/performanceGoals";
import { goalTracking } from "./operations/goalTracking";
import { promotionRecords } from "./operations/promotionRecords";
import { successionPlans } from "./operations/successionPlans";
import { disciplinaryActions } from "./operations/disciplinaryActions";
import { grievanceRecords } from "./operations/grievanceRecords";

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
    performanceReviews,
    performanceGoals,
    goalTracking,
    promotionRecords,
    successionPlans,
    disciplinaryActions,
    grievanceRecords,
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
    },
    goalTracking: {
      goal: r.one.performanceGoals({
        from: r.goalTracking.goalId,
        to: r.performanceGoals.goalId,
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
    },
  })
);
