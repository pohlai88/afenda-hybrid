import * as React from "react";
import * as LucideIcons from "lucide-react";
import { cn } from "../lib/utils";

export interface AppModuleIconProps {
  iconName: string;
  className?: string;
  size?: number;
}

export function AppModuleIcon({ iconName, className, size = 20 }: AppModuleIconProps) {
  const IconComponent = (
    LucideIcons as unknown as Record<
      string,
      React.ComponentType<{ className?: string; size?: number }>
    >
  )[iconName];

  if (!IconComponent || typeof IconComponent !== "function") {
    return <LucideIcons.HelpCircle className={cn(className)} size={size} />;
  }

  return <IconComponent className={cn(className)} size={size} />;
}
