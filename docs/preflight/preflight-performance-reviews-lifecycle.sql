-- Preflight: performance_reviews lifecycle CHECKs (dates + terminal outcomes)
-- Run against staging (or prod read replica) BEFORE applying migration
-- 20260320131009_loose_venom (or any deploy that adds these constraints).
--
-- Automated gate (same counts): DATABASE_URL=... pnpm check:reviews-lifecycle-preflight
-- Index: [README.md](./README.md) · bundle: `pnpm check:preflight`.
--
-- Constraints covered:
--   chk_performance_reviews_completed_date_vs_status
--   chk_performance_reviews_acknowledged_date_vs_status
--   chk_performance_reviews_terminal_outcomes_vs_status
--
-- Remediation templates: bottom of file (human review required).

-- =============================================================================
-- 1) completedDate set while status is not COMPLETED or ACKNOWLEDGED
-- =============================================================================
SELECT
  r."reviewId",
  r."tenantId",
  r."employeeId",
  r."status",
  r."completedDate",
  r."acknowledgedDate",
  r."finalRating",
  r."overallScore",
  r."deletedAt"
FROM "talent"."performance_reviews" r
WHERE r."completedDate" IS NOT NULL
  AND r."status" NOT IN (
    'COMPLETED'::"talent"."review_status",
    'ACKNOWLEDGED'::"talent"."review_status"
  );

SELECT COUNT(*)::bigint AS "completed_date_violation_count"
FROM "talent"."performance_reviews" r
WHERE r."completedDate" IS NOT NULL
  AND r."status" NOT IN (
    'COMPLETED'::"talent"."review_status",
    'ACKNOWLEDGED'::"talent"."review_status"
  );

-- =============================================================================
-- 2) acknowledgedDate set while status is not ACKNOWLEDGED
-- =============================================================================
SELECT
  r."reviewId",
  r."tenantId",
  r."employeeId",
  r."status",
  r."completedDate",
  r."acknowledgedDate",
  r."deletedAt"
FROM "talent"."performance_reviews" r
WHERE r."acknowledgedDate" IS NOT NULL
  AND r."status" <> 'ACKNOWLEDGED'::"talent"."review_status";

SELECT COUNT(*)::bigint AS "acknowledged_date_violation_count"
FROM "talent"."performance_reviews" r
WHERE r."acknowledgedDate" IS NOT NULL
  AND r."status" <> 'ACKNOWLEDGED'::"talent"."review_status";

-- =============================================================================
-- 3) finalRating or overallScore set while status is not terminal
--    (COMPLETED or ACKNOWLEDGED)
-- =============================================================================
SELECT
  r."reviewId",
  r."tenantId",
  r."employeeId",
  r."status",
  r."finalRating",
  r."overallScore",
  r."deletedAt"
FROM "talent"."performance_reviews" r
WHERE (
    r."finalRating" IS NOT NULL
    OR r."overallScore" IS NOT NULL
  )
  AND r."status" NOT IN (
    'COMPLETED'::"talent"."review_status",
    'ACKNOWLEDGED'::"talent"."review_status"
  );

SELECT COUNT(*)::bigint AS "terminal_outcomes_violation_count"
FROM "talent"."performance_reviews" r
WHERE (
    r."finalRating" IS NOT NULL
    OR r."overallScore" IS NOT NULL
  )
  AND r."status" NOT IN (
    'COMPLETED'::"talent"."review_status",
    'ACKNOWLEDGED'::"talent"."review_status"
  );

-- =============================================================================
-- 4) Single rollup (any row matching any rule above) — useful for go/no-go
-- =============================================================================
SELECT COUNT(*)::bigint AS "any_lifecycle_violation_count"
FROM "talent"."performance_reviews" r
WHERE
  (
    r."completedDate" IS NOT NULL
    AND r."status" NOT IN (
      'COMPLETED'::"talent"."review_status",
      'ACKNOWLEDGED'::"talent"."review_status"
    )
  )
  OR (
    r."acknowledgedDate" IS NOT NULL
    AND r."status" <> 'ACKNOWLEDGED'::"talent"."review_status"
  )
  OR (
    (
      r."finalRating" IS NOT NULL
      OR r."overallScore" IS NOT NULL
    )
    AND r."status" NOT IN (
      'COMPLETED'::"talent"."review_status",
      'ACKNOWLEDGED'::"talent"."review_status"
    )
  );

-- =============================================================================
-- REMEDIATION (templates — NOT automatic; approve row set before executing)
-- Prefer staging → re-run counts → migrate → prod during a controlled window.
-- Coordinate with CSQL-014 preflight if performance_review_goals.finalScore exists.
-- =============================================================================

-- --- Pattern A: Clear milestone dates that are inconsistent with status --------
-- BEGIN;
-- UPDATE "talent"."performance_reviews" r
-- SET
--   "completedDate" = NULL,
--   "updatedAt" = now()
-- WHERE r."completedDate" IS NOT NULL
--   AND r."status" NOT IN (
--     'COMPLETED'::"talent"."review_status",
--     'ACKNOWLEDGED'::"talent"."review_status"
--   );
-- -- same for acknowledgedDate when status is not ACKNOWLEDGED:
-- UPDATE "talent"."performance_reviews" r
-- SET
--   "acknowledgedDate" = NULL,
--   "updatedAt" = now()
-- WHERE r."acknowledgedDate" IS NOT NULL
--   AND r."status" <> 'ACKNOWLEDGED'::"talent"."review_status";
-- -- ROLLBACK; / COMMIT;

-- --- Pattern B: Clear terminal outcome fields while status is non-terminal ----
-- Use when ratings/scores were saved too early (e.g. during CALIBRATION).
-- BEGIN;
-- UPDATE "talent"."performance_reviews" r
-- SET
--   "finalRating" = NULL,
--   "overallScore" = NULL,
--   "updatedAt" = now()
-- WHERE (
--     r."finalRating" IS NOT NULL
--     OR r."overallScore" IS NOT NULL
--   )
--   AND r."status" NOT IN (
--     'COMPLETED'::"talent"."review_status",
--     'ACKNOWLEDGED'::"talent"."review_status"
--   );
-- -- ROLLBACK; / COMMIT;

-- --- Pattern C: Advance status instead of wiping fields (business-led) -------
-- Only when workflow truly completed but status was never updated.
-- Example: set COMPLETED and completedDate together (adjust to your rules):
--
-- BEGIN;
-- UPDATE "talent"."performance_reviews" r
-- SET
--   "status" = 'COMPLETED'::"talent"."review_status",
--   "completedDate" = COALESCE(r."completedDate", CURRENT_DATE),
--   "updatedAt" = now()
-- WHERE r."reviewId" IN ( /* explicit id list after review */ );
-- -- ROLLBACK; / COMMIT;
