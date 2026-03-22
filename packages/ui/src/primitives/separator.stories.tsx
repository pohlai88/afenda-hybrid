import type { Meta, StoryObj } from "@storybook/react-vite";
import { Separator } from "./separator";

const meta = {
  title: "Primitives/Separator",
  component: Separator,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-[300px]">
      <div className="space-y-1">
        <h4 className="text-sm font-medium leading-none">Employee Profile</h4>
        <p className="text-sm text-muted-foreground">View and manage employee details.</p>
      </div>
      <Separator className="my-4" />
      <div className="space-y-1">
        <h4 className="text-sm font-medium leading-none">Department</h4>
        <p className="text-sm text-muted-foreground">Engineering</p>
      </div>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-5 items-center space-x-4 text-sm">
      <div>Dashboard</div>
      <Separator orientation="vertical" />
      <div>Employees</div>
      <Separator orientation="vertical" />
      <div>Reports</div>
    </div>
  ),
};
