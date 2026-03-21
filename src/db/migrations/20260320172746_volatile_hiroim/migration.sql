CREATE TABLE "recruitment"."candidate_salary_backfill_issues" (
	"issueId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "recruitment"."candidate_salary_backfill_issues_issueId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"candidateId" integer NOT NULL,
	"tenantId" integer NOT NULL,
	"expectedSalary" text,
	"normalizedDigits" text,
	"reason" text NOT NULL,
	"capturedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_candidate_salary_backfill_issues_candidate" ON "recruitment"."candidate_salary_backfill_issues" ("candidateId");--> statement-breakpoint
CREATE INDEX "idx_candidate_salary_backfill_issues_tenant" ON "recruitment"."candidate_salary_backfill_issues" ("tenantId");--> statement-breakpoint
ALTER TABLE "recruitment"."candidate_salary_backfill_issues" ADD CONSTRAINT "fk_candidate_salary_backfill_issues_candidate" FOREIGN KEY ("candidateId") REFERENCES "recruitment"."candidates"("candidateId") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
-- Conservative backfill: strip non-digits from legacy expectedSalary; only set amount when pattern fits numeric(14,2).
WITH "norm" AS (
	SELECT
		"candidateId",
		regexp_replace(trim("expectedSalary"), '[^0-9\.]', '', 'g') AS "digits"
	FROM "recruitment"."candidates"
	WHERE "expectedSalary" IS NOT NULL
		AND trim("expectedSalary") <> ''
		AND "expectedSalaryAmount" IS NULL
		AND "deletedAt" IS NULL
)
UPDATE "recruitment"."candidates" AS c
SET "expectedSalaryAmount" = ("norm"."digits")::numeric(14, 2)
FROM "norm"
WHERE c."candidateId" = "norm"."candidateId"
	AND "norm"."digits" ~ '^[0-9]{1,12}(\.[0-9]{1,2})?$'
	AND ("norm"."digits")::numeric <= 999999999999.99;--> statement-breakpoint
INSERT INTO "recruitment"."candidate_salary_backfill_issues" ("candidateId", "tenantId", "expectedSalary", "normalizedDigits", "reason")
SELECT
	c."candidateId",
	c."tenantId",
	c."expectedSalary",
	regexp_replace(trim(c."expectedSalary"), '[^0-9\.]', '', 'g'),
	'legacy_expected_salary_not_parseable_or_out_of_range'
FROM "recruitment"."candidates" AS c
WHERE c."expectedSalary" IS NOT NULL
	AND trim(c."expectedSalary") <> ''
	AND c."expectedSalaryAmount" IS NULL
	AND c."deletedAt" IS NULL
ON CONFLICT ("candidateId") DO NOTHING;