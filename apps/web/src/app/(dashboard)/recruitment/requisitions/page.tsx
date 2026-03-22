export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { db } from "@afenda/db/src/db";
import { DataTable, type Column, Badge } from "@afenda/ui";
import { redirect } from "next/navigation";

interface JobRequisition extends Record<string, unknown> {
  jobRequisitionId: number;
  requisitionCode: string;
  status: string;
  createdAt: Date | string;
}

export default async function JobRequisitionsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { jobRequisitions } =
    await import("@afenda/db/src/schema-hrm/recruitment/operations/jobRequisitions");
  const { eq, desc } = await import("drizzle-orm");

  const requisitions = await db
    .select()
    .from(jobRequisitions)
    .where(eq(jobRequisitions.tenantId, session.tenantId))
    .orderBy(desc(jobRequisitions.createdAt))
    .limit(50);

  const columns: Column<JobRequisition>[] = [
    {
      id: "requisitionCode",
      header: "Code",
      accessorKey: "requisitionCode",
      sortable: true,
      filterable: true,
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      cell: (row) => {
        const variant =
          row.status === "OPEN" ? "default" : row.status === "FILLED" ? "secondary" : "outline";
        return <Badge variant={variant}>{row.status}</Badge>;
      },
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
        <h1 className="text-3xl font-bold tracking-tight">Job Requisitions</h1>
        <p className="text-muted-foreground">Manage open positions and hiring requests</p>
      </div>

      <DataTable
        data={requisitions as unknown as JobRequisition[]}
        columns={columns}
        pageSize={20}
      />
    </div>
  );
}
