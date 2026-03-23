import { ToolbarSkeleton } from "@/components/toolbar-skeleton";
import { DataZoneSkeleton } from "@/components/data-zone-skeleton";

export default function DynamicModelLoading() {
  return (
    <div className="space-y-4 p-6">
      <ToolbarSkeleton />
      <DataZoneSkeleton />
    </div>
  );
}
