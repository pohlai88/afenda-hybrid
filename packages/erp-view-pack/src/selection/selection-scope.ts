/**
 * Enterprise bulk-selection scope. Keep concrete selection state (IDs, filter hash,
 * pagination) in your app layer (store, URL, or server session)—not inside table UI—so
 * filter and page changes cannot leave "phantom" selections.
 */

export type SelectionScope =
  | { type: "page"; ids: ReadonlyArray<string> }
  | { type: "all"; total: number }
  | { type: "filtered"; total: number };

export function selectionScopeCount(scope: SelectionScope): number {
  switch (scope.type) {
    case "page":
      return scope.ids.length;
    case "all":
      return scope.total;
    case "filtered":
      return scope.total;
  }
}
