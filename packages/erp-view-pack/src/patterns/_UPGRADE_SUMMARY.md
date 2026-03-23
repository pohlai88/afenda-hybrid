# ERP View Pack — Patterns Upgrade Summary

**Completed**: 2026-03-23  
**Scope**: All 12+ patterns in `packages/erp-view-pack/src/patterns/`

---

## What was upgraded

### Phase 1 — Conventions & shared chrome

**Created:**

- [`pattern-chrome.ts`](pattern-chrome.ts) — shared tokens for dense motion, executive typography, bar surfaces, decorative icon guard.
- [`_CONVENTIONS.md`](_CONVENTIONS.md) — coding standards (client directives, imports, class composition, a11y, motion, tokens, testing).
- [`_AUDIT_MATRIX.md`](_AUDIT_MATRIX.md) — per-pattern quality checklist with gap analysis.

**Extracted tokens:**

- `PATTERN_DENSE_MOTION` — `tracking-tight` + `motion-reduce:animate-none motion-reduce:transition-none`
- `PATTERN_DENSE_TEXT` — `text-[13px] font-medium tracking-tight` (executive density)
- `PATTERN_BAR_SURFACE` — `bg-muted/60 backdrop-blur supports-[backdrop-filter]:bg-muted/40`
- `PATTERN_DECORATIVE_ICON` — `aria-hidden` constant

**Import cleanup:**

Removed unused `import * as React from "react"` from 10+ files; kept namespace only where needed (`React.useState`, `React.ComponentType`, etc.).

---

### Phase 2 — Per-pattern accessibility & motion

| Pattern                 | Changes                                                                                                                                                                                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **metric-card**         | • Trend icons → `aria-hidden`<br>• Clickable cards wrapped in `<button>` with focus ring<br>• `PATTERN_DENSE_MOTION` on transitions                                                                                                                                                                    |
| **stat-group**          | • Trend icons → `aria-hidden`<br>• `PATTERN_DENSE_MOTION` on root                                                                                                                                                                                                                                      |
| **notification-center** | • Badge → `role="status"` + `aria-live="polite"` + `aria-label`<br>• "Mark all read" → `type="button"` + `aria-label`<br>• Notification list → `<ul role="list">` + `<li>`<br>• Icon container → `aria-hidden`<br>• Unread dot → `aria-hidden`<br>• `PATTERN_DENSE_MOTION` on notification buttons     |
| **sidebar-nav**         | • Root → `<nav aria-label="Main navigation">`<br>• Module toggle → `aria-expanded` + `aria-controls`<br>• Collapsed module button → `aria-label`<br>• Search icon → `aria-hidden`<br>• Chevrons → `aria-hidden`<br>• Module icon containers → `aria-hidden`<br>• `PATTERN_DENSE_MOTION` on transitions |
| **record-status-bar**   | • `role="group"` → `role="radiogroup"`<br>• `PATTERN_DENSE_MOTION` on transitions                                                                                                                                                                                                                      |

**No changes needed** (already compliant or static):

- `description-list` — static, semantic `<dl>` already used
- `status-badge` — dot already `aria-hidden`
- `app-module-icon` — utility component, no a11y concerns

---

### Phase 3 — Structure

**Moved:**

- `patterns/selection-scope.ts` → `selection/selection-scope.ts`
- Updated barrel exports in `selection/index.ts` and package root `index.ts`

**Result:** Selection types + runtime now live in one cohesive `selection/` module.

---

### Phase 4 — Tests

**Created:**

- [`__tests__/action-bar.test.tsx`](../__tests__/action-bar.test.tsx) — 16 tests covering:
  - Rendering (count, singular/plural, zero-count null, clear button)
  - Destructive mode (data attribute, ghost variant)
  - Variants (floating, sticky delegation, compact)
  - Interactions (onClear callback)
  - Accessibility (live region attributes)
  - StickyActionBar (positioning, count, clear, destructive)

**Test results:**

```
Test Files  5 passed (5)
Tests  38 passed (38)
```

---

## Design system improvements

### Shared chrome (`action-bar-chrome.ts`)

- `ACTION_BAR_ROOT_MOTION` — motion-reduce + tracking-tight
- `ACTION_BAR_DESTRUCTIVE` — stronger risk signal (border/50, bg/[0.08], box-shadow ring)
- `ACTION_BAR_ACTIONS_SCROLL` — `.mask-gradient-x` fade
- `ACTION_BAR_DIVIDER` / `_COMPACT` — softer `bg-border/70`
- `ACTION_BAR_COMPACT_CHILD_HIT` — touch-safe minimums

### Button primitive (`@afenda/ui-core`)

Added `destructive-ghost` variant for calmer destructive-adjacent controls.

### Design tokens (`@afenda/ui-core/tokens/globals.css`)

Added `.mask-gradient-x` utility for horizontal scroll affordance.

### AnimatedSelectionCount

- Numeric stability: `min-w-[7ch] text-center` prevents jitter
- `dangerTone` prop → `text-destructive/90`
- `motion-reduce` on animation

---

## Success criteria met

- ✅ ESLint clean on `patterns/` and `selection/`
- ✅ Consistent a11y (live regions, aria-labels, decorative icons hidden, semantic roles)
- ✅ Motion-reduce on all animated/interactive patterns
- ✅ Selection types + store in one `selection/` subtree
- ✅ Automated tests for ActionBar/StickyActionBar (16 tests)
- ✅ TypeScript strict mode passes
- ✅ All 38 tests pass

---

## Architecture quality

**Before upgrade:**

- Mixed a11y depth
- Inconsistent motion handling
- Some unused imports
- No tests for patterns
- Selection types split across folders

**After upgrade:**

- Consistent enterprise-grade a11y
- Motion-reduce everywhere
- Clean imports (React namespace only when needed)
- Test coverage for bulk selection path
- Cohesive selection module
- Shared chrome tokens prevent drift
- Design-system publishable quality

---

## Files created/modified

**Created:**

- `patterns/pattern-chrome.ts`
- `patterns/action-bar-chrome.ts`
- `patterns/_CONVENTIONS.md`
- `patterns/_AUDIT_MATRIX.md`
- `patterns/_UPGRADE_SUMMARY.md` (this file)
- `selection/selection-scope.ts` (moved)
- `__tests__/action-bar.test.tsx`

**Modified:**

- `patterns/action-bar.tsx`
- `patterns/sticky-action-bar.tsx`
- `patterns/compact-selection-bar.tsx`
- `patterns/bulk-selection-notice.tsx`
- `patterns/animated-selection-count.tsx`
- `patterns/metric-card.tsx`
- `patterns/stat-group.tsx`
- `patterns/notification-center.tsx`
- `patterns/sidebar-nav.tsx`
- `patterns/record-status-bar.tsx`
- `patterns/description-list.tsx`
- `selection/index.ts`
- `index.ts`
- `package.json` (added `zustand`, `@testing-library/user-event`)
- `../../ui-core/src/primitives/button.tsx` (added `destructive-ghost`)
- `../../ui-core/src/tokens/globals.css` (added `.mask-gradient-x`)

---

## Next steps (optional)

- Add tests for other interactive patterns (MetricCard, NotificationCenter, RecordStatusBar)
- Consider Framer Motion for advanced animations (if needed)
- Document bulk interaction standard (if requested)
- Add visual regression tests via Storybook + Chromatic
