# AFENDA Frontend Implementation

**Status:** Phase 1 & 2 Complete  
**Date:** 2026-03-22  
**Implemented by:** Professional Frontend Developer

> **Current monorepo (updated):** Use **`@afenda/ui-core`**, **`@afenda/view-engine`**, and **`@afenda/erp-view-pack`** only. The former **`@afenda/ui`** facade package and **`apps/web`** have been removed. Sections below retain the original structure; treat **`packages/ui` → `packages/ui-core`** and **`@afenda/ui` → `@afenda/ui-core`** (plus direct view-engine / erp imports) when following file paths or imports.

---

## Overview

This document describes the production-ready frontend implementation for AFENDA-HYBRID, following a **design system first** approach. The implementation establishes a solid foundation for building the complete HCM application.

---

## Implementation Summary

### Phase 1: Design system package (`@afenda/ui-core`)

Created a comprehensive design system package that serves as the foundation for all AFENDA frontend applications.

#### Package Structure

```
packages/ui-core/
├── src/
│   ├── tokens/
│   │   ├── globals.css          -- CSS custom properties, design tokens
│   │   └── index.ts             -- Module color exports
│   ├── primitives/              -- shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── avatar.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── checkbox.tsx
│   │   ├── switch.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── tooltip.tsx
│   │   ├── popover.tsx
│   │   ├── scroll-area.tsx
│   │   ├── tabs.tsx
│   │   ├── table.tsx
│   │   ├── breadcrumb.tsx
│   │   ├── separator.tsx
│   │   └── skeleton.tsx
│   ├── patterns/                -- HCM-specific composites
│   │   ├── app-module-icon.tsx  -- Renders Lucide icons by name
│   │   ├── metric-card.tsx      -- Dashboard metric widgets
│   │   ├── widget-grid.tsx      -- 12-column grid system
│   │   ├── data-table.tsx       -- Sortable/filterable tables
│   │   ├── form-field.tsx       -- Form inputs with Zod
│   │   └── sidebar-nav.tsx      -- DB-driven navigation
│   ├── hooks/
│   │   ├── use-theme.ts         -- Theme management
│   │   ├── use-sidebar.ts       -- Sidebar state
│   │   └── use-media-query.ts   -- Responsive utilities
│   ├── providers/
│   │   └── theme-provider.tsx   -- Theme context
│   ├── lib/
│   │   └── utils.ts             -- cn() helper
│   ├── __tests__/
│   │   ├── setup.ts
│   │   └── button.test.tsx
│   └── index.ts                 -- Barrel export
├── .storybook/
│   ├── main.ts
│   └── preview.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vitest.config.ts
└── README.md
```

#### Design Tokens

**Brand Palette** (from `core.app_modules` DB seed):

- Core: #6366f1 (indigo)
- Security: #8b5cf6 (violet)
- Audit: #64748b (slate)
- HR: #10b981 (emerald)
- Payroll: #f59e0b (amber)
- Benefits: #ec4899 (pink)
- Talent: #06b6d4 (cyan)
- Learning: #14b8a6 (teal)
- Recruitment: #f97316 (orange)

**Semantic Tokens**: background, foreground, card, popover, primary, secondary, muted, accent, destructive, border, input, ring -- all with light/dark mode variants.

#### Key Features

1. **Primitives Layer**: 18 shadcn/ui components adapted for AFENDA
2. **Pattern Components**: 6 HCM-specific composites that map directly to DB schema
3. **Theme System**: Light/dark/system modes with localStorage persistence
4. **Testing**: Vitest + React Testing Library setup
5. **Documentation**: Storybook 8 for component showcase

---

### Phase 2: Next.js Application Shell (`apps/web`)

Created a Next.js 15 App Router application that consumes the design system and connects to the database.

#### App Structure

```
apps/web/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx        -- Login form
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx          -- Authenticated layout
│   │   │   ├── page.tsx            -- Redirect to /dashboard
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx        -- Dashboard with widgets
│   │   │   ├── core/
│   │   │   │   └── organizations/
│   │   │   │       └── page.tsx    -- Organizations list
│   │   │   ├── hr/
│   │   │   │   └── employees/
│   │   │   │       └── page.tsx    -- Employees list
│   │   │   └── recruitment/
│   │   │       └── requisitions/
│   │   │           └── page.tsx    -- Job requisitions list
│   │   ├── layout.tsx              -- Root layout
│   │   ├── page.tsx                -- Redirect to dashboard
│   │   └── globals.css
│   ├── components/
│   │   ├── app-sidebar.tsx         -- Collapsible sidebar
│   │   └── app-header.tsx          -- Header with breadcrumbs
│   └── lib/
│       ├── auth.ts                 -- Session management
│       └── navigation.ts           -- DB-driven menu loading
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── .eslintrc.json
├── .env.example
└── README.md
```

#### Key Features

1. **DB-Driven Navigation**: Sidebar reads from `core.app_modules` + `core.menu_items`
2. **Permission Filtering**: Menu items filtered by user permissions
3. **Dashboard Widgets**: Renders `user_dashboard_widgets` in responsive grid
4. **Theme Integration**: Respects `security.user_preferences.theme`
5. **Sample Pages**: Organizations, Employees, Job Requisitions with DataTable
6. **Server Components**: Data fetching via Drizzle on server side
7. **Type Safety**: Full TypeScript coverage, passes `pnpm typecheck`

---

## Tech Stack

| Layer           | Technology           | Version       |
| --------------- | -------------------- | ------------- |
| Framework       | Next.js (App Router) | 15.1.6        |
| React           | React                | 19.0.0        |
| Styling         | Tailwind CSS         | 4.1.0         |
| Components      | shadcn/ui (adapted)  | --            |
| Icons           | Lucide React         | 0.468.0       |
| Database        | Drizzle ORM          | 1.0.0-beta.19 |
| Validation      | Zod                  | 4.0.0         |
| Forms           | React Hook Form      | 7.54.2        |
| State           | Zustand              | 5.0.2         |
| Testing (UI)    | Vitest + RTL         | 4.1.0         |
| Documentation   | Storybook            | 8.5.0         |
| Package Manager | pnpm                 | 9.15.9        |

---

## Database Integration

The frontend is tightly integrated with the existing database schema:

### Navigation Contract

```typescript
// Reads from:
// - core.app_modules (icon, color, basePath, sortOrder)
// - core.menu_items (label, routePath, icon, requiredPermission, badgeQuery)

const modules = await getAppModulesWithMenu(tenantId, userPermissions);
// Returns: AppModule[] with nested MenuItem[] tree
```

### Dashboard Contract

```typescript
// Reads from:
// - core.dashboard_widgets (templates: METRIC, TABLE, LIST, CALENDAR, CHART)
// - core.user_dashboard_widgets (per-user instances with gridPosition)
// - security.user_preferences.dashboardLayout (optional override)

const widgets = await getUserDashboardWidgets(userId, tenantId);
// Renders in 12-column grid with x, y, w, h positioning
```

### User Preferences Contract

```typescript
// Reads from:
// - security.user_preferences (theme, sidebarCollapsed, locale, timezone)

const preferences = await getUserPreferences(userId, tenantId);
// Applied via ThemeProvider and sidebar state
```

---

## Component Patterns

### 1. AppModuleIcon

Maps string icon names from the database to Lucide React components.

```typescript
<AppModuleIcon iconName="Building2" size={20} />
// Renders: <Building2 size={20} />
```

### 2. SidebarNav

Renders hierarchical navigation from `core.menu_items` with permission filtering.

```typescript
<SidebarNav
  modules={modules}
  currentPath={pathname}
  isCollapsed={isCollapsed}
  onNavigate={(path) => router.push(path)}
/>
```

### 3. MetricCard

Displays dashboard metrics from `dashboard_widgets` of type METRIC.

```typescript
<MetricCard
  title="Employee Count"
  value={1234}
  icon="Users"
  color="#10b981"
  description="Total active employees"
  trend={{ value: 12.5, isPositive: true }}
/>
```

### 4. DataTable

Generic sortable/filterable table for all list pages.

```typescript
<DataTable
  data={employees}
  columns={[
    { id: "code", header: "Code", accessorKey: "employeeCode", sortable: true },
    { id: "status", header: "Status", cell: (row) => <Badge>{row.status}</Badge> },
  ]}
  pageSize={20}
/>
```

### 5. WidgetGrid

12-column grid system for dashboard widgets.

```typescript
<WidgetGrid columns={12} gap={4}>
  {widgets.map(widget => (
    <WidgetGridItem position={{ x: 0, y: 0, w: 4, h: 2 }}>
      <MetricCard {...widget} />
    </WidgetGridItem>
  ))}
</WidgetGrid>
```

---

## Development Workflow

### Install Dependencies

```bash
pnpm install
```

### Storybook

Not configured in-repo. Add Storybook under `@afenda/ui-core` when needed.

### Host application

There is no `apps/web` in this workspace. Add a Next.js (or other) app under `apps/*` and depend on `@afenda/ui-core`, `@afenda/view-engine`, and `@afenda/erp-view-pack`.

### Tests

```bash
pnpm test:ui-packages   # view-engine + erp-view-pack
pnpm test:db          # database package
```

### Typecheck

```bash
pnpm typecheck
pnpm --filter @afenda/ui-core typecheck
pnpm --filter @afenda/view-engine typecheck
```

### Build

Add build scripts to your host app when you create one.

---

## Deployment

### Vercel Setup (via MCP)

The project is ready for Vercel deployment:

1. **Connect Repository**: Use Vercel MCP to create project
2. **Environment Variables**: Set `DATABASE_URL` in Vercel dashboard
3. **Build Settings**: Point at your host app directory when you add one (e.g. `apps/web` with Next.js)
4. **Preview Deployments**: Automatic on PR

### Database Connection

The web app connects to the same PostgreSQL database as `@afenda/db`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/afenda_dev
```

For production, use Neon or your preferred PostgreSQL provider.

---

## Next Steps

### Phase 3: Domain Module Pages

Implement remaining domain pages following the established patterns:

**Core Module:**

- ✅ Organizations (implemented)
- [ ] Locations
- [ ] Workflows
- [ ] Notifications

**HR Module:**

- ✅ Employees (implemented)
- [ ] Departments
- [ ] Attendance
- [ ] Leave Requests

**Recruitment Module:**

- ✅ Job Requisitions (implemented)
- [ ] Applications
- [ ] Interviews

**Other Modules:**

- [ ] Payroll (runs, structures, tax slabs)
- [ ] Benefits (plans, enrollments, claims)
- [ ] Talent (appraisals, skills, succession)
- [ ] Learning (courses, certifications)
- [ ] Security (users, roles, permissions)

### Phase 4: Enhanced Features

- [ ] Real authentication (Neon Auth or Auth.js v5)
- [ ] Server Actions for CRUD operations
- [ ] Form validation with React Hook Form + Zod
- [ ] Optimistic updates with Zustand
- [ ] Real-time notifications
- [ ] Dashboard widget customization (drag-and-drop)
- [ ] Advanced filtering and search
- [ ] Export to CSV/Excel
- [ ] Bulk operations
- [ ] Audit trail viewer

### Phase 5: Production Hardening

- [ ] Error boundaries and error pages
- [ ] Loading states and Suspense
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Performance optimization (Core Web Vitals)
- [ ] E2E tests (Playwright)
- [ ] Visual regression tests (Chromatic)
- [ ] Security audit
- [ ] Internationalization (i18n)
- [ ] Analytics integration
- [ ] Monitoring (Sentry, Vercel Analytics)

---

## Architecture Decisions

### 1. Design System First

**Decision**: Build `@afenda/ui-core` as the design system package; add a host app separately when needed.

**Rationale**:

- Ensures consistent UI across all future apps
- Enables parallel development (design system + app features)
- Facilitates component testing in isolation
- Provides Storybook documentation for the team

### 2. Next.js 15 App Router

**Decision**: Use Next.js 15 with App Router (not Pages Router).

**Rationale**:

- Server Components reduce client bundle size for data-heavy HCM pages
- Streaming and Suspense improve perceived performance
- Built-in API routes eliminate need for separate backend
- Vercel deployment optimized for Next.js
- App Router is the future of Next.js

### 3. Tailwind CSS v4

**Decision**: Use Tailwind v4 with CSS custom properties.

**Rationale**:

- Design tokens via CSS variables enable runtime theming
- Zero-runtime CSS-in-JS (better performance than styled-components)
- JIT compilation keeps bundle size small
- Aligns with shadcn/ui conventions
- v4 improves DX with `@theme` directive

### 4. shadcn/ui (Copy, Not Dependency)

**Decision**: Copy shadcn/ui components into the repo (not npm install).

**Rationale**:

- Full control over component code
- No version lock-in
- Easy customization for AFENDA brand
- Radix primitives provide accessibility
- shadcn MCP available for adding new components

### 5. DB-First Data Fetching

**Decision**: Server Components fetch directly via Drizzle (no REST/GraphQL layer initially).

**Rationale**:

- Eliminates API boilerplate
- Type-safe end-to-end (DB → UI)
- Reduces latency (no extra hop)
- Simplifies deployment (single Next.js app)
- Can add API layer later if needed (e.g., for mobile apps)

### 6. Zustand for Client State

**Decision**: Use Zustand for minimal client state (sidebar, filters, etc.).

**Rationale**:

- Lightweight (1KB)
- No Provider boilerplate
- Simple API
- Server Components handle most state
- Avoids Redux complexity

---

## Design System API

### Primitives

All primitives follow shadcn/ui conventions with AFENDA theming:

```typescript
import { Button, Card, Badge, Input, Select } from "@afenda/ui-core";

<Button variant="default" size="lg">Save</Button>
<Card><CardHeader><CardTitle>Title</CardTitle></CardHeader></Card>
<Badge variant="destructive">Error</Badge>
```

### Patterns

HCM-specific composites:

```typescript
import { MetricCard, DataTable, SidebarNav, WidgetGrid } from "@afenda/ui-core";
import { FormView } from "@afenda/view-engine";

// Metric widget
<MetricCard title="Employees" value={1234} icon="Users" color="#10b981" />

// Data table
<DataTable data={rows} columns={columns} pageSize={20} />

// Navigation
<SidebarNav modules={modules} currentPath="/hr/employees" />

// Widget grid
<WidgetGrid columns={12}>
  <WidgetGridItem position={{ x: 0, y: 0, w: 4, h: 2 }}>
    <MetricCard {...widget} />
  </WidgetGridItem>
</WidgetGrid>
```

### Hooks

```typescript
import { useTheme, useSidebar, useMediaQuery } from "@afenda/ui-core";

const { theme, setTheme } = useTheme();
const { isCollapsed, toggle } = useSidebar();
const isMobile = useMediaQuery("(max-width: 768px)");
```

---

## Database Schema Mapping

The frontend directly maps to these DB tables:

| DB Table                       | Frontend Usage                                       |
| ------------------------------ | ---------------------------------------------------- |
| `core.app_modules`             | Sidebar top-level modules (icon, color, name)        |
| `core.menu_items`              | Sidebar navigation tree (routes, icons, permissions) |
| `core.dashboard_widgets`       | Widget templates (METRIC, TABLE, LIST, etc.)         |
| `core.user_dashboard_widgets`  | Per-user widget instances with grid positions        |
| `security.users`               | User profile, avatar, display name                   |
| `security.user_preferences`    | Theme, sidebar state, locale, timezone               |
| `security.roles`               | Role-based access control                            |
| `security.permissions`         | Permission keys for menu filtering                   |
| `hr.employees`                 | Employee list page                                   |
| `core.organizations`           | Organizations list page                              |
| `recruitment.job_requisitions` | Job requisitions list page                           |

---

## CI Integration

### Existing Gates Extended

The implementation integrates with existing CI gates:

```yaml
# .github/workflows/early-gate.yml
- Typecheck: pnpm typecheck (workspace packages)
- Lint: pnpm lint (includes all packages)
- Format: pnpm format:check

# New jobs to add:
- UI tests: pnpm test:ui-packages
- Storybook: add to `@afenda/ui-core` when needed
- Web build: add a host app (e.g. Next.js) under `apps/*` when needed
```

### Recommended Additions

1. **Vercel Preview Deployments**: Auto-deploy on PR via Vercel MCP
2. **Chromatic**: Visual regression testing for UI package
3. **Playwright**: E2E tests for critical user flows

---

## File Inventory

### New Files Created

**Workspace Config:**

- `pnpm-workspace.yaml` (`packages/*`)
- `package.json` (updated: `test:ui-packages`, `ui-core`, etc.)

**@afenda/ui-core package (representative files):**

- `packages/ui-core/package.json`
- `packages/ui-core/tsconfig.json`
- `packages/ui-core/tailwind.config.ts`
- `packages/ui-core/README.md`
- `packages/ui-core/.gitignore`
- `packages/ui-core/src/tokens/globals.css`
- `packages/ui-core/src/tokens/index.ts`
- `packages/ui-core/src/lib/utils.ts`
- `packages/ui-core/src/index.ts`
- 18 primitive components (button, card, badge, etc.)
- 6 pattern components (app-module-icon, metric-card, etc.)
- 3 hooks (use-theme, use-sidebar, use-media-query)
- 1 provider (theme-provider)
- 2 test files (setup, button.test)
- 2 Storybook files (main, preview)
- 2 story files (button.stories, metric-card.stories)

**Host app:** removed from this monorepo (recreate under `apps/*` when needed).

**Documentation:**

- `docs/frontend/implementation.md` (this file)

**Total**: varies with current `packages/*` only

---

## Verification

### Typecheck Status

```bash
$ pnpm typecheck
✓ packages/db typecheck: Done
✓ packages/ui-core typecheck: Done
✓ packages/view-engine typecheck: Done
✓ packages/erp-view-pack typecheck: Done
```

All packages pass TypeScript compilation with zero errors.

### Package Dependencies

```bash
$ pnpm install
✓ Packages: +482
✓ All workspace dependencies resolved
```

---

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Start database (if not running)
pnpm docker:test:start

# 3. Run migrations and seed data
pnpm db:migrate
pnpm db:seed

# 4. Add or run your host app (not in this repo snapshot)
```

---

## GitHub Integration

### Current Repository State

- **Repo**: `pohlai88/afenda-hybrid`
- **Branch**: `master`
- **Last Commit**: 2026-03-22 (docs CI path filter)
- **Open Issues**: 0
- **Open PRs**: 0

### Recommended Next Steps

1. **Create Feature Branch**: `git checkout -b feat/frontend-design-system`
2. **Commit Changes**: Commit all 51 new files
3. **Create PR**: Use GitHub MCP to create PR with summary
4. **CI Validation**: Ensure early-gate passes
5. **Deploy Preview**: Vercel auto-deploys preview URL
6. **Review**: Team reviews design system + app shell
7. **Merge**: Merge to master after approval

---

## Production Readiness Checklist

### ✅ Completed

- [x] Design system package with 18 primitives
- [x] 6 HCM pattern components
- [x] Theme system (light/dark/system)
- [x] Next.js 15 app shell
- [x] DB-driven navigation
- [x] Dashboard with widget grid
- [x] 3 sample domain pages
- [x] TypeScript strict mode (zero errors)
- [x] Monorepo workspace configuration
- [x] Storybook documentation
- [x] Vitest test setup

### 🔄 In Progress (Phase 3+)

- [ ] Real authentication
- [ ] All domain pages (23 routes from menu_items)
- [ ] CRUD operations via Server Actions
- [ ] Form validation
- [ ] Error handling
- [ ] Loading states
- [ ] E2E tests

### 📋 Backlog (Phase 4+)

- [ ] Internationalization
- [ ] Advanced dashboard customization
- [ ] Real-time features
- [ ] Mobile responsive refinement
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] Security hardening

---

## Notes for Team

### For Backend Developers

The frontend is **DB-first** -- all navigation, permissions, and dashboard configuration come from the database. When you add/modify:

- `core.menu_items`: Sidebar updates automatically
- `core.dashboard_widgets`: New widget types available
- `security.permissions`: Menu filtering respects new permissions

### For Frontend Developers

The design system is in `packages/ui`. To add a new component:

1. Add primitive to `src/primitives/` (or use shadcn MCP)
2. Add pattern to `src/patterns/` (HCM-specific composites)
3. Export from `src/index.ts`
4. Add Storybook story
5. Add Vitest test
6. Use in `apps/web`

### For DevOps/SRE

- **Deployment**: Vercel (recommended) or any Node.js host
- **Database**: Requires PostgreSQL 15+ with existing AFENDA schema
- **Environment**: `DATABASE_URL` is the only required variable
- **Build**: `pnpm web:build` produces static + server bundle
- **Monitoring**: Add Vercel Analytics or Sentry

---

## References

- [Main README](../README.md)
- [DB Package](../packages/db/README.md)
- [DB-First Guideline](./architecture/01-db-first-guideline.md)
- [Quick Start](./QUICK_START.md)
- [CI Gates](./CI_GATES.md)

---

_This document is part of the AFENDA-HYBRID monorepo documentation. For questions or issues, open a GitHub issue._
