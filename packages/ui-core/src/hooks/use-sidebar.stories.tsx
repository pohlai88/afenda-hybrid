import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

function UseSidebarDemo() {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const toggle = () => setIsCollapsed((prev) => !prev);
  const collapse = () => setIsCollapsed(true);
  const expand = () => setIsCollapsed(false);

  return (
    <div className="space-y-4 w-[300px]">
      <div className="text-sm font-medium">
        Sidebar: <code className="text-primary">{isCollapsed ? "collapsed" : "expanded"}</code>
      </div>

      <div className="flex items-center gap-4">
        <div
          className="rounded-lg border bg-muted transition-all duration-300 flex items-center justify-center text-xs text-muted-foreground"
          style={{ width: isCollapsed ? 48 : 192, height: 120 }}
        >
          {isCollapsed ? "..." : "Sidebar content"}
        </div>
        <div className="flex-1 rounded-lg border h-[120px] flex items-center justify-center text-xs text-muted-foreground">
          Main content
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={toggle} className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
          Toggle
        </button>
        <button
          onClick={collapse}
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
        >
          Collapse
        </button>
        <button onClick={expand} className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
          Expand
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        The real useSidebar hook persists state to localStorage under the key
        &quot;afenda-sidebar-collapsed&quot;.
      </p>
    </div>
  );
}

const meta = {
  title: "Hooks/useSidebar",
  component: UseSidebarDemo,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof UseSidebarDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
