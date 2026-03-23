import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChartContainer } from "./chart-container";
import { Button } from "../primitives/button";
import { Download } from "lucide-react";

const meta = {
  title: "Patterns/ChartContainer",
  component: ChartContainer,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ChartContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Headcount Growth",
    subtitle: "Monthly employee count over the past year",
    children: (
      <div className="flex h-[200px] items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25">
        <p className="text-sm text-muted-foreground">Chart goes here</p>
      </div>
    ),
  },
};

export const WithSource: Story = {
  args: {
    title: "Revenue by Department",
    subtitle: "Q4 2025 performance breakdown",
    source: "Finance Department, January 2026",
    children: (
      <div className="flex h-[200px] items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25">
        <p className="text-sm text-muted-foreground">Bar chart placeholder</p>
      </div>
    ),
  },
};

export const WithActions: Story = {
  args: {
    title: "Turnover Rate Trends",
    subtitle: "12-month rolling average",
    source: "HR Analytics",
    actions: (
      <Button size="sm" variant="ghost">
        <Download className="mr-2 h-3.5 w-3.5" />
        Export
      </Button>
    ),
    children: (
      <div className="flex h-[200px] items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25">
        <p className="text-sm text-muted-foreground">Line chart placeholder</p>
      </div>
    ),
  },
};

export const Loading: Story = {
  args: {
    title: "Loading Chart",
    subtitle: "Fetching data...",
    loading: true,
    children: null,
  },
};
