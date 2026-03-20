import { integer, text, date, smallint, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { talentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { skills } from "../fundamentals/skills";
import { proficiencyCodes, skillProficiencyEnum, skillProficiencyZodEnum } from "../_shared/proficiency";

/**
 * Employee Skills - Skill proficiency levels per employee.
 * Circular FK note: employeeId and assessedBy FKs added via custom SQL.
 */
export const proficiencyLevels = proficiencyCodes;

export const proficiencyZodEnum = skillProficiencyZodEnum;

export const employeeSkills = talentSchema.table(
  "employee_skills",
  {
    employeeSkillId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    skillId: integer().notNull(),
    proficiency: skillProficiencyEnum().notNull().default("BEGINNER"),
    yearsOfExperience: smallint(),
    lastAssessedDate: date(),
    assessedBy: integer(),
    notes: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_employee_skills_tenant").on(t.tenantId),
    index("idx_employee_skills_employee").on(t.tenantId, t.employeeId),
    /** Supports filters like “skills for this employee at proficiency X” (tenant-scoped). */
    index("idx_employee_skills_employee_proficiency").on(t.tenantId, t.employeeId, t.proficiency),
    index("idx_employee_skills_skill").on(t.tenantId, t.skillId),
    index("idx_employee_skills_proficiency").on(t.tenantId, t.proficiency),
    uniqueIndex("uq_employee_skills_employee_skill")
      .on(t.tenantId, t.employeeId, t.skillId)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_employee_skills_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.skillId],
      foreignColumns: [skills.skillId],
      name: "fk_employee_skills_skill",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_employee_skills_experience",
      sql`${t.yearsOfExperience} IS NULL OR (${t.yearsOfExperience} >= 0 AND ${t.yearsOfExperience} <= 50)`
    ),
  ]
);

export const EmployeeSkillIdSchema = z.number().int().brand<"EmployeeSkillId">();
export type EmployeeSkillId = z.infer<typeof EmployeeSkillIdSchema>;

export const employeeSkillSelectSchema = createSelectSchema(employeeSkills);

export const employeeSkillInsertSchema = createInsertSchema(employeeSkills, {
  proficiency: skillProficiencyZodEnum.optional(),
  yearsOfExperience: z.number().int().min(0).max(50).optional(),
  notes: z.string().max(1000).optional(),
});

export const employeeSkillUpdateSchema = createUpdateSchema(employeeSkills);

export type EmployeeSkill = typeof employeeSkills.$inferSelect;
export type NewEmployeeSkill = typeof employeeSkills.$inferInsert;
