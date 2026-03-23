"use server";

import { revalidatePath } from "next/cache";
import { revalidateTag } from "next/cache";
import { listRegisteredModelNames } from "@/lib/metadata/model-service";
import { METADATA_TAGS } from "@/lib/metadata/cache-tags";
import { MODEL_LIST_PATHS } from "@/lib/metadata/model-registry";
import { eligibilityForModel, loadPermissionKeys } from "@/lib/metadata/permission-service";
import { PHASE1_TENANT_ID, PHASE1_USER_ID } from "@/lib/phase1-context";

/**
 * Generic metadata action entrypoint — maps view-engine list/kanban actions to server mutations.
 * Phase 2: branch on `action` + `modelName`, call domain services, audit, etc.
 */
export async function executeModelAction(
  modelName: string,
  action: string,
  records: unknown[]
): Promise<{ ok: boolean; message?: string }> {
  if (!listRegisteredModelNames().includes(modelName)) {
    return { ok: false, message: "Unknown model" };
  }

  if (typeof action !== "string" || !action.trim()) {
    return { ok: false, message: "Invalid action" };
  }

  const keys = await loadPermissionKeys(PHASE1_TENANT_ID, PHASE1_USER_ID);
  const el = eligibilityForModel(keys, modelName);

  if (action === "delete" && !el.canDelete) {
    return { ok: false, message: "Forbidden" };
  }
  if (action === "create" && !el.canCreate) {
    return { ok: false, message: "Forbidden" };
  }
  if (action === "save" && !el.canWrite) {
    return { ok: false, message: "Forbidden" };
  }
  if (action.startsWith("bulk_") && !el.canWrite) {
    return { ok: false, message: "Forbidden" };
  }

  if (action === "view" && !el.canRead) {
    return { ok: false, message: "Forbidden" };
  }

  void records;

  if (process.env.NODE_ENV !== "production") {
    console.log("[executeModelAction]", {
      modelName,
      action,
      recordCount: Array.isArray(records) ? records.length : 0,
    });
  }

  const listPath = MODEL_LIST_PATHS[modelName];
  if (listPath) revalidatePath(listPath);
  revalidatePath("/dashboard");
  revalidateTag(METADATA_TAGS.navigation);
  revalidateTag(METADATA_TAGS.model(modelName));
  revalidateTag(METADATA_TAGS.views);

  return { ok: true };
}
