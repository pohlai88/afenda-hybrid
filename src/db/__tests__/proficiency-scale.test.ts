import { describe, expect, it } from "vitest";
import {
  getProficiencyValue,
  isProficiencyCode,
  meetsRequiredLevel,
  proficiencyScale,
} from "../utils/proficiencyScale";
import { proficiencyCodes } from "../schema/talent/_shared/proficiency";

describe("proficiency scale", () => {
  it("keeps expected ordinal mapping", () => {
    expect(proficiencyScale).toEqual({
      BEGINNER: 1,
      INTERMEDIATE: 2,
      ADVANCED: 3,
      EXPERT: 4,
      MASTER: 5,
    });
  });

  it("accepts only known proficiency codes", () => {
    expect(Object.keys(proficiencyScale)).toEqual([...proficiencyCodes]);
    expect(isProficiencyCode("BEGINNER")).toBe(true);
    expect(isProficiencyCode("MASTER")).toBe(true);
    expect(isProficiencyCode("NOVICE")).toBe(false);
    expect(isProficiencyCode("advanced")).toBe(false);
  });

  it("returns consistent numeric values", () => {
    expect(getProficiencyValue("BEGINNER")).toBe(1);
    expect(getProficiencyValue("ADVANCED")).toBe(3);
    expect(getProficiencyValue("MASTER")).toBe(5);
  });

  it("evaluates required level thresholds correctly", () => {
    expect(meetsRequiredLevel("ADVANCED", 3)).toBe(true);
    expect(meetsRequiredLevel("EXPERT", 3)).toBe(true);
    expect(meetsRequiredLevel("INTERMEDIATE", 3)).toBe(false);
  });
});
