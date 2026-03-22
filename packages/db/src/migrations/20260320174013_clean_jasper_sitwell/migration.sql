DO $guard$
DECLARE
  orphan_count integer;
BEGIN
  SELECT count(*)::integer INTO orphan_count
  FROM "recruitment"."candidate_salary_backfill_issues" AS csbi
  LEFT JOIN "core"."tenants" AS t ON csbi."tenantId" = t."tenantId"
  WHERE t."tenantId" IS NULL;

  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'candidate_salary_backfill_issues: % row(s) reference missing core.tenants — remediate before fk_candidate_salary_backfill_issues_tenant',
      orphan_count;
  END IF;
END
$guard$;--> statement-breakpoint
ALTER TABLE "recruitment"."candidate_salary_backfill_issues" ADD CONSTRAINT "fk_candidate_salary_backfill_issues_tenant" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;