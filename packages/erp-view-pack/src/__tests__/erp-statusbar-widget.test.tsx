/**
 * ERP Statusbar Widget Tests
 *
 * Tests for the ERP-specific statusbar widget.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErpStatusBarWidgetRender } from "../widgets/erp-statusbar-widget";
import type { FieldDef } from "@afenda/view-engine";

describe("ErpStatusbarWidget", () => {
  const field: FieldDef = {
    name: "status",
    label: "Status",
    type: "selection",
    options: [
      { value: "DRAFT", label: "Draft" },
      { value: "PENDING", label: "Pending" },
      { value: "APPROVED", label: "Approved" },
      { value: "REJECTED", label: "Rejected" },
    ],
  };

  describe("ErpStatusBarWidgetRender", () => {
    it("renders all status options", () => {
      render(<ErpStatusBarWidgetRender field={field} value="PENDING" onChange={() => {}} />);

      expect(screen.getByText("Draft")).toBeInTheDocument();
      expect(screen.getByText("Pending")).toBeInTheDocument();
      expect(screen.getByText("Approved")).toBeInTheDocument();
      expect(screen.getByText("Rejected")).toBeInTheDocument();
    });

    it("highlights the current status", () => {
      render(<ErpStatusBarWidgetRender field={field} value="APPROVED" onChange={() => {}} />);

      const approvedButton = screen.getByText("Approved").closest("button");
      expect(approvedButton).toHaveClass("bg-primary");
    });

    it("calls onChange when status is clicked", () => {
      const onChange = vi.fn();

      render(<ErpStatusBarWidgetRender field={field} value="DRAFT" onChange={onChange} />);

      const pendingButton = screen.getByText("Pending");
      pendingButton.click();

      expect(onChange).toHaveBeenCalledWith("PENDING");
    });

    it("disables buttons when disabled prop is true", () => {
      render(<ErpStatusBarWidgetRender field={field} value="DRAFT" onChange={() => {}} disabled />);

      const buttons = screen.getAllByRole("radio");
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it("handles empty options array", () => {
      const fieldWithoutOptions: FieldDef = {
        ...field,
        options: [],
      };

      const { container } = render(
        <ErpStatusBarWidgetRender field={fieldWithoutOptions} value="DRAFT" onChange={() => {}} />
      );

      expect(container.querySelector("button")).not.toBeInTheDocument();
    });

    it("handles undefined options", () => {
      const fieldWithoutOptions: FieldDef = {
        ...field,
        options: undefined,
      };

      const { container } = render(
        <ErpStatusBarWidgetRender field={fieldWithoutOptions} value="DRAFT" onChange={() => {}} />
      );

      expect(container.querySelector("button")).not.toBeInTheDocument();
    });
  });
});
