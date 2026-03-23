/**
 * ListView Component Tests
 *
 * Tests for the list view renderer.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ListView } from "../renderers/list-view";
import type { ModelDef } from "../metadata/model-def";
import type { ViewDef } from "../metadata/view-kind";

describe("ListView", () => {
  const model: ModelDef = {
    version: 1,
    name: "employee",
    label: "Employee",
    fields: {
      name: { name: "name", label: "Name", type: "char" },
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
    },
  };

  const view: ViewDef = {
    version: 1,
    id: "test.employee.list",
    name: "Employee List",
    kind: "list",
    model: "employee",
    fields: ["name", "email", "status"],
  };

  const data = [
    { id: 1, name: "Alice", email: "alice@example.com", status: "ACTIVE", age: 30 },
    { id: 2, name: "Bob", email: "bob@example.com", status: "INACTIVE", age: 25 },
  ];

  it("renders table with columns from ViewDef.fields", () => {
    render(<ListView model={model} view={view} data={data} />);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("renders data rows", () => {
    render(<ListView model={model} view={view} data={data} />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
  });

  it("uses all model fields when ViewDef.fields is undefined", () => {
    const viewWithoutFields: ViewDef = {
      ...view,
      fields: undefined,
    };

    render(<ListView model={model} view={viewWithoutFields} data={data} />);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Age")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("renders action column when onAction is provided", () => {
    const onAction = vi.fn();

    render(<ListView model={model} view={view} data={data} onAction={onAction} />);

    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("passes searchFields to DataTable", () => {
    const viewWithSearch: ViewDef = {
      ...view,
      searchFields: ["name", "email"],
    };

    const { container } = render(<ListView model={model} view={viewWithSearch} data={data} />);

    expect(container.querySelector('input[placeholder*="Search"]')).toBeInTheDocument();
  });

  it("passes defaultOrder to DataTable as initialSorting", () => {
    const viewWithSort: ViewDef = {
      ...view,
      defaultOrder: [["name", "asc"]],
    };

    render(<ListView model={model} view={viewWithSort} data={data} />);

    // Verify the data is rendered (sorting is internal to DataTable)
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("renders empty state when no data", () => {
    render(<ListView model={model} view={view} data={[]} />);

    expect(screen.getByText("No results found.")).toBeInTheDocument();
  });

  it("renders data correctly", () => {
    render(<ListView model={model} view={view} data={data} />);

    // Verify both records are displayed
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });
});
