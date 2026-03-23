import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "../patterns/status-badge";

const variants = [
  { status: "active" as const, label: "Active" },
  { status: "inactive" as const, label: "Inactive" },
  { status: "pending" as const, label: "Pending" },
  { status: "error" as const, label: "Error" },
  { status: "draft" as const, label: "Draft" },
  { status: "archived" as const, label: "Archived" },
] as const;

describe("StatusBadge", () => {
  describe("variants", () => {
    it.each(variants)("renders default label for %s", ({ status, label }) => {
      render(<StatusBadge status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
    });

    it.each(variants)("applies status-specific text class for %s", ({ status }) => {
      const { container } = render(<StatusBadge status={status} />);
      const root = container.firstElementChild;
      expect(root).toBeTruthy();
      if (status === "active") expect(root).toHaveClass("text-success");
      if (status === "inactive") expect(root).toHaveClass("text-neutral-500");
      if (status === "pending") expect(root).toHaveClass("text-warning");
      if (status === "error") expect(root).toHaveClass("text-destructive");
      if (status === "draft") expect(root).toHaveClass("text-neutral-500");
      if (status === "archived") expect(root).toHaveClass("text-neutral-500");
    });

    it.each(variants)("applies status-specific dot class for %s", ({ status }) => {
      const { container } = render(<StatusBadge status={status} />);
      const dot = container.querySelector(".rounded-full");
      expect(dot).toBeInTheDocument();
      if (status === "active") expect(dot).toHaveClass("bg-success");
      if (status === "inactive") expect(dot).toHaveClass("bg-neutral-400");
      if (status === "pending") expect(dot).toHaveClass("bg-warning");
      if (status === "error") expect(dot).toHaveClass("bg-destructive");
      if (status === "draft") expect(dot).toHaveClass("bg-neutral-400");
      if (status === "archived") expect(dot).toHaveClass("bg-neutral-400");
    });
  });

  it("uses custom label when provided", () => {
    render(<StatusBadge status="active" label="Published" />);
    expect(screen.getByText("Published")).toBeInTheDocument();
    expect(screen.queryByText("Active")).not.toBeInTheDocument();
  });

  it("marks the status dot as aria-hidden", () => {
    const { container } = render(<StatusBadge status="pending" />);
    const dot = container.querySelector(".rounded-full");
    expect(dot).toHaveAttribute("aria-hidden", "true");
  });

  it("merges className onto the root", () => {
    const { container } = render(<StatusBadge status="draft" className="ml-2" />);
    expect(container.firstElementChild).toHaveClass("ml-2");
  });
});
