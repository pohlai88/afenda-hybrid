import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../primitives/card";
import { AppModuleIcon } from "./app-module-icon";
import { cn } from "../lib/utils";

export interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: string;
  color?: string;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function MetricCard({
  title,
  value,
  icon,
  color,
  description,
  trend,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && (
          <div
            className="rounded-full p-2"
            style={{
              backgroundColor: color ? `${color}20` : undefined,
              color: color || undefined,
            }}
          >
            <AppModuleIcon iconName={icon} size={16} />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        {trend && (
          <p
            className={cn(
              "text-xs mt-1 font-medium",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}
          >
            {trend.isPositive ? "+" : ""}
            {trend.value}%
          </p>
        )}
      </CardContent>
    </Card>
  );
}
