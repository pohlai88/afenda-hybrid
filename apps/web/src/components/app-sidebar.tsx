"use client";

import { usePathname, useRouter } from "next/navigation";
import { SidebarNav } from "@afenda/erp-view-pack";
import type { AppModule } from "@afenda/erp-view-pack";

export function AppSidebar({ modules }: { modules: AppModule[] }) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-card">
      <SidebarNav
        modules={modules}
        currentPath={pathname}
        onNavigate={(path) => router.push(path)}
      />
    </aside>
  );
}
