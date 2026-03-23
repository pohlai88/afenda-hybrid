import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useLocalStorage } from "./use-local-storage";
import { Input } from "../primitives/input";
import { Button } from "../primitives/button";
import { Label } from "../primitives/label";

function UseLocalStorageDemo() {
  const [name, setName, removeName] = useLocalStorage("demo-name", "");
  const [count, setCount, removeCount] = useLocalStorage("demo-count", 0);

  return (
    <div className="w-[400px] space-y-6">
      <div className="space-y-3">
        <Label htmlFor="name">Name (persisted in localStorage)</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
        />
        <Button variant="outline" size="sm" onClick={removeName}>
          Clear Name
        </Button>
      </div>

      <div className="space-y-3">
        <Label>Counter (persisted in localStorage)</Label>
        <div className="flex items-center gap-2">
          <Button onClick={() => setCount((prev) => prev - 1)}>-</Button>
          <span className="w-16 text-center font-mono text-lg font-semibold">{count}</span>
          <Button onClick={() => setCount((prev) => prev + 1)}>+</Button>
        </div>
        <Button variant="outline" size="sm" onClick={removeCount}>
          Reset Counter
        </Button>
      </div>

      <div className="rounded-md border bg-muted/50 p-3 text-xs text-muted-foreground">
        <p className="font-medium">localStorage keys:</p>
        <ul className="mt-1 space-y-0.5">
          <li>demo-name: {JSON.stringify(name)}</li>
          <li>demo-count: {JSON.stringify(count)}</li>
        </ul>
      </div>

      <p className="text-xs text-muted-foreground">
        Values persist across page reloads. Open DevTools → Application → Local Storage to inspect.
      </p>
    </div>
  );
}

const meta = {
  title: "Hooks/useLocalStorage",
  component: UseLocalStorageDemo,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof UseLocalStorageDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
