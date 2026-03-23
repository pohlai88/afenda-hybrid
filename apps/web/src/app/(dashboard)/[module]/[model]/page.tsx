import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageHeader } from "@afenda/ui-core/patterns/page-header";
import {
  gateDynamicModelRoute,
  loadModel,
  loadPermissionKeys,
  loadRecords,
  loadView,
  resolveRouteToModelKey,
  resolveViewIntentFromSearchParams,
} from "@/lib/metadata";
import type { ViewKind } from "@afenda/view-engine";
import { MetadataViewRenderer } from "@/components/metadata-view-renderer";
import { ToolbarSkeleton } from "@/components/toolbar-skeleton";
import { DataZoneSkeleton } from "@/components/data-zone-skeleton";
import { PHASE1_TENANT_ID, PHASE1_USER_ID } from "@/lib/phase1-context";

async function DynamicToolbar({ title, intent }: { title: string; intent: string }) {
  await Promise.resolve();
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-3">
      <p className="text-xs text-muted-foreground">
        View intent: <span className="font-medium text-foreground">{intent}</span> ·{" "}
        <span className="font-medium text-foreground">{title}</span>
      </p>
    </div>
  );
}

async function DynamicModelData({ modelName, intent }: { modelName: string; intent: ViewKind }) {
  const [resolvedModel, view, rows] = await Promise.all([
    loadModel(modelName),
    loadView(modelName, intent),
    loadRecords(modelName, PHASE1_TENANT_ID, PHASE1_USER_ID),
  ]);
  if (!resolvedModel || !view) return null;
  const data = intent === "form" ? (rows[0] ?? {}) : rows;
  return (
    <MetadataViewRenderer
      model={resolvedModel}
      view={view}
      data={data}
      modelName={modelName}
      userId={PHASE1_USER_ID}
    />
  );
}

type PageProps = {
  params: Promise<{ module: string; model: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toURLSearchParams(raw: Record<string, string | string[] | undefined>): URLSearchParams {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) sp.append(key, v);
    } else {
      sp.set(key, value);
    }
  }
  return sp;
}

export default async function DynamicModuleModelPage({ params, searchParams }: PageProps) {
  const { module, model } = await params;
  const rawSp = await searchParams;
  const sp = toURLSearchParams(rawSp);

  const permissionKeys = await loadPermissionKeys(PHASE1_TENANT_ID, PHASE1_USER_ID);
  const gated = await gateDynamicModelRoute(module, model, permissionKeys);

  if ("notFound" in gated || "forbidden" in gated) {
    notFound();
  }

  const { modelDef } = gated;
  const technicalName = resolveRouteToModelKey(module, model) || modelDef.name;

  const intent = resolveViewIntentFromSearchParams(sp, {
    hasRecordId: false,
  });

  return (
    <div className="space-y-4 p-6">
      <PageHeader title={modelDef.label} />
      <Suspense fallback={<ToolbarSkeleton />}>
        <DynamicToolbar title={modelDef.label} intent={intent} />
      </Suspense>
      <Suspense fallback={<DataZoneSkeleton />}>
        <DynamicModelData modelName={technicalName} intent={intent} />
      </Suspense>
    </div>
  );
}
