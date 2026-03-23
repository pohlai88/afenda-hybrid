import type { Meta, StoryObj } from "@storybook/react-vite";
import { PageHeader } from "./page-header";
import { Button } from "../primitives/button";
import { Plus, Download } from "lucide-react";

const meta: Meta<typeof PageHeader> = {
  title: "Patterns/PageHeader",
  component: PageHeader,
};
export default meta;
type Story = StoryObj<typeof PageHeader>;

export const Default: Story = {
  args: {
    title: "Revenue grew 15% driven by enterprise segment",
    description: "Q4 2025 performance summary across all business units.",
  },
};

export const WithActions: Story = {
  render: () => (
    <PageHeader
      title="Employees"
      description="Manage your organization's workforce."
      actions={
        <>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1.5" /> Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" /> Add Employee
          </Button>
        </>
      }
    />
  ),
};
