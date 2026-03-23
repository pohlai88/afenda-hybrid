"use client";

import * as React from "react";
import { Button } from "../primitives/button";
import { Badge } from "../primitives/badge";
import { Popover, PopoverContent, PopoverTrigger } from "../primitives/popover";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "../lib/utils";

export interface FilterChip {
  id: string;
  label: string;
  value: string;
}

export interface FilterBarProps {
  children: React.ReactNode;
  activeFilters?: FilterChip[];
  onClearFilter?: (id: string) => void;
  onClearAll?: () => void;
  moreFilters?: React.ReactNode;
  className?: string;
}

export function FilterBar({
  children,
  activeFilters = [],
  onClearFilter,
  onClearAll,
  moreFilters,
  className,
}: FilterBarProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        {moreFilters && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                More Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-80">
              {moreFilters}
            </PopoverContent>
          </Popover>
        )}
      </div>
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeFilters.map((filter) => (
            <Badge key={filter.id} variant="secondary" className="gap-1 pr-1">
              <span className="text-muted-foreground">{filter.label}:</span>
              {filter.value}
              {onClearFilter && (
                <button
                  onClick={() => onClearFilter(filter.id)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                  aria-label={`Remove ${filter.label} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
          {onClearAll && activeFilters.length > 1 && (
            <button
              onClick={onClearAll}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
