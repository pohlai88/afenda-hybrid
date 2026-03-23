import type { ModelDef } from "@afenda/view-engine";
import { loadModel, listRegisteredModelNames } from "./model-service";
import { eligibilityForModel } from "./permission-service";
import { resolveRouteToModelKey, verifyModuleOwnership } from "./model-registry";

export { resolveRouteToModelKey, verifyModuleOwnership } from "./model-registry";

export async function gateDynamicModelRoute(
  module: string,
  model: string,
  permissionKeys: ReadonlySet<string>,
  modelNameOverride?: string
): Promise<{ modelDef: ModelDef } | { notFound: true } | { forbidden: true }> {
  const resolved = modelNameOverride ?? resolveRouteToModelKey(module, model);
  if (!resolved) return { notFound: true };

  if (!verifyModuleOwnership(module, resolved)) return { notFound: true };

  if (!listRegisteredModelNames().includes(resolved)) return { notFound: true };

  const modelDef = await loadModel(resolved);
  if (!modelDef) return { notFound: true };

  const eligibility = eligibilityForModel(permissionKeys, resolved);
  if (!eligibility.canRead) return { forbidden: true };

  return { modelDef };
}
