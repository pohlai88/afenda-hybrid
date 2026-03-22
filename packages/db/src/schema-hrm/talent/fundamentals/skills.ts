import { integer, text, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { talentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns, nameColumn } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";

/**
 * Skills - Recognized capabilities master data.
 */
export const skillCategories = [
  "TECHNICAL",
  "SOFT",
  "LANGUAGE",
  "CERTIFICATION",
  "TOOL",
  "DOMAIN",
  "OTHER",
] as const;

export const skillCategoryEnum = talentSchema.enum("skill_category", [...skillCategories]);

export const skillCategoryZodEnum = createSelectSchema(skillCategoryEnum);

export const skillStatuses = ["ACTIVE", "INACTIVE", "DEPRECATED"] as const;

export const skillStatusEnum = talentSchema.enum("skill_status", [...skillStatuses]);

export const skillStatusZodEnum = createSelectSchema(skillStatusEnum);

export const skills = talentSchema.table(
  "skills",
  {
    skillId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    skillCode: text().notNull(),
    ...nameColumn,
    category: skillCategoryEnum().notNull(),
    description: text(),
    parentSkillId: integer(),
    status: skillStatusEnum().notNull().default("ACTIVE"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_skills_tenant").on(t.tenantId),
    index("idx_skills_category").on(t.tenantId, t.category),
    index("idx_skills_parent").on(t.tenantId, t.parentSkillId),
    index("idx_skills_status").on(t.tenantId, t.status),
    uniqueIndex("uq_skills_code")
      .on(t.tenantId, sql`lower(${t.skillCode})`)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_skills_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.parentSkillId],
      foreignColumns: [t.skillId],
      name: "fk_skills_parent",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_skills_skill_code",
      sql`${t.skillCode} ~ '^[A-Za-z0-9_-]+$' AND char_length(${t.skillCode}) >= 2 AND char_length(${t.skillCode}) <= 50`
    ),
    check(
      "chk_skills_name_length",
      sql`char_length(${t.name}) >= 1 AND char_length(${t.name}) <= 200`
    ),
    check(
      "chk_skills_description_length",
      sql`(${t.description} IS NULL OR char_length(${t.description}) <= 1000)`
    ),
  ]
);

export const SkillIdSchema = z.number().int().brand<"SkillId">();
export type SkillId = z.infer<typeof SkillIdSchema>;

export const skillSelectSchema = createSelectSchema(skills);

export const skillInsertSchema = createInsertSchema(skills, {
  skillCode: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/i, "Only alphanumeric, underscore, and hyphen allowed"),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
});

export const skillUpdateSchema = createUpdateSchema(skills);

export type Skill = typeof skills.$inferSelect;
export type NewSkill = typeof skills.$inferInsert;
