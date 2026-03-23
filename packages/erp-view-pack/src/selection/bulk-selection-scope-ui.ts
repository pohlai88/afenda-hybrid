/**
 * UI-facing selection scope labels (AFENDA Bulk Interaction Standard §2.1).
 * Distinct from `SelectionScope` in `selection-scope.ts` (concrete state shape for apps).
 */

export type BulkSelectionScopeUi = "page" | "filtered" | "global";

/** Screen-reader-only line appended in live regions so scope is never ambiguous. */
export function bulkSelectionScopeSrOnlyLabel(scope: BulkSelectionScopeUi): string {
  switch (scope) {
    case "page":
      return "Selection scope: rows on this page only.";
    case "filtered":
      return "Selection scope: all rows matching the current filters.";
    case "global":
      return "Selection scope: entire dataset.";
  }
}
