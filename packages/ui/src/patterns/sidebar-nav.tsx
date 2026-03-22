"use client";

import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import { AppModuleIcon } from "./app-module-icon";
import { Badge } from "../primitives/badge";
import { ScrollArea } from "../primitives/scroll-area";

export interface MenuItem {
  menuItemId: number;
  code: string;
  label: string;
  icon?: string;
  routePath: string;
  parentMenuItemId?: number | null;
  sortOrder: number;
  badgeCount?: number;
  children?: MenuItem[];
}

export interface AppModule {
  appModuleId: number;
  code: string;
  name: string;
  icon: string;
  color: string;
  basePath: string;
  sortOrder: number;
  menuItems: MenuItem[];
}

export interface SidebarNavProps {
  modules: AppModule[];
  currentPath?: string;
  isCollapsed?: boolean;
  onNavigate?: (path: string) => void;
  className?: string;
}

export function SidebarNav({
  modules,
  currentPath = "",
  isCollapsed = false,
  onNavigate,
  className,
}: SidebarNavProps) {
  const [expandedModules, setExpandedModules] = React.useState<Set<number>>(new Set());

  const toggleModule = (moduleId: number) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const isActive = currentPath === item.routePath;
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.menuItemId}>
        <button
          onClick={() => onNavigate?.(item.routePath)}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
            isActive
              ? "bg-primary text-primary-foreground"
              : "hover:bg-accent hover:text-accent-foreground",
            level > 0 && "ml-4"
          )}
          style={{ paddingLeft: `${0.75 + level * 1}rem` }}
        >
          {item.icon && !isCollapsed && <AppModuleIcon iconName={item.icon} size={16} />}
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              {item.badgeCount !== undefined && item.badgeCount > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {item.badgeCount}
                </Badge>
              )}
              {hasChildren && <ChevronRight className="h-4 w-4 ml-auto" />}
            </>
          )}
        </button>
        {hasChildren &&
          !isCollapsed &&
          item.children?.map((child) => renderMenuItem(child, level + 1))}
      </div>
    );
  };

  return (
    <ScrollArea className={cn("h-full py-4", className)}>
      <div className="space-y-4 px-3">
        {modules
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((module) => {
            const isExpanded = expandedModules.has(module.appModuleId);
            const hasActiveRoute = module.menuItems.some((item) =>
              currentPath.startsWith(item.routePath)
            );

            return (
              <div key={module.appModuleId} className="space-y-1">
                <button
                  onClick={() => toggleModule(module.appModuleId)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                    hasActiveRoute
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="rounded-md p-1" style={{ backgroundColor: `${module.color}20` }}>
                    <AppModuleIcon iconName={module.icon} size={16} className="shrink-0" />
                  </div>
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left">{module.name}</span>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </>
                  )}
                </button>
                {isExpanded && !isCollapsed && (
                  <div className="space-y-1 ml-2">
                    {module.menuItems
                      .filter((item) => !item.parentMenuItemId)
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((item) => renderMenuItem(item))}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </ScrollArea>
  );
}
