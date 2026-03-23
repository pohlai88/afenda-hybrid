import { ToolbarSkeleton } from "@/components/toolbar-skeleton";
import { DataZoneSkeleton } from "@/components/data-zone-skeleton";

export default function RecordLoading() {
  return (
    <div className="space-y-4 p-6">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <ToolbarSkeleton />
      <DataZoneSkeleton />
    </div>
  );
}
