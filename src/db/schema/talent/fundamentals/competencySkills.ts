import { integer, smallint, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { talentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { competencyFrameworks } from "./competencyFrameworks";
import { skills } from "./skills";

/**
 * Competency Skills - Framework to skill junction with required proficiency level.
 */
export const competencySkills = talentSchema.table(
  "competency_skills",
  {
    competencySkillId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    frameworkId: integer().notNull(),
    skillId: integer().notNull(),
    requiredLevel: smallint().notNull(),
    weight: smallint().default(1),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_competency_skills_framework").on(t.tenantId, t.frameworkId),
    index("idx_competency_skills_skill").on(t.tenantId, t.skillId),
    uniqueIndex("uq_competency_skills_framework_skill")
      .on(t.tenantId, t.frameworkId, t.skillId)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_competency_skills_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.frameworkId],
      foreignColumns: [competencyFrameworks.frameworkId],
      name: "fk_competency_skills_framework",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.skillId],
      foreignColumns: [skills.skillId],
      name: "fk_competency_skills_skill",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_competency_skills_level",
      sql`${t.requiredLevel} >= 1 AND ${t.requiredLevel} <= 5`
    ),
    check(
      "chk_competency_skills_weight",
      sql`${t.weight} IS NULL OR ${t.weight} >= 1`
    ),
  ]
);

export const CompetencySkillIdSchema = z.number().int().brand<"CompetencySkillId">();
export type CompetencySkillId = z.infer<typeof CompetencySkillIdSchema>;

export const competencySkillSelectSchema = createSelectSchema(competencySkills);

export const competencySkillInsertSchema = createInsertSchema(competencySkills, {
  requiredLevel: z.number().int().min(1).max(5),
  weight: z.number().int().min(1).max(100).optional(),
});

export const competencySkillUpdateSchema = createUpdateSchema(competencySkills);

export type CompetencySkill = typeof competencySkills.$inferSelect;
export type NewCompetencySkill = typeof competencySkills.$inferInsert;
