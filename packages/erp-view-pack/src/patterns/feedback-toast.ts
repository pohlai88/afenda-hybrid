/**
 * Maps standard feedback severity to Sonner toasts (`notification-system-feedback-standard.md` §2–3).
 * Prefer this over ad-hoc `toast()` calls in apps for cross-cutting consistency.
 */

import { toast } from "@afenda/ui-core/primitives/toast";

export type FeedbackSeverity = "neutral" | "success" | "warning" | "error";

export interface ShowFeedbackOptions {
  description?: string;
}

/**
 * Show an ephemeral toast aligned with ERP notification severity semantics.
 */
export function showFeedback(
  severity: FeedbackSeverity,
  title: string,
  options?: ShowFeedbackOptions
) {
  const { description } = options ?? {};
  const opts = description ? { description } : undefined;

  switch (severity) {
    case "neutral":
      return opts ? toast(title, opts) : toast(title);
    case "success":
      return toast.success(title, opts);
    case "warning":
      return toast.warning(title, opts);
    case "error":
      return toast.error(title, opts);
    default: {
      const _exhaustive: never = severity;
      return _exhaustive;
    }
  }
}
