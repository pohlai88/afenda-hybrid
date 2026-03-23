"use client";

import { cn } from "@afenda/ui-core/lib/utils";
import { ERP_TYPO_META_STRONG } from "./erp-typography";

const statusConfig = {
  active: { dot: "bg-success", text: "text-success", label: "Active" },
  inactive: { dot: "bg-neutral-400", text: "text-neutral-500", label: "Inactive" },
  pending: { dot: "bg-warning", text: "text-warning", label: "Pending" },
  error: { dot: "bg-destructive", text: "text-destructive", label: "Error" },
  draft: { dot: "bg-neutral-400", text: "text-neutral-500", label: "Draft" },
  archived: { dot: "bg-neutral-400", text: "text-neutral-500", label: "Archived" },
} as const;

export type StatusType = keyof typeof statusConfig;

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

/** Inline operational status for grids and headers (Data Grid Interaction Standard §3.2). */
export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        ERP_TYPO_META_STRONG,
        config.text,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} aria-hidden="true" />
      {label || config.label}
    </span>
  );
}
