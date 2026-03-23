/**
 * View Engine Boot Sequence
 *
 * Initializes the widget and view registries.
 * Must be called once at application startup, before any rendering occurs.
 */

import { registerCoreWidgets } from "./register-core-widgets";
import { registerCoreViews } from "./register-core-views";
import { sealRegistry } from "./widget-registry";
import { sealViewRegistry } from "./view-registry";

let initialized = false;

/**
 * Initializes the view engine.
 * Registers core widgets, core views, and seals both registries.
 *
 * Call this once at application startup:
 * ```typescript
 * import { initializeViewEngine } from "@afenda/view-engine";
 *
 * initializeViewEngine();
 * ```
 *
 * For ERP applications, call `registerErpWidgets()` before `initializeViewEngine()`.
 */
export function initializeViewEngine(): void {
  if (initialized) {
    console.warn("[View Engine] Already initialized. Skipping.");
    return;
  }

  registerCoreWidgets();
  registerCoreViews();
  sealRegistry();
  sealViewRegistry();

  initialized = true;

  if (process.env.NODE_ENV !== "production") {
    console.log("[View Engine] Initialized successfully.");
  }
}

/**
 * Returns true if the view engine has been initialized.
 */
export function isInitialized(): boolean {
  return initialized;
}
