/**
 * AFENDA Destructive Action Safety Standard §4.2 (progressive emphasis) & §5.2 (confirm labels).
 * Use with `hasDestructiveAction` on bulk action bars; confirmations and dialogs stay in app/domain.
 */

export type BulkDestructiveSeverity = "medium" | "high" | "critical";

/** Default English confirm primary labels (§5.2 — localize in apps). */
export const DESTRUCTIVE_CONFIRM_LABEL_DELETE_PERMANENTLY = "Delete permanently";

export const DESTRUCTIVE_CONFIRM_LABEL_RESET_RECORDS = "Reset records";

export const DESTRUCTIVE_CONFIRM_LABEL_REVOKE_ACCESS = "Revoke access";

export function resolveBulkDestructiveSeverity(
  hasDestructiveAction: boolean | undefined,
  severity: BulkDestructiveSeverity | undefined
): BulkDestructiveSeverity | undefined {
  if (!hasDestructiveAction) return undefined;
  return severity ?? "medium";
}
