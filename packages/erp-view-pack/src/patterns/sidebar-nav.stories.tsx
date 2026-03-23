import type { Meta, StoryObj } from "@storybook/react-vite";
import { SidebarNav } from "./sidebar-nav";
import { mockAppModules } from "../__mocks__";

const meta = {
  title: "Patterns/SidebarNav",
  component: SidebarNav,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  argTypes: {
    isCollapsed: { control: "boolean" },
  },
} satisfies Meta<typeof SidebarNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    modules: mockAppModules,
    currentPath: "/hr/employees",
  },
  decorators: [
    (Story) => (
      <div className="w-64 h-[500px] border rounded-lg overflow-hidden bg-background">
        <Story />
      </div>
    ),
  ],
};

export const Collapsed: Story = {
  args: {
    modules: mockAppModules,
    currentPath: "/hr/employees",
    isCollapsed: true,
  },
  decorators: [
    (Story) => (
      <div className="w-16 h-[500px] border rounded-lg overflow-hidden bg-background">
        <Story />
      </div>
    ),
  ],
};

export const NoActiveRoute: Story = {
  args: {
    modules: mockAppModules,
    currentPath: "/unknown",
  },
  decorators: [
    (Story) => (
      <div className="w-64 h-[500px] border rounded-lg overflow-hidden bg-background">
        <Story />
      </div>
    ),
  ],
};

export const SingleModule: Story = {
  args: {
    modules: [mockAppModules[0]],
    currentPath: "/core/organizations",
  },
  decorators: [
    (Story) => (
      <div className="w-64 h-[400px] border rounded-lg overflow-hidden bg-background">
        <Story />
      </div>
    ),
  ],
};
