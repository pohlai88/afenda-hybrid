import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { Button } from "@afenda/ui-core/primitives/button";
import { Trash2 } from "lucide-react";
import { StickyActionBar } from "../patterns/sticky-action-bar";
import { RowCheckbox } from "./row-checkbox";
import { SelectAllCheckbox } from "./select-all-checkbox";
import { selectSelectionCount } from "./selection-store";
import { SelectionStoreProvider, useSelectionStore } from "./selection-store-context";
import { dataGridRowSelectionClass } from "./selection-tokens";

function Toolbar() {
  const count = useSelectionStore(selectSelectionCount);
  const clear = useSelectionStore((s) => s.clear);
  if (count === 0) return null;
  return (
    <StickyActionBar selectedCount={count} onClear={clear} hasDestructiveAction>
      <Button size="sm" variant="destructive">
        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
        Delete
      </Button>
    </StickyActionBar>
  );
}

function GridRow({ id, pageIds }: { id: string; pageIds: readonly string[] }) {
  const selected = useSelectionStore((s) => s.isIdSelected(id, pageIds));
  return (
    <tr data-state={selected ? "selected" : undefined} className={dataGridRowSelectionClass}>
      <td className="p-2">
        <RowCheckbox id={id} pageIds={pageIds} />
      </td>
      <td className="px-3 py-2">{id}</td>
    </tr>
  );
}

function GridBody() {
  const pageIds = React.useMemo(() => ["emp-1", "emp-2", "emp-3", "emp-4"], []);

  return (
    <table className="w-full border-collapse text-left text-sm">
      <thead className="border-b bg-muted/50">
        <tr>
          <th className="w-10 p-2">
            <SelectAllCheckbox pageIds={pageIds} />
          </th>
          <th className="px-3 py-2 font-medium">Employee</th>
        </tr>
      </thead>
      <tbody>
        {pageIds.map((id) => (
          <GridRow key={id} id={id} pageIds={pageIds} />
        ))}
      </tbody>
    </table>
  );
}

function Demo() {
  return (
    <SelectionStoreProvider>
      <div className="mx-auto max-w-lg p-8">
        <div className="relative max-h-[280px] overflow-auto rounded-lg border bg-card">
          <GridBody />
          <Toolbar />
        </div>
      </div>
    </SelectionStoreProvider>
  );
}

const meta = {
  title: "Patterns/Selection/Grid + store",
  component: Demo,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithStickyBar: Story = {
  render: () => <Demo />,
};
