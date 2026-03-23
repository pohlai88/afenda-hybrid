import { NextResponse } from "next/server";
import { listRegisteredModelNames } from "@/lib/metadata/model-service";
import { loadRecords } from "@/lib/metadata/data-service";
import { eligibilityForModel, loadPermissionKeys } from "@/lib/metadata/permission-service";
import { PHASE1_TENANT_ID, PHASE1_USER_ID } from "@/lib/phase1-context";
import { headers } from "next/headers";

/**
 * Generic read API for registered models (plan BP-7 baseline).
 * POST/PATCH/DELETE remain server-action territory until a shared mutation layer exists.
 */
export async function GET(_request: Request, ctx: { params: Promise<{ model: string }> }) {
  const { model: encoded } = await ctx.params;
  const modelName = decodeURIComponent(encoded);

  if (!listRegisteredModelNames().includes(modelName)) {
    return NextResponse.json({ error: "Unknown model" }, { status: 404 });
  }

  const h = await headers();
  const tenantHdr = h.get("x-tenant-id");
  const userHdr = h.get("x-user-id");
  const tenantId = tenantHdr ? Number(tenantHdr) : PHASE1_TENANT_ID;
  const userId = userHdr ? Number(userHdr) : PHASE1_USER_ID;

  if (!Number.isFinite(tenantId) || !Number.isFinite(userId)) {
    return NextResponse.json({ error: "Invalid tenant or user" }, { status: 400 });
  }

  const keys = await loadPermissionKeys(tenantId, userId);
  if (!eligibilityForModel(keys, modelName).canRead) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await loadRecords(modelName, tenantId, userId);
  return NextResponse.json({ model: modelName, data: rows });
}
