import { z } from "zod/v4";
import { talentSchema } from "../_schema";

export const proficiencyCodes = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "EXPERT",
  "MASTER",
] as const;

/**
 * Canonical proficiency enum for talent skill levels.
 * Reuses existing DB enum name for backwards compatibility.
 */
export const skillProficiencyEnum = talentSchema.enum("proficiency_level", [...proficiencyCodes]);

export const skillProficiencyZodEnum = z.enum(proficiencyCodes);

export type SkillProficiencyCode = (typeof proficiencyCodes)[number];
