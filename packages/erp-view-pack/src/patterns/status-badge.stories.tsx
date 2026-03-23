import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatusBadge } from "./status-badge";

const meta: Meta<typeof StatusBadge> = {
  title: "Patterns/StatusBadge",
  component: StatusBadge,
};
export default meta;
type Story = StoryObj<typeof StatusBadge>;

export const Active: Story = { args: { status: "active" } };
export const Inactive: Story = { args: { status: "inactive" } };
export const Pending: Story = { args: { status: "pending" } };
export const Error: Story = { args: { status: "error" } };
export const Draft: Story = { args: { status: "draft" } };
export const Archived: Story = { args: { status: "archived" } };
export const CustomLabel: Story = {
  args: { status: "active", label: "Live" },
};
