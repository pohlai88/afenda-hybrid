import {
  integer,
  varchar,
  date,
  smallint,
  index,
  uniqueIndex,
  foreignKey,
  check,
} from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { talentSchema } from "../_schema";
import { timestampColumns, softDeleteColumns, auditColumns } from "../../../_shared";
import { tenants } from "../../../schema-platform/core/tenants";

/**
 * Succession Plans - Replacement planning for key positions.
 * Circular FK note: positionId, incumbentId, successorId FKs added via custom SQL.
 *
 * Lifecycle: `targetDate` is required when `status` is `ACTIVE` or `UNDER_REVIEW`. `targetDate` may be
 * set on `DRAFT` / `ARCHIVED` for planning or history; not constrained to “future only” (retroactive OK).
 * Preflight: `docs/preflight/preflight-succession-plans-lifecycle.sql`.
 *
 * Optional next step — require non-empty `developmentPlan` for `ACTIVE` / `UNDER_REVIEW`: see
 * `docs/hcm/succession-plans-optional-development-plan-check.md` (not enforced in DB until product approves).
 * Nightly staging gap count (optional): `pnpm report:succession-plans-development-gap` — `docs/CI_GATES.md`.
 * Metrics JSON line: `SUCCESSION_DEV_PLAN_GAP_JSON_LINE=1`; job summary: `GITHUB_STEP_SUMMARY` — `docs/hcm/succession-plans-optional-development-plan-check.md`.
 */
export const readinessLevels = [
  "READY_NOW",
  "READY_1_YEAR",
  "READY_2_YEARS",
  "DEVELOPMENT_NEEDED",
  "NOT_READY",
] as const;

export const readinessLevelEnum = talentSchema.enum("readiness_level", [...readinessLevels]);

export const readinessLevelZodEnum = createSelectSchema(readinessLevelEnum);

export const successionPlanStatuses = ["DRAFT", "ACTIVE", "UNDER_REVIEW", "ARCHIVED"] as const;

export const successionPlanStatusEnum = talentSchema.enum("succession_plan_status", [
  ...successionPlanStatuses,
]);

export const successionPlanStatusZodEnum = createSelectSchema(successionPlanStatusEnum);

export const successionPlans = talentSchema.table(
  "succession_plans",
  {
    successionPlanId: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenantId: integer().notNull(),
    positionId: integer().notNull(),
    incumbentId: integer(),
    successorId: integer().notNull(),
    readinessLevel: readinessLevelEnum().notNull(),
    priority: smallint().notNull().default(1),
    /** DB-capped to match API / Zod (was unbounded `text`). */
    developmentPlan: varchar({ length: 4000 }),
    targetDate: date(),
    status: successionPlanStatusEnum().notNull().default("DRAFT"),
    ...timestampColumns,
    ...softDeleteColumns,
    ...auditColumns,
  },
  (t) => [
    index("idx_succession_plans_tenant").on(t.tenantId),
    index("idx_succession_plans_position").on(t.tenantId, t.positionId),
    index("idx_succession_plans_incumbent").on(t.tenantId, t.incumbentId),
    index("idx_succession_plans_successor").on(t.tenantId, t.successorId),
    index("idx_succession_plans_readiness").on(t.tenantId, t.readinessLevel),
    index("idx_succession_plans_status").on(t.tenantId, t.status),
    index("idx_succession_plans_created").on(t.tenantId, t.createdAt),
    index("idx_succession_plans_active_target")
      .on(t.tenantId, t.targetDate)
      .where(
        sql`${t.deletedAt} IS NULL AND ${t.status} = ${sql.raw(`'ACTIVE'::"talent"."succession_plan_status"`)}`
      ),
    index("idx_succession_plans_archived_reporting")
      .on(t.tenantId, t.positionId)
      .where(
        sql`${t.deletedAt} IS NULL AND ${t.status} = ${sql.raw(`'ARCHIVED'::"talent"."succession_plan_status"`)}`
      ),
    uniqueIndex("uq_succession_plans_position_successor")
      .on(t.tenantId, t.positionId, t.successorId)
      .where(sql`${t.deletedAt} IS NULL`),
    foreignKey({
      columns: [t.tenantId],
      foreignColumns: [tenants.tenantId],
      name: "fk_succession_plans_tenant",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    check("chk_succession_plans_priority", sql`${t.priority} >= 1 AND ${t.priority} <= 10`),
    check(
      "chk_succession_plans_different",
      sql`${t.incumbentId} IS NULL OR ${t.incumbentId} != ${t.successorId}`
    ),
    check(
      "chk_succession_plans_target_when_live",
      sql`${t.status}::text NOT IN ('ACTIVE', 'UNDER_REVIEW') OR ${t.targetDate} IS NOT NULL`
    ),
  ]
);

export const SuccessionPlanIdSchema = z.number().int().brand<"SuccessionPlanId">();
export type SuccessionPlanId = z.infer<typeof SuccessionPlanIdSchema>;

export const successionPlanSelectSchema = createSelectSchema(successionPlans);

export const successionPlanInsertSchema = createInsertSchema(successionPlans, {
  priority: z.number().int().min(1).max(10),
  developmentPlan: z.string().max(4000).optional(),
});

export const successionPlanUpdateSchema = createUpdateSchema(successionPlans, {
  priority: z.number().int().min(1).max(10).optional(),
  developmentPlan: z.string().max(4000).optional(),
});

export type SuccessionPlan = typeof successionPlans.$inferSelect;
export type NewSuccessionPlan = typeof successionPlans.$inferInsert;
