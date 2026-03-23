import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@afenda/ui-core/primitives/button";
import { Clock } from "lucide-react";
import { WorkflowStateBanner } from "./workflow-state-banner";

const meta: Meta<typeof WorkflowStateBanner> = {
  title: "Patterns/WorkflowStateBanner",
  component: WorkflowStateBanner,
};
export default meta;
type Story = StoryObj<typeof WorkflowStateBanner>;

export const Pending: Story = {
  args: {
    status: "pending",
    title: "Awaiting approval",
    description: "Your request was sent to the payroll team.",
    icon: <Clock className="h-4 w-4" aria-hidden />,
  },
};

export const Blocked: Story = {
  args: {
    status: "blocked",
    title: "Cannot submit",
    description: "Resolve validation errors before continuing.",
  },
};

export const WithActions: Story = {
  args: {
    status: "info",
    title: "Escalation available",
    description: "No response in 48 hours.",
    actions: (
      <Button type="button" size="sm" variant="outline">
        Escalate
      </Button>
    ),
  },
};
