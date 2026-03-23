import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useCopyToClipboard } from "./use-copy-to-clipboard";
import { Button } from "../primitives/button";
import { Input } from "../primitives/input";
import { Label } from "../primitives/label";
import { Check, Copy } from "lucide-react";

function UseCopyToClipboardDemo() {
  const [copied, copy] = useCopyToClipboard();
  const [text, setText] = React.useState("EMP-2024-0156");

  return (
    <div className="w-[400px] space-y-4">
      <div className="space-y-2">
        <Label htmlFor="text">Text to Copy</Label>
        <Input
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text"
        />
      </div>

      <Button onClick={() => copy(text)} className="w-full">
        {copied ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="mr-2 h-4 w-4" />
            Copy to Clipboard
          </>
        )}
      </Button>

      <div className="space-y-2">
        <p className="text-sm font-medium">Common Use Cases:</p>
        <div className="space-y-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => copy("john.smith@company.com")}
            className="w-full justify-start"
          >
            <Copy className="mr-2 h-3.5 w-3.5" />
            Copy Email Address
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copy("https://afenda.com/employees/156")}
            className="w-full justify-start"
          >
            <Copy className="mr-2 h-3.5 w-3.5" />
            Copy Employee Link
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copy("REQ-2024-0234")}
            className="w-full justify-start"
          >
            <Copy className="mr-2 h-3.5 w-3.5" />
            Copy Requisition Code
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">The copied state resets after 2 seconds</p>
    </div>
  );
}

const meta = {
  title: "Hooks/useCopyToClipboard",
  component: UseCopyToClipboardDemo,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof UseCopyToClipboardDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
