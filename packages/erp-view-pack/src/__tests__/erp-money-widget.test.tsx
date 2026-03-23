/**
 * ERP Money Widget Tests
 *
 * Tests for the ERP-specific money widget override.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  ErpMoneyWidgetRender,
  ErpMoneyWidgetReadonly,
  ErpMoneyWidgetCell,
} from "../widgets/erp-money-widget";
import type { FieldDef } from "@afenda/view-engine";

describe("ErpMoneyWidget", () => {
  const field: FieldDef = {
    name: "salary",
    label: "Salary",
    type: "monetary",
    currencyField: "USD",
  };

  describe("ErpMoneyWidgetRender", () => {
    it("renders input with currency symbol", () => {
      render(<ErpMoneyWidgetRender field={field} value={50000} onChange={() => {}} />);

      expect(screen.getByDisplayValue("50000")).toBeInTheDocument();
      expect(screen.getByText("$")).toBeInTheDocument();
    });

    it("handles empty value", () => {
      render(<ErpMoneyWidgetRender field={field} value={null} onChange={() => {}} />);

      expect(screen.getByDisplayValue("")).toBeInTheDocument();
    });
  });

  describe("ErpMoneyWidgetReadonly", () => {
    it("formats value with currency", () => {
      render(<ErpMoneyWidgetReadonly field={field} value={50000} />);

      expect(screen.getByText("$50,000.00")).toBeInTheDocument();
    });

    it("handles null value", () => {
      render(<ErpMoneyWidgetReadonly field={field} value={null} />);

      expect(screen.getByText("—")).toBeInTheDocument();
    });

    it("formats with 2 decimal places", () => {
      render(<ErpMoneyWidgetReadonly field={field} value={1234.5} />);

      expect(screen.getByText("$1,234.50")).toBeInTheDocument();
    });
  });

  describe("ErpMoneyWidgetCell", () => {
    it("renders formatted value", () => {
      const { container } = render(<ErpMoneyWidgetCell field={field} value={75000} />);

      expect(container.textContent).toBe("$75,000.00");
    });

    it("handles null value", () => {
      const { container } = render(<ErpMoneyWidgetCell field={field} value={null} />);

      expect(container.textContent).toBe("");
    });
  });
});
