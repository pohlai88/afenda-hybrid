--> statement-breakpoint

-- CUSTOM: finalScore on performance_review_goals only when review is terminal; block demotion if children have finalScore (CSQL-014)
-- Preflight data checks: docs/preflight/preflight-csql-014-review-goal-final-score.sql
CREATE OR REPLACE FUNCTION "talent"."enforce_review_goal_final_score_vs_parent_status"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
DECLARE
  st "talent"."review_status";
BEGIN
  SELECT r."status" INTO st
  FROM "talent"."performance_reviews" r
  WHERE r."reviewId" = NEW."reviewId";

  IF NOT FOUND THEN
    RAISE EXCEPTION 'performance_reviews not found for reviewId %', NEW."reviewId";
  END IF;

  IF NEW."finalScore" IS NOT NULL
     AND st IS DISTINCT FROM 'COMPLETED'::"talent"."review_status"
     AND st IS DISTINCT FROM 'ACKNOWLEDGED'::"talent"."review_status"
  THEN
    RAISE EXCEPTION
      'finalScore may only be set when review status is COMPLETED or ACKNOWLEDGED (review %, current status: %)',
      NEW."reviewId",
      st;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS "trg_review_goals_final_vs_parent_status" ON "talent"."performance_review_goals";
CREATE TRIGGER "trg_review_goals_final_vs_parent_status"
  BEFORE INSERT OR UPDATE
  ON "talent"."performance_review_goals"
  FOR EACH ROW
  WHEN (NEW."finalScore" IS NOT NULL)
  EXECUTE FUNCTION "talent"."enforce_review_goal_final_score_vs_parent_status"();

CREATE OR REPLACE FUNCTION "talent"."enforce_review_status_vs_goal_final_scores"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW."status" IS NOT DISTINCT FROM OLD."status" THEN
    RETURN NEW;
  END IF;

  IF NEW."status" = 'COMPLETED'::"talent"."review_status"
     OR NEW."status" = 'ACKNOWLEDGED'::"talent"."review_status"
  THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "talent"."performance_review_goals" g
    WHERE g."reviewId" = NEW."reviewId"
      AND g."deletedAt" IS NULL
      AND g."finalScore" IS NOT NULL
  ) THEN
    RAISE EXCEPTION
      'cannot set review % to non-terminal status % while review goals have finalScore set; clear final scores first',
      NEW."reviewId",
      NEW."status";
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS "trg_reviews_status_vs_goal_finals" ON "talent"."performance_reviews";
CREATE TRIGGER "trg_reviews_status_vs_goal_finals"
  BEFORE UPDATE OF "status"
  ON "talent"."performance_reviews"
  FOR EACH ROW
  EXECUTE FUNCTION "talent"."enforce_review_status_vs_goal_final_scores"();
