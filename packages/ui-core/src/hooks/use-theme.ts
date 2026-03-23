"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = window.document.documentElement;
    const initialTheme = (root.getAttribute("data-theme") as Theme) || "system";
    setThemeState(initialTheme);

    const updateResolvedTheme = () => {
      const isDark =
        initialTheme === "dark" ||
        (initialTheme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      setResolvedTheme(isDark ? "dark" : "light");
      root.classList.toggle("dark", isDark);
    };

    updateResolvedTheme();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        updateResolvedTheme();
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    const root = window.document.documentElement;
    root.setAttribute("data-theme", newTheme);
    setThemeState(newTheme);

    const isDark =
      newTheme === "dark" ||
      (newTheme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setResolvedTheme(isDark ? "dark" : "light");
    root.classList.toggle("dark", isDark);
  };

  return { theme, setTheme, resolvedTheme };
}
