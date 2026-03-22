import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton } from "./skeleton";

const meta = {
  title: "Primitives/Skeleton",
  component: Skeleton,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Skeleton className="h-4 w-[250px]" />,
};

export const Circle: Story = {
  render: () => <Skeleton className="h-12 w-12 rounded-full" />,
};

export const Card: Story = {
  render: () => (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  ),
};

export const TableRows: Story = {
  render: () => (
    <div className="w-[500px] space-y-3">
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-[80px]" />
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-[80px]" />
      </div>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[80px]" />
        </div>
      ))}
    </div>
  ),
};

export const DashboardLoading: Story = {
  render: () => (
    <div className="w-[600px] space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="space-y-3 rounded-lg border p-4">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-8 w-[60px]" />
            <Skeleton className="h-3 w-[140px]" />
          </div>
        ))}
      </div>
      <div className="space-y-3 rounded-lg border p-4">
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    </div>
  ),
};
