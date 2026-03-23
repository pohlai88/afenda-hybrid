"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@afenda/ui-core/lib/utils";
import {
  ERP_TYPO_KPI_VALUE,
  ERP_TYPO_META_STRONG,
  ERP_TYPO_OVERLINE_LABEL,
} from "./erp-typography";
import { PATTERN_DENSE_MOTION } from "./pattern-chrome";

export interface StatItem {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export interface StatGroupProps {
  stats: StatItem[];
  className?: string;
}

/**
 * Compact horizontal KPI row; values use tabular numerals (Data Grid Standard §9.2;
 * Visual Density Standard §4.2–4.3).
 */
export function StatGroup({ stats, className }: StatGroupProps) {
  return (
    <div
      className={cn(
        "flex items-center divide-x rounded-lg border bg-card p-4",
        PATTERN_DENSE_MOTION,
        className
      )}
    >
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 px-4",
            idx === 0 && "pl-0",
            idx === stats.length - 1 && "pr-0"
          )}
        >
          <span className={ERP_TYPO_OVERLINE_LABEL}>{stat.label}</span>
          <span className={ERP_TYPO_KPI_VALUE}>{stat.value}</span>
          {stat.trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5",
                ERP_TYPO_META_STRONG,
                stat.trend.value === 0
                  ? "text-muted-foreground"
                  : stat.trend.isPositive
                    ? "text-success"
                    : "text-destructive"
              )}
            >
              {stat.trend.value === 0 ? (
                <Minus className="h-3 w-3" aria-hidden />
              ) : stat.trend.isPositive ? (
                <TrendingUp className="h-3 w-3" aria-hidden />
              ) : (
                <TrendingDown className="h-3 w-3" aria-hidden />
              )}
              {stat.trend.isPositive && stat.trend.value > 0 ? "+" : ""}
              {stat.trend.value}%
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
