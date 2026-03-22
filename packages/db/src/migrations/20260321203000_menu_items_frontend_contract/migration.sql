-- Align core.menu_items column names and shapes with frontend / DB prerequisites plan:
-- parentMenuItemId, routePath, isVisible, code, resourceTable, requiredPermission (text), unique (tenantId, code).

ALTER TABLE "core"."menu_items" ADD COLUMN IF NOT EXISTS "code" text;
--> statement-breakpoint
ALTER TABLE "core"."menu_items" ADD COLUMN IF NOT EXISTS "resourceTable" text;
--> statement-breakpoint
ALTER TABLE "core"."menu_items" ADD COLUMN IF NOT EXISTS "requiredPermission" text;
--> statement-breakpoint
UPDATE "core"."menu_items"
SET "requiredPermission" = "requiredPermissions"->>0
WHERE "requiredPermissions" IS NOT NULL
  AND jsonb_typeof("requiredPermissions") = 'array'
  AND jsonb_array_length("requiredPermissions") > 0;
--> statement-breakpoint
UPDATE "core"."menu_items"
SET "requiredPermission" = trim(both '"' from "requiredPermissions"::text)
WHERE "requiredPermission" IS NULL
  AND "requiredPermissions" IS NOT NULL
  AND jsonb_typeof("requiredPermissions") = 'string';
--> statement-breakpoint
ALTER TABLE "core"."menu_items" DROP COLUMN "requiredPermissions";
--> statement-breakpoint
UPDATE "core"."menu_items"
SET "code" = lower(
  trim(both '_' from regexp_replace(
    regexp_replace(
      trim(both '/' from replace(coalesce("path", ''), '//', '/')),
      '[^a-zA-Z0-9]+',
      '_',
      'g'
    ),
    '_+',
    '_',
    'g'
  ))
)
WHERE ("code" IS NULL OR "code" = '')
  AND coalesce(
    nullif(
      trim(both '/' from replace(coalesce("path", ''), '//', '/')),
      ''
    ),
    ''
  ) <> '';
--> statement-breakpoint
UPDATE "core"."menu_items"
SET "code" = lower(
  trim(both '_' from regexp_replace(
    regexp_replace(coalesce("label", 'item'), '[^a-zA-Z0-9]+', '_', 'g'),
    '_+',
    '_',
    'g'
  ))
)
WHERE "code" IS NULL OR "code" = '';
--> statement-breakpoint
UPDATE "core"."menu_items" AS mi
SET "code" = mi."code" || '_' || mi."menuItemId"::text
FROM (
  SELECT "tenantId", lower("code") AS lc
  FROM "core"."menu_items"
  WHERE "deletedAt" IS NULL
  GROUP BY "tenantId", lower("code")
  HAVING count(*) > 1
) AS d
WHERE mi."tenantId" = d."tenantId"
  AND lower(mi."code") = d.lc;
--> statement-breakpoint
ALTER TABLE "core"."menu_items" ALTER COLUMN "code" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "core"."menu_items" RENAME COLUMN "parentId" TO "parentMenuItemId";
--> statement-breakpoint
ALTER TABLE "core"."menu_items" RENAME COLUMN "path" TO "routePath";
--> statement-breakpoint
ALTER TABLE "core"."menu_items" RENAME COLUMN "isEnabled" TO "isVisible";
--> statement-breakpoint
DROP INDEX IF EXISTS "core"."idx_menu_items_enabled_sort";
--> statement-breakpoint
CREATE INDEX "idx_menu_items_visible_sort" ON "core"."menu_items" ("tenantId", "isVisible", "sortOrder");
--> statement-breakpoint
DROP INDEX IF EXISTS "core"."idx_menu_items_parent";
--> statement-breakpoint
CREATE INDEX "idx_menu_items_parent" ON "core"."menu_items" ("tenantId", "parentMenuItemId");
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_menu_items_tenant_code" ON "core"."menu_items" ("tenantId", lower("code")) WHERE "deletedAt" IS NULL;
--> statement-breakpoint
CREATE INDEX "idx_menu_items_module_sort" ON "core"."menu_items" ("tenantId", "appModuleId", "sortOrder");
