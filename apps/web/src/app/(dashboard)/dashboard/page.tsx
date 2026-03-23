import Link from "next/link";
import { PageHeader } from "@afenda/ui-core/patterns/page-header";
import { Button } from "@afenda/ui-core/primitives/button";

export default function DashboardHomePage() {
  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Dashboard"
        description="Metadata-driven ERP shell — start from a module below."
      />
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="default">
          <Link href="/hr/employees">Employees</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/core/organizations">Organizations</Link>
        </Button>
      </div>
    </div>
  );
}
