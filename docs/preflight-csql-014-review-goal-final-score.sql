-- Preflight: CSQL-014 (review_goal_final_score_triggers)
-- Run against staging (or prod read replica) BEFORE applying migration
-- 20260320125500_review_goal_final_score_triggers.
--
-- Automated gate (same counts): DATABASE_URL=... pnpm check:csql014-preflight
-- See docs/CI_GATES.md → "CSQL-014 staging gate".
--
-- Violations: performance_review_goals.finalScore is set while the parent review is not terminal.
-- Remediation templates: see bottom of this file (run only after human review, ideally in staging first).

-- 1) Goal rows that will fail on INSERT-like assumptions or on any update that touches finalScore
--    once trg_review_goals_final_vs_parent_status is active.
SELECT
  g."reviewGoalId",
  g."tenantId",
  g."reviewId",
  g."goalId",
  g."finalScore",
  r."status" AS "parentReviewStatus",
  r."deletedAt" AS "parentDeletedAt",
  g."deletedAt" AS "goalDeletedAt"
FROM "talent"."performance_review_goals" g
INNER JOIN "talent"."performance_reviews" r ON r."reviewId" = g."reviewId"
WHERE g."finalScore" IS NOT NULL
  AND g."deletedAt" IS NULL
  AND r."status" NOT IN (
    'COMPLETED'::"talent"."review_status",
    'ACKNOWLEDGED'::"talent"."review_status"
  );

-- 2) Row count only (quick gate for CI/staging checklist)
SELECT COUNT(*) AS "violation_count"
FROM "talent"."performance_review_goals" g
INNER JOIN "talent"."performance_reviews" r ON r."reviewId" = g."reviewId"
WHERE g."finalScore" IS NOT NULL
  AND g."deletedAt" IS NULL
  AND r."status" NOT IN (
    'COMPLETED'::"talent"."review_status",
    'ACKNOWLEDGED'::"talent"."review_status"
  );

-- 3) Optional: orphan reviewIds on goals (parent missing — trigger will error on finalScore set)
SELECT g."reviewGoalId", g."reviewId", g."finalScore"
FROM "talent"."performance_review_goals" g
LEFT JOIN "talent"."performance_reviews" r ON r."reviewId" = g."reviewId"
WHERE g."finalScore" IS NOT NULL
  AND g."deletedAt" IS NULL
  AND r."reviewId" IS NULL;

-- =============================================================================
-- REMEDIATION (templates — NOT automatic; approve row set before executing)
-- Prefer: run in staging → re-run preflight counts → migrate → repeat in prod during window.
-- =============================================================================

-- --- Pattern A: Clear finalScore where parent review is not terminal ----------------
-- Same row set as query (1). Use a transaction; ROLLBACK first to verify row count, then COMMIT.

-- Preview rows that would be updated (should match query 1):
-- SELECT g."reviewGoalId", g."finalScore", r."status"
-- FROM "talent"."performance_review_goals" g
-- INNER JOIN "talent"."performance_reviews" r ON r."reviewId" = g."reviewId"
-- WHERE g."finalScore" IS NOT NULL
--   AND g."deletedAt" IS NULL
--   AND r."status" NOT IN (
--     'COMPLETED'::"talent"."review_status",
--     'ACKNOWLEDGED'::"talent"."review_status"
--   );

-- BEGIN;
-- UPDATE "talent"."performance_review_goals" g
-- SET
--   "finalScore" = NULL,
--   "updatedAt" = now()
--   -- "updatedBy" = <service user id>  -- set if your audit rules require it
-- FROM "talent"."performance_reviews" r
-- WHERE r."reviewId" = g."reviewId"
--   AND g."finalScore" IS NOT NULL
--   AND g."deletedAt" IS NULL
--   AND r."status" NOT IN (
--     'COMPLETED'::"talent"."review_status",
--     'ACKNOWLEDGED'::"talent"."review_status"
--   );
-- -- SELECT * FROM ... verify;
-- -- ROLLBACK;  -- first run
-- -- COMMIT;    -- when satisfied

-- --- Pattern B: Orphans (query 3) -------------------------------------------------
-- No safe generic UPDATE: fix "reviewId" to a valid review, soft-delete the goal row,
-- or NULL finalScore only after deciding the row is not legally binding history.
-- Example: NULL final for orphans only (still requires human sign-off):
--
-- BEGIN;
-- UPDATE "talent"."performance_review_goals" g
-- SET "finalScore" = NULL, "updatedAt" = now()
-- WHERE g."deletedAt" IS NULL
--   AND g."finalScore" IS NOT NULL
--   AND NOT EXISTS (
--     SELECT 1 FROM "talent"."performance_reviews" r WHERE r."reviewId" = g."reviewId"
--   );
-- -- ROLLBACK; / COMMIT;
