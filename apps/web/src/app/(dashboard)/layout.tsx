import { type ReactNode } from "react";
import { ViewEngineProvider } from "@/providers/view-engine-provider";
import { PermissionProvider } from "@/providers/permission-context";
import { loadNavigation, loadPermissionKeyList, loadSession } from "@/lib/metadata";
import { AppSidebar } from "@/components/app-sidebar";
import { mapNavModulesToSidebar } from "@/components/map-nav-modules";
import { PHASE1_TENANT_ID, PHASE1_USER_ID } from "@/lib/phase1-context";

/** DB-backed nav + pages must not prerender at `next build` without a live database. */
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
  const [session, keyList, navTree] = await Promise.all([
    loadSession(),
    loadPermissionKeyList(PHASE1_TENANT_ID, PHASE1_USER_ID),
    loadNavigation(PHASE1_TENANT_ID, PHASE1_USER_ID),
  ]);

  void session;

  return (
    <PermissionProvider keys={keyList}>
      <ViewEngineProvider>
        <div className="flex h-screen min-h-0 w-full overflow-hidden bg-background">
          <AppSidebar modules={mapNavModulesToSidebar(navTree)} />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <main className="min-h-0 flex-1 overflow-auto">{children}</main>
          </div>
        </div>
      </ViewEngineProvider>
    </PermissionProvider>
  );
}
