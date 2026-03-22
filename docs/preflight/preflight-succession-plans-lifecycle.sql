-- Preflight: succession_plans lifecycle migration 20260320132957_succession_plans_lifecycle
--
-- Gate: DATABASE_URL=... pnpm check:succession-plans-preflight
-- Index: [README.md](./README.md) · bundle: `pnpm check:preflight`.

-- 1) ACTIVE / UNDER_REVIEW without targetDate
SELECT
  s."successionPlanId",
  s."tenantId",
  s."positionId",
  s."successorId",
  s."status",
  s."targetDate",
  s."deletedAt"
FROM "talent"."succession_plans" s
WHERE s."status" IN (
    'ACTIVE'::"talent"."succession_plan_status",
    'UNDER_REVIEW'::"talent"."succession_plan_status"
  )
  AND s."targetDate" IS NULL;

SELECT COUNT(*)::bigint AS "missing_target_date_count"
FROM "talent"."succession_plans" s
WHERE s."status" IN (
    'ACTIVE'::"talent"."succession_plan_status",
    'UNDER_REVIEW'::"talent"."succession_plan_status"
  )
  AND s."targetDate" IS NULL;

-- 2) Duplicate (tenant, position, successor) among non-deleted rows — blocks unique index
SELECT
  s."tenantId",
  s."positionId",
  s."successorId",
  COUNT(*)::bigint AS "row_count"
FROM "talent"."succession_plans" s
WHERE s."deletedAt" IS NULL
GROUP BY s."tenantId", s."positionId", s."successorId"
HAVING COUNT(*) > 1;

SELECT COUNT(*)::bigint AS "duplicate_position_successor_group_count"
FROM (
  SELECT 1
  FROM "talent"."succession_plans" s
  WHERE s."deletedAt" IS NULL
  GROUP BY s."tenantId", s."positionId", s."successorId"
  HAVING COUNT(*) > 1
) d;

-- 3) Optional: developmentPlan longer than 4000 chars (migration will truncate via LEFT)
SELECT s."successionPlanId", length(s."developmentPlan"::text) AS "len"
FROM "talent"."succession_plans" s
WHERE s."developmentPlan" IS NOT NULL
  AND length(s."developmentPlan"::text) > 4000;

SELECT COUNT(*)::bigint AS "development_plan_over_4000_count"
FROM "talent"."succession_plans" s
WHERE s."developmentPlan" IS NOT NULL
  AND length(s."developmentPlan"::text) > 4000;

-- REMEDIATION: set targetDate, merge/soft-delete duplicate rows, shorten or NULL long developmentPlan text.

-- =============================================================================
-- OPTIONAL (not enforced yet): non-empty developmentPlan for ACTIVE / UNDER_REVIEW
-- Full rollout sketch: ../hcm/succession-plans-optional-development-plan-check.md
-- =============================================================================
-- SELECT COUNT(*)::bigint AS "missing_development_plan_count"
-- FROM "talent"."succession_plans" s
-- WHERE s."status" IN (
--     'ACTIVE'::"talent"."succession_plan_status",
--     'UNDER_REVIEW'::"talent"."succession_plan_status"
--   )
--   AND (
--     s."developmentPlan" IS NULL
--     OR length(trim(s."developmentPlan"::text)) = 0
--   );
