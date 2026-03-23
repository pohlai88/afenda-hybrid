# AFENDA Command Surface & Toolbar Standard

## 1. Purpose

Define how **command surfaces** and **toolbars** present actions, context, and selection state in AFENDA ERP applications so that:

- Users can predict where commands live and how they behave
- Dense operational layouts stay scannable and accessible
- Bulk and contextual actions align with metadata-driven composition
- Visual hierarchy matches [ERP visual density & typography](./erp-visual-density-typography-standard.md)

A **command surface** is any persistent or contextual region that groups controls (toolbars, selection bars, header strips). This standard complements the [bulk interaction](./bulk-interaction-standard.md) and [data grid](./data-grid-interaction-standard.md) standards.

---

## Related standards

- [Bulk interaction](./bulk-interaction-standard.md) — selection scope, live regions, Escape-to-clear
- [Data grid interaction](./data-grid-interaction-standard.md) — toolbar / selection layer placement
- [Destructive action safety](./destructive-action-safety-standard.md) — muted destructive chrome, severity, confirmations
- [ERP visual density & typography](./erp-visual-density-typography-standard.md) — spacing scale, type roles on bars
- [Metadata-driven view composition](./metadata-driven-view-composition-standard.md) — action slots supplied by engine; no permission logic in components
- [Notification & system feedback](./notification-system-feedback-standard.md) — shell inbox trigger placement in header/toolbar zones
- [Permission & role interaction](./permission-role-interaction-standard.md) — toolbar actions are eligible slots from resolved contracts, not inferred in primitives
- [Workflow & state transition](./workflow-state-transition-standard.md) — transition actions surfaced in command zones when metadata places them there
- [Cross-module navigation](./cross-module-navigation-standard.md) — header zone next to app-level nav; consistent route vocabulary

---

## 2. Design intent

Command surfaces must:

- Expose **one primary context** per strip (e.g. current selection count, current record, or global page actions—not all mixed without hierarchy)
- Keep **frequent actions** visible; **overflow** rare and explicit (menu, “More”)
- Preserve **keyboard and screen-reader parity** with pointer use
- Use **calm, token-driven** styling—no decorative chrome that competes with data

---

## 3. Core principles

### 3.1 Zone semantics

Typical left-to-right (RTL mirrored in locale-aware layouts):

1. **Context** — what the bar applies to (selection count, scope hint, record label)
2. **Divider** — low-contrast vertical rule (`aria-hidden`)
3. **Actions** — primary commands; may scroll horizontally on narrow widths
4. **Divider** (optional) — before destructive-adjacent or dismiss controls
5. **Dismiss / secondary** — clear selection, close contextual mode

Zones must not reorder arbitrarily between modules for the same pattern.

### 3.2 Single live region per contextual bar

Selection and bulk context updates use **one** `role="status"` region with `aria-live="polite"` and `aria-atomic="true"` unless a product-specific pattern documents fragmentation.

### 3.3 Destructive and high-impact actions

Muted shell only on the bar; **confirmations and eligibility** live in domain / metadata layers per [destructive action safety](./destructive-action-safety-standard.md).

### 3.4 Touch and compact density

Interactive targets meet or exceed **40×40px** where feasible on floating bars; compact strips use documented minima and [bulk standard](./bulk-interaction-standard.md) checkbox touch tokens for grid selection.

---

## 4. Toolbar variants

| Variant                | Use                                | Anchoring                                |
| ---------------------- | ---------------------------------- | ---------------------------------------- |
| **Floating**           | Global / page-level bulk selection | Viewport-safe bottom, centered or corner |
| **Sticky (container)** | Table / grid selection             | Bottom of scrollable table wrapper       |
| **Compact strip**      | Financial / dense grids            | Header-adjacent, border-b, non-floating  |
| **Escalation notice**  | Select-all prompts                 | Separate strip; may coexist above grid   |

---

## 5. Action overflow

When actions exceed horizontal space:

- Prefer **horizontal scroll** with a subtle fade mask—not hidden commands without affordance
- Preserve **visible primary** action where metadata marks it primary
- Do not rely on hover-only discovery for required tasks

---

## 6. Keyboard & focus

- **Escape** clears selection when the bar owns that contract ([bulk standard](./bulk-interaction-standard.md) §6.2); allow opt-out when modals own Escape
- Icon buttons: `type="button"`, explicit `aria-label`
- Focus order: context → actions left-to-right → dismiss

---

## 7. Identifiers for conformance

Implementations may expose:

- `data-afenda-command-surface="bulk-selection-toolbar"` on floating, sticky, and compact bulk bars
- `data-afenda-command-surface="bulk-selection-notice"` on escalation notices

For testing, analytics, and layout audits—not a substitute for accessible names.

---

## 8. Anti-patterns (prohibited)

- Hidden critical actions with no overflow affordance
- Multiple competing `aria-live` regions for the same selection state
- Bright “alarm” destructive styling on toolbars (use progressive severity tokens)
- Permission or role checks inside presentational toolbar components
- Ad-hoc spacing outside the shared spacing scale ([visual density](./erp-visual-density-typography-standard.md) §3.2)

---

## 9. Implementation reference (`@afenda/erp-view-pack`)

| Area             | Files / exports                                                                                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chrome & motion  | `action-bar-chrome.ts` — `ACTION_BAR_ROOT_MOTION`, `ACTION_BAR_ACTIONS_SCROLL`, `ACTION_BAR_DIVIDER*`, `ACTION_BAR_DESTRUCTIVE`, `ACTION_BAR_COMPACT_CHILD_HIT` |
| Semantic aliases | `command-surface-toolbar.ts` — `COMMAND_SURFACE_*` re-exports + `COMMAND_SURFACE_ATTR`, role string constants                                                   |
| Components       | `ActionBar`, `StickyActionBar`, `CompactSelectionBar`, `BulkSelectionNotice`                                                                                    |
| Selection shell  | `selection-tokens.ts` — `SELECTION_BAR_SURFACE`, `SELECTION_EXEC_TEXT`                                                                                          |

---

## 10. Standard outcome

Consistent command surfaces reduce training cost, support metadata-driven action wiring, and keep operational UIs legible under load.
