import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatGroup } from "./stat-group";

const meta: Meta<typeof StatGroup> = {
  title: "Patterns/StatGroup",
  component: StatGroup,
};
export default meta;
type Story = StoryObj<typeof StatGroup>;

export const Default: Story = {
  args: {
    stats: [
      {
        label: "Total Employees",
        value: "1,247",
        trend: { value: 3.2, isPositive: true },
      },
      {
        label: "Open Positions",
        value: "42",
        trend: { value: -12, isPositive: false },
      },
      {
        label: "Turnover Rate",
        value: "8.4%",
        trend: { value: 0, isPositive: true },
      },
      { label: "Avg Tenure", value: "3.6y" },
    ],
  },
};
