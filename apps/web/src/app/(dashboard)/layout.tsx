export const dynamic = "force-dynamic";

import * as React from "react";
import { getSession, getUserPermissions } from "@/lib/auth";
import { getAppModulesWithMenu } from "@/lib/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const permissions = await getUserPermissions(session.userId, session.tenantId);
  const modules = await getAppModulesWithMenu(session.tenantId, permissions);

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar modules={modules} />
      <div className="flex flex-1 flex-col overflow-hidden pl-64">
        <AppHeader
          user={{
            displayName: session.displayName,
            email: session.email,
            avatarUrl: null,
          }}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
