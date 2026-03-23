import type { Meta, StoryObj } from "@storybook/react-vite";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";
import { Button } from "./button";
import { ChevronDown } from "lucide-react";
import * as React from "react";

const meta = {
  title: "Primitives/Collapsible",
  component: Collapsible,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [isOpen, setIsOpen] = React.useState(false);
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-[400px]">
        <div className="flex items-center justify-between space-x-4 rounded-md border p-4">
          <h4 className="text-sm font-semibold">Advanced Filters</h4>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
              <span className="sr-only">Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="space-y-2 border-x border-b p-4">
          <div className="rounded-md border px-4 py-2 text-sm">Department: Engineering</div>
          <div className="rounded-md border px-4 py-2 text-sm">Location: Remote</div>
          <div className="rounded-md border px-4 py-2 text-sm">Employment Type: Full-time</div>
        </CollapsibleContent>
      </Collapsible>
    );
  },
};
