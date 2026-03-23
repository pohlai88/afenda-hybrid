"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@afenda/ui-core/primitives/card";
import { Skeleton } from "@afenda/ui-core/primitives/skeleton";
import { AppModuleIcon } from "./app-module-icon";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@afenda/ui-core/lib/utils";
import {
  ERP_TYPO_KPI_VALUE,
  ERP_TYPO_META,
  ERP_TYPO_META_STRONG,
  ERP_TYPO_OVERLINE_LABEL,
} from "./erp-typography";
import { PATTERN_DENSE_MOTION } from "./pattern-chrome";

export interface MetricCardTrend {
  value: number;
  isPositive: boolean;
  label?: string;
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: string;
  color?: string;
  description?: string;
  trend?: MetricCardTrend;
  comparison?: {
    value: string | number;
    label: string;
  };
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Dashboard / toolbar KPI surface; primary value uses tabular numerals (Data Grid Standard §9.2;
 * Visual Density Standard §4.2 display / §4.3 numeric typography).
 */
export function MetricCard({
  title,
  value,
  icon,
  color,
  description,
  trend,
  comparison,
  loading = false,
  onClick,
  className,
}: MetricCardProps) {
  if (loading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-1" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  const content = (
    <>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={ERP_TYPO_OVERLINE_LABEL}>{title}</CardTitle>
        {icon && (
          <div
            className="rounded-full p-2"
            style={{
              backgroundColor: color ? `${color}15` : undefined,
              color: color || undefined,
            }}
            aria-hidden
          >
            <AppModuleIcon iconName={icon} size={16} />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className={ERP_TYPO_KPI_VALUE}>{value}</div>
        {comparison && (
          <p className={cn("mt-0.5 text-muted-foreground", ERP_TYPO_META)}>
            vs {comparison.value} {comparison.label}
          </p>
        )}
        {description && (
          <p className={cn("mt-1 text-muted-foreground", ERP_TYPO_META)}>{description}</p>
        )}
        {trend && (
          <div
            className={cn(
              "mt-2 inline-flex items-center gap-1",
              ERP_TYPO_META_STRONG,
              trend.value === 0
                ? "text-muted-foreground"
                : trend.isPositive
                  ? "text-success"
                  : "text-destructive"
            )}
          >
            {trend.value === 0 ? (
              <Minus className="h-3 w-3" aria-hidden />
            ) : trend.isPositive ? (
              <TrendingUp className="h-3 w-3" aria-hidden />
            ) : (
              <TrendingDown className="h-3 w-3" aria-hidden />
            )}
            {trend.isPositive && trend.value > 0 ? "+" : ""}
            {trend.value}%
            {trend.label && <span className="text-muted-foreground"> {trend.label}</span>}
          </div>
        )}
      </CardContent>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "block w-full text-left",
          PATTERN_DENSE_MOTION,
          "transition-shadow hover:shadow-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
      >
        <Card className={cn("overflow-hidden cursor-pointer", className)}>{content}</Card>
      </button>
    );
  }

  return <Card className={cn("overflow-hidden", className)}>{content}</Card>;
}
