import type { ViewKind } from "@afenda/view-engine";

/**
 * URL-level view intent — mirrors Odoo `ir.actions.act_window` view_mode.
 * `analytics` is reserved; maps to `list` until a dedicated renderer exists (plan Phase 4).
 */
export type ViewIntent = ViewKind | "analytics";

const VIEW_KINDS: ReadonlySet<string> = new Set(["list", "form", "kanban"]);

export function isViewKind(value: string): value is ViewKind {
  return VIEW_KINDS.has(value);
}

export function resolveViewIntentFromSearchParams(
  searchParams: URLSearchParams,
  options: { hasRecordId: boolean }
): ViewKind {
  const raw = searchParams.get("view");
  if (raw === "analytics") return "list";

  if (options.hasRecordId) {
    if (raw === "kanban") return "kanban";
    if (raw === "list") return "form";
    if (raw && isViewKind(raw)) return raw;
    return "form";
  }

  if (raw === "form") return "list";
  if (raw === "kanban") return "kanban";
  if (raw && isViewKind(raw)) return raw;
  return "list";
}
