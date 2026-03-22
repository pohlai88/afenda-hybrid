"use client";

import * as React from "react";
import { SidebarNav, type AppModule } from "@afenda/ui";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "@afenda/ui/hooks/use-sidebar";
import { Button } from "@afenda/ui";
import { Menu, X } from "lucide-react";
import { cn } from "@afenda/ui";

export interface AppSidebarProps {
  modules: AppModule[];
}

export function AppSidebar({ modules }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, toggle } = useSidebar();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!isCollapsed && <h1 className="text-xl font-bold text-primary">AFENDA</h1>}
        <Button variant="ghost" size="icon" onClick={toggle}>
          {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </Button>
      </div>
      <SidebarNav
        modules={modules}
        currentPath={pathname}
        isCollapsed={isCollapsed}
        onNavigate={(path) => router.push(path)}
      />
    </aside>
  );
}
