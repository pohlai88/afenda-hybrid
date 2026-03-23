import { unstable_cache } from "next/cache";
import type { ViewDef, ViewKind } from "@afenda/view-engine";
import { buildViewRegistry } from "./views/registry";
import { METADATA_TAGS } from "./cache-tags";

const VIEW_REGISTRY = buildViewRegistry();

function getViewUncached(modelName: string, kind: ViewKind): ViewDef | null {
  return VIEW_REGISTRY.get(`${modelName}:${kind}`) ?? null;
}

/**
 * Tier: view layouts — tag-based revalidation (plan §4g).
 */
export async function loadView(modelName: string, kind: ViewKind): Promise<ViewDef | null> {
  return unstable_cache(
    async () => getViewUncached(modelName, kind),
    ["metadata", "view", modelName, kind],
    {
      revalidate: 3600,
      tags: [METADATA_TAGS.views, METADATA_TAGS.view(modelName, kind)],
    }
  )();
}
