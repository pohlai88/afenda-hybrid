"use client";

import { useEffect, useCallback } from "react";

export interface KeyboardShortcutOptions {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  preventDefault?: boolean;
}

export function useKeyboardShortcut(
  shortcut: KeyboardShortcutOptions,
  callback: () => void,
  enabled: boolean = true
): void {
  const handler = useCallback(
    (e: KeyboardEvent) => {
      const matchesKey = e.key.toLowerCase() === shortcut.key.toLowerCase();
      const matchesCtrl = shortcut.ctrl ? e.ctrlKey : true;
      const matchesMeta = shortcut.meta ? e.metaKey : true;
      const matchesShift = shortcut.shift ? e.shiftKey : !e.shiftKey;
      const matchesAlt = shortcut.alt ? e.altKey : !e.altKey;

      if (matchesKey && matchesCtrl && matchesMeta && matchesShift && matchesAlt) {
        if (shortcut.preventDefault !== false) e.preventDefault();
        callback();
      }
    },
    [shortcut, callback]
  );

  useEffect(() => {
    if (!enabled) return;
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handler, enabled]);
}
