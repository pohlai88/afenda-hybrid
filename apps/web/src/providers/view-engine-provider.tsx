"use client";

import { useRef, type ReactNode } from "react";
import { registerErpWidgets } from "@afenda/erp-view-pack";
import { initializeViewEngine, isInitialized } from "@afenda/view-engine";

/**
 * Boots view-engine registries once per browser session (plan §4a / anti-patterns).
 */
export function ViewEngineProvider({ children }: { children: ReactNode }) {
  const bootedRef = useRef(false);
  if (!bootedRef.current && !isInitialized()) {
    registerErpWidgets();
    initializeViewEngine();
    bootedRef.current = true;
  }
  return <>{children}</>;
}
