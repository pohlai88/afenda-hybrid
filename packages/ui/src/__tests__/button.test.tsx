import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "../primitives/button";

describe("Button", () => {
  it("renders with default variant", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });

  it("renders with different variants", () => {
    const { rerender } = render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Outline");
  });

  it("renders with different sizes", () => {
    render(<Button size="sm">Small</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Small");
  });

  it("handles disabled state", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
