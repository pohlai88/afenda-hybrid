"use client";

import * as React from "react";
import * as LucideIcons from "lucide-react";
import { cn } from "@afenda/ui-core/lib/utils";

export interface AppModuleIconProps {
  iconName: string;
  className?: string;
  size?: number;
}

function isRenderableLucideIcon(candidate: unknown): candidate is React.ElementType {
  if (candidate == null) return false;
  if (typeof candidate === "function") return true;
  return typeof candidate === "object" && "$$typeof" in candidate;
}

/** Resolves `lucide-react` icons by name for shell navigation; falls back to `HelpCircle`. */
export function AppModuleIcon({ iconName, className, size = 20 }: AppModuleIconProps) {
  const IconComponent = (LucideIcons as unknown as Record<string, unknown>)[iconName];

  if (!isRenderableLucideIcon(IconComponent)) {
    return <LucideIcons.HelpCircle className={cn(className)} size={size} />;
  }

  return <IconComponent className={cn(className)} size={size} />;
}
