"use client";

import type { ReactNode } from "react";
import { cn } from "@afenda/ui-core/lib/utils";
import { AUDIT_TEXT_ACTOR, AUDIT_TEXT_IDENTIFIER, AUDIT_TEXT_TIMESTAMP } from "./audit-chrome";
import { ERP_TYPO_OVERLINE_LABEL } from "./erp-typography";

export interface DescriptionItem {
  label: string;
  value: ReactNode;
  /**
   * Audit / traceability typography for evidence panels (`audit-traceability-ux-standard.md` §8.3).
   * Omit for default body styling.
   */
  valueTone?: "identifier" | "timestamp" | "actor";
}

export interface DescriptionListProps {
  items: DescriptionItem[];
  columns?: 1 | 2 | 3;
  className?: string;
}

/**
 * Semantic `<dl>` for record detail panels (Data Grid / form adjacency; `docs/patterns/data-grid-interaction-standard.md` §3).
 * Labels follow Visual Density Standard §9.1 (`ERP_TYPO_OVERLINE_LABEL`).
 * Use `valueTone` on items when rendering audit metadata (actor, timestamps, record IDs).
 */
export function DescriptionList({ items, columns = 2, className }: DescriptionListProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  };

  const valueToneClass = (tone: DescriptionItem["valueTone"]) => {
    if (tone === "identifier") return AUDIT_TEXT_IDENTIFIER;
    if (tone === "timestamp") return cn("text-sm", AUDIT_TEXT_TIMESTAMP);
    if (tone === "actor") return AUDIT_TEXT_ACTOR;
    return "text-sm text-foreground";
  };

  return (
    <dl className={cn("grid gap-4", gridCols[columns], className)}>
      {items.map((item, idx) => (
        <div key={idx} className="space-y-1">
          <dt className={ERP_TYPO_OVERLINE_LABEL}>{item.label}</dt>
          <dd className={valueToneClass(item.valueTone)}>{item.value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
