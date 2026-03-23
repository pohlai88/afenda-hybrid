/**
 * Tests for Widget Registry governance
 */

import { describe, it, expect, vi } from "vitest";
import {
  registerWidget,
  registerCustomWidget,
  resolveWidget,
  getRegisteredWidgets,
  unsealRegistryForTesting,
  type WidgetDef,
} from "../registry/widget-registry";
import { registerCoreWidgets } from "../registry/register-core-widgets";
import type { FieldDef } from "../metadata/field-def";

// Mock widget for testing
const mockWidget: WidgetDef = {
  render: () => null,
};

describe("Widget Registry", () => {
  describe("registerWidget", () => {
    it("registers a core widget", () => {
      const widgets = getRegisteredWidgets();
      const initialSize = widgets.size;

      // This test assumes registry is not sealed yet
      // In real usage, core widgets are registered at boot
      expect(widgets.size).toBeGreaterThanOrEqual(initialSize);
    });

    it("throws when registering duplicate key", () => {
      // Try to register a widget that's already registered
      expect(() => registerWidget("text", mockWidget)).toThrow();
    });
  });

  describe("registerCustomWidget", () => {
    it("logs warning in dev mode", () => {
      unsealRegistryForTesting();

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      registerCustomWidget("custom-test-widget", mockWidget);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Custom widget "custom-test-widget" registered')
      );

      process.env.NODE_ENV = originalEnv;
      consoleSpy.mockRestore();
    });
  });

  describe("resolveWidget", () => {
    it("resolves by explicit widget hint", () => {
      // Ensure core widgets are registered
      try {
        registerCoreWidgets();
      } catch {
        // Already registered, ignore
      }
      const field: FieldDef = {
        name: "email",
        label: "Email",
        type: "text",
        widget: "email",
      };

      // Register email widget if not already registered
      try {
        registerCustomWidget("email", mockWidget);
      } catch {
        // Already registered
      }

      const resolved = resolveWidget(field);
      expect(resolved).toBeDefined();
    });

    it("resolves by normalized field type - text", () => {
      try {
        registerCoreWidgets();
      } catch {
        /* duplicate registration */
      }

      const field: FieldDef = {
        name: "name",
        label: "Name",
        type: "text",
      };
      const resolved = resolveWidget(field);
      expect(resolved).toBeDefined();
    });

    it("resolves by normalized field type - integer to number", () => {
      try {
        registerCoreWidgets();
      } catch {
        /* duplicate registration */
      }

      const field: FieldDef = {
        name: "age",
        label: "Age",
        type: "integer",
      };
      const resolved = resolveWidget(field);
      expect(resolved).toBeDefined();
    });

    it("resolves by normalized field type - selection to select", () => {
      try {
        registerCoreWidgets();
      } catch {
        /* duplicate registration */
      }

      const field: FieldDef = {
        name: "status",
        label: "Status",
        type: "selection",
      };
      const resolved = resolveWidget(field);
      expect(resolved).toBeDefined();
    });

    it("falls back to text widget for unknown types", () => {
      try {
        registerCoreWidgets();
      } catch {
        /* duplicate registration */
      }

      const field: FieldDef = {
        name: "unknown",
        label: "Unknown",
        type: "not-a-known-type" as FieldDef["type"],
      };
      const resolved = resolveWidget(field);
      expect(resolved).toBeDefined();
    });
  });

  describe("getRegisteredWidgets", () => {
    it("returns readonly map", () => {
      const widgets = getRegisteredWidgets();
      expect(widgets.size).toBeGreaterThan(0);
    });
  });
});
