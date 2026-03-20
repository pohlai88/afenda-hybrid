import { integer, text, date, smallint, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { talentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { skills } from "../fundamentals/skills";

/**
 * Employee Skills - Skill proficiency levels per employee.
 * Circular FK note: employeeId and assessedBy FKs added via custom SQL.
 */
export const proficiencyLevels = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT", "MASTER"] as const;

export const proficiencyLevelEnum = talentSchema.enum("proficiency_level", [...proficiencyLevels]);

export const proficiencyLevelZodEnum = createSelectSchema(proficiencyLevelEnum);

export const employeeSkills = talentSchema.table(
  "employee_skills",
  {
    employeeSkillId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    employeeId: integer().notNull(),
    skillId: integer().notNull(),
    proficiencyLevel: proficiencyLevelEnum().notNull(),
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
    index("idx_employee_skills_skill").on(t.tenantId, t.skillId),
    index("idx_employee_skills_level").on(t.tenantId, t.proficiencyLevel),
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
      sql`${t.yearsOfExperience} IS NULL OR ${t.yearsOfExperience} >= 0`
    ),
  ]
);

export const EmployeeSkillIdSchema = z.number().int().brand<"EmployeeSkillId">();
export type EmployeeSkillId = z.infer<typeof EmployeeSkillIdSchema>;

export const employeeSkillSelectSchema = createSelectSchema(employeeSkills);

export const employeeSkillInsertSchema = createInsertSchema(employeeSkills, {
  yearsOfExperience: z.number().int().min(0).max(50).optional(),
  notes: z.string().max(1000).optional(),
});

export const employeeSkillUpdateSchema = createUpdateSchema(employeeSkills);

export type EmployeeSkill = typeof employeeSkills.$inferSelect;
export type NewEmployeeSkill = typeof employeeSkills.$inferInsert;
