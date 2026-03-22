# @afenda/ui

AFENDA design system package. Provides design tokens, primitives (shadcn/ui), and HCM-specific pattern components for all AFENDA frontend applications.

## Structure

```
src/
  tokens/       -- CSS custom properties, design tokens
  primitives/   -- shadcn/ui components (Button, Input, Dialog, etc.)
  patterns/     -- HCM composites (MetricCard, SidebarNav, DataTable, etc.)
  hooks/        -- React hooks (useTheme, useSidebar, etc.)
  lib/          -- Utilities (cn, variants)
  index.ts      -- Barrel export
```

## Usage

```typescript
import { Button, Card, MetricCard } from "@afenda/ui";
import { useTheme } from "@afenda/ui/hooks/use-theme";
```

## Development

```bash
pnpm install
pnpm typecheck
pnpm lint
```
