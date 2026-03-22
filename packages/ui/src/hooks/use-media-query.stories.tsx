import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

function UseMediaQueryDemo() {
  const queries = [
    { label: "Mobile", query: "(max-width: 640px)" },
    { label: "Tablet", query: "(min-width: 641px) and (max-width: 1024px)" },
    { label: "Desktop", query: "(min-width: 1025px)" },
    { label: "Prefers Dark", query: "(prefers-color-scheme: dark)" },
    { label: "Prefers Reduced Motion", query: "(prefers-reduced-motion: reduce)" },
  ];

  const results = queries.map(({ query }) => {
    const [matches, setMatches] = React.useState(false);
    React.useEffect(() => {
      const mql = window.matchMedia(query);
      setMatches(mql.matches);
      const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    }, [query]);
    return matches;
  });

  return (
    <div className="space-y-3 w-[350px]">
      <h4 className="text-sm font-medium">Live Media Query Results</h4>
      <div className="rounded-md border">
        {queries.map((q, i) => (
          <div
            key={q.query}
            className="flex items-center justify-between px-4 py-2.5 border-b last:border-b-0"
          >
            <div>
              <div className="text-sm font-medium">{q.label}</div>
              <code className="text-xs text-muted-foreground">{q.query}</code>
            </div>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                results[i]
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}
            >
              {results[i] ? "true" : "false"}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Resize the viewport or change the Storybook viewport preset to see live updates.
      </p>
    </div>
  );
}

const meta = {
  title: "Hooks/useMediaQuery",
  component: UseMediaQueryDemo,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof UseMediaQueryDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
