# ERP View Pack — Patterns Quality Audit

**Reference implementation**: `action-bar.tsx` + selection system

**Metadata-driven composition** (`metadata-driven-view-composition-standard.md` §3.3): Patterns and widgets are presentation-only — no `fetch`/permission inference in `patterns/` or `widgets/`; `registerErpWidgets` augments the view-engine registry (§7, §9). See `metadata-rendering-layer.ts`, `ERP_PACK_RENDERING_LAYER`.

**Command surface & toolbar** (`command-surface-toolbar-standard.md`): Bulk bars use zone dividers, horizontal action scroll, and `data-afenda-command-surface`; see `command-surface-toolbar.ts`.

**Notification & system feedback** (`notification-system-feedback-standard.md`): Inbox shell uses `data-afenda-notification-surface` on trigger and panel; `notification-feedback.ts` + `feedback-toast.ts` (`showFeedback`).

**Permission & role interaction** (`permission-role-interaction-standard.md`): No dedicated pattern file — eligibility is resolved outside `@afenda/erp-view-pack`; `metadata-rendering-layer.ts` and `selection/index.ts` document the boundary.

**Workflow & state transition** (`workflow-state-transition-standard.md`): `record-status-bar.tsx` (guarded `disabled` states), `workflow-state-banner.tsx`, `status-badge.tsx`; transition rules live in domain/metadata — see `metadata-rendering-layer.ts`.

**Cross-module navigation** (`cross-module-navigation-standard.md`): `navigation-chrome.ts` conformance attrs; primary rail via `sidebar-nav.tsx` + `app-module-icon.tsx`; filtered `modules` / menu data from outside the package.

| Pattern                      | A11y | Motion | Tokens | Tests | Stories | Notes                                                                                                                           |
| ---------------------------- | ---- | ------ | ------ | ----- | ------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **audit-chrome**             | N/A  | N/A    | ✅     | ✅    | N/A     | Audit typography + diff surface tokens (`audit-traceability-ux-standard.md` §6.1, §8).                                          |
| **audit-field-diff**         | ✅   | N/A    | ✅     | ✅    | ✅      | Read-only group, SR before/after copy, `ERP_TYPO_BODY` base.                                                                    |
| **erp-typography**           | N/A  | N/A    | ✅     | ✅    | N/A     | Visual density type scale + spacing tokens (`erp-visual-density-typography-standard.md`).                                       |
| **metadata-rendering-layer** | N/A  | N/A    | ✅     | ✅    | N/A     | §3.3 contract doc + `ERP_PACK_RENDERING_LAYER` (`metadata-driven-view-composition-standard.md`).                                |
| **command-surface-toolbar**  | N/A  | N/A    | ✅     | ✅    | N/A     | `COMMAND_SURFACE_*`, `commandSurfaceDataAttrs`, chrome aliases (`command-surface-toolbar-standard.md`).                         |
| **notification-feedback**    | N/A  | N/A    | ✅     | ✅    | N/A     | `NOTIFICATION_FEEDBACK_ATTR`, `notificationSurfaceDataAttrs` (`notification-system-feedback-standard.md` §8).                   |
| **navigation-chrome**        | N/A  | N/A    | ✅     | ✅    | N/A     | `NAVIGATION_SURFACE_ATTR`, `navigationSurfaceDataAttrs` (`cross-module-navigation-standard.md` §8).                             |
| **feedback-toast**           | N/A  | N/A    | ✅     | ✅    | N/A     | `showFeedback` → Sonner (`notification-system-feedback-standard.md` §10).                                                       |
| **action-bar**               | ✅   | ✅     | ✅     | ✅    | ✅      | Command surface id; optional `disabledReason` (permission §5); zones/dividers, live region, destructive severity, Escape clear. |
| **sticky-action-bar**        | ✅   | ✅     | ✅     | ✅    | ✅      | Command surface id; optional `disabledReason`; zone divider + `gap-3`; parity with destructive props; action-bar suite.         |
| **animated-selection-count** | ✅   | ✅     | ✅     | ✅    | ✅      | Numeric stability (min-w), motion-reduce, enter-animation classes, keyed remount.                                               |
| **bulk-selection-notice**    | ✅   | ✅     | ✅     | ✅    | ✅      | `data-afenda-command-surface=bulk-selection-notice`, live region, `ERP_TYPO_BODY`, escalation links.                            |
| **compact-selection-bar**    | ✅   | ✅     | ✅     | ✅    | ✅      | Command surface id; optional `disabledReason`; `ACTION_BAR_DIVIDER`, destructive severity, clear, scope hints.                  |
| **metric-card**              | ✅   | ✅     | ✅     | ✅    | ✅      | `ERP_TYPO_KPI_VALUE` / overline / meta; tabular KPI; trend/meta-strong.                                                         |
| **description-list**         | ✅   | N/A    | ✅     | ✅    | ✅      | `ERP_TYPO_OVERLINE_LABEL` on `<dt>`; `valueTone` for audit metadata; em dash empty.                                             |
| **stat-group**               | ✅   | ✅     | ✅     | ✅    | ✅      | `ERP_TYPO_KPI_VALUE` (semibold display); overline labels; meta-strong trends.                                                   |
| **status-badge**             | ✅   | N/A    | ✅     | ✅    | ✅      | `ERP_TYPO_META_STRONG`; dot aria-hidden; semantic status colors only.                                                           |
| **notification-center**      | ✅   | ✅     | ✅     | ✅    | ✅      | `data-afenda-notification-surface` trigger + panel; `ERP_TYPO_*` + optional `timestampIso` → `<time>`.                          |
| **sidebar-nav**              | ✅   | ✅     | ✅     | ✅    | ✅      | `data-afenda-nav-surface` rail / module-group / menu-item-active; `ERP_TYPO_MICRO` badges; search, collapsed mode.              |
| **record-status-bar**        | ✅   | ✅     | ✅     | ✅    | ✅      | `disabled` / `disabledReason`; `ERP_TYPO_META_STRONG`; `workflow-state-transition-standard.md` §5.1.                            |
| **workflow-state-banner**    | ✅   | ✅     | ✅     | ✅    | ✅      | `Alert` + ERP type roles; `role="status"` `aria-live="polite"` (`workflow-state-transition-standard.md` §5.2).                  |
| **app-module-icon**          | ✅   | N/A    | ✅     | ✅    | ✅      | Resolves Lucide forward-ref icons; fallback to HelpCircle; className/size.                                                      |

---

## Legend

- ✅ Strong / complete
- ⚠️ Partial / minor gaps
- ❌ Missing
- N/A Not applicable (static)

---

## Priority gaps (Phase 2)

**All critical gaps closed!** ✅

All patterns now implement:

- ✅ **motion-reduce** via `PATTERN_DENSE_MOTION` on all interactive patterns
- ✅ **aria-hidden** on all decorative icons (trend arrows, status dots, module icons)
- ✅ **aria-expanded / aria-controls** on sidebar-nav module toggles
- ✅ **type="button"** + **aria-label** on all interactive buttons
- ✅ **Keyboard nav** for clickable metric-card (button wrapper with focus-visible ring)

---

## Test coverage status

**Major patterns now have comprehensive unit tests!** ✅

### Completed test suites:

- ✅ **ActionBar/StickyActionBar** — count, destructive, clear callback, variants, `disabledReason`
- ✅ **MetricCard** — loading, trend, onClick, keyboard nav
- ✅ **NotificationCenter** — unread count, mark all read, interactions, conformance attrs
- ✅ **RecordStatusBar** — state transitions, onChange, variants, folded states, disabled guards
- ✅ **SidebarNav** — search, expand/collapse, navigation, collapsed mode, nav conformance attrs
- ✅ **StatGroup** — trend display, layout, typography
- ✅ **BulkSelectionNotice** — escalation links, callbacks, edge cases
- ✅ **SelectionStore** — toggle, reconciliation, virtual selection
- ✅ **AnimatedSelectionCount** — copy/variants, min-width + animation classes, motion-reduce, keyed remount, danger tone
- ✅ **CompactSelectionBar** — null at zero, live region, children, divider, className, `disabledReason`
- ✅ **DescriptionList** — `<dl>` semantics, columns 1–3, empty value, ReactNode values
- ✅ **StatusBadge** — all status variants (label + dot + text class), custom label, aria-hidden dot
- ✅ **AppModuleIcon** — valid icon vs fallback markup, className/size on SVG
- ✅ **audit-chrome** — identifier / timestamp / actor / diff / surface tokens
- ✅ **AuditFieldDiff** — group label, before/after, strike optional, SR hints
- ✅ **erp-typography** — role tokens + spacing scale string coverage
- ✅ **metadata-rendering-layer** — rendering-layer contract export + standard reference
- ✅ **command-surface-toolbar** — attrs helper + zone divider alias coverage
- ✅ **notification-feedback** — surface attr + `notificationSurfaceDataAttrs` roles
- ✅ **navigation-chrome** — `navigationSurfaceDataAttrs` roles
- ✅ **feedback-toast** — `showFeedback` severity dispatch
- ✅ **WorkflowStateBanner** — status variants, actions slot, a11y role

---

## Token alignment status

**All tokens properly aligned!** ✅

- ✅ **ERP type scale**: `erp-typography.ts` (`ERP_TYPO_*`, `ERP_SPACE_*`) for Visual Density Standard §3.2–4.2
- ✅ **Dense typography**: `PATTERN_DENSE_TEXT` implemented in `pattern-chrome.ts` for executive density
- ✅ **Motion bundle**: `PATTERN_DENSE_MOTION` implemented and used across all interactive patterns
- ✅ **Bar surface**: `PATTERN_BAR_SURFACE` shared across sticky/compact bars and notices
- ✅ **Decorative icons**: `PATTERN_DECORATIVE_ICON` constant available for consistency

---

## Structure notes

- `selection-scope.ts` in `patterns/` but store in `selection/` — minor split; consider moving to `selection/` for cohesion.
- Flat exports work well; grouping into `patterns/bulk/` optional (higher churn, no functional benefit).
