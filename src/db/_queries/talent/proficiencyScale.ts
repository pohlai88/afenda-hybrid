import { proficiencyCodes, type SkillProficiencyCode } from "@db/schema-hrm/talent/_shared/proficiency";

export const proficiencyScale = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
  EXPERT: 4,
  MASTER: 5,
} as const satisfies Record<SkillProficiencyCode, number>;

export type ProficiencyCode = SkillProficiencyCode;
export type ProficiencyValue = (typeof proficiencyScale)[ProficiencyCode];

const proficiencyCodeSet = new Set<ProficiencyCode>(proficiencyCodes);

export function isProficiencyCode(value: string): value is ProficiencyCode {
  return proficiencyCodeSet.has(value as ProficiencyCode);
}

export function getProficiencyValue(code: ProficiencyCode): ProficiencyValue {
  return proficiencyScale[code];
}

export function meetsRequiredLevel(code: ProficiencyCode, requiredLevel: number): boolean {
  return getProficiencyValue(code) >= requiredLevel;
}
