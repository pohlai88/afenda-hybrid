import type { Meta, StoryObj } from "@storybook/react-vite";
import { ActionBar } from "./action-bar";
import { Button } from "@afenda/ui-core/primitives/button";
import { Download, Mail, Trash2 } from "lucide-react";
import * as React from "react";

const meta = {
  title: "Patterns/ActionBar",
  component: ActionBar,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof ActionBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {} as Story["args"],
  render: () => {
    const [count, setCount] = React.useState(3);
    return (
      <div className="relative h-[400px] w-full bg-muted/20 p-8">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select some items to see the action bar appear at the bottom
          </p>
          <Button onClick={() => setCount(count > 0 ? 0 : 3)}>
            {count > 0 ? "Clear Selection" : "Select 3 Items"}
          </Button>
        </div>
        <ActionBar selectedCount={count} onClear={() => setCount(0)} hasDestructiveAction>
          <Button size="sm" variant="outline">
            <Mail className="mr-2 h-3.5 w-3.5" />
            Send Email
          </Button>
          <Button size="sm" variant="outline">
            <Download className="mr-3.5 h-3.5 w-3.5" />
            Export
          </Button>
          <Button size="sm" variant="destructive">
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete
          </Button>
        </ActionBar>
      </div>
    );
  },
};

export const ManySelected: Story = {
  args: {} as Story["args"],
  render: () => (
    <div className="relative h-[400px] w-full bg-muted/20 p-8">
      <ActionBar selectedCount={127} onClear={() => {}} hasDestructiveAction>
        <Button size="sm" variant="outline">
          Bulk Update
        </Button>
        <Button size="sm" variant="outline">
          Export to CSV
        </Button>
        <Button size="sm" variant="destructive">
          Delete All
        </Button>
      </ActionBar>
    </div>
  ),
};

export const StickyInScrollRegion: Story = {
  args: {} as Story["args"],
  render: () => (
    <div className="mx-auto max-w-3xl p-8">
      <div className="relative max-h-[320px] overflow-auto rounded-lg border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-[1] border-b bg-muted/80 backdrop-blur">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 24 }, (_, i) => (
              <tr key={i} className="border-b border-border/60">
                <td className="px-4 py-2">Employee {i + 1}</td>
                <td className="px-4 py-2 text-muted-foreground">Staff</td>
              </tr>
            ))}
          </tbody>
        </table>
        <ActionBar variant="sticky" selectedCount={5} onClear={() => {}} hasDestructiveAction>
          <Button size="sm" variant="outline">
            Assign
          </Button>
          <Button size="sm" variant="outline">
            Export
          </Button>
          <Button size="sm" variant="destructive">
            Remove
          </Button>
        </ActionBar>
      </div>
    </div>
  ),
};

export const Compact: Story = {
  args: {} as Story["args"],
  render: () => (
    <div className="relative h-[360px] w-full bg-muted/20 p-8">
      <ActionBar variant="compact" selectedCount={12} onClear={() => {}} hasDestructiveAction>
        <Button size="sm" variant="outline">
          Tag
        </Button>
        <Button size="sm" variant="outline">
          Export
        </Button>
        <Button size="sm" variant="destructive">
          Delete
        </Button>
      </ActionBar>
    </div>
  ),
};
