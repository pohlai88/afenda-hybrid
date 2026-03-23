import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageHeader } from "@afenda/ui-core/patterns/page-header";
import {
  gateDynamicModelRoute,
  loadModel,
  loadPermissionKeys,
  loadRecord,
  loadView,
  resolveRouteToModelKey,
  resolveViewIntentFromSearchParams,
} from "@/lib/metadata";
import { MetadataViewRenderer } from "@/components/metadata-view-renderer";
import { ToolbarSkeleton } from "@/components/toolbar-skeleton";
import { DataZoneSkeleton } from "@/components/data-zone-skeleton";
import { PHASE1_TENANT_ID, PHASE1_USER_ID } from "@/lib/phase1-context";
import type { ViewKind } from "@afenda/view-engine";

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

async function RecordToolbar({
  title,
  recordId,
  intent,
}: {
  title: string;
  recordId: string;
  intent: string;
}) {
  await Promise.resolve();
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-3">
      <p className="text-xs text-muted-foreground">
        Record <span className="font-mono text-foreground">{recordId}</span> · intent{" "}
        <span className="font-medium text-foreground">{intent}</span> · {title}
      </p>
    </div>
  );
}

async function RecordDataZone({
  modelName,
  recordId,
  intent,
}: {
  modelName: string;
  recordId: string;
  intent: ViewKind;
}) {
  const record = await loadRecord(modelName, PHASE1_TENANT_ID, recordId, PHASE1_USER_ID);
  if (!record) return null;

  const [resolvedModel, view] = await Promise.all([
    loadModel(modelName),
    loadView(modelName, intent),
  ]);
  if (!resolvedModel || !view) return null;

  return (
    <MetadataViewRenderer
      model={resolvedModel}
      view={view}
      data={record}
      modelName={modelName}
      userId={PHASE1_USER_ID}
    />
  );
}

type PageProps = {
  params: Promise<{ module: string; model: string; recordId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DynamicRecordPage({ params, searchParams }: PageProps) {
  const { module, model, recordId } = await params;
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
    hasRecordId: true,
  });

  return (
    <div className="space-y-4 p-6">
      <PageHeader title={`${modelDef.label} · #${recordId}`} />
      <Suspense fallback={<ToolbarSkeleton />}>
        <RecordToolbar title={modelDef.label} recordId={recordId} intent={intent} />
      </Suspense>
      <Suspense fallback={<DataZoneSkeleton />}>
        <RecordDataZone modelName={technicalName} recordId={recordId} intent={intent} />
      </Suspense>
    </div>
  );
}
