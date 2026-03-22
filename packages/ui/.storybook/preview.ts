import * as React from "react";
import type { Preview, Decorator } from "@storybook/react-vite";
import "../src/tokens/globals.css";

function ThemeWrapper({ theme, children }: { theme: string; children: React.ReactNode }) {
  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    return () => {
      root.classList.remove("dark");
    };
  }, [theme]);

  return React.createElement(
    "div",
    {
      className: "bg-background text-foreground p-4 min-h-[100px] transition-colors",
      style: { fontFamily: "var(--font-sans)" },
    },
    children
  );
}

const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme || "light";
  return React.createElement(ThemeWrapper, { theme, children: React.createElement(Story) });
};

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Toggle light/dark mode",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: [
          { value: "light", icon: "sun", title: "Light" },
          { value: "dark", icon: "moon", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "light",
  },
  decorators: [withTheme],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: { disabled: true },
    viewport: {
      options: {
        mobile: { name: "Mobile", styles: { width: "375px", height: "812px" } },
        tablet: { name: "Tablet", styles: { width: "768px", height: "1024px" } },
        desktop: { name: "Desktop", styles: { width: "1440px", height: "900px" } },
      },
    },
  },
};

export default preview;
