import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatGroup } from "../patterns/stat-group";
import type { StatItem } from "../patterns/stat-group";

const mockStats: StatItem[] = [
  { label: "Total Orders", value: 1234 },
  { label: "Revenue", value: "$45,231" },
  { label: "Avg Order", value: "$36.67" },
];

const mockStatsWithTrends: StatItem[] = [
  {
    label: "Sales",
    value: "$12,345",
    trend: { value: 12.5, isPositive: true },
  },
  {
    label: "Returns",
    value: "23",
    trend: { value: -5.2, isPositive: false },
  },
  {
    label: "Neutral",
    value: "100",
    trend: { value: 0, isPositive: false },
  },
];

describe("StatGroup", () => {
  describe("rendering", () => {
    it("renders all stats", () => {
      render(<StatGroup stats={mockStats} />);
      expect(screen.getByText("Total Orders")).toBeInTheDocument();
      expect(screen.getByText("1234")).toBeInTheDocument();
      expect(screen.getByText("Revenue")).toBeInTheDocument();
      expect(screen.getByText("$45,231")).toBeInTheDocument();
      expect(screen.getByText("Avg Order")).toBeInTheDocument();
      expect(screen.getByText("$36.67")).toBeInTheDocument();
    });

    it("renders with dividers between stats", () => {
      const { container } = render(<StatGroup stats={mockStats} />);
      const wrapper = container.querySelector(".divide-x");
      expect(wrapper).toBeInTheDocument();
    });

    it("renders empty state gracefully", () => {
      const { container } = render(<StatGroup stats={[]} />);
      expect(container.querySelector(".divide-x")).toBeInTheDocument();
    });
  });

  describe("layout", () => {
    it("applies flex-1 to each stat for equal width", () => {
      const { container } = render(<StatGroup stats={mockStats} />);
      const statDivs = container.querySelectorAll(".flex-1.flex-col");
      expect(statDivs.length).toBe(mockStats.length);
    });

    it("removes left padding from first stat", () => {
      const { container } = render(<StatGroup stats={mockStats} />);
      const firstStat = container.querySelector(".pl-0");
      expect(firstStat).toBeInTheDocument();
    });

    it("removes right padding from last stat", () => {
      const { container } = render(<StatGroup stats={mockStats} />);
      const lastStat = container.querySelector(".pr-0");
      expect(lastStat).toBeInTheDocument();
    });
  });

  describe("trend indicators", () => {
    it("renders positive trend with plus sign", () => {
      render(<StatGroup stats={mockStatsWithTrends} />);
      expect(screen.getByText("+12.5%")).toBeInTheDocument();
    });

    it("renders negative trend without plus sign", () => {
      render(<StatGroup stats={mockStatsWithTrends} />);
      expect(screen.getByText("-5.2%")).toBeInTheDocument();
    });

    it("renders zero trend without sign", () => {
      render(<StatGroup stats={mockStatsWithTrends} />);
      expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("applies success color to positive trends", () => {
      render(<StatGroup stats={mockStatsWithTrends} />);
      const positiveTrend = screen.getByText("+12.5%").closest("span");
      expect(positiveTrend?.className).toContain("text-success");
    });

    it("applies destructive color to negative trends", () => {
      render(<StatGroup stats={mockStatsWithTrends} />);
      const negativeTrend = screen.getByText("-5.2%").closest("span");
      expect(negativeTrend?.className).toContain("text-destructive");
    });

    it("applies muted color to zero trends", () => {
      render(<StatGroup stats={mockStatsWithTrends} />);
      const zeroTrend = screen.getByText("0%").closest("span");
      expect(zeroTrend?.className).toContain("text-muted-foreground");
    });

    it("does not render trend when omitted", () => {
      render(<StatGroup stats={mockStats} />);
      expect(screen.queryByText(/%$/)).not.toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("marks trend icons as aria-hidden", () => {
      const { container } = render(<StatGroup stats={mockStatsWithTrends} />);
      const trendIcons = container.querySelectorAll(".inline-flex.items-center svg");
      trendIcons.forEach((icon) => {
        expect(icon).toHaveAttribute("aria-hidden");
      });
    });

    it("uses uppercase labels with tracking", () => {
      const { container } = render(<StatGroup stats={mockStats} />);
      const labels = container.querySelectorAll(".uppercase.tracking-wider");
      expect(labels.length).toBe(mockStats.length);
    });
  });

  describe("typography", () => {
    it("uses display font for values", () => {
      const { container } = render(<StatGroup stats={mockStats} />);
      const values = container.querySelectorAll(".font-display");
      expect(values.length).toBe(mockStats.length);
    });

    it("uses semibold display weight per Visual Density Standard §4.2", () => {
      const { container } = render(<StatGroup stats={mockStats} />);
      const values = container.querySelectorAll(".font-semibold");
      expect(values.length).toBeGreaterThanOrEqual(mockStats.length);
    });

    it("uses tight tracking for values", () => {
      const { container } = render(<StatGroup stats={mockStats} />);
      const values = container.querySelectorAll(".tracking-tight");
      expect(values.length).toBeGreaterThan(0);
    });
  });

  describe("custom styling", () => {
    it("accepts custom className", () => {
      const { container } = render(<StatGroup stats={mockStats} className="custom-class" />);
      expect(container.querySelector(".custom-class")).toBeInTheDocument();
    });
  });
});
