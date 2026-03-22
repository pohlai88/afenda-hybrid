export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { db } from "@afenda/db/src/db";
import { DataTable, type Column } from "@afenda/ui";
import { redirect } from "next/navigation";

interface Organization extends Record<string, unknown> {
  organizationId: number;
  orgCode: string;
  name: string;
  status: string;
  createdAt: Date;
}

export default async function OrganizationsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { organizations: orgsTable } =
    await import("@afenda/db/src/schema-platform/core/organizations");
  const { eq, asc } = await import("drizzle-orm");

  const organizations = await db
    .select()
    .from(orgsTable)
    .where(eq(orgsTable.tenantId, session.tenantId))
    .orderBy(asc(orgsTable.name));

  const columns: Column<Organization>[] = [
    {
      id: "orgCode",
      header: "Code",
      accessorKey: "orgCode",
      sortable: true,
      filterable: true,
    },
    {
      id: "name",
      header: "Name",
      accessorKey: "name",
      sortable: true,
      filterable: true,
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      sortable: true,
    },
    {
      id: "createdAt",
      header: "Created",
      accessorKey: "createdAt",
      cell: (row) => new Date(row.createdAt).toLocaleDateString(),
      sortable: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
        <p className="text-muted-foreground">Manage organizational units and structures</p>
      </div>

      <DataTable
        data={organizations as unknown as Organization[]}
        columns={columns}
        pageSize={20}
      />
    </div>
  );
}
