ALTER TABLE "benefits"."benefits_providers" ALTER COLUMN "contractStartDate" SET DATA TYPE date USING (
	CASE
		WHEN "contractStartDate" IS NULL OR trim("contractStartDate"::text) = '' THEN NULL
		ELSE "contractStartDate"::date
	END
);--> statement-breakpoint
ALTER TABLE "benefits"."benefits_providers" ALTER COLUMN "contractEndDate" SET DATA TYPE date USING (
	CASE
		WHEN "contractEndDate" IS NULL OR trim("contractEndDate"::text) = '' THEN NULL
		ELSE "contractEndDate"::date
	END
);