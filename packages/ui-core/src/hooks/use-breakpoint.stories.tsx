import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useBreakpoint, useIsAboveBreakpoint } from "./use-breakpoint";
import { Badge } from "../primitives/badge";

function UseBreakpointDemo() {
  const breakpoint = useBreakpoint();
  const isAboveMd = useIsAboveBreakpoint("md");
  const isAboveLg = useIsAboveBreakpoint("lg");

  return (
    <div className="w-[400px] space-y-4">
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Current Breakpoint</h4>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="text-base font-mono">
            {breakpoint}
          </Badge>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium">Breakpoint Checks</h4>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <span className="text-sm">Above md (768px)</span>
            <Badge variant={isAboveMd ? "default" : "secondary"}>
              {isAboveMd ? "true" : "false"}
            </Badge>
          </div>
          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <span className="text-sm">Above lg (1024px)</span>
            <Badge variant={isAboveLg ? "default" : "secondary"}>
              {isAboveLg ? "true" : "false"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="rounded-md border bg-muted/50 p-3 text-xs text-muted-foreground">
        <p className="font-medium">Breakpoint Scale:</p>
        <ul className="mt-1 space-y-0.5 font-mono">
          <li>sm: 640px</li>
          <li>md: 768px</li>
          <li>lg: 1024px</li>
          <li>xl: 1280px</li>
          <li>2xl: 1536px</li>
        </ul>
      </div>

      <p className="text-xs text-muted-foreground">
        Resize the viewport or change the Storybook viewport preset to see live updates.
      </p>
    </div>
  );
}

const meta = {
  title: "Hooks/useBreakpoint",
  component: UseBreakpointDemo,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof UseBreakpointDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
