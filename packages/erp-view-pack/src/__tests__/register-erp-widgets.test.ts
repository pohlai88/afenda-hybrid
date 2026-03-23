/**
 * ERP Widget Registration Tests
 *
 * Tests for the ERP widget registration function.
 */

import { describe, it, expect } from "vitest";
import { registerErpWidgets } from "../registry/register-erp-widgets";
import { resolveWidget } from "@afenda/view-engine/registry/widget-registry";
import type { FieldDef } from "@afenda/view-engine";

describe("registerErpWidgets", () => {
  it("registers ERP widgets and resolves them correctly", () => {
    // Register ERP widgets (idempotent - may already be registered from setup)
    expect(() => registerErpWidgets()).not.toThrow();

    // Test money widget resolution
    const moneyField: FieldDef = {
      name: "salary",
      label: "Salary",
      type: "monetary",
    };
    const moneyWidget = resolveWidget(moneyField);
    expect(moneyWidget).toBeDefined();
    expect(moneyWidget.render).toBeDefined();

    // Test statusbar widget resolution
    const statusField: FieldDef = {
      name: "state",
      label: "State",
      type: "selection",
      widget: "statusbar",
      options: [
        { value: "DRAFT", label: "Draft" },
        { value: "DONE", label: "Done" },
      ],
    };
    const statusWidget = resolveWidget(statusField);
    expect(statusWidget).toBeDefined();
    expect(statusWidget.render).toBeDefined();
  });

  it("ERP widgets take precedence over core widgets", () => {
    // This tests the boot conflict fix from Phase 1
    // ERP widgets registered via registerCustomWidget should take precedence
    const moneyField: FieldDef = {
      name: "salary",
      label: "Salary",
      type: "monetary",
    };

    const widget = resolveWidget(moneyField);
    expect(widget).toBeDefined();
    // The ERP money widget should be resolved (not the core one)
    expect(widget.render.name).toBe("ErpMoneyWidgetRender");
  });
});
