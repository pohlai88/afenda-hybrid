/**
 * Layout Validation Tests
 *
 * Tests for the layout tree validator.
 */

import { describe, it, expect } from "vitest";
import { validateLayout } from "../metadata/layout";
import type { LayoutNode } from "../metadata/layout";
import type { ModelDef } from "../metadata/model-def";

describe("validateLayout", () => {
  const model: ModelDef = {
    version: 1,
    name: "employee",
    label: "Employee",
    fields: {
      name: { name: "name", label: "Name", type: "char" },
      email: { name: "email", label: "Email", type: "char" },
      age: { name: "age", label: "Age", type: "integer" },
      department: { name: "department", label: "Department", type: "selection", options: [] },
      notes: { name: "notes", label: "Notes", type: "text" },
    },
  };

  describe("valid layouts", () => {
    it("validates a simple field layout", () => {
      const layout: LayoutNode[] = [
        { kind: "field", name: "name" },
        { kind: "field", name: "email" },
      ];

      const result = validateLayout(layout, model);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("validates a group layout", () => {
      const layout: LayoutNode[] = [
        {
          kind: "group",
          direction: "vertical",
          title: "Personal Info",
          children: [
            { kind: "field", name: "name" },
            { kind: "field", name: "age" },
          ],
        },
      ];

      const result = validateLayout(layout, model);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("validates a notebook layout", () => {
      const layout: LayoutNode[] = [
        {
          kind: "notebook",
          pages: [
            {
              key: "info",
              label: "Info",
              children: [{ kind: "field", name: "name" }],
            },
            {
              key: "details",
              label: "Details",
              children: [{ kind: "field", name: "notes" }],
            },
          ],
        },
      ];

      const result = validateLayout(layout, model);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("validates separator nodes", () => {
      const layout: LayoutNode[] = [
        { kind: "field", name: "name" },
        { kind: "separator" },
        { kind: "field", name: "email" },
      ];

      const result = validateLayout(layout, model);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("validates nested groups", () => {
      const layout: LayoutNode[] = [
        {
          kind: "group",
          direction: "vertical",
          title: "Outer",
          children: [
            {
              kind: "group",
              direction: "vertical",
              title: "Inner",
              children: [{ kind: "field", name: "name" }],
            },
          ],
        },
      ];

      const result = validateLayout(layout, model);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe("invalid layouts", () => {
    it("detects unknown field references", () => {
      const layout: LayoutNode[] = [{ kind: "field", name: "unknown_field" }];

      const result = validateLayout(layout, model);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Unknown field "unknown_field"'))).toBe(true);
    });

    it("detects empty notebook pages", () => {
      const layout: LayoutNode[] = [
        {
          kind: "notebook",
          pages: [
            {
              key: "info",
              label: "Info",
              children: [],
            },
          ],
        },
      ];

      const result = validateLayout(layout, model);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("has no children"))).toBe(true);
    });

    it("detects empty groups", () => {
      const layout: LayoutNode[] = [
        {
          kind: "group",
          direction: "vertical",
          title: "Empty Group",
          children: [],
        },
      ];

      const result = validateLayout(layout, model);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("has no children"))).toBe(true);
    });

    it("detects excessive horizontal group fields", () => {
      const layout: LayoutNode[] = [
        {
          kind: "group",
          direction: "horizontal",
          children: [
            { kind: "field", name: "name" },
            { kind: "field", name: "email" },
            { kind: "field", name: "age" },
            { kind: "field", name: "department" },
          ],
        },
      ];

      const result = validateLayout(layout, model);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("max 3 allowed"))).toBe(true);
    });

    it("detects nested notebooks", () => {
      const layout: LayoutNode[] = [
        {
          kind: "notebook",
          pages: [
            {
              key: "outer",
              label: "Outer",
              children: [
                {
                  kind: "notebook",
                  pages: [
                    {
                      key: "inner",
                      label: "Inner",
                      children: [{ kind: "field", name: "name" }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];

      const result = validateLayout(layout, model);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("nested notebook"))).toBe(true);
    });
  });

  describe("complex scenarios", () => {
    it("validates a complex multi-level layout", () => {
      const layout: LayoutNode[] = [
        {
          kind: "notebook",
          pages: [
            {
              key: "personal",
              label: "Personal",
              children: [
                {
                  kind: "group",
                  direction: "vertical",
                  title: "Basic Info",
                  children: [
                    { kind: "field", name: "name" },
                    { kind: "field", name: "age" },
                  ],
                },
                { kind: "separator" },
                { kind: "field", name: "email" },
              ],
            },
            {
              key: "work",
              label: "Work",
              children: [
                { kind: "field", name: "department" },
                { kind: "field", name: "notes" },
              ],
            },
          ],
        },
      ];

      const result = validateLayout(layout, model);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("accumulates multiple errors", () => {
      const layout: LayoutNode[] = [
        { kind: "field", name: "unknown1" },
        { kind: "field", name: "unknown2" },
      ];

      const result = validateLayout(layout, model);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(2);
    });
  });
});
