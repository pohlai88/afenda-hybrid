-- Preflight: training_enrollments completion + employee_certifications verification CHECKs
-- Run before migration 20260320132450_learning_completion_cert_verification.
--
-- Gate: DATABASE_URL=... pnpm check:learning-cert-lifecycle-preflight
-- Index: [README.md](./README.md) · bundle: `pnpm check:preflight`.

-- =============================================================================
-- 1) learning.training_enrollments — completionDate iff status = COMPLETED
-- =============================================================================
SELECT e."enrollmentId", e."tenantId", e."employeeId", e."status", e."completionDate", e."deletedAt"
FROM "learning"."training_enrollments" e
WHERE NOT (
  (e."completionDate" IS NULL OR e."status"::text = 'COMPLETED')
  AND (e."status"::text != 'COMPLETED' OR e."completionDate" IS NOT NULL)
);

SELECT COUNT(*)::bigint AS "training_completion_violation_count"
FROM "learning"."training_enrollments" e
WHERE NOT (
  (e."completionDate" IS NULL OR e."status"::text = 'COMPLETED')
  AND (e."status"::text != 'COMPLETED' OR e."completionDate" IS NOT NULL)
);

-- =============================================================================
-- 2) talent.employee_certifications — verifier pairing; none while PENDING_VERIFICATION
-- =============================================================================
SELECT
  c."employeeCertificationId",
  c."tenantId",
  c."employeeId",
  c."status",
  c."verifiedBy",
  c."verificationDate",
  c."deletedAt"
FROM "talent"."employee_certifications" c
WHERE NOT (
  (c."verifiedBy" IS NULL = (c."verificationDate" IS NULL))
  AND (
    c."status"::text != 'PENDING_VERIFICATION'
    OR (c."verifiedBy" IS NULL AND c."verificationDate" IS NULL)
  )
);

SELECT COUNT(*)::bigint AS "employee_cert_verification_violation_count"
FROM "talent"."employee_certifications" c
WHERE NOT (
  (c."verifiedBy" IS NULL = (c."verificationDate" IS NULL))
  AND (
    c."status"::text != 'PENDING_VERIFICATION'
    OR (c."verifiedBy" IS NULL AND c."verificationDate" IS NULL)
  )
);

-- REMEDIATION (templates — human review)
-- Training: NULL completionDate for non-COMPLETED, or set status COMPLETED when date is intentional.
-- Certs: NULL both verifier fields on PENDING_VERIFICATION, or advance status when verified.
