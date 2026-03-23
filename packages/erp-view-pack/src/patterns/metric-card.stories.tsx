import type { Meta, StoryObj } from "@storybook/react-vite";
import { MetricCard } from "./metric-card";

const meta = {
  title: "Patterns/MetricCard",
  component: MetricCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof MetricCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmployeeCount: Story = {
  args: {
    title: "Employee Count",
    value: 1234,
    icon: "Users",
    color: "#10b981",
    description: "Total active employees",
  },
};

export const PendingLeaves: Story = {
  args: {
    title: "Pending Leave Requests",
    value: 23,
    icon: "Clock",
    color: "#f59e0b",
    description: "Awaiting approval",
  },
};

export const WithTrend: Story = {
  args: {
    title: "Open Positions",
    value: 45,
    icon: "Briefcase",
    color: "#f97316",
    description: "Active job requisitions",
    trend: {
      value: 12.5,
      isPositive: true,
    },
  },
};

export const NegativeTrend: Story = {
  args: {
    title: "Pending Claims",
    value: 8,
    icon: "FileText",
    color: "#ec4899",
    description: "Benefits claims pending",
    trend: {
      value: -5.2,
      isPositive: false,
    },
  },
};
