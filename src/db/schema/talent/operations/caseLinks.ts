import { integer, text, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { talentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";

/**
 * Case Links - Generic relationship graph for grievance/disciplinary and future case types.
 */
export const caseEntityTypes = ["GRIEVANCE", "DISCIPLINARY"] as const;
export const caseEntityTypeEnum = talentSchema.enum("case_entity_type", [...caseEntityTypes]);
export const caseEntityTypeZodEnum = createSelectSchema(caseEntityTypeEnum);

export const caseLinkTypes = ["ESCALATES_TO", "RELATED_TO", "DERIVED_FROM"] as const;
export const caseLinkTypeEnum = talentSchema.enum("case_link_type", [...caseLinkTypes]);
export const caseLinkTypeZodEnum = createSelectSchema(caseLinkTypeEnum);

export const caseLinks = talentSchema.table(
  "case_links",
  {
    caseLinkId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    sourceType: caseEntityTypeEnum().notNull(),
    sourceId: integer().notNull(),
    targetType: caseEntityTypeEnum().notNull(),
    targetId: integer().notNull(),
    linkType: caseLinkTypeEnum().notNull(),
    reason: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_case_links_tenant").on(t.tenantId),
    index("idx_case_links_source").on(t.tenantId, t.sourceType, t.sourceId),
    index("idx_case_links_target").on(t.tenantId, t.targetType, t.targetId),
    index("idx_case_links_link_type").on(t.tenantId, t.linkType),
    uniqueIndex("uq_case_links_tuple")
      .on(t.tenantId, t.sourceType, t.sourceId, t.targetType, t.targetId, t.linkType)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_case_links_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_case_links_no_self_loop",
      sql`NOT (${t.sourceType} = ${t.targetType} AND ${t.sourceId} = ${t.targetId})`
    ),
  ]
);

export const CaseLinkIdSchema = z.number().int().brand<"CaseLinkId">();
export type CaseLinkId = z.infer<typeof CaseLinkIdSchema>;

export const caseLinkSelectSchema = createSelectSchema(caseLinks);
export const caseLinkInsertSchema = createInsertSchema(caseLinks, {
  reason: z.string().max(2000).optional(),
});
export const caseLinkUpdateSchema = createUpdateSchema(caseLinks);

export type CaseLink = typeof caseLinks.$inferSelect;
export type NewCaseLink = typeof caseLinks.$inferInsert;
