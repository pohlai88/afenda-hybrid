/**
 * Revalidation tags for metadata ISR tiering (plan §4g).
 * Use with `revalidateTag` from `next/cache` after admin mutations.
 */
export const METADATA_TAGS = {
  models: "metadata:models",
  views: "metadata:views",
  navigation: "navigation",
  navigationTenant: (tenantId: number) => `navigation:tenant:${tenantId}`,
  model: (name: string) => `model:${name}`,
  view: (modelName: string, kind: string) => `view:${modelName}:${kind}`,
} as const;
