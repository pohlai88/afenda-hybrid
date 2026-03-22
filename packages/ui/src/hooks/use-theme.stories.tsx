import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

function UseThemeDemo() {
  const [theme, setThemeState] = React.useState<"light" | "dark" | "system">("system");
  const [resolved, setResolved] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    const isDark =
      theme === "dark" ||
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setResolved(isDark ? "dark" : "light");
  }, [theme]);

  return (
    <div className="space-y-4 w-[300px]">
      <div className="space-y-2">
        <div className="text-sm font-medium">
          Current theme: <code className="text-primary">{theme}</code>
        </div>
        <div className="text-sm font-medium">
          Resolved: <code className="text-primary">{resolved}</code>
        </div>
      </div>
      <div className="flex gap-2">
        {(["light", "dark", "system"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setThemeState(t)}
            className={`rounded-md border px-3 py-1.5 text-sm capitalize transition-colors ${
              theme === t ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        The real useTheme hook also toggles the .dark class on the document and persists via
        data-theme attribute. This demo shows the state logic only.
      </p>
    </div>
  );
}

const meta = {
  title: "Hooks/useTheme",
  component: UseThemeDemo,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof UseThemeDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
