import { integer, text, date, index, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { talentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../_shared";
import { tenants } from "../../core/tenants";
import { talentPools } from "../fundamentals/talentPools";

/**
 * Talent Pool Memberships - Employee participation in talent pools.
 * Circular FK note: employeeId and nominatedBy FKs added via custom SQL.
 */
export const poolMembershipStatuses = ["ACTIVE", "EXITED", "SUSPENDED"] as const;

export const poolMembershipStatusEnum = talentSchema.enum("pool_membership_status", [...poolMembershipStatuses]);

export const poolMembershipStatusZodEnum = createSelectSchema(poolMembershipStatusEnum);

export const talentPoolMemberships = talentSchema.table(
  "talent_pool_memberships",
  {
    talentPoolMembershipId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    talentPoolId: integer().notNull(),
    employeeId: integer().notNull(),
    nominatedBy: integer(),
    joinedDate: date().notNull(),
    exitedDate: date(),
    status: poolMembershipStatusEnum().notNull().default("ACTIVE"),
    rationale: text(),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_talent_pool_memberships_tenant").on(t.tenantId),
    index("idx_talent_pool_memberships_pool").on(t.tenantId, t.talentPoolId),
    index("idx_talent_pool_memberships_employee").on(t.tenantId, t.employeeId),
    index("idx_talent_pool_memberships_status").on(t.tenantId, t.status),
    uniqueIndex("uq_talent_pool_memberships_active")
      .on(t.tenantId, t.talentPoolId, t.employeeId)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_talent_pool_memberships_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [t.talentPoolId],
      foreignColumns: [talentPools.talentPoolId],
      name: "fk_talent_pool_memberships_pool",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check(
      "chk_talent_pool_memberships_dates",
      sql`${t.exitedDate} IS NULL OR ${t.exitedDate} >= ${t.joinedDate}`
    ),
  ]
);

export const TalentPoolMembershipIdSchema = z.number().int().brand<"TalentPoolMembershipId">();
export type TalentPoolMembershipId = z.infer<typeof TalentPoolMembershipIdSchema>;

export const talentPoolMembershipSelectSchema = createSelectSchema(talentPoolMemberships);

export const talentPoolMembershipInsertSchema = createInsertSchema(talentPoolMemberships, {
  rationale: z.string().max(2000).optional(),
});

export const talentPoolMembershipUpdateSchema = createUpdateSchema(talentPoolMemberships);

export type TalentPoolMembership = typeof talentPoolMemberships.$inferSelect;
export type NewTalentPoolMembership = typeof talentPoolMemberships.$inferInsert;
