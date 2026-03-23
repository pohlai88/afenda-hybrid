import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActionBar } from "../patterns/action-bar";
import { StickyActionBar } from "../patterns/sticky-action-bar";
import { COMMAND_SURFACE_BULK_SELECTION } from "../patterns/command-surface-toolbar";
import { Button } from "@afenda/ui-core/primitives/button";

describe("ActionBar", () => {
  describe("rendering", () => {
    it("renders with selection count and actions", () => {
      render(
        <ActionBar selectedCount={3}>
          <Button size="sm">Delete</Button>
        </ActionBar>
      );
      expect(
        screen.getByText((content, element) => {
          return (
            element?.textContent === "3items selected" ||
            element?.textContent === "3 items selected"
          );
        })
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
    });

    it("tags bulk toolbar with data-afenda-command-surface (Command Surface Standard §7)", () => {
      render(
        <ActionBar selectedCount={2}>
          <Button size="sm">Go</Button>
        </ActionBar>
      );
      const bar = screen.getByRole("status");
      expect(bar).toHaveAttribute("data-afenda-command-surface", COMMAND_SURFACE_BULK_SELECTION);
    });

    it("renders singular label for count=1", () => {
      render(
        <ActionBar selectedCount={1}>
          <Button size="sm">Action</Button>
        </ActionBar>
      );
      expect(
        screen.getByText((content, element) => {
          return (
            element?.textContent === "1item selected" || element?.textContent === "1 item selected"
          );
        })
      ).toBeInTheDocument();
    });

    it("returns null when selectedCount is 0", () => {
      const { container } = render(
        <ActionBar selectedCount={0}>
          <Button size="sm">Action</Button>
        </ActionBar>
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders clear button when onClear provided", () => {
      render(
        <ActionBar selectedCount={2} onClear={() => {}}>
          <Button size="sm">Action</Button>
        </ActionBar>
      );
      expect(screen.getByRole("button", { name: /clear selection/i })).toBeInTheDocument();
    });

    it("does not render clear button when onClear omitted", () => {
      render(
        <ActionBar selectedCount={2}>
          <Button size="sm">Action</Button>
        </ActionBar>
      );
      expect(screen.queryByRole("button", { name: /clear selection/i })).not.toBeInTheDocument();
    });

    it("exposes disabledReason with title, aria-disabled, and sr-only text", () => {
      render(
        <ActionBar selectedCount={2} disabledReason="You cannot edit this selection.">
          <Button size="sm">Go</Button>
        </ActionBar>
      );
      const bar = screen.getByRole("status");
      expect(bar).toHaveAttribute("aria-disabled", "true");
      expect(bar).toHaveAttribute("title", "You cannot edit this selection.");
      expect(screen.getByText("You cannot edit this selection.")).toHaveClass("sr-only");
    });
  });

  describe("destructive mode", () => {
    it("applies destructive data attribute when hasDestructiveAction=true", () => {
      const { container } = render(
        <ActionBar selectedCount={2} hasDestructiveAction>
          <Button size="sm">Delete</Button>
        </ActionBar>
      );
      const bar = container.querySelector('[data-destructive=""]');
      expect(bar).toBeInTheDocument();
    });

    it("uses destructive-ghost variant for clear button in destructive mode", () => {
      render(
        <ActionBar selectedCount={2} onClear={() => {}} hasDestructiveAction>
          <Button size="sm">Delete</Button>
        </ActionBar>
      );
      const clearBtn = screen.getByRole("button", { name: /clear selection/i });
      expect(clearBtn.className).toContain("text-destructive");
    });

    it("sets data-destructive-severity=medium by default when destructive", () => {
      const { container } = render(
        <ActionBar selectedCount={2} hasDestructiveAction>
          <Button size="sm">Delete</Button>
        </ActionBar>
      );
      const bar = container.querySelector('[role="status"]');
      expect(bar).toHaveAttribute("data-destructive-severity", "medium");
    });

    it("sets data-destructive-severity for high and critical", () => {
      const { container: h } = render(
        <ActionBar selectedCount={2} hasDestructiveAction destructiveSeverity="high">
          <Button size="sm">Delete</Button>
        </ActionBar>
      );
      expect(h.querySelector('[role="status"]')).toHaveAttribute(
        "data-destructive-severity",
        "high"
      );

      const { container: c } = render(
        <ActionBar selectedCount={2} hasDestructiveAction destructiveSeverity="critical">
          <Button size="sm">Delete</Button>
        </ActionBar>
      );
      expect(c.querySelector('[role="status"]')).toHaveAttribute(
        "data-destructive-severity",
        "critical"
      );
    });

    it("omits destructive severity attribute when not destructive", () => {
      const { container } = render(
        <ActionBar selectedCount={2}>
          <Button size="sm">Action</Button>
        </ActionBar>
      );
      const bar = container.querySelector('[role="status"]');
      expect(bar).not.toHaveAttribute("data-destructive-severity");
    });

    it("announces high-severity consequence for screen readers", () => {
      render(
        <ActionBar selectedCount={2} hasDestructiveAction destructiveSeverity="high">
          <Button size="sm">Delete</Button>
        </ActionBar>
      );
      expect(screen.getByText(/High-impact bulk actions are available/i)).toBeInTheDocument();
    });
  });

  describe("variants", () => {
    it("renders floating variant by default", () => {
      const { container } = render(
        <ActionBar selectedCount={2}>
          <Button size="sm">Action</Button>
        </ActionBar>
      );
      const bar = container.querySelector('[role="status"]');
      expect(bar?.className).toContain("fixed");
      expect(bar?.className).toContain("left-1/2");
    });

    it("delegates to StickyActionBar for variant=sticky", () => {
      const { container } = render(
        <ActionBar selectedCount={2} variant="sticky">
          <Button size="sm">Action</Button>
        </ActionBar>
      );
      const bar = container.querySelector('[role="status"]');
      expect(bar?.className).toContain("sticky");
      expect(bar?.className).toContain("bottom-0");
    });

    it("passes disabledReason to StickyActionBar for variant sticky", () => {
      render(
        <ActionBar selectedCount={2} variant="sticky" disabledReason="No bulk permission">
          <Button size="sm">Action</Button>
        </ActionBar>
      );
      expect(screen.getByRole("status")).toHaveAttribute("title", "No bulk permission");
    });

    it("renders compact variant with left alignment", () => {
      const { container } = render(
        <ActionBar selectedCount={2} variant="compact">
          <Button size="sm">Action</Button>
        </ActionBar>
      );
      const bar = container.querySelector('[role="status"]');
      expect(bar?.className).toContain("left-[max(1rem,env(safe-area-inset-left))]");
    });
  });

  describe("interactions", () => {
    it("calls onClear when clear button clicked", async () => {
      const user = userEvent.setup();
      const onClear = vi.fn();
      render(
        <ActionBar selectedCount={3} onClear={onClear}>
          <Button size="sm">Action</Button>
        </ActionBar>
      );
      await user.click(screen.getByRole("button", { name: /clear selection/i }));
      expect(onClear).toHaveBeenCalledTimes(1);
    });

    it("calls onClear when Escape is pressed (Standard §6.2)", async () => {
      const user = userEvent.setup();
      const onClear = vi.fn();
      render(
        <ActionBar selectedCount={2} onClear={onClear}>
          <Button size="sm">Action</Button>
        </ActionBar>
      );
      await user.keyboard("{Escape}");
      expect(onClear).toHaveBeenCalledTimes(1);
    });

    it("does not call onClear on Escape when escapeClearsSelection is false", async () => {
      const user = userEvent.setup();
      const onClear = vi.fn();
      render(
        <ActionBar selectedCount={2} onClear={onClear} escapeClearsSelection={false}>
          <Button size="sm">Action</Button>
        </ActionBar>
      );
      await user.keyboard("{Escape}");
      expect(onClear).not.toHaveBeenCalled();
    });
  });

  describe("accessibility", () => {
    it("has live region attributes", () => {
      const { container } = render(
        <ActionBar selectedCount={2}>
          <Button size="sm">Action</Button>
        </ActionBar>
      );
      const bar = container.querySelector('[role="status"]');
      expect(bar).toHaveAttribute("aria-live", "polite");
      expect(bar).toHaveAttribute("aria-atomic", "true");
    });

    it("includes screen-reader scope hint when selectionScope is set", () => {
      render(
        <ActionBar selectedCount={2} selectionScope="filtered">
          <Button size="sm">Action</Button>
        </ActionBar>
      );
      expect(
        screen.getByText(/Selection scope: all rows matching the current filters/i)
      ).toBeInTheDocument();
    });
  });
});

describe("StickyActionBar", () => {
  it("exposes disabledReason on sticky bar", () => {
    render(
      <StickyActionBar selectedCount={2} disabledReason="Actions frozen while sync runs.">
        <Button size="sm">Go</Button>
      </StickyActionBar>
    );
    const bar = screen.getByRole("status");
    expect(bar).toHaveAttribute("aria-disabled", "true");
    expect(bar).toHaveAttribute("title", "Actions frozen while sync runs.");
  });

  it("uses command surface identifier on sticky bulk toolbar", () => {
    render(
      <StickyActionBar selectedCount={1} onClear={() => {}}>
        <Button size="sm">Act</Button>
      </StickyActionBar>
    );
    expect(screen.getByRole("status")).toHaveAttribute(
      "data-afenda-command-surface",
      COMMAND_SURFACE_BULK_SELECTION
    );
  });

  it("renders with sticky positioning", () => {
    const { container } = render(
      <StickyActionBar selectedCount={5} onClear={() => {}}>
        <Button size="sm">Action</Button>
      </StickyActionBar>
    );
    const bar = container.querySelector('[role="status"]');
    expect(bar?.className).toContain("sticky");
    expect(bar?.className).toContain("bottom-0");
  });

  it("returns null when selectedCount is 0", () => {
    const { container } = render(
      <StickyActionBar selectedCount={0}>
        <Button size="sm">Action</Button>
      </StickyActionBar>
    );
    expect(container.firstChild).toBeNull();
  });

  it("calls onClear when clear button clicked", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(
      <StickyActionBar selectedCount={3} onClear={onClear}>
        <Button size="sm">Action</Button>
      </StickyActionBar>
    );
    await user.click(screen.getByRole("button", { name: /clear selection/i }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("applies destructive styling when hasDestructiveAction=true", () => {
    const { container } = render(
      <StickyActionBar selectedCount={2} hasDestructiveAction>
        <Button size="sm">Delete</Button>
      </StickyActionBar>
    );
    const bar = container.querySelector('[data-destructive=""]');
    expect(bar).toBeInTheDocument();
  });

  it("sets data-destructive-severity when provided", () => {
    const { container } = render(
      <StickyActionBar selectedCount={2} hasDestructiveAction destructiveSeverity="critical">
        <Button size="sm">Delete</Button>
      </StickyActionBar>
    );
    expect(container.querySelector('[role="status"]')).toHaveAttribute(
      "data-destructive-severity",
      "critical"
    );
  });

  it("calls onClear when Escape is pressed", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(
      <StickyActionBar selectedCount={2} onClear={onClear}>
        <Button size="sm">Action</Button>
      </StickyActionBar>
    );
    await user.keyboard("{Escape}");
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
