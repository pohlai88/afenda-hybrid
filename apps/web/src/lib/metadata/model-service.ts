import { unstable_cache } from "next/cache";
import type { ModelDef } from "@afenda/view-engine";
import { employeeModel } from "./models/hr.employee";
import { organizationModel } from "./models/core.organization";
import { METADATA_TAGS } from "./cache-tags";
import { getRegisteredModelNames } from "./model-registry";

/** ModelDef instances keyed by technical model name */
const MODEL_DEF_REGISTRY = new Map<string, ModelDef>([
  ["hr.employee", employeeModel],
  ["core.organization", organizationModel],
]);

function getModelUncached(name: string): ModelDef | null {
  return MODEL_DEF_REGISTRY.get(name) ?? null;
}

/**
 * Tier: model schemas — long revalidate (plan §4g).
 */
export async function loadModel(name: string): Promise<ModelDef | null> {
  return unstable_cache(async () => getModelUncached(name), ["metadata", "model", name], {
    revalidate: 86_400,
    tags: [METADATA_TAGS.models, METADATA_TAGS.model(name)],
  })();
}

/**
 * Returns all registered model names from the central registry.
 */
export function listRegisteredModelNames(): string[] {
  return [...getRegisteredModelNames()];
}
