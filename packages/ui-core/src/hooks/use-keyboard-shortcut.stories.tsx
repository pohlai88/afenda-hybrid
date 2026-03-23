import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useKeyboardShortcut } from "./use-keyboard-shortcut";
import { Badge } from "../primitives/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../primitives/card";

function UseKeyboardShortcutDemo() {
  const [lastPressed, setLastPressed] = React.useState<string>("None");

  useKeyboardShortcut({ key: "s", meta: true }, () => setLastPressed("⌘S - Save"), true);

  useKeyboardShortcut({ key: "k", meta: true }, () => setLastPressed("⌘K - Command Palette"), true);

  useKeyboardShortcut(
    { key: "n", meta: true, shift: true },
    () => setLastPressed("⌘⇧N - New Window"),
    true
  );

  useKeyboardShortcut({ key: "f", ctrl: true }, () => setLastPressed("Ctrl+F - Find"), true);

  return (
    <div className="w-[400px] space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Last Shortcut Pressed</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="default" className="text-base font-mono">
            {lastPressed}
          </Badge>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <p className="text-sm font-medium">Try these shortcuts:</p>
        <div className="space-y-1.5 rounded-md border p-3 text-sm">
          <div className="flex items-center justify-between">
            <span>Save</span>
            <kbd className="rounded border bg-muted px-2 py-0.5 font-mono text-xs">⌘S</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span>Command Palette</span>
            <kbd className="rounded border bg-muted px-2 py-0.5 font-mono text-xs">⌘K</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span>New Window</span>
            <kbd className="rounded border bg-muted px-2 py-0.5 font-mono text-xs">⌘⇧N</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span>Find</span>
            <kbd className="rounded border bg-muted px-2 py-0.5 font-mono text-xs">Ctrl+F</kbd>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Press any of the shortcuts above to see the hook in action
      </p>
    </div>
  );
}

const meta = {
  title: "Hooks/useKeyboardShortcut",
  component: UseKeyboardShortcutDemo,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof UseKeyboardShortcutDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
