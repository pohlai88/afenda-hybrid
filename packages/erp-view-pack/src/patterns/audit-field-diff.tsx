import type { ReactNode } from "react";
import { cn } from "@afenda/ui-core/lib/utils";
import { AUDIT_FIELD_DIFF_AFTER, AUDIT_FIELD_DIFF_BEFORE } from "./audit-chrome";
import { ERP_TYPO_BODY } from "./erp-typography";

export interface AuditFieldDiffProps {
  /** Field or attribute name; used for the group accessible name. */
  label: string;
  before: ReactNode;
  after: ReactNode;
  className?: string;
  /** When true, old value is not struck through (§6.1 allows strike-through optional). */
  omitStrikeThrough?: boolean;
}

/**
 * Read-only before/after value pair for audit timelines and record history.
 *
 * @see `docs/patterns/audit-traceability-ux-standard.md` §6.1, §12 (accessible expansion of change detail).
 */
export function AuditFieldDiff({
  label,
  before,
  after,
  className,
  omitStrikeThrough = false,
}: AuditFieldDiffProps) {
  return (
    <div
      role="group"
      aria-label={`${label} change`}
      className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-1", ERP_TYPO_BODY, className)}
    >
      <span className="sr-only">Previous value: </span>
      <span className={cn(omitStrikeThrough ? "text-muted-foreground" : AUDIT_FIELD_DIFF_BEFORE)}>
        {before}
      </span>
      <span className="text-muted-foreground select-none" aria-hidden="true">
        →
      </span>
      <span className="sr-only"> New value: </span>
      <span className={AUDIT_FIELD_DIFF_AFTER}>{after}</span>
    </div>
  );
}
