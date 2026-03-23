"use client";

import type { ReactNode } from "react";
import { cn } from "@afenda/ui-core/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@afenda/ui-core/primitives/alert";
import { ERP_TYPO_EMPHASIS, ERP_TYPO_META } from "./erp-typography";
import { PATTERN_DENSE_MOTION } from "./pattern-chrome";

export type WorkflowStateBannerStatus = "pending" | "blocked" | "info";

export interface WorkflowStateBannerProps {
  status: WorkflowStateBannerStatus;
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

const statusToAlertVariant: Record<WorkflowStateBannerStatus, "warning" | "destructive" | "info"> =
  {
    pending: "warning",
    blocked: "destructive",
    info: "info",
  };

/**
 * Blocking / contextual workflow message (`workflow-state-transition-standard.md` §5.2).
 * Uses `@afenda/ui-core` `Alert` with ERP typography tokens.
 */
export function WorkflowStateBanner({
  status,
  title,
  description,
  icon,
  actions,
  className,
}: WorkflowStateBannerProps) {
  const variant = statusToAlertVariant[status];

  return (
    <Alert
      variant={variant}
      role="status"
      aria-live="polite"
      className={cn(PATTERN_DENSE_MOTION, className)}
    >
      <div className="flex gap-3">
        {icon ? <div className="mt-0.5 shrink-0 text-foreground">{icon}</div> : null}
        <div className="min-w-0 flex-1 space-y-1">
          <AlertTitle className={ERP_TYPO_EMPHASIS}>{title}</AlertTitle>
          {description ? (
            <AlertDescription className={cn(ERP_TYPO_META, "text-current/90")}>
              {description}
            </AlertDescription>
          ) : null}
          {actions ? <div className="flex flex-wrap items-center gap-2 pt-1">{actions}</div> : null}
        </div>
      </div>
    </Alert>
  );
}
