/**
 * Root barrel for `_queries`: explicit re-exports only (no `export *`).
 * Add new domains as `./<domain>` entrypoints with their own named exports.
 */
export {
  createEmployeeCertificationWithSnapshot,
  type CreateEmployeeCertificationInput,
  getFrameworkReadiness,
  type FrameworkReadiness,
  type FrameworkReadinessRequirement,
  type FrameworkReadinessHolder,
  getFrameworkSkillsWithHolders,
  type FrameworkSkillsWithHolders,
  type FrameworkSkillRequirementWithHolders,
  type FrameworkSkillHolder,
  getQualifiedFrameworkHolders,
  type QualifiedFrameworkHolders,
  type QualifiedFrameworkRequirement,
  type QualifiedFrameworkHolder,
  getProficiencyValue,
  isProficiencyCode,
  meetsRequiredLevel,
  proficiencyScale,
  type ProficiencyCode,
  type ProficiencyValue,
} from "./talent";
