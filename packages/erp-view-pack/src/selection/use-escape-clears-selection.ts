"use client";

import { useEffect } from "react";

/**
 * AFENDA Bulk Interaction Standard §6.2 — Escape clears selection when enabled.
 * Disable when a modal or command palette owns Escape.
 */
export function useEscapeClearsSelection(active: boolean, onClear: (() => void) | undefined): void {
  useEffect(() => {
    if (!active || !onClear) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (e.defaultPrevented) return;
      e.preventDefault();
      onClear();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active, onClear]);
}
