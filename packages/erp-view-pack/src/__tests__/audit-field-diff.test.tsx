import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuditFieldDiff } from "../patterns/audit-field-diff";

describe("AuditFieldDiff", () => {
  it("exposes a labelled group for the field change", () => {
    render(<AuditFieldDiff label="Status" before="Draft" after="Posted" />);
    expect(screen.getByRole("group", { name: /status change/i })).toBeInTheDocument();
  });

  it("renders before and after values", () => {
    render(<AuditFieldDiff label="Amount" before="$0" after="$100" />);
    expect(screen.getByText("$0")).toBeInTheDocument();
    expect(screen.getByText("$100")).toBeInTheDocument();
  });

  it("omits strike-through when omitStrikeThrough is true", () => {
    render(<AuditFieldDiff label="Note" before="(empty)" after="Hello" omitStrikeThrough />);
    const beforeEl = screen.getByText("(empty)");
    expect(beforeEl.className).toContain("text-muted-foreground");
    expect(beforeEl.className).not.toContain("line-through");
  });

  it("announces previous and new values to screen readers", () => {
    render(<AuditFieldDiff label="Code" before="A" after="B" />);
    expect(screen.getByText("Previous value:")).toHaveClass("sr-only");
    expect(screen.getByText("New value:")).toHaveClass("sr-only");
  });
});
