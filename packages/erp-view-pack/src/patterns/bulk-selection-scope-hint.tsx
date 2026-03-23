"use client";

import {
  bulkSelectionScopeSrOnlyLabel,
  type BulkSelectionScopeUi,
} from "../selection/bulk-selection-scope-ui";

export interface BulkSelectionScopeHintProps {
  scope?: BulkSelectionScopeUi;
  /** Overrides the default label for `scope` (e.g. localized or domain-specific copy). */
  scopeHint?: string;
}

/** Screen-reader-only scope line for bulk live regions (`docs/patterns/bulk-interaction-standard.md` §2.1, §6.1). */
export function BulkSelectionScopeHint({ scope, scopeHint }: BulkSelectionScopeHintProps) {
  const text = scopeHint ?? (scope ? bulkSelectionScopeSrOnlyLabel(scope) : null);
  if (!text) return null;
  return <span className="sr-only">{text}</span>;
}
