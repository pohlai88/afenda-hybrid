"use client";

import type { BulkDestructiveSeverity } from "./destructive-bulk-ui";

const COPY_HIGH =
  "High-impact bulk actions are available. Verify the selection scope and confirm consequences before proceeding.";

const COPY_CRITICAL =
  "Critical bulk actions are available. A separate confirmation step is required before irreversible changes. Verify affected records and scope.";

export interface BulkDestructiveConsequenceHintProps {
  severity?: BulkDestructiveSeverity;
  /** Overrides default English consequence line for screen readers. */
  consequenceHint?: string;
}

/**
 * Screen-reader-only consequence line for `high` / `critical` bulk destructive severity
 * (Destructive Action Safety Standard §3.2, §6.1). Omitted for `medium` to reduce repetition.
 */
export function BulkDestructiveConsequenceHint({
  severity,
  consequenceHint,
}: BulkDestructiveConsequenceHintProps) {
  if (severity !== "high" && severity !== "critical") return null;
  const text = consequenceHint ?? (severity === "critical" ? COPY_CRITICAL : COPY_HIGH);
  return <span className="sr-only">{text}</span>;
}
