import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { Button } from "@afenda/ui-core/primitives/button";
import { Download, Mail, Trash2 } from "lucide-react";
import { BulkSelectionNotice } from "./bulk-selection-notice";
import { CompactSelectionBar } from "./compact-selection-bar";
import { StickyActionBar } from "./sticky-action-bar";

const meta = {
  title: "Patterns/Selection (enterprise)",
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const StickyTableIntegrated: Story = {
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
            {Array.from({ length: 20 }, (_, i) => (
              <tr key={i} className="border-b border-border/60">
                <td className="px-4 py-2">Row {i + 1}</td>
                <td className="px-4 py-2 text-muted-foreground">—</td>
              </tr>
            ))}
          </tbody>
        </table>
        <StickyActionBar selectedCount={4} onClear={() => {}} hasDestructiveAction>
          <Button size="sm" variant="outline">
            Assign
          </Button>
          <Button size="sm" variant="outline">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export
          </Button>
          <Button size="sm" variant="destructive">
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Remove
          </Button>
        </StickyActionBar>
      </div>
    </div>
  ),
};

export const CompactAboveGrid: Story = {
  render: () => (
    <div className="mx-auto max-w-3xl p-8">
      <div className="overflow-hidden rounded-lg border">
        <CompactSelectionBar selectedCount={8}>
          <Button size="sm" variant="outline">
            Tag
          </Button>
          <Button size="sm" variant="outline">
            <Mail className="mr-1.5 h-3.5 w-3.5" />
            Email
          </Button>
        </CompactSelectionBar>
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              <th className="px-3 py-2 font-medium">Symbol</th>
              <th className="px-3 py-2 font-medium text-right">Qty</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }, (_, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="px-3 py-2 font-mono text-xs">AFN{i}</td>
                <td className="px-3 py-2 text-right tabular-nums">{(i + 1) * 100}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ),
};

export const BulkEscalation: Story = {
  render: () => {
    const [n, setN] = React.useState(2);
    const totalOnPage = 10;
    const totalFiltered = 248;
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-8">
        <p className="text-sm text-muted-foreground">
          Adjust selection to show “select all on page” and “select all matching filter”.
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setN((x) => x + 1)}>
            +1 on page
          </Button>
          <Button size="sm" variant="outline" onClick={() => setN((x) => Math.max(0, x - 1))}>
            −1
          </Button>
          <Button size="sm" variant="outline" onClick={() => setN(0)}>
            Clear
          </Button>
        </div>
        <BulkSelectionNotice
          selectedOnPage={n}
          totalOnPage={totalOnPage}
          totalFiltered={totalFiltered}
          onSelectAllPage={() => setN(totalOnPage)}
          onSelectAllFiltered={() => setN(Math.min(totalFiltered, 99))}
        />
      </div>
    );
  },
};
