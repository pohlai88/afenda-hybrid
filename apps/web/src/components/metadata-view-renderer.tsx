"use client";

import { useCallback, useState, useTransition } from "react";
import { resolveView } from "@afenda/view-engine";
import type { ConditionContext, ModelDef, ViewDef, ViewKind } from "@afenda/view-engine";
import { useEligibilityForModel } from "@/providers/permission-context";
import { eligibilityToConditionContext } from "@/lib/metadata/permission-utils";
import { executeModelAction } from "@/lib/actions/model-action-dispatcher";

interface MetadataViewRendererProps {
  model: ModelDef;
  view: ViewDef;
  data: unknown;
  modelName: string;
  userId: number;
}

export function MetadataViewRenderer({
  model,
  view,
  data,
  modelName,
  userId,
}: MetadataViewRendererProps) {
  const eligibility = useEligibilityForModel(modelName);
  const conditionContext: ConditionContext = eligibilityToConditionContext(eligibility, userId);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  const handleAction = useCallback(
    async (action: string, records: unknown[]) => {
      setActionError(null);
      startTransition(async () => {
        try {
          const result = await executeModelAction(modelName, action, records);
          if (!result.ok) {
            setActionError(result.message ?? "Action failed");
          }
        } catch (err) {
          setActionError(err instanceof Error ? err.message : "An unexpected error occurred");
        }
      });
    },
    [modelName]
  );

  const viewKind = view.kind as ViewKind;
  const Renderer = resolveView(viewKind);

  return (
    <div className="relative">
      {actionError && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <span className="font-medium">Error:</span> {actionError}
          <button
            type="button"
            className="ml-2 text-xs underline"
            onClick={() => setActionError(null)}
          >
            Dismiss
          </button>
        </div>
      )}
      {isPending && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      <Renderer
        model={model}
        view={view}
        data={data}
        conditionContext={conditionContext}
        onAction={handleAction}
      />
    </div>
  );
}
