import type { Database } from "@db/db";
import { getFrameworkReadiness } from "./getFrameworkReadiness";
import type { ProficiencyCode } from "./proficiencyScale";

export type QualifiedFrameworkHolder = {
  employeeId: number;
  employeeCode: string;
  employeeStatus: string;
  proficiencyLevel: ProficiencyCode;
  proficiencyScore: number;
};

export type QualifiedFrameworkRequirement = {
  competencySkillId: number;
  skillId: number;
  skillCode: string;
  skillName: string;
  requiredLevel: number;
  weight: number | null;
  qualifiedHolders: QualifiedFrameworkHolder[];
};

export type QualifiedFrameworkHolders = {
  frameworkId: number;
  frameworkCode: string;
  frameworkName: string;
  status: string;
  requirements: QualifiedFrameworkRequirement[];
};

/**
 * Returns framework requirements with only holders who meet/exceed required level.
 */
export async function getQualifiedFrameworkHolders(
  db: Database,
  tenantId: number,
  frameworkId: number
): Promise<QualifiedFrameworkHolders | null> {
  const readiness = await getFrameworkReadiness(db, tenantId, frameworkId);
  if (!readiness) {
    return null;
  }

  return {
    frameworkId: readiness.frameworkId,
    frameworkCode: readiness.frameworkCode,
    frameworkName: readiness.frameworkName,
    status: readiness.status,
    requirements: readiness.requirements.map((requirement) => ({
      competencySkillId: requirement.competencySkillId,
      skillId: requirement.skillId,
      skillCode: requirement.skillCode,
      skillName: requirement.skillName,
      requiredLevel: requirement.requiredLevel,
      weight: requirement.weight,
      qualifiedHolders: requirement.qualifiedHolders,
    })),
  };
}
