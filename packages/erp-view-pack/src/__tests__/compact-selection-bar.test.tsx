import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@afenda/ui-core/primitives/button";
import { COMMAND_SURFACE_BULK_SELECTION } from "../patterns/command-surface-toolbar";
import { CompactSelectionBar } from "../patterns/compact-selection-bar";

describe("CompactSelectionBar", () => {
  it("returns null when selectedCount is 0", () => {
    const { container } = render(
      <CompactSelectionBar selectedCount={0}>
        <span>actions</span>
      </CompactSelectionBar>
    );
    expect(container.firstChild).toBeNull();
  });

  it("exposes a polite live status region", () => {
    render(
      <CompactSelectionBar selectedCount={2}>
        <span>Extra</span>
      </CompactSelectionBar>
    );
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveAttribute("aria-atomic", "true");
  });

  it("tags compact strip with data-afenda-command-surface", () => {
    render(
      <CompactSelectionBar selectedCount={2}>
        <span>x</span>
      </CompactSelectionBar>
    );
    expect(screen.getByRole("status")).toHaveAttribute(
      "data-afenda-command-surface",
      COMMAND_SURFACE_BULK_SELECTION
    );
  });

  it("exposes disabledReason with title and aria-disabled", () => {
    render(
      <CompactSelectionBar selectedCount={1} disabledReason="Read-only grid.">
        <span>x</span>
      </CompactSelectionBar>
    );
    const bar = screen.getByRole("status");
    expect(bar).toHaveAttribute("aria-disabled", "true");
    expect(bar).toHaveAttribute("title", "Read-only grid.");
  });

  it("renders selection count and children", () => {
    render(
      <CompactSelectionBar selectedCount={4}>
        <Button type="button" size="sm">
          Export
        </Button>
      </CompactSelectionBar>
    );
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("items selected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /export/i })).toBeInTheDocument();
  });

  it("marks the vertical rule as decorative", () => {
    const { container } = render(
      <CompactSelectionBar selectedCount={1}>
        <span>child</span>
      </CompactSelectionBar>
    );
    const divider = container.querySelector(".bg-border\\/70");
    expect(divider).toHaveAttribute("aria-hidden");
  });

  it("forwards interactions from action children", async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    render(
      <CompactSelectionBar selectedCount={2}>
        <Button type="button" size="sm" onClick={onExport}>
          Export
        </Button>
      </CompactSelectionBar>
    );
    await user.click(screen.getByRole("button", { name: /export/i }));
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it("merges className onto the bar", () => {
    const { container } = render(
      <CompactSelectionBar selectedCount={1} className="custom-bar">
        <span>x</span>
      </CompactSelectionBar>
    );
    expect(container.firstElementChild).toHaveClass("custom-bar");
  });

  it("renders clear control and calls onClear", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(
      <CompactSelectionBar selectedCount={2} onClear={onClear}>
        <span>a</span>
      </CompactSelectionBar>
    );
    await user.click(screen.getByRole("button", { name: /clear selection/i }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("applies destructive chrome when hasDestructiveAction", () => {
    const { container } = render(
      <CompactSelectionBar selectedCount={1} hasDestructiveAction>
        <span>x</span>
      </CompactSelectionBar>
    );
    expect(container.querySelector('[data-destructive=""]')).toBeInTheDocument();
  });

  it("sets data-destructive-severity for progressive emphasis", () => {
    const { container } = render(
      <CompactSelectionBar selectedCount={1} hasDestructiveAction destructiveSeverity="high">
        <span>x</span>
      </CompactSelectionBar>
    );
    expect(container.firstElementChild).toHaveAttribute("data-destructive-severity", "high");
  });

  it("clears on Escape when onClear is set", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(
      <CompactSelectionBar selectedCount={1} onClear={onClear}>
        <span>x</span>
      </CompactSelectionBar>
    );
    await user.keyboard("{Escape}");
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
