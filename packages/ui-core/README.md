# @afenda/ui-core

**AFENDA UI Core** — Radix-based primitives, layout patterns, hooks, and design tokens.

This package provides the foundational UI components for the AFENDA platform. It has **zero metadata awareness** and **zero registry logic** — it's a pure component library.

---

## What's Inside

### Primitives (35 components)

Radix-based accessible components:

- **Form controls:** Input, Textarea, Select, Checkbox, Switch, RadioGroup, Slider, DatePicker
- **Layout:** Card, Separator, Tabs, Accordion, Collapsible, Sheet, Dialog
- **Navigation:** Breadcrumb, NavigationMenu, Command, Popover, DropdownMenu
- **Feedback:** Alert, AlertDialog, Toast, Skeleton, Progress, Badge, Tooltip
- **Data:** Table, ScrollArea

### Patterns (13 components)

Higher-level compositions:

- **Data display:** DataTable, EmptyState, DetailPanel, ChartContainer
- **Forms:** FormField, FormSection, FormNotebook
- **Search:** SearchCommand, SearchFacetsBar, FilterBar
- **Layout:** PageHeader, WidgetGrid, Stepper

### Hooks (9 utilities)

- `useBreakpoint` — Responsive breakpoint detection
- `useCopyToClipboard` — Copy text to clipboard
- `useDebounce` — Debounce values
- `useIntersectionObserver` — Observe element visibility
- `useKeyboardShortcut` — Register keyboard shortcuts
- `useLocalStorage` — Persist state to localStorage
- `useMediaQuery` — Match media queries
- `useSidebar` — Sidebar state management
- `useTheme` — Theme switching

### Utilities

- `cn()` — Tailwind class merging
- Formatters — Number, currency, date, percent

### Design tokens

Import global styles from `@afenda/ui-core/tokens/globals.css`. The static blue ramp is exposed as Tailwind **`brand`** utilities (e.g. `bg-brand-500`) and as `colors.brand` in `@afenda/ui-core/tokens` (formerly `mckinsey` / `mckinsey-*`).

- Color system
- Typography scale
- Spacing scale
- Border radii
- Shadows

---

## Installation

```bash
pnpm add @afenda/ui-core
```

---

## Usage

```typescript
import { Button, Card, DataTable } from "@afenda/ui-core";
import { useDebounce } from "@afenda/ui-core/hooks/use-debounce";
import { cn } from "@afenda/ui-core/lib/utils";

function MyComponent() {
  return (
    <Card>
      <Button>Click me</Button>
    </Card>
  );
}
```

---

## Design Principles

### Composition Over Configuration

Components are designed to be composed, not configured. Prefer small, focused components over large, prop-heavy ones.

### Accessibility First

All components follow WCAG 2.1 AA standards and use Radix primitives for keyboard navigation, focus management, and screen reader support.

### Tailwind-Native

Components use Tailwind CSS for styling. No CSS-in-JS, no runtime style injection.

### Zero Metadata Awareness

This package knows nothing about `ModelDef`, `ViewDef`, or business logic. It's a pure UI library.

---

## Package Boundaries

### What This Package Does

- ✅ Provide accessible UI primitives
- ✅ Compose layout patterns
- ✅ Manage local UI state (theme, sidebar, etc.)
- ✅ Format display values

### What This Package Does NOT Do

- ❌ Interpret metadata
- ❌ Manage registries
- ❌ Fetch data
- ❌ Contain business logic

For metadata-driven UI, use `@afenda/view-engine`.

---

## Dependencies

- **Radix UI** — Accessible primitives
- **Tailwind CSS** — Utility-first styling
- **Lucide React** — Icon library
- **date-fns** — Date utilities
- **Recharts** — Chart library
- **cmdk** — Command palette
- **Sonner** — Toast notifications

---

## Testing

```bash
pnpm --filter @afenda/ui-core typecheck
```

---

## License

Private — AFENDA Platform
