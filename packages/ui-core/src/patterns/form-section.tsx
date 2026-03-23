"use client";

import * as React from "react";
import { Separator } from "../primitives/separator";
import { cn } from "../lib/utils";

export interface FormSectionProps {
  /** Section heading (Odoo "group" label). */
  title: string;
  /** Optional description below the heading. */
  description?: string;
  /** Number of columns for the contained fields. */
  columns?: 1 | 2 | 3;
  className?: string;
  children: React.ReactNode;
}

export function FormSection({
  title,
  description,
  columns = 1,
  className,
  children,
}: FormSectionProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  };

  return (
    <fieldset className={cn("space-y-4", className)}>
      <legend className="contents">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </h3>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </legend>
      <Separator />
      <div className={cn("grid gap-4", gridCols[columns])}>{children}</div>
    </fieldset>
  );
}
