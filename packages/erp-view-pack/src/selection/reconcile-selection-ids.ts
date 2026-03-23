/**
 * Pure helper: after a fetch, drop selection entries that no longer exist (soft delete,
 * optimistic rollback, partial page loads). Prefer {@link SelectionStoreActions.reconcileToValidIds}
 * on the live store; this is for tests or non-zustand pipelines.
 */
export function reconcileSelectionIds(
  selectedIds: ReadonlySet<string>,
  validIds: ReadonlySet<string>
): Set<string> {
  const next = new Set<string>();
  for (const id of selectedIds) {
    if (validIds.has(id)) next.add(id);
  }
  return next;
}
