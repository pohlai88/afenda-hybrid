"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface GridPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WidgetGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: number;
  gap?: number;
}

export function WidgetGrid({ children, className, columns = 12, gap = 4 }: WidgetGridProps) {
  return (
    <div
      className={cn("grid auto-rows-[minmax(100px,auto)]", className)}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: `${gap * 0.25}rem`,
      }}
    >
      {children}
    </div>
  );
}

export interface WidgetGridItemProps {
  children: React.ReactNode;
  position: GridPosition;
  className?: string;
}

export function WidgetGridItem({ children, position, className }: WidgetGridItemProps) {
  return (
    <div
      className={cn("overflow-hidden", className)}
      style={{
        gridColumn: `${position.x + 1} / span ${position.w}`,
        gridRow: `${position.y + 1} / span ${position.h}`,
      }}
    >
      {children}
    </div>
  );
}
