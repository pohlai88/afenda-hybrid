-- Preflight: promotion_records approval CHECK + unique (tenant, employee, effectiveDate)
-- Run before migration 20260320131426_flaky_black_tom (or any deploy adding these objects).
--
-- Gate: DATABASE_URL=... pnpm check:promotion-records-preflight
-- See docs/CI_GATES.md → "Promotion records preflight".

-- =============================================================================
-- 1) Approval consistency (matches chk_promotion_records_approval_consistency)
--    Either both approvedBy and approvedAt are NULL, or both are set and status is APPROVED/COMPLETED;
--    APPROVED/COMPLETED always require both approver fields.
-- =============================================================================

-- Detail rows
SELECT
  p."promotionRecordId",
  p."tenantId",
  p."employeeId",
  p."status",
  p."approvedBy",
  p."approvedAt",
  p."deletedAt"
FROM "talent"."promotion_records" p
WHERE NOT (
  (p."approvedBy" IS NULL = (p."approvedAt" IS NULL))
  AND (
    p."status" NOT IN (
      'APPROVED'::"talent"."promotion_status",
      'COMPLETED'::"talent"."promotion_status"
    )
    OR (p."approvedBy" IS NOT NULL AND p."approvedAt" IS NOT NULL)
  )
);

SELECT COUNT(*)::bigint AS "approval_violation_count"
FROM "talent"."promotion_records" p
WHERE NOT (
  (p."approvedBy" IS NULL = (p."approvedAt" IS NULL))
  AND (
    p."status" NOT IN (
      'APPROVED'::"talent"."promotion_status",
      'COMPLETED'::"talent"."promotion_status"
    )
    OR (p."approvedBy" IS NOT NULL AND p."approvedAt" IS NOT NULL)
  )
);

-- =============================================================================
-- 2) Duplicate active rows per (tenantId, employeeId, effectiveDate) — blocks unique index
-- =============================================================================
SELECT
  p."tenantId",
  p."employeeId",
  p."effectiveDate",
  COUNT(*)::bigint AS "row_count"
FROM "talent"."promotion_records" p
WHERE p."deletedAt" IS NULL
GROUP BY p."tenantId", p."employeeId", p."effectiveDate"
HAVING COUNT(*) > 1;

SELECT COUNT(*)::bigint AS "duplicate_effective_date_group_count"
FROM (
  SELECT 1
  FROM "talent"."promotion_records" p
  WHERE p."deletedAt" IS NULL
  GROUP BY p."tenantId", p."employeeId", p."effectiveDate"
  HAVING COUNT(*) > 1
) d;

-- =============================================================================
-- REMEDIATION (templates — human review required)
-- =============================================================================

-- Pattern A: APPROVED/COMPLETED but missing approver — set from audit or fall back to PENDING
-- BEGIN;
-- UPDATE "talent"."promotion_records"
-- SET "status" = 'PENDING'::"talent"."promotion_status", "updatedAt" = now()
-- WHERE "promotionRecordId" IN ( /* … */ );
-- ROLLBACK; / COMMIT;

-- Pattern B: Clear orphan approval stamp on non-terminal status (one field set incorrectly)
-- UPDATE "talent"."promotion_records"
-- SET "approvedBy" = NULL, "approvedAt" = NULL, "updatedAt" = now()
-- WHERE "promotionRecordId" IN ( /* … */ );

-- Pattern C: Duplicates — soft-delete duplicate rows, merge, or change effectiveDate after review.
