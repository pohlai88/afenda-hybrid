# AFENDA Notification & System Feedback Standard

## 1. Purpose

Define how **notifications**, **alerts**, and **system feedback** are presented across AFENDA applications so that:

- Users distinguish **informational** updates from **action-required** and **destructive-risk** messages
- Feedback is **accessible**, **predictable**, and **non-blocking** unless safety demands interruption
- **Operational density** is preserved—feedback supports work; it does not replace primary surfaces
- **Metadata and server truth** remain authoritative; UI reflects state, it does not invent it

This standard complements [Audit & traceability UX](./audit-traceability-ux-standard.md) (immutable history) and [Destructive action safety](./destructive-action-safety-standard.md) (real destructive controls).

---

## Related standards

- [Audit & traceability UX](./audit-traceability-ux-standard.md) — long-lived, evidence-grade history vs ephemeral inbox items
- [Destructive action safety](./destructive-action-safety-standard.md) — destructive **actions** vs red **badges** for attention (not equivalent)
- [ERP visual density & typography](./erp-visual-density-typography-standard.md) — meta/micro type roles, tabular times
- [Metadata-driven view composition](./metadata-driven-view-composition-standard.md) — notification payloads and eligibility from contracts
- [Command surface & toolbar](./command-surface-toolbar-standard.md) — shell placement of the inbox trigger (header/toolbar zones)
- [Bulk interaction](./bulk-interaction-standard.md) — analogous live-region discipline for selection counts vs notification counts
- [Permission & role interaction](./permission-role-interaction-standard.md) — forbidden-operation messaging; avoid leaking internal permission keys in user copy
- [Workflow & state transition](./workflow-state-transition-standard.md) — task queues, approvals, SLA nudges, transition rejection feedback
- [Cross-module navigation](./cross-module-navigation-standard.md) — deep links from notifications to permitted targets; tenant/route recovery messaging

---

## 2. Feedback channels

| Channel                 | Role                                  | Typical persistence                    |
| ----------------------- | ------------------------------------- | -------------------------------------- |
| **In-app inbox / list** | Reviewable messages, links to context | Until read or expired per policy       |
| **Toast / banner**      | Lightweight acknowledgment            | Ephemeral; auto-dismiss with pause     |
| **Inline / field**      | Validation, save state                | Tied to control                        |
| **Modal / blocking**    | Irreversible or safety-critical       | Until explicit dismiss (use sparingly) |

Do not use **blocking modals** for routine informational notifications.

---

## 3. Severity & semantics

Use **consistent visual semantics** (luminance-first per [visual density](./erp-visual-density-typography-standard.md) §7):

| Level              | Meaning                        | UI treatment                                     |
| ------------------ | ------------------------------ | ------------------------------------------------ |
| **Neutral / info** | FYI, no user fault             | Muted or default surface                         |
| **Success**        | Completed operation            | Positive semantic tone; no gloating copy         |
| **Warning**        | Risk of mistake or degradation | Warning tone; actionable next step when possible |
| **Error**          | Failure or blocked operation   | Clear error tone; recovery path or support hint  |

**Unread count badges** may use high-contrast or “attention” palettes for **visibility**; that is **not** the same as labeling a control “destructive.”

---

## 4. Content rules

- **Title**: short, specific (what happened or what is needed)
- **Body**: optional detail; avoid duplicating audit log prose in the inbox
- **Timestamp**: prefer machine-parseable `datetime` when showing relative time ([audit typography](./audit-traceability-ux-standard.md) §8.3 alignment)
- **Actions**: primary action ≤ one visible; secondary actions in menu or detail view if needed

---

## 5. Accessibility

- **Unread summary**: a single polite live region for the **count** is acceptable; avoid stacking multiple `aria-live` regions for the same concept ([bulk interaction](./bulk-interaction-standard.md) live-region discipline applies by analogy)
- **List**: semantic list or feed; each item keyboard activatable when it navigates or opens detail
- **Mark all read**: explicit **accessible name**; does not remove history from audit backends
- **Color**: never the only indicator of read vs unread (weight, icon, or text state as well)

---

## 6. Interaction

- Opening the inbox **does not** mark items read unless product policy says so; default is explicit read on open or per-item
- **Click** / **Enter** on an item runs the provided handler (navigation, panel, etc.); handler wiring is **app/engine**, not hard-coded in primitives
- **Escape** closes popovers per platform; focus returns to trigger

---

## 7. Performance & data

- **Virtualize** long lists; cap initial fetch; paginate or lazy-load
- **No** notification UI should **fetch domain data** directly in the rendering layer—data passes in as props or via engine-bound containers ([metadata standard](./metadata-driven-view-composition-standard.md) §3.3)

---

## 8. Conformance identifiers

For tests and analytics, implementations may expose:

- `data-afenda-notification-surface="inbox-trigger"` on the shell trigger control
- `data-afenda-notification-surface="inbox-panel"` on the inbox panel container

---

## 9. Anti-patterns (prohibited)

- Using **toast spam** for errors that belong in inline validation
- Treating **red badge** as “delete” or destructive affordance without a real destructive action
- **Silent** failure—user-visible feedback for operations that fail
- **Duplicate** live regions announcing the same unread count
- **Inventing** notification text in components—copy and eligibility from **metadata / API**

---

## 10. Implementation reference (`@afenda/erp-view-pack`)

| Piece                   | Location                                                                                                                                |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Inbox shell             | `patterns/notification-center.tsx` — `Notification`, `NotificationCenter`; typography via `erp-typography` + `audit-chrome` timestamps  |
| Conformance attrs       | `patterns/notification-feedback.ts` — `NOTIFICATION_FEEDBACK_ATTR`, `notificationSurfaceDataAttrs()`                                    |
| Severity → toast helper | `patterns/feedback-toast.ts` — `showFeedback()` maps neutral / success / warning / error to Sonner (`@afenda/ui-core/primitives/toast`) |

Global toast/banner systems may live in app or `@afenda/ui-core`; align severity and A11y with §3–5 above.

---

## 11. Standard outcome

Consistent notification and feedback patterns reduce missed alerts, avoid panic styling for routine counts, and keep ERP shells calm under load.
