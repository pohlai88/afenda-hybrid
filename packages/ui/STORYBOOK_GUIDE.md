# Storybook Development Guide -- AFENDA Design System

This guide defines how to write, organise, and maintain Storybook stories for the
`@afenda/ui` design-system package. Follow it whenever you add or update a
component so the catalogue stays consistent and useful.

---

## Quick Start

```bash
# Run Storybook locally
pnpm ui:storybook          # http://localhost:6006

# Build a static Storybook site
pnpm --filter @afenda/ui build-storybook
```

---

## Sidebar Organisation

Stories are grouped into four tiers that mirror the package structure:

```
Tokens/          Design tokens (MDX documentation pages)
  Colors         Module palette + semantic tokens
  Typography     Font families + scale

Primitives/      Low-level building blocks (shadcn/ui + Radix)
  Button, Card, Badge, Avatar, Input, Label, Select, Checkbox,
  Switch, Dialog, DropdownMenu, Tooltip, Popover, ScrollArea,
  Tabs, Table, Breadcrumb, Separator, Skeleton

Patterns/        HCM-specific composites
  MetricCard, DataTable, FormField, SidebarNav, WidgetGrid,
  AppModuleIcon

Hooks/           React hooks with interactive wrappers
  useTheme, useSidebar, useMediaQuery
```

---

## File Conventions

| Rule     | Detail                                                                |
| -------- | --------------------------------------------------------------------- |
| Format   | **CSF3** (`satisfies Meta<typeof Component>`)                         |
| Location | Co-located: `component-name.stories.tsx` next to `component-name.tsx` |
| Autodocs | Always include `tags: ["autodocs"]`                                   |
| Naming   | PascalCase title matching the export name                             |

### Template (Primitive)

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { ComponentName } from "./component-name";

const meta = {
  title: "Primitives/ComponentName",
  component: ComponentName,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline"],
    },
  },
} satisfies Meta<typeof ComponentName>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "Label" },
};
```

### Template (Pattern)

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { PatternName } from "./pattern-name";
import { mockData } from "../__mocks__";

const meta = {
  title: "Patterns/PatternName",
  component: PatternName,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof PatternName>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { data: mockData },
};

export const Empty: Story = {
  args: { data: [] },
};
```

---

## Story Rules per Layer

### Primitives

- Layout: `"centered"`
- One exported story per meaningful state:
  - `Default` -- component with default props
  - One story per `variant` value (from CVA)
  - One story per `size` value
  - `Disabled` -- `disabled={true}`
  - With optional props exercised (icons, `asChild`, etc.)
- Use `argTypes` with `control: "select"` for enums

### Patterns

- Layout: `"padded"` (patterns are wider)
- Import mock data from `src/__mocks__/index.ts`
- Minimum stories:
  - `Default` -- minimal required props
  - `FullyLoaded` -- every optional prop populated
  - `Empty` -- zero-data / edge case
  - Interactive state if applicable (expanded, sorted, filtered)

### Tokens (MDX)

- Use `.mdx` files in `src/tokens/`
- Render colour swatches, typography samples, spacing references
- No `args` or controls needed

### Hooks

- Create a small React wrapper component inside the story file
- The wrapper calls the hook and renders its return values
- Provide buttons/controls to trigger state changes

---

## Decorators

### Theme Toggle (Global)

A global theme decorator is already configured in `.storybook/preview.ts`.
Use the toolbar sun/moon icon to switch between light and dark modes.
All stories automatically render inside a themed container.

### Module Colour Context (Per-Story)

For pattern stories that need a module colour context:

```tsx
import type { Decorator } from "@storybook/react";

const withModuleColor: Decorator = (Story) => (
  <div style={{ "--module-active": "var(--module-hr)" } as React.CSSProperties}>
    <Story />
  </div>
);

export const WithModuleContext: Story = {
  decorators: [withModuleColor],
  args: {
    /* ... */
  },
};
```

---

## Mock Data

Shared mock data lives in `src/__mocks__/index.ts`. Available exports:

| Export                | Used by                        |
| --------------------- | ------------------------------ |
| `mockAppModules`      | SidebarNav stories             |
| `mockMenuItems`       | SidebarNav, navigation stories |
| `mockEmployeeData`    | DataTable stories              |
| `mockEmployeeColumns` | DataTable stories              |

Add new mocks to this file when writing new pattern stories.
Never duplicate test data inline -- import from `__mocks__` instead.

---

## Testing Integration

Every component should have **two** companion files:

| File                   | Purpose                                       |
| ---------------------- | --------------------------------------------- |
| `*.stories.tsx`        | Visual documentation + interactive playground |
| `__tests__/*.test.tsx` | Unit tests (Vitest + React Testing Library)   |

### Interaction Tests

Use `@storybook/test` for click/type interaction tests directly in stories:

```tsx
import { expect, userEvent, within } from "@storybook/test";

export const Clickable: Story = {
  args: { children: "Click me" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button"));
    await expect(canvas.getByRole("button")).toHaveFocus();
  },
};
```

### Visual Regression

Chromatic is installed (`@chromatic-com/storybook`). Every story is a visual
snapshot. To flag a story as skip-for-snapshot, add:

```tsx
parameters: {
  chromatic: {
    disableSnapshot: true;
  }
}
```

---

## New Component Checklist

Use this checklist every time you add a component to `@afenda/ui`:

1. Create component in `src/primitives/` (base) or `src/patterns/` (composite)
2. Export from `src/index.ts`
3. Create co-located `*.stories.tsx`:
   - `tags: ["autodocs"]`
   - Cover default, variants, disabled, edge states
4. Create `src/__tests__/*.test.tsx` with RTL assertions
5. Verify visually in Storybook -- check **both** light and dark themes
6. Run `pnpm --filter @afenda/ui typecheck`
7. Run `pnpm --filter @afenda/ui test`

---

## Priority Guide (Remaining Work)

### High Priority

Components actively used in `apps/web`:

- Card, Badge, Avatar, Input, DataTable, SidebarNav

### Medium Priority

Used in the app but simpler surface area:

- Label, Select, DropdownMenu, Breadcrumb, FormField, AppModuleIcon, WidgetGrid

### Lower Priority

Available but not yet consumed by `apps/web`:

- Checkbox, Switch, Dialog, Tooltip, Popover, Tabs, Table (raw), ScrollArea,
  Separator, Skeleton

### Documentation Pages

- `tokens/colors.mdx` -- module palette + semantic token swatches
- `tokens/typography.mdx` -- font family + scale samples

---

## Useful Commands

```bash
pnpm ui:storybook                        # Dev server on :6006
pnpm --filter @afenda/ui build-storybook # Static build
pnpm --filter @afenda/ui test            # Unit tests
pnpm --filter @afenda/ui test:watch      # Watch mode
pnpm --filter @afenda/ui typecheck       # TypeScript
```
