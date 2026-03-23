import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnimatedSelectionCount } from "../patterns/animated-selection-count";

describe("AnimatedSelectionCount", () => {
  describe("copy and variants", () => {
    it("renders plural items label when count !== 1", () => {
      render(<AnimatedSelectionCount count={3} />);
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("items selected")).toBeInTheDocument();
    });

    it("renders singular item label when count === 1", () => {
      render(<AnimatedSelectionCount count={1} />);
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("item selected")).toBeInTheDocument();
    });

    it("renders selected variant without items wording", () => {
      render(<AnimatedSelectionCount count={5} variant="selected" />);
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("selected")).toBeInTheDocument();
      expect(screen.queryByText(/items/)).not.toBeInTheDocument();
    });
  });

  describe("numeric stability and motion classes", () => {
    it("applies min-width tabular layout classes on the numeric cell", () => {
      const { container } = render(<AnimatedSelectionCount count={42} />);
      const numeric = container.querySelector(".min-w-\\[7ch\\]");
      expect(numeric).toBeInTheDocument();
      expect(numeric).toHaveClass("tabular-nums", "text-center");
    });

    it("includes enter animation classes for count changes", () => {
      const { container } = render(<AnimatedSelectionCount count={1} />);
      const numeric = container.querySelector(".min-w-\\[7ch\\]");
      expect(numeric).toHaveClass("animate-in", "fade-in-0", "zoom-in-95", "duration-150");
    });

    it("disables animation under motion-reduce", () => {
      const { container } = render(<AnimatedSelectionCount count={2} />);
      const numeric = container.querySelector(".min-w-\\[7ch\\]");
      expect(numeric).toHaveClass("motion-reduce:animate-none", "motion-reduce:transition-none");
    });

    it("remounts the numeric span when count changes (keyed by count)", () => {
      const { container, rerender } = render(<AnimatedSelectionCount count={1} />);
      const firstNumeric = container.querySelector(".min-w-\\[7ch\\]");
      expect(firstNumeric).toBeInTheDocument();

      rerender(<AnimatedSelectionCount count={2} />);
      const secondNumeric = container.querySelector(".min-w-\\[7ch\\]");
      expect(secondNumeric).toBeInTheDocument();
      expect(secondNumeric).not.toBe(firstNumeric);
    });
  });

  describe("danger tone", () => {
    it("applies destructive tone class when dangerTone is true", () => {
      const { container } = render(<AnimatedSelectionCount count={3} dangerTone />);
      const root = container.firstElementChild;
      expect(root).toHaveClass("text-destructive/90");
    });
  });

  describe("custom class names", () => {
    it("merges className and textClassName on the root", () => {
      const { container } = render(
        <AnimatedSelectionCount count={1} className="extra-root" textClassName="text-base" />
      );
      const root = container.firstElementChild;
      expect(root).toHaveClass("extra-root", "text-base");
    });
  });
});
