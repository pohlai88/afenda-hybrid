export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { db } from "@afenda/db/src/db";
import { DataTable, type Column, Badge } from "@afenda/ui";
import { redirect } from "next/navigation";

interface Employee extends Record<string, unknown> {
  employeeId: number;
  employeeCode: string;
  status: string;
  hireDate: Date | string;
}

export default async function EmployeesPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { employees } = await import("@afenda/db/src/schema-hrm/hr/fundamentals/employees");
  const { eq, asc } = await import("drizzle-orm");

  const employeeList = await db
    .select()
    .from(employees)
    .where(eq(employees.tenantId, session.tenantId))
    .orderBy(asc(employees.employeeCode))
    .limit(100);

  const columns: Column<Employee>[] = [
    {
      id: "employeeCode",
      header: "Code",
      accessorKey: "employeeCode",
      sortable: true,
      filterable: true,
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      cell: (row) => (
        <Badge variant={row.status === "ACTIVE" ? "default" : "secondary"}>{row.status}</Badge>
      ),
      sortable: true,
    },
    {
      id: "hireDate",
      header: "Hire Date",
      accessorKey: "hireDate",
      cell: (row) => new Date(row.hireDate).toLocaleDateString(),
      sortable: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
        <p className="text-muted-foreground">Manage employee records and information</p>
      </div>

      <DataTable data={employeeList as unknown as Employee[]} columns={columns} pageSize={20} />
    </div>
  );
}
