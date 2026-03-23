import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useDebounce } from "./use-debounce";
import { Input } from "../primitives/input";
import { Label } from "../primitives/label";

function UseDebounceDemo() {
  const [value, setValue] = React.useState("");
  const debouncedValue = useDebounce(value, 500);
  const [searchResults, setSearchResults] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (debouncedValue) {
      const mockResults = [
        `Result 1 for "${debouncedValue}"`,
        `Result 2 for "${debouncedValue}"`,
        `Result 3 for "${debouncedValue}"`,
      ];
      setSearchResults(mockResults);
    } else {
      setSearchResults([]);
    }
  }, [debouncedValue]);

  return (
    <div className="w-[400px] space-y-4">
      <div className="space-y-2">
        <Label htmlFor="search">Search Employees</Label>
        <Input
          id="search"
          placeholder="Type to search..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <div className="space-y-2 rounded-md border p-3">
        <div className="text-xs text-muted-foreground">
          <div>Current value: {value || "(empty)"}</div>
          <div>Debounced value: {debouncedValue || "(empty)"}</div>
        </div>
      </div>
      {searchResults.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Search Results:</p>
          <div className="space-y-1">
            {searchResults.map((result, i) => (
              <div key={i} className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
                {result}
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground">Search executes 500ms after you stop typing</p>
    </div>
  );
}

const meta = {
  title: "Hooks/useDebounce",
  component: UseDebounceDemo,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof UseDebounceDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
