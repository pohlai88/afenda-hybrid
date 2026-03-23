/**
 * FormView Component Tests
 *
 * Tests for the form view renderer.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormView } from "../renderers/form-view";
import type { ModelDef } from "../metadata/model-def";
import type { ViewDef } from "../metadata/view-kind";

describe("FormView", () => {
  const model: ModelDef = {
    version: 1,
    name: "employee",
    label: "Employee",
    fields: {
      name: { name: "name", label: "Name", type: "char", required: true },
      email: { name: "email", label: "Email", type: "char" },
      age: { name: "age", label: "Age", type: "integer" },
      status: {
        name: "status",
        label: "Status",
        type: "selection",
        options: [
          { value: "ACTIVE", label: "Active" },
          { value: "INACTIVE", label: "Inactive" },
        ],
      },
      computed_field: {
        name: "computed_field",
        label: "Computed",
        type: "char",
        compute: { deps: ["name"], compute: "compute_display_name" },
      },
    },
  };

  const view: ViewDef = {
    version: 1,
    id: "test.employee.form",
    name: "Employee Form",
    kind: "form",
    model: "employee",
  };

  it("renders form fields from model", () => {
    render(
      <FormView model={model} view={view} data={{ name: "Alice", email: "alice@example.com" }} />
    );

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("renders computed field as readonly with badge", () => {
    render(<FormView model={model} view={view} data={{ computed_field: "Alice (Employee)" }} />);

    const computedElements = screen.getAllByText("Computed");
    expect(computedElements).toHaveLength(2);
    const badge = computedElements.find((el) => el.classList.contains("absolute"));
    expect(badge).toBeInTheDocument();
  });

  it("evaluates field conditions", () => {
    const conditionalModel: ModelDef = {
      ...model,
      fields: {
        ...model.fields,
        conditional_field: {
          name: "conditional_field",
          label: "Conditional",
          type: "char",
          invisible: { field: "status", op: "eq", value: "INACTIVE" },
        },
      },
    };

    const { unmount } = render(
      <FormView model={conditionalModel} view={view} data={{ status: "ACTIVE" }} />
    );

    expect(screen.getByText("Conditional")).toBeInTheDocument();

    unmount();

    render(<FormView model={conditionalModel} view={view} data={{ status: "INACTIVE" }} />);

    expect(screen.queryByText("Conditional")).not.toBeInTheDocument();
  });

  it("renders custom layout when provided", () => {
    const viewWithLayout: ViewDef = {
      ...view,
      layout: [
        {
          kind: "group",
          direction: "vertical",
          title: "Personal Info",
          children: [
            { kind: "field", name: "name" },
            { kind: "field", name: "email" },
          ],
        },
      ],
    };

    render(<FormView model={model} view={viewWithLayout} data={{}} />);

    expect(screen.getByText("Personal Info")).toBeInTheDocument();
  });

  it("renders notebook layout with tabs", () => {
    const viewWithNotebook: ViewDef = {
      ...view,
      layout: [
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
              children: [{ kind: "field", name: "email" }],
            },
          ],
        },
      ],
    };

    render(<FormView model={model} view={viewWithNotebook} data={{}} />);

    expect(screen.getByText("Info")).toBeInTheDocument();
    expect(screen.getByText("Details")).toBeInTheDocument();
  });

  it("filters notebook pages by invisible condition", () => {
    const viewWithConditionalPages: ViewDef = {
      ...view,
      layout: [
        {
          kind: "notebook",
          pages: [
            {
              key: "info",
              label: "Info",
              children: [{ kind: "field", name: "name" }],
            },
            {
              key: "admin",
              label: "Admin",
              children: [{ kind: "field", name: "email" }],
              invisible: { field: "status", op: "ne", value: "ACTIVE" },
            },
          ],
        },
      ],
    };

    const { unmount } = render(
      <FormView model={model} view={viewWithConditionalPages} data={{ status: "ACTIVE" }} />
    );

    expect(screen.getByText("Admin")).toBeInTheDocument();

    unmount();

    render(
      <FormView model={model} view={viewWithConditionalPages} data={{ status: "INACTIVE" }} />
    );

    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });

  it("renders save and cancel buttons", () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onCancel = vi.fn();

    render(
      <FormView
        model={model}
        view={view}
        data={{ name: "Alice" }}
        onSave={onSave}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("logs layout validation errors in development", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const invalidView: ViewDef = {
      ...view,
      layout: [{ kind: "field", name: "unknown_field" }],
    };

    render(<FormView model={model} view={invalidView} data={{}} />);

    expect(consoleError).toHaveBeenCalledWith(
      "[FormView] Invalid layout:",
      expect.arrayContaining([expect.stringContaining("unknown_field")])
    );

    consoleError.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });
});
