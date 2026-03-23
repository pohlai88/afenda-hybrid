/**
 * @afenda/ui-core — Core UI Components
 *
 * Radix-based primitives, layout patterns, hooks, and design tokens.
 * Zero metadata awareness. Zero registry logic.
 *
 * @version 0.1.0
 */

export * from "./lib/utils";

// Primitives
export * from "./primitives/accordion";
export * from "./primitives/alert";
export * from "./primitives/alert-dialog";
export * from "./primitives/avatar";
export * from "./primitives/badge";
export * from "./primitives/breadcrumb";
export * from "./primitives/button";
export * from "./primitives/calendar";
export * from "./primitives/card";
export * from "./primitives/checkbox";
export * from "./primitives/collapsible";
export * from "./primitives/command";
export * from "./primitives/date-picker";
export * from "./primitives/dialog";
export * from "./primitives/dropdown-menu";
export * from "./primitives/input";
export * from "./primitives/label";
export * from "./primitives/navigation-menu";
export * from "./primitives/popover";
export * from "./primitives/progress";
export * from "./primitives/radio-group";
export * from "./primitives/scroll-area";
export * from "./primitives/select";
export * from "./primitives/separator";
export * from "./primitives/sheet";
export * from "./primitives/skeleton";
export * from "./primitives/slider";
export * from "./primitives/switch";
export * from "./primitives/table";
export * from "./primitives/tabs";
export * from "./primitives/textarea";
export * from "./primitives/toast";
export * from "./primitives/toggle";
export * from "./primitives/toggle-group";
export * from "./primitives/tooltip";

// Patterns (general-purpose only)
export * from "./patterns/chart-container";
export * from "./patterns/data-table";
export * from "./patterns/detail-panel";
export * from "./patterns/empty-state";
export * from "./patterns/filter-bar";
export * from "./patterns/form-field";
export * from "./patterns/form-notebook";
export * from "./patterns/form-section";
export * from "./patterns/page-header";
export * from "./patterns/search-command";
export * from "./patterns/search-facets-bar";
export * from "./patterns/stepper";
export * from "./patterns/widget-grid";

// Providers
export { ThemeProvider } from "./providers/theme-provider";

// Hooks
export * from "./hooks/use-breakpoint";
export * from "./hooks/use-copy-to-clipboard";
export * from "./hooks/use-debounce";
export * from "./hooks/use-intersection-observer";
export * from "./hooks/use-keyboard-shortcut";
export * from "./hooks/use-local-storage";
export * from "./hooks/use-media-query";
export * from "./hooks/use-sidebar";
export { useTheme } from "./providers/theme-provider";

// Utilities
export * from "./lib/formatters";

// Tokens
export * from "./tokens";
