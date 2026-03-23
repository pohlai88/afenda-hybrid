import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorkflowStateBanner } from "../patterns/workflow-state-banner";

describe("WorkflowStateBanner", () => {
  it("renders title and maps pending to warning styling", () => {
    render(
      <WorkflowStateBanner
        status="pending"
        title="Awaiting sign-off"
        description="Sent to manager."
      />
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Awaiting sign-off")).toBeInTheDocument();
    expect(screen.getByText("Sent to manager.")).toBeInTheDocument();
    const alert = screen.getByRole("status");
    expect(alert.className).toMatch(/border-warning/);
  });

  it("maps blocked to destructive variant", () => {
    const { container } = render(<WorkflowStateBanner status="blocked" title="Blocked" />);
    expect(container.querySelector('[role="status"]')?.className).toMatch(/border-destructive/);
  });

  it("renders actions slot", () => {
    render(
      <WorkflowStateBanner
        status="info"
        title="Info"
        actions={<button type="button">Act</button>}
      />
    );
    expect(screen.getByRole("button", { name: "Act" })).toBeInTheDocument();
  });
});
