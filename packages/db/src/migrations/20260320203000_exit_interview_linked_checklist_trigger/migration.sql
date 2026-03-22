-- CUSTOM: exit_interviews must link to an active offboarding_checklists row with taskCategory EXIT_INTERVIEW and matching tenantId/employeeId (CSQL-015)
CREATE OR REPLACE FUNCTION "recruitment"."enforce_exit_interview_linked_checklist"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
DECLARE
  cat "recruitment"."offboarding_task_category";
  oc_tenant integer;
  oc_employee integer;
  oc_deleted timestamptz;
BEGIN
  SELECT c."taskCategory", c."tenantId", c."employeeId", c."deletedAt"
  INTO cat, oc_tenant, oc_employee, oc_deleted
  FROM "recruitment"."offboarding_checklists" c
  WHERE c."offboardingChecklistId" = NEW."linkedOffboardingChecklistId";

  IF NOT FOUND THEN
    RAISE EXCEPTION 'offboarding_checklists row % not found for exit_interviews.linkedOffboardingChecklistId',
      NEW."linkedOffboardingChecklistId";
  END IF;

  IF oc_deleted IS NOT NULL THEN
    RAISE EXCEPTION 'exit_interviews cannot reference soft-deleted offboarding_checklists row %',
      NEW."linkedOffboardingChecklistId";
  END IF;

  IF cat IS DISTINCT FROM 'EXIT_INTERVIEW'::"recruitment"."offboarding_task_category" THEN
    RAISE EXCEPTION
      'exit_interviews.linkedOffboardingChecklistId % must reference taskCategory EXIT_INTERVIEW (actual: %)',
      NEW."linkedOffboardingChecklistId",
      cat;
  END IF;

  IF oc_tenant IS DISTINCT FROM NEW."tenantId" THEN
    RAISE EXCEPTION
      'exit_interviews.tenantId % must match linked offboarding_checklists.tenantId % (checklist %)',
      NEW."tenantId",
      oc_tenant,
      NEW."linkedOffboardingChecklistId";
  END IF;

  IF oc_employee IS DISTINCT FROM NEW."employeeId" THEN
    RAISE EXCEPTION
      'exit_interviews.employeeId % must match linked offboarding_checklists.employeeId % (checklist %)',
      NEW."employeeId",
      oc_employee,
      NEW."linkedOffboardingChecklistId";
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS "trg_exit_interviews_linked_checklist" ON "recruitment"."exit_interviews";
CREATE TRIGGER "trg_exit_interviews_linked_checklist"
  BEFORE INSERT OR UPDATE OF "linkedOffboardingChecklistId", "tenantId", "employeeId"
  ON "recruitment"."exit_interviews"
  FOR EACH ROW
  EXECUTE FUNCTION "recruitment"."enforce_exit_interview_linked_checklist"();

-- Same CSQL-015: prevent breaking the link from the checklist side while an active exit_interviews row exists
CREATE OR REPLACE FUNCTION "recruitment"."enforce_offboarding_checklist_for_exit_interviews"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "recruitment"."exit_interviews" e
    WHERE e."linkedOffboardingChecklistId" = OLD."offboardingChecklistId"
      AND e."deletedAt" IS NULL
  ) THEN
    IF NEW."deletedAt" IS NOT NULL AND OLD."deletedAt" IS NULL THEN
      RAISE EXCEPTION
        'cannot soft-delete offboarding_checklists row % while recruitment.exit_interviews references it',
        OLD."offboardingChecklistId";
    END IF;

    IF NEW."taskCategory" IS DISTINCT FROM 'EXIT_INTERVIEW'::"recruitment"."offboarding_task_category" THEN
      RAISE EXCEPTION
        'cannot set taskCategory away from EXIT_INTERVIEW on offboarding_checklists row % while exit_interviews references it',
        OLD."offboardingChecklistId";
    END IF;

    IF NEW."tenantId" IS DISTINCT FROM OLD."tenantId"
       OR NEW."employeeId" IS DISTINCT FROM OLD."employeeId" THEN
      RAISE EXCEPTION
        'cannot change tenantId or employeeId on offboarding_checklists row % while exit_interviews references it',
        OLD."offboardingChecklistId";
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS "trg_offboarding_checklists_exit_interview_guard" ON "recruitment"."offboarding_checklists";
CREATE TRIGGER "trg_offboarding_checklists_exit_interview_guard"
  BEFORE UPDATE OF "taskCategory", "tenantId", "employeeId", "deletedAt"
  ON "recruitment"."offboarding_checklists"
  FOR EACH ROW
  EXECUTE FUNCTION "recruitment"."enforce_offboarding_checklist_for_exit_interviews"();
