import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MetricCard } from "../patterns/metric-card";

describe("MetricCard", () => {
  describe("rendering", () => {
    it("renders title and value", () => {
      render(<MetricCard title="Total Revenue" value="$45,231" />);
      expect(screen.getByText("Total Revenue")).toBeInTheDocument();
      expect(screen.getByText("$45,231")).toBeInTheDocument();
    });

    it("renders with icon and color", () => {
      const { container } = render(
        <MetricCard title="Active Users" value={1234} icon="Users" color="#3b82f6" />
      );
      const iconWrapper = container.querySelector('[aria-hidden="true"]');
      expect(iconWrapper).toBeInTheDocument();
      expect(iconWrapper).toHaveStyle({ color: "#3b82f6" });
    });

    it("renders description when provided", () => {
      render(<MetricCard title="Orders" value={42} description="Last 30 days" />);
      expect(screen.getByText("Last 30 days")).toBeInTheDocument();
    });

    it("renders comparison when provided", () => {
      render(
        <MetricCard
          title="Sales"
          value="$12,345"
          comparison={{ value: "$10,000", label: "last month" }}
        />
      );
      expect(screen.getByText(/vs \$10,000 last month/)).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("renders skeleton when loading=true", () => {
      const { container } = render(<MetricCard title="Revenue" value="$1000" loading />);
      const skeletons = container.querySelectorAll("[data-testid], .animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("does not render actual content when loading", () => {
      render(<MetricCard title="Revenue" value="$1000" loading />);
      expect(screen.queryByText("Revenue")).not.toBeInTheDocument();
      expect(screen.queryByText("$1000")).not.toBeInTheDocument();
    });
  });

  describe("trend indicator", () => {
    it("renders positive trend with TrendingUp icon", () => {
      render(<MetricCard title="Growth" value="100" trend={{ value: 12.5, isPositive: true }} />);
      expect(screen.getByText("+12.5%")).toBeInTheDocument();
    });

    it("renders negative trend with TrendingDown icon", () => {
      render(<MetricCard title="Churn" value="50" trend={{ value: -8.2, isPositive: false }} />);
      expect(screen.getByText("-8.2%")).toBeInTheDocument();
    });

    it("renders zero trend with Minus icon", () => {
      render(<MetricCard title="Stable" value="200" trend={{ value: 0, isPositive: false }} />);
      expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("renders trend label when provided", () => {
      render(
        <MetricCard
          title="Revenue"
          value="$5000"
          trend={{ value: 15, isPositive: true, label: "vs last week" }}
        />
      );
      expect(screen.getByText(/vs last week/)).toBeInTheDocument();
    });

    it("marks trend icons as aria-hidden", () => {
      const { container } = render(
        <MetricCard title="Test" value="100" trend={{ value: 10, isPositive: true }} />
      );
      const trendContainer = container.querySelector(".inline-flex.items-center.gap-1");
      const icon = trendContainer?.querySelector("svg");
      expect(icon).toHaveAttribute("aria-hidden");
    });
  });

  describe("clickable variant", () => {
    it("renders as button when onClick provided", () => {
      const onClick = vi.fn();
      render(<MetricCard title="Clickable" value="123" onClick={onClick} />);
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("type", "button");
    });

    it("calls onClick when clicked", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<MetricCard title="Clickable" value="123" onClick={onClick} />);
      await user.click(screen.getByRole("button"));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("has keyboard navigation support", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<MetricCard title="Clickable" value="123" onClick={onClick} />);
      const button = screen.getByRole("button");
      button.focus();
      await user.keyboard("{Enter}");
      expect(onClick).toHaveBeenCalled();
    });

    it("does not render as button when onClick omitted", () => {
      render(<MetricCard title="Static" value="456" />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("marks icon wrapper as aria-hidden", () => {
      const { container } = render(<MetricCard title="Test" value="100" icon="Users" />);
      const iconWrapper = container.querySelector(".rounded-full.p-2");
      expect(iconWrapper).toHaveAttribute("aria-hidden");
    });
  });
});
