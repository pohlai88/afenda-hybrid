import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmptyState } from "./empty-state";
import { FileText } from "lucide-react";

const meta: Meta<typeof EmptyState> = {
  title: "Patterns/EmptyState",
  component: EmptyState,
};
export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    title: "No results found",
    description: "Try adjusting your search or filter to find what you're looking for.",
    icon: <FileText className="h-6 w-6" />,
    action: { label: "Clear filters", onClick: () => {} },
  },
};

export const WithSecondaryAction: Story = {
  args: {
    title: "No employees yet",
    description: "Get started by adding your first employee to the system.",
    icon: <FileText className="h-6 w-6" />,
    action: { label: "Add Employee", onClick: () => {} },
    secondaryAction: { label: "Import CSV", onClick: () => {} },
  },
};
