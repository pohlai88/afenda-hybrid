import { and, eq, isNull } from "drizzle-orm";
import type { Database } from "@db/db";
import { competencyFrameworks } from "@db/schema-hrm/talent/fundamentals/competencyFrameworks";
import { competencySkills } from "@db/schema-hrm/talent/fundamentals/competencySkills";
import { skills } from "@db/schema-hrm/talent/fundamentals/skills";
import { employeeSkills } from "@db/schema-hrm/talent/operations/employeeSkills";
import { employees } from "@db/schema-hrm/hr/fundamentals/employees";
import {
  getProficiencyValue,
  isProficiencyCode,
  meetsRequiredLevel,
  type ProficiencyCode,
} from "./proficiencyScale";

export type FrameworkReadinessHolder = {
  employeeId: number;
  employeeCode: string;
  employeeStatus: string;
  proficiencyLevel: ProficiencyCode;
  proficiencyScore: number;
};

export type FrameworkReadinessRequirement = {
  competencySkillId: number;
  skillId: number;
  skillCode: string;
  skillName: string;
  requiredLevel: number;
  weight: number | null;
  qualifiedHolders: FrameworkReadinessHolder[];
  underQualifiedHolders: FrameworkReadinessHolder[];
};

export type FrameworkReadiness = {
  frameworkId: number;
  frameworkCode: string;
  frameworkName: string;
  status: string;
  requirements: FrameworkReadinessRequirement[];
};

/**
 * Returns framework requirements split by holder readiness against required level.
 */
export async function getFrameworkReadiness(
  db: Database,
  tenantId: number,
  frameworkId: number
): Promise<FrameworkReadiness | null> {
  const rows = await db
    .select({
      frameworkId: competencyFrameworks.frameworkId,
      frameworkCode: competencyFrameworks.frameworkCode,
      frameworkName: competencyFrameworks.name,
      frameworkStatus: competencyFrameworks.status,
      competencySkillId: competencySkills.competencySkillId,
      requiredLevel: competencySkills.requiredLevel,
      weight: competencySkills.weight,
      skillId: skills.skillId,
      skillCode: skills.skillCode,
      skillName: skills.name,
      employeeId: employeeSkills.employeeId,
      proficiencyLevel: employeeSkills.proficiency,
      employeeCode: employees.employeeCode,
      employeeStatus: employees.status,
    })
    .from(competencyFrameworks)
    .innerJoin(
      competencySkills,
      and(
        eq(competencySkills.tenantId, competencyFrameworks.tenantId),
        eq(competencySkills.frameworkId, competencyFrameworks.frameworkId),
        isNull(competencySkills.deletedAt)
      )
    )
    .innerJoin(
      skills,
      and(
        eq(skills.tenantId, competencySkills.tenantId),
        eq(skills.skillId, competencySkills.skillId),
        isNull(skills.deletedAt)
      )
    )
    .leftJoin(
      employeeSkills,
      and(
        eq(employeeSkills.tenantId, competencySkills.tenantId),
        eq(employeeSkills.skillId, competencySkills.skillId),
        isNull(employeeSkills.deletedAt)
      )
    )
    .leftJoin(
      employees,
      and(
        eq(employees.tenantId, employeeSkills.tenantId),
        eq(employees.employeeId, employeeSkills.employeeId),
        isNull(employees.deletedAt)
      )
    )
    .where(
      and(
        eq(competencyFrameworks.tenantId, tenantId),
        eq(competencyFrameworks.frameworkId, frameworkId),
        isNull(competencyFrameworks.deletedAt)
      )
    );

  if (rows.length === 0) {
    return null;
  }

  const first = rows[0];
  const requirementMap = new Map<number, FrameworkReadinessRequirement>();

  for (const row of rows) {
    const existing = requirementMap.get(row.competencySkillId);
    if (!existing) {
      requirementMap.set(row.competencySkillId, {
        competencySkillId: row.competencySkillId,
        skillId: row.skillId,
        skillCode: row.skillCode,
        skillName: row.skillName,
        requiredLevel: row.requiredLevel,
        weight: row.weight,
        qualifiedHolders: [],
        underQualifiedHolders: [],
      });
    }

    if (
      row.employeeId === null ||
      row.employeeCode === null ||
      row.employeeStatus === null ||
      row.proficiencyLevel === null ||
      !isProficiencyCode(row.proficiencyLevel)
    ) {
      continue;
    }

    const holder: FrameworkReadinessHolder = {
      employeeId: row.employeeId,
      employeeCode: row.employeeCode,
      employeeStatus: row.employeeStatus,
      proficiencyLevel: row.proficiencyLevel,
      proficiencyScore: getProficiencyValue(row.proficiencyLevel),
    };

    const requirement = requirementMap.get(row.competencySkillId)!;
    if (meetsRequiredLevel(holder.proficiencyLevel, requirement.requiredLevel)) {
      requirement.qualifiedHolders.push(holder);
    } else {
      requirement.underQualifiedHolders.push(holder);
    }
  }

  return {
    frameworkId: first.frameworkId,
    frameworkCode: first.frameworkCode,
    frameworkName: first.frameworkName,
    status: first.frameworkStatus,
    requirements: [...requirementMap.values()],
  };
}
