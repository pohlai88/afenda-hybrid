# AFENDA Destructive Action Safety Standard

**Purpose**  
Define safeguards, interaction patterns, and system responsibilities for operations that can cause irreversible or high-impact state changes. This standard protects data integrity, prevents accidental loss, and ensures accountable operational workflows across AFENDA systems.

---

## 1. Definition of Destructive Actions

Destructive actions are operations that may:

- Permanently delete records
- Irreversibly alter system state
- Remove user access or permissions
- Trigger financial or compliance impact
- Cause cascading data effects

If an action can materially harm system integrity or business operations, it must follow this standard.

---

## 2. Risk Classification

### 2.1 Severity Levels

| Level    | Description                                  | Examples              |
| -------- | -------------------------------------------- | --------------------- |
| Low      | Reversible change with minimal impact        | Archive, soft-disable |
| Medium   | Reversible but operationally disruptive      | Bulk status reset     |
| High     | Difficult to reverse, multi-record impact    | Bulk reassignment     |
| Critical | Irreversible, compliance or financial impact | Permanent delete      |

Severity determines required safeguards.

---

## 3. Safety Principles

### 3.1 Intentionality

Users must never trigger destructive actions accidentally.

### 3.2 Clarity of Consequence

The interface must clearly communicate:

- What will change
- How many records are affected
- Whether recovery is possible

### 3.3 Reversibility Preference

Prefer reversible system design whenever feasible.

### 3.4 Friction by Design

Higher risk requires deliberate interaction friction.

---

## 4. Visual Signaling

### 4.1 Destructive Styling

Destructive actions must be visually distinct but not alarming.

**Requirements**

- Muted danger tone (not bright red)
- Elevated border emphasis
- Subtle background tint
- Consistent placement across modules

### 4.2 Progressive Emphasis

Visual intensity increases with severity.

| Severity | Visual weight                            |
| -------- | ---------------------------------------- |
| Low      | Neutral styling                          |
| Medium   | Subtle warning tint                      |
| High     | Strong border + warning tint             |
| Critical | Elevated container + confirmation dialog |

**UI package note:** `@afenda/erp-view-pack` provides a **muted** bulk-toolbar destructive shell via `ACTION_BAR_DESTRUCTIVE` + `hasDestructiveAction` on `ActionBar`, `StickyActionBar`, and `CompactSelectionBar`. Use **`destructiveSeverity`** (`medium` | `high` | `critical`) for progressive border/background emphasis (§4.2). **`BulkDestructiveConsequenceHint`** adds screen-reader consequence copy for `high` / `critical`. Default English confirm button strings are exported as **`DESTRUCTIVE_CONFIRM_LABEL_*`** for dialogs (§5.2). Typed confirmations and staged flows remain in app/domain per §5–6.

---

## 5. Interaction Safeguards

### 5.1 Confirmation Requirements

| Severity | Confirmation required                   |
| -------- | --------------------------------------- |
| Low      | None                                    |
| Medium   | Simple confirmation                     |
| High     | Typed confirmation or secondary dialog  |
| Critical | Typed confirmation + contextual warning |

### 5.2 Confirmation Design Rules

Confirmations must:

- State the action clearly
- Display affected record count
- Describe consequences plainly
- Avoid vague language

#### Prohibited

- Generic “Are you sure?” prompts
- Emotionally manipulative wording
- Ambiguous button labels

#### Required Button Labels

| Action type   | Confirm label      |
| ------------- | ------------------ |
| Delete        | Delete permanently |
| Reset         | Reset records      |
| Remove access | Revoke access      |

Cancel must always be present and visually safer.

---

## 6. Bulk Destructive Actions

### 6.1 Scope Awareness

Users must see:

- Number of affected records
- Selection scope (page, filtered, global)
- Any exclusions due to permissions

**Related:** [AFENDA Bulk Interaction Standard](./bulk-interaction-standard.md) (selection scope, centralized store, live regions). [AFENDA Audit & Traceability UX Standard](./audit-traceability-ux-standard.md) (immutable audit narratives, deletion and permission-change semantics in §8.2). [AFENDA ERP Visual Density & Typography Standard](./erp-visual-density-typography-standard.md) (color restraint — risk signals stay minimal and semantic). [AFENDA Metadata-Driven View Composition Standard](./metadata-driven-view-composition-standard.md) (destructive classification and confirmations belong in action contracts §4.4, not ad-hoc component branches). [AFENDA Notification & System Feedback Standard](./notification-system-feedback-standard.md) (attention badges vs destructive **actions** — red unread count is not a delete affordance). [AFENDA Permission & Role Interaction Standard](./permission-role-interaction-standard.md) (omit or disable destructive entry points when eligibility is known; server must still enforce). [AFENDA Workflow & State Transition Standard](./workflow-state-transition-standard.md) (high-impact and terminal lifecycle transitions).

### 6.2 Progressive Disclosure

Critical bulk actions must use staged confirmations:

1. Action intent
2. Impact summary
3. Final confirmation

### 6.3 Simulation Option

Where feasible, allow preview of effects before execution.

---

## 7. System Safeguards

### 7.1 Permission Enforcement

Destructive actions must verify:

- Role authorization
- Record ownership
- Domain-level restrictions

UI must not imply permission that backend denies.

### 7.2 Backend Authority

Safety cannot rely solely on UI protections.  
All destructive actions must be validated server-side.

### 7.3 Idempotency

Repeated execution must not cause inconsistent state.

---

## 8. Recovery and Reversal

### 8.1 Soft Delete Preference

Prefer reversible deletion models:

- Soft delete flags
- Restore windows
- Trash management

### 8.2 Undo Windows

For medium-risk actions, provide time-limited undo.

### 8.3 Restoration Transparency

Users must understand:

- Whether recovery is possible
- Recovery timeframe
- Restoration limitations

---

## 9. Audit and Accountability

### 9.1 Mandatory Logging

All destructive actions must log:

- Actor identity
- Timestamp
- Action type
- Scope
- Affected record IDs
- Authorization source

### 9.2 Audit Visibility

Authorized users must access action history.

---

## 10. UX Writing Standards

### 10.1 Language Tone

Use precise, professional language.  
Avoid emotional or dramatic phrasing.

### 10.2 Clarity Rules

#### Good

- “Delete 24 invoices permanently”
- “Revoke access for 3 users”

#### Bad

- “This cannot be undone!!!”
- “You are about to do something dangerous”

---

## 11. Accessibility Requirements

- Confirmation dialogs keyboard navigable
- Screen readers announce consequences
- Focus trapped inside critical dialogs
- Escape closes only non-critical dialogs

---

## 12. Performance Considerations

- Avoid blocking UI during long operations
- Provide progress indicators
- Allow safe cancellation where possible

---

## 13. Edge Case Governance

| Scenario                     | Required behavior                        |
| ---------------------------- | ---------------------------------------- |
| Partial failure              | Report successes and failures separately |
| Network interruption         | Retry-safe execution                     |
| Permission change mid-flow   | Re-validate before commit                |
| Data mutation before confirm | Recompute impact summary                 |
| Concurrent operations        | Maintain state consistency               |

---

## 14. Anti-Patterns (Prohibited)

- One-click irreversible deletion
- Bright alarming colors
- Hidden destructive options in menus
- Ambiguous confirmation labels
- UI-only permission checks
- Immediate execution without impact summary

---

## 15. Integration with System Architecture

Destructive actions are domain-level state transitions.

Therefore:

- Must pass through domain services
- Must validate against system truth
- Must generate audit events
- Must reconcile optimistic UI updates

UI is an execution surface, not a decision authority.

**Companion standards**

- **[Bulk Interaction Standard](./bulk-interaction-standard.md)** — bulk selection scope, action bars, muted destructive bar styling (`hasDestructiveAction` / `ACTION_BAR_DESTRUCTIVE` in `@afenda/erp-view-pack`).
- **[Data Grid Interaction Standard](./data-grid-interaction-standard.md)** — grid context where destructive bulk actions are initiated.

---

## 16. Implementation Checklist

### Risk Handling

- [ ] Severity classification applied
- [ ] Safeguard level matched to severity

### UI Safeguards

- [ ] Visual destructive styling
- [ ] Proper confirmation dialogs
- [ ] Clear consequence messaging

### System Safeguards

- [ ] Server validation
- [ ] Permission enforcement
- [ ] Idempotent operations

### Recovery

- [ ] Soft delete where feasible
- [ ] Undo support
- [ ] Restoration workflow

### Audit

- [ ] Action logging
- [ ] Audit visibility

---

## 17. Maturity Model

| Level        | Capability                       |
| ------------ | -------------------------------- |
| Basic        | Confirmation dialog              |
| Managed      | Severity-based safeguards        |
| Advanced     | Undo and soft delete             |
| Professional | Audit and permission integration |
| Enterprise   | Full lifecycle safety governance |

Mission-critical modules must reach **Enterprise** maturity.

---

## 18. Standard Outcome

Adopting this standard ensures:

- Prevention of accidental data loss
- Accountable operational workflows
- Compliance-ready audit trails
- Trustworthy system state transitions

Destructive actions become **controlled, governed operations**, not dangerous shortcuts.
