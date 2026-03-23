"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { cn } from "@afenda/ui-core/lib/utils";
import { AppModuleIcon } from "./app-module-icon";
import { Badge } from "@afenda/ui-core/primitives/badge";
import { ScrollArea } from "@afenda/ui-core/primitives/scroll-area";
import { Input } from "@afenda/ui-core/primitives/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@afenda/ui-core/primitives/tooltip";
import { ERP_TYPO_MICRO } from "./erp-typography";
import {
  NAVIGATION_SURFACE_MENU_ITEM_ACTIVE,
  NAVIGATION_SURFACE_MODULE_GROUP,
  NAVIGATION_SURFACE_SIDEBAR_RAIL,
  navigationSurfaceDataAttrs,
} from "./navigation-chrome";
import { PATTERN_DENSE_MOTION } from "./pattern-chrome";

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

/**
 * ERP application shell sidebar — `docs/patterns/cross-module-navigation-standard.md` §4 (primary rail),
 * §8 implementation reference; shell region context in `data-grid-interaction-standard.md` §3.1.
 * Dense chrome follows `erp-visual-density-typography-standard.md` (badge micro scale §4.2).
 */
export function SidebarNav({
  modules,
  currentPath = "",
  isCollapsed = false,
  onNavigate,
  className,
}: SidebarNavProps) {
  const [expandedModules, setExpandedModules] = React.useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    const activeModule = modules.find((m) =>
      m.menuItems.some((item) => currentPath.startsWith(item.routePath))
    );
    if (activeModule) {
      setExpandedModules((prev) => {
        const next = new Set(prev);
        next.add(activeModule.appModuleId);
        return next;
      });
    }
  }, [currentPath, modules]);

  const toggleModule = (moduleId: number) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  const filteredModules = React.useMemo(() => {
    if (!searchQuery) return modules;
    const q = searchQuery.toLowerCase();
    return modules
      .map((m) => ({
        ...m,
        menuItems: m.menuItems.filter(
          (item) => item.label.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)
        ),
      }))
      .filter((m) => m.menuItems.length > 0 || m.name.toLowerCase().includes(q));
  }, [modules, searchQuery]);

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const isActive = currentPath === item.routePath;
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.menuItemId}>
        <button
          type="button"
          onClick={() => onNavigate?.(item.routePath)}
          {...(isActive ? navigationSurfaceDataAttrs(NAVIGATION_SURFACE_MENU_ITEM_ACTIVE) : {})}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm",
            PATTERN_DENSE_MOTION,
            "transition-colors",
            isActive
              ? "bg-primary/10 font-medium text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            level > 0 && "ml-4"
          )}
          style={{ paddingLeft: `${0.75 + level * 1}rem` }}
        >
          {item.icon && !isCollapsed && <AppModuleIcon iconName={item.icon} size={14} />}
          {!isCollapsed && (
            <>
              <span className="flex-1 truncate text-left">{item.label}</span>
              {item.badgeCount !== undefined && item.badgeCount > 0 && (
                <Badge variant="secondary" className={cn("ml-auto px-1.5 py-0", ERP_TYPO_MICRO)}>
                  {item.badgeCount}
                </Badge>
              )}
              {hasChildren && <ChevronRight className="h-3 w-3 ml-auto" aria-hidden />}
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
    <TooltipProvider delayDuration={0}>
      <nav
        className={cn("flex h-full flex-col", className)}
        aria-label="Application modules"
        {...navigationSurfaceDataAttrs(NAVIGATION_SURFACE_SIDEBAR_RAIL)}
      >
        {!isCollapsed && (
          <div className="px-3 pb-2">
            <div className="relative">
              <Search
                className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                compact
                className="pl-8 h-7 text-xs"
                aria-label="Search navigation"
              />
            </div>
          </div>
        )}
        <ScrollArea className="flex-1 py-2">
          <div className="space-y-3 px-3">
            {filteredModules
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((module) => {
                const isExpanded = expandedModules.has(module.appModuleId);
                const hasActiveRoute = module.menuItems.some((item) =>
                  currentPath.startsWith(item.routePath)
                );
                const moduleMenuId = `module-menu-${module.appModuleId}`;

                if (isCollapsed) {
                  return (
                    <Tooltip key={module.appModuleId}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => {
                            const firstItem = module.menuItems
                              .filter((item) => !item.parentMenuItemId)
                              .sort((a, b) => a.sortOrder - b.sortOrder)[0];
                            if (firstItem) onNavigate?.(firstItem.routePath);
                          }}
                          {...(hasActiveRoute
                            ? navigationSurfaceDataAttrs(NAVIGATION_SURFACE_MENU_ITEM_ACTIVE)
                            : {})}
                          className={cn(
                            "flex w-full items-center justify-center rounded-md p-2",
                            PATTERN_DENSE_MOTION,
                            "transition-colors",
                            hasActiveRoute
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                          aria-label={module.name}
                        >
                          <div
                            className="rounded-md p-1"
                            style={{
                              backgroundColor: `${module.color}15`,
                            }}
                            aria-hidden
                          >
                            <AppModuleIcon iconName={module.icon} size={16} className="shrink-0" />
                          </div>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="font-medium">
                        {module.name}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return (
                  <div
                    key={module.appModuleId}
                    className="space-y-0.5"
                    {...navigationSurfaceDataAttrs(NAVIGATION_SURFACE_MODULE_GROUP)}
                  >
                    <button
                      type="button"
                      onClick={() => toggleModule(module.appModuleId)}
                      aria-expanded={isExpanded}
                      aria-controls={moduleMenuId}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider",
                        PATTERN_DENSE_MOTION,
                        "transition-colors",
                        hasActiveRoute
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div
                        className="rounded-md p-1"
                        style={{ backgroundColor: `${module.color}15` }}
                        aria-hidden
                      >
                        <AppModuleIcon iconName={module.icon} size={14} className="shrink-0" />
                      </div>
                      <span className="flex-1 text-left">{module.name}</span>
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3" aria-hidden />
                      ) : (
                        <ChevronRight className="h-3 w-3" aria-hidden />
                      )}
                    </button>
                    {isExpanded && (
                      <div id={moduleMenuId} className="space-y-0.5 ml-2">
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
      </nav>
    </TooltipProvider>
  );
}
