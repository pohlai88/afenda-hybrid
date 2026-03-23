"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../primitives/card";
import { Skeleton } from "../primitives/skeleton";
import { cn } from "../lib/utils";

export interface ChartContainerProps {
  title: string;
  subtitle?: string;
  source?: string;
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function ChartContainer({
  title,
  subtitle,
  source,
  loading = false,
  className,
  children,
  actions,
}: ChartContainerProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-0.5">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {subtitle && <CardDescription>{subtitle}</CardDescription>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[200px] items-center justify-center">
            <Skeleton className="h-full w-full rounded-md" />
          </div>
        ) : (
          <div className="min-h-[200px]">{children}</div>
        )}
        {source && <p className="mt-3 text-[10px] text-muted-foreground">Source: {source}</p>}
      </CardContent>
    </Card>
  );
}
