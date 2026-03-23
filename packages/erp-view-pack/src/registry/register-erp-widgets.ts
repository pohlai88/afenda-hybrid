/**
 * ERP Widget Registration
 *
 * Registers ERP-specific widget overrides with `@afenda/view-engine` (**registry augmentation** /
 * Metadata-Driven View Composition Standard §7, §9 — not core engine patches).
 *
 * Call this **before** `initializeViewEngine()` so widgets are available when the registry is sealed.
 *
 * @see `../../../../docs/patterns/metadata-driven-view-composition-standard.md`
 */

import { registerCustomWidget } from "@afenda/view-engine";
import {
  ErpMoneyWidgetRender,
  ErpMoneyWidgetReadonly,
  ErpMoneyWidgetCell,
} from "../widgets/erp-money-widget";
import {
  ErpStatusBarWidgetRender,
  ErpStatusBarWidgetReadonly,
  ErpStatusBarWidgetCell,
} from "../widgets/erp-statusbar-widget";

/**
 * Registers all ERP widget overrides.
 * Must be called before initializeViewEngine().
 *
 * Usage:
 * ```typescript
 * import { registerErpWidgets } from "@afenda/erp-view-pack";
 * import { initializeViewEngine } from "@afenda/view-engine";
 *
 * registerErpWidgets();
 * initializeViewEngine();
 * ```
 */
export function registerErpWidgets(): void {
  // Override money widget with ERP-specific currency handling
  registerCustomWidget("money", {
    render: ErpMoneyWidgetRender,
    readonly: ErpMoneyWidgetReadonly,
    cell: ErpMoneyWidgetCell,
  });

  // Register statusbar widget for workflow fields
  registerCustomWidget("statusbar", {
    render: ErpStatusBarWidgetRender,
    readonly: ErpStatusBarWidgetReadonly,
    cell: ErpStatusBarWidgetCell,
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("[ERP View Pack] Registered ERP widget overrides.");
  }
}
