# AFENDA Cross-Module Navigation Standard

## 1. Purpose

Define how users **move between application modules**, **deep-link to records**, and **recover context** across AFENDA ERP shells so that:

- **Primary** navigation (persistent rail, module groups) stays **predictable** and **scalable** as the product grows
- **Secondary** navigation (command palette, search, recents) accelerates expert workflows without replacing the mental model
- **Permission** and **tenant** boundaries are respected—users never see destinations they cannot use ([Permission & role interaction](./permission-role-interaction-standard.md))
- **Layout** and **density** stay coherent with [ERP visual density & typography](./erp-visual-density-typography-standard.md) and [Data grid interaction](./data-grid-interaction-standard.md) shell regions

This standard complements the **view layout contract** ([Metadata-driven view composition](./metadata-driven-view-composition-standard.md) §4.2): navigation occupies explicit **zones** (side panels, header) and is supplied as **data** to rendering components, not invented inside primitives.

---

## Related standards

- [Metadata-driven view composition](./metadata-driven-view-composition-standard.md) — §4.2 zones (header, toolbar, side panels); menu trees as resolved layout data
- [Permission & role interaction](./permission-role-interaction-standard.md) — omit or disable destinations the principal cannot access
- [Data grid interaction](./data-grid-interaction-standard.md) — shell / toolbar region harmony (§3.1)
- [Command surface & toolbar](./command-surface-toolbar-standard.md) — header strip actions alongside nav affordances
- [ERP visual density & typography](./erp-visual-density-typography-standard.md) — collapsed rail, badges, compact labels (§4.2 micro)
- [Notification & system feedback](./notification-system-feedback-standard.md) — wayfinding after redirects; optional links from notifications to targets
- [Workflow & state transition](./workflow-state-transition-standard.md) — deep links into records and workflow queues
- [Audit & traceability UX](./audit-traceability-ux-standard.md) — navigating from audit entries to subject records when permitted
- [Bulk interaction](./bulk-interaction-standard.md) — route changes do not imply selection state; clear scope when returning to grids

---

## 2. Definitions

| Term                     | Meaning                                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| **Module**               | A major product area (HR, Core, Recruitment, …) with a **base path** and grouped **menu items** |
| **Primary navigation**   | Persistent structure: sidebar rail, module headers, nested items                                |
| **Secondary navigation** | Command palette, global search, keyboard shortcuts, contextual “Go to …”                        |
| **Deep link**            | URL (or equivalent) that opens a specific record, tab, or queue inside a module                 |
| **Active state**         | Visual and semantic indication of the current route within the tree                             |

---

## 3. Architectural placement

### 3.1 Source of truth

- **Menu graphs** (modules, items, order, icons, paths) are defined in **metadata, registry, or server-backed config**—versioned and tenant-aware where applicable
- The **interpretation layer** filters items by **permission** and **feature flags** before passing props to UI
- **`@afenda/erp-view-pack`** exposes presentational components (e.g. `SidebarNav`) that render **props**; they do **not** fetch menus or evaluate `can()` ([Rendering layer §3.3](./metadata-driven-view-composition-standard.md))

### 3.2 URL and routing

- Routes must be **stable**, **bookmarkable**, and **shareable** within the tenant’s allowed host
- **Deep links** preserve **module context** so back navigation and breadcrumbs (if used) remain intelligible
- Changing tenant or organization context may **invalidate** open routes; surfaces must **recover** with clear feedback ([Notification & system feedback](./notification-system-feedback-standard.md))

---

## 4. Primary navigation (sidebar / rail)

### 4.1 Structure

- **Modules** group related **menu items**; order follows metadata **sort order**
- **Expand/collapse** per module; **auto-expand** the module containing the **current path** so users orient without manual hunting
- **Collapsed rail** mode: icons + tooltips; **current module** must still be inferable ([ERP visual density](./erp-visual-density-typography-standard.md) §4.2 for badge/label scale)

### 4.2 Badges and counts

- **Counts** on menu items (e.g. open tasks) are **data from the server or engine**, not guessed in the component
- Use **micro** type scale for badges; do not use **destructive** palette for routine counts ([Notification standard](./notification-system-feedback-standard.md) §3 analogy)

### 4.3 Search within the tree

- **Filter-in-place** search across visible labels is optional but recommended for large menus
- Search is **narrowing**, not a replacement for **global** search (§5)

---

## 5. Secondary navigation

### 5.1 Command palette / global search

- Provides **fast jump** to modules, records, and actions the user **may** access
- Results must respect the same **eligibility** rules as the sidebar—**no** leaking hidden modules in result lists
- Keyboard **modality** must be documented (e.g. shortcut to open, arrows to move, Enter to activate)

### 5.2 Contextual links

- **Related record** links, **notification** targets, and **audit** drill-downs should use the same **route vocabulary** as primary nav to avoid duplicate URL schemes

---

## 6. Accessibility

- **Landmarks:** side panel as `nav` where appropriate; **label** matches product language (“Main”, “Module”, or module name)
- **Expand/collapse:** `aria-expanded` and **controls** relationships for module toggles (already required in quality audits for `SidebarNav`)
- **Focus:** navigating to a new view moves focus to **main content** or a **sensible** heading per platform guidelines—avoid focus traps in the rail
- **RTL:** mirror module chevrons and padding when layout is localized

---

## 7. Anti-patterns (prohibited)

- Hard-coded **module lists** inside shared `SidebarNav`-style components
- Showing **links** to routes that **always** 403 for the current user when eligibility was knowable at render time
- **Inconsistent** paths for the same screen (different URL shapes per entry point)
- **Silent** failure when deep link targets a **deleted** or **forbidden** record—use clear empty or error states
- Using **secondary** search as the **only** way to reach core modules (primary structure must remain usable)

---

## 8. Implementation reference (`@afenda/erp-view-pack`)

| Piece                  | Role                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| `navigation-chrome.ts` | `NAVIGATION_SURFACE_ATTR`, `navigationSurfaceDataAttrs()` — `sidebar-rail`, `module-group`, `menu-item-active` |
| `sidebar-nav.tsx`      | Renders `AppModule` / `MenuItem` trees, search filter, collapsed mode, `onNavigate` callback                   |
| `app-module-icon.tsx`  | Module and item icons from metadata codes                                                                      |

Application shells (e.g. Next.js layouts) own **router** integration: pass `currentPath`, wire `onNavigate`, and supply **filtered** `modules`.

---

## 9. Checklist

- [ ] Menu metadata/registry includes sort order, icons, paths, parent/child relationships
- [ ] Engine filters items by permission before render
- [ ] Deep links documented per module; deleted/forbidden targets handled
- [ ] Command palette / global search aligned with eligibility
- [ ] Sidebar meets landmark, expansion, and focus expectations (§6)

---

## 10. Standard outcome

Users can **move across modules** without losing context, **trust** that visible destinations are **reachable**, and **experts** can **jump** quickly—while engineering keeps **one** source of truth for the navigation graph.
