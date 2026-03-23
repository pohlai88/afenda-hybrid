# AFENDA Workflow & State Transition Standard

## 1. Purpose

Define how **lifecycle states**, **transitions**, and **workflow surfaces** (approvals, pipelines, record status) behave across AFENDA applications so that:

- **Domain truth** governs which states exist and which moves are legal
- The **interpretation layer** resolves **allowed transitions**, **guards**, and **approvals**; the **rendering layer** only reflects outcomes
- Users always know **where a record is** in a process, **what can happen next**, and **who must act**
- **Audit** and **destructive-safety** rules apply consistently to state-changing operations

This standard is the UX and architecture companion to the **state machine contract** in [Metadata-driven view composition](./metadata-driven-view-composition-standard.md) §4.5 and **workflow views** §5.4.

---

## Related standards

- [Metadata-driven view composition](./metadata-driven-view-composition-standard.md) — §4.5 state machine contract; §5.2 state banners & workflow panels; §5.4 workflow views
- [Permission & role interaction](./permission-role-interaction-standard.md) — who may trigger transitions; guards vs presentation
- [Destructive action safety](./destructive-action-safety-standard.md) — high-impact or terminal transitions
- [Audit & traceability UX](./audit-traceability-ux-standard.md) — evidence for state changes, actors, and reasons
- [Bulk interaction](./bulk-interaction-standard.md) — bulk operations that change state across many records
- [Data grid interaction](./data-grid-interaction-standard.md) — status columns, filters by state, row-level workflow entry
- [Notification & system feedback](./notification-system-feedback-standard.md) — task assignments, approvals, SLA nudges
- [Command surface & toolbar](./command-surface-toolbar-standard.md) — transition actions in toolbars when metadata places them there
- [ERP visual density & typography](./erp-visual-density-typography-standard.md) — calm status chrome and meta-strong labels on bars
- [Cross-module navigation](./cross-module-navigation-standard.md) — deep links into queues and records; stable URLs per module

---

## 2. Definitions

| Term               | Meaning                                                                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| **State**          | A named lifecycle value of a record or process (e.g. `draft`, `approved`)                                                  |
| **Transition**     | A controlled move from one state to another, possibly conditional                                                          |
| **Guard**          | A rule (permissions, field validity, business preconditions) that must pass before a transition is offered or accepted     |
| **Approval**       | A human or system step that must complete before a transition commits                                                      |
| **Terminal state** | A state from which normal forward progress ends (may still allow admin-only or exceptional transitions)                    |
| **Workflow view**  | A UI optimized for pipelines: queues, lanes, SLA signals ([Metadata §5.4](./metadata-driven-view-composition-standard.md)) |

---

## 3. Layered responsibility

### 3.1 Domain / services

- Own the **authoritative** state machine: valid states, edges, side effects, invariants
- **Reject** illegal transitions at the API regardless of UI
- Emit **audit events** for transitions per domain policy ([Audit standard](./audit-traceability-ux-standard.md))

### 3.2 Interpretation layer (view engine)

- Materialize **which transitions** are visible and **enabled** for the current principal, record context, and metadata contract
- Supply **state banners**, **status bars**, and **action lists** as **resolved data** (labels, current value, allowed targets, disabled reasons)
- **Never** embed ad-hoc “if status === X” business branching in generic layout code

### 3.3 Rendering layer

- Display current state and offered transitions from **props**
- **Record-level** status chrome (e.g. `RecordStatusBar` in `@afenda/erp-view-pack`) is a **presentation** component: it does not decide business legality of a click—it invokes callbacks wired by the app/engine, which must still **validate server-side**

---

## 4. State machine contract (summary)

The metadata **state machine contract** ([Metadata §4.5](./metadata-driven-view-composition-standard.md)) must define at minimum:

- **Valid states** and their user-visible labels
- **Transition graph** (from → to), including any **folded** or **rare** paths documented for admins
- **Guards** (permission keys, field preconditions, record context)
- **Required approvals** and escalation paths
- **Terminal states** and whether **backward** transitions exist
- **Side effects** and **audit verbosity** for each transition class

**UI affordances** (which buttons, pills, or lanes appear) must be **derivable** from this contract plus resolved eligibility—not from duplicated logic in widgets.

---

## 5. Presentation patterns

### 5.1 Record status bar

- Shows **ordered** states with a clear **current** indicator
- **Folded** states stay hidden until current unless metadata marks them visible for orientation
- **Read-only** when `onChange` is omitted (view-only lifecycle)
- **Interactive** only when the engine has already restricted choices to **legal** targets; spurious clicks must still **fail safe** on the server ([Permission standard](./permission-role-interaction-standard.md))

### 5.2 State banners and panels

- Use for **blocking** context (“Awaiting approval from …”) vs subtle status badges
- Align copy and prominence with [notification](./notification-system-feedback-standard.md) severity guidance

### 5.3 Workflow / pipeline views

- **Stages** map to contract states or derived milestones
- **Lanes** map to responsibility (role, queue, team)—resolved from metadata, not hard-coded modules
- **SLA timers** and escalation signals are **data-driven**; avoid alarmist styling for routine delays ([ERP visual density](./erp-visual-density-typography-standard.md))

---

## 6. Transitions and safety

- **High-impact** or **irreversible** transitions follow [Destructive action safety](./destructive-action-safety-standard.md): confirmations, consequence hints, severity
- **Bulk** state changes use [Bulk interaction](./bulk-interaction-standard.md): scope clarity, reconciliation, auditable scope
- **Optimistic UI** (optional) must **reconcile** when the server rejects a transition; restore prior state and surface feedback via [Notification & system feedback](./notification-system-feedback-standard.md)

---

## 7. Auditability

Every material transition should be reconstructable from **audit** or **activity** data:

- Prior and new state (or semantic equivalents)
- Actor (user or system)
- Timestamp
- Reason / comment when the contract requires it

Narrative timelines should remain **chronologically coherent** ([Audit standard](./audit-traceability-ux-standard.md)).

---

## 8. Accessibility

- Current state must be **programmatically identifiable** (text + semantics, not color alone)
- Disabled transition controls need **discoverable** explanation when non-obvious (same spirit as permission-gated controls)
- Workflow lists and queues: **keyboard** operable row actions; **busy** or **pending** states exposed to assistive tech where applicable

---

## 9. Anti-patterns (prohibited)

- Hard-coded state graphs in **shared** UI components
- Letting users **complete** a transition in UI when server will **always** reject (when eligibility was knowable)
- **Silent** failure after a transition attempt
- **Inconsistent** labels for the same state across grid, detail, and audit views
- Using **RecordStatusBar** (or similar) as the **only** enforcement of legality—server must remain authoritative

---

## 10. Implementation reference (`@afenda/erp-view-pack`)

| Piece                       | Role                                                                                                  |
| --------------------------- | ----------------------------------------------------------------------------------------------------- |
| `record-status-bar.tsx`     | Visual state strip; `states` (`disabled` / `disabledReason` per §5.1), `current`, optional `onChange` |
| `workflow-state-banner.tsx` | Blocking / contextual banner (`Alert` + ERP typography); §5.2                                         |
| `status-badge.tsx`          | Compact state label where a full bar is unnecessary                                                   |

Domain services, workflow engines, and metadata registries own **rules**; view-engine integration supplies **resolved** props.

---

## 11. Checklist

**Metadata**

- [ ] State machine contract published for each workflow-backed entity
- [ ] Transitions reference permission and destructive classifications where needed

**Engine**

- [ ] Resolved transition list matches server acceptance
- [ ] State banners and status bars receive contract-aligned props

**API**

- [ ] Illegal transitions return clear, stable errors
- [ ] Audit events emitted per transition class

**UI**

- [ ] No duplicate lifecycle logic in `@afenda/erp-view-pack` beyond presentation
- [ ] Optimistic flows reconcile on rejection

---

## 12. Standard outcome

Workflow UIs feel **coherent** with backend rules: users see **honest** next steps, operators can **trust** audit trails, and engineering avoids **split-brain** between widgets and domain state machines.
