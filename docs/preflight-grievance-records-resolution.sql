-- Preflight: grievance_records resolution CHECK (chk_grievance_records_resolution_consistency)
-- Run before migration 20260320131847_grievance_resolution_consistency.
--
-- Gate: DATABASE_URL=... pnpm check:grievance-resolution-preflight
-- See docs/CI_GATES.md → "Grievance resolution preflight".
--
-- Rules:
--   - resolvedBy / resolvedDate are both NULL or both NOT NULL
--   - status = 'RESOLVED' iff both resolution fields are set

-- Detail rows
SELECT
  g."grievanceRecordId",
  g."tenantId",
  g."employeeId",
  g."status",
  g."resolvedBy",
  g."resolvedDate",
  g."deletedAt"
FROM "talent"."grievance_records" g
WHERE NOT (
  (g."resolvedBy" IS NULL = (g."resolvedDate" IS NULL))
  AND (
    g."status"::text != 'RESOLVED'
    OR (g."resolvedBy" IS NOT NULL AND g."resolvedDate" IS NOT NULL)
  )
  AND (
    (g."resolvedBy" IS NULL AND g."resolvedDate" IS NULL)
    OR g."status"::text = 'RESOLVED'
  )
);

SELECT COUNT(*)::bigint AS "resolution_violation_count"
FROM "talent"."grievance_records" g
WHERE NOT (
  (g."resolvedBy" IS NULL = (g."resolvedDate" IS NULL))
  AND (
    g."status"::text != 'RESOLVED'
    OR (g."resolvedBy" IS NOT NULL AND g."resolvedDate" IS NOT NULL)
  )
  AND (
    (g."resolvedBy" IS NULL AND g."resolvedDate" IS NULL)
    OR g."status"::text = 'RESOLVED'
  )
);

-- REMEDIATION (templates — human review)
-- Pattern A: Non-RESOLVED status but resolution stamps set — clear or advance status to RESOLVED
-- Pattern B: RESOLVED missing resolver — set from audit trail or revert status
-- Pattern C: One of resolvedBy / resolvedDate missing — backfill partner field or NULL both
