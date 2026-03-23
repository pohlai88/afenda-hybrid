import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecordStatusBar } from "../patterns/record-status-bar";
import type { RecordState } from "../patterns/record-status-bar";

const mockStates: RecordState[] = [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected", folded: true },
  { value: "completed", label: "Completed" },
];

describe("RecordStatusBar", () => {
  describe("rendering", () => {
    it("renders all non-folded states", () => {
      render(<RecordStatusBar states={mockStates} current="draft" />);
      expect(screen.getByText("Draft")).toBeInTheDocument();
      expect(screen.getByText("Submitted")).toBeInTheDocument();
      expect(screen.getByText("Approved")).toBeInTheDocument();
      expect(screen.getByText("Completed")).toBeInTheDocument();
    });

    it("hides folded states unless current", () => {
      render(<RecordStatusBar states={mockStates} current="draft" />);
      expect(screen.queryByText("Rejected")).not.toBeInTheDocument();
    });

    it("shows folded state when it is current", () => {
      render(<RecordStatusBar states={mockStates} current="rejected" />);
      expect(screen.getByText("Rejected")).toBeInTheDocument();
    });
  });

  describe("pill variant", () => {
    it("renders pill variant by default", () => {
      const { container } = render(<RecordStatusBar states={mockStates} current="submitted" />);
      const buttons = container.querySelectorAll("button.rounded-full");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("highlights current state with primary background", () => {
      render(<RecordStatusBar states={mockStates} current="submitted" />);
      const currentButton = screen.getByRole("radio", { checked: true });
      expect(currentButton.className).toContain("bg-primary");
      expect(currentButton.className).toContain("text-primary-foreground");
    });

    it("styles past states differently", () => {
      render(<RecordStatusBar states={mockStates} current="approved" />);
      const draftButton = screen.getByRole("radio", { name: "Draft" });
      expect(draftButton.className).toContain("bg-primary/10");
      expect(draftButton.className).toContain("text-primary");
    });

    it("styles future states as muted", () => {
      render(<RecordStatusBar states={mockStates} current="submitted" />);
      const completedButton = screen.getByRole("radio", { name: "Completed" });
      expect(completedButton.className).toContain("bg-muted");
      expect(completedButton.className).toContain("text-muted-foreground");
    });
  });

  describe("arrow variant", () => {
    it("renders arrow variant when specified", () => {
      const { container } = render(
        <RecordStatusBar states={mockStates} current="submitted" variant="arrow" />
      );
      const wrapper = container.querySelector(".flex.items-stretch");
      expect(wrapper).toBeInTheDocument();
      expect(wrapper?.className).toContain("rounded-lg");
      expect(wrapper?.className).toContain("border");
    });

    it("applies current state styling in arrow variant", () => {
      render(<RecordStatusBar states={mockStates} current="approved" variant="arrow" />);
      const currentButton = screen.getByRole("radio", { checked: true });
      expect(currentButton.className).toContain("bg-primary");
    });
  });

  describe("state transitions", () => {
    it("calls onChange when clicking different state", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<RecordStatusBar states={mockStates} current="draft" onChange={onChange} />);

      await user.click(screen.getByRole("radio", { name: "Submitted" }));
      expect(onChange).toHaveBeenCalledWith("submitted");
    });

    it("does not call onChange when clicking current state", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<RecordStatusBar states={mockStates} current="submitted" onChange={onChange} />);

      await user.click(screen.getByRole("radio", { checked: true }));
      expect(onChange).not.toHaveBeenCalled();
    });

    it("is read-only when onChange omitted", () => {
      render(<RecordStatusBar states={mockStates} current="draft" />);
      const buttons = screen.getAllByRole("radio");
      buttons.forEach((button) => {
        if (button.getAttribute("aria-checked") !== "true") {
          expect(button).toBeDisabled();
        }
      });
    });

    it("does not call onChange when target state is disabled", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const withGuard: RecordState[] = [
        { value: "draft", label: "Draft" },
        {
          value: "approved",
          label: "Approved",
          disabled: true,
          disabledReason: "Awaiting manager sign-off",
        },
        { value: "done", label: "Done" },
      ];
      render(<RecordStatusBar states={withGuard} current="draft" onChange={onChange} />);
      const approved = screen.getByRole("radio", { name: "Approved" });
      expect(approved).toBeDisabled();
      expect(approved).toHaveAttribute("title", "Awaiting manager sign-off");
      await user.click(approved);
      expect(onChange).not.toHaveBeenCalled();
    });

    it("allows clicking past and future states when onChange provided", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<RecordStatusBar states={mockStates} current="submitted" onChange={onChange} />);

      await user.click(screen.getByRole("radio", { name: "Draft" }));
      expect(onChange).toHaveBeenCalledWith("draft");

      onChange.mockClear();
      await user.click(screen.getByRole("radio", { name: "Completed" }));
      expect(onChange).toHaveBeenCalledWith("completed");
    });
  });

  describe("accessibility", () => {
    it("uses radiogroup role", () => {
      const { container } = render(<RecordStatusBar states={mockStates} current="draft" />);
      expect(container.querySelector('[role="radiogroup"]')).toBeInTheDocument();
    });

    it("has aria-label on radiogroup", () => {
      const { container } = render(<RecordStatusBar states={mockStates} current="draft" />);
      const radiogroup = container.querySelector('[role="radiogroup"]');
      expect(radiogroup).toHaveAttribute("aria-label", "Record status");
    });

    it("marks current state with aria-checked=true", () => {
      render(<RecordStatusBar states={mockStates} current="approved" />);
      const currentButton = screen.getByRole("radio", { name: "Approved" });
      expect(currentButton).toHaveAttribute("aria-checked", "true");
    });

    it("marks non-current states with aria-checked=false", () => {
      render(<RecordStatusBar states={mockStates} current="approved" />);
      const draftButton = screen.getByRole("radio", { name: "Draft" });
      expect(draftButton).toHaveAttribute("aria-checked", "false");
    });

    it("has type=button on all buttons", () => {
      render(<RecordStatusBar states={mockStates} current="draft" />);
      const buttons = screen.getAllByRole("radio");
      buttons.forEach((button) => {
        expect(button).toHaveAttribute("type", "button");
      });
    });
  });
});
