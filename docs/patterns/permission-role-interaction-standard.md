# AFENDA Permission & Role Interaction Standard

## 1. Purpose

Define how **permissions**, **roles**, and **policies** shape what users **see**, **can do**, and **understand** in AFENDA interfaces—without leaking authorization logic into presentational components.

This standard ensures:

- **Deny-by-default** enforcement on the server remains the source of truth
- The **interpretation layer** (view engine + resolved contracts) decides eligibility; the **rendering layer** only reflects props
- Users get **consistent** affordances when access is missing (omit, disable, mask, or explain—by policy)
- **Bulk**, **destructive**, and **audit** experiences stay aligned with real access rules

This document is the UX and architecture companion to the **permission contract** in [Metadata-driven view composition](./metadata-driven-view-composition-standard.md) §4.6.

---

## Related standards

- [Metadata-driven view composition](./metadata-driven-view-composition-standard.md) — §3.2 permission gating in the engine; §4.4 action requirements; §4.6 permission contract
- [Bulk interaction](./bulk-interaction-standard.md) — permission change and bulk action eligibility (§7, §9.2)
- [Destructive action safety](./destructive-action-safety-standard.md) — high-impact actions still require server checks and confirmations
- [Data grid interaction](./data-grid-interaction-standard.md) — row actions, column visibility, selection vs authorization
- [Audit & traceability UX](./audit-traceability-ux-standard.md) — who did what; optional logging of denied attempts per product policy
- [Command surface & toolbar](./command-surface-toolbar-standard.md) — toolbar actions supplied as eligible slots
- [Notification & system feedback](./notification-system-feedback-standard.md) — messaging when access is denied or scope changes
- [Workflow & state transition](./workflow-state-transition-standard.md) — transition guards, approvals, and eligible actions from the state machine contract
- [Cross-module navigation](./cross-module-navigation-standard.md) — filter menu graphs and command-palette results by eligibility

**Backend reference (authorization model):** `packages/db/src/_services/authorization.ts` — direct permissions, role permissions, dynamic policies; evaluation order and deny-by-default behavior.

---

## 2. Definitions

| Term                  | Meaning                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| **Permission**        | Atomic grant, typically `resource.action` (e.g. `employee.update`), tenant-scoped                 |
| **Role**              | Named bundle of permissions (and policy targets); assigned to users                               |
| **Policy**            | Conditional rule (roles + conditions + effect) evaluated with **resource context**                |
| **Eligibility**       | Resolved outcome: may the current principal perform this action on this resource in this context? |
| **Presentation mode** | How the UI reflects ineligibility (see §5)                                                        |

User-facing copy should use **capabilities** (“You can’t edit this record”) rather than raw permission keys or internal role codes unless the product explicitly surfaces them for admins.

---

## 3. Layered responsibility

### 3.1 Server / domain services

- **Always** enforce authorization before mutating state or returning sensitive fields
- Treat the client as **untrusted** for security decisions
- Return **stable** error shapes for forbidden operations (HTTP 403 / domain equivalent) so the client can show [system feedback](./notification-system-feedback-standard.md) without guessing

### 3.2 Interpretation layer (view engine)

- Resolve **visibility**, **editability**, **action lists**, and **bulk eligibility** from metadata **permission contracts** and live principal context
- Re-resolve when **session**, **tenant**, or **record context** changes
- Pass results to UI as **data**: disabled flags, omitted nodes, masked values, optional human-readable **denial hints** (sanitized; no stack traces)

### 3.3 Rendering layer (`@afenda/erp-view-pack` and primitives)

- **Do not** infer permissions from labels, routes, or heuristics
- **Do not** call authorization APIs from presentational patterns
- Accept **props** (`disabled`, `hidden`, masked value, `aria-*`, tooltips) from the engine or app shell

See `packages/erp-view-pack/src/patterns/metadata-rendering-layer.ts`.

---

## 4. Permission contract (summary)

The metadata **permission contract** (see [Metadata-driven view composition](./metadata-driven-view-composition-standard.md) §4.6) must be explicit about:

- **Visibility** — whether fields, sections, actions, or routes appear at all
- **Masking** — redacted or partial display of values
- **Edit scope** — create/update constraints per record or field
- **Action eligibility** — which actions exist in the UI and under what preconditions
- **Inheritance** — how org/team/record scope flows

The contract is **machine-verifiable**; the UI is a **projection** of resolved eligibility.

---

## 5. Presentation modes for ineligible or partial access

Choose one mode per surface **consistently** within a module (document the choice in module UX notes).

| Mode                  | When to use                                             | UX notes                                                                                           |
| --------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Omit**              | User should not know the capability exists              | No empty disabled control; no teasing label                                                        |
| **Hide**              | Capability exists in product but not for this principal | Same as omit for end users; differs in admin/metadata docs                                         |
| **Disable + explain** | Discoverability matters; user should learn _why_        | `disabled` + accessible name/description or help link; avoid dead silent buttons                   |
| **Read-only**         | View allowed, edit not                                  | Clear non-edit state; do not fake editable chrome                                                  |
| **Masked**            | View partial or redacted                                | Use audit-friendly patterns where required ([Audit standard](./audit-traceability-ux-standard.md)) |

**Do not** enable a control and rely on the server error alone as the primary feedback path for routine denial—users should see **prospective** disabled/omitted state when eligibility is already known.

---

## 6. Roles in the UI

- **Default:** Prefer **permission outcomes** over role names in end-user copy (“You don’t have access”) unless the product educates about roles (e.g. admin screens).
- **Admin / security UIs** may show role names, role assignments, and effective permission sets—still backed by server APIs.
- **Policy-driven** outcomes may need **contextual** explanations (“Not available for records in status Archived”) without exposing policy JSON.

---

## 7. Bulk selection and mass actions

- Bulk actions **must** be filtered to **eligible** actions for the current selection context; if eligibility changes (e.g. permission refresh), **disable or remove** invalid actions per [Bulk interaction](./bulk-interaction-standard.md) §7.
- **Selection count** is UI state; **whether an action may run** is authorization + contract state—never conflate the two.
- Server-side bulk endpoints **must** re-check permissions **per operation** (and often per row or batch rule), not trust the client’s action list.

---

## 8. Destructive and high-impact actions

- Follow [Destructive action safety](./destructive-action-safety-standard.md): confirmations, severity, and audit hooks remain mandatory.
- Lack of permission **must** result in **omitted or disabled** destructive entry points when eligibility is known **before** the user commits—do not route users into a confirmation dialog they cannot complete.

---

## 9. Accessibility

- **Disabled** controls that remain visible need an **accessible name** or **description** when the reason is non-obvious (same idea as non-silent bulk bars).
- **Do not** remove focus order in a way that confuses screen-reader users without an equivalent announcement when the page context changes (e.g. sudden loss of an entire toolbar after refresh).
- **Hidden** actions should be **removed from the accessibility tree**, not merely styled invisible.

---

## 10. Audit and observability

- Successful mutations should continue to emit **audit events** per domain rules ([Audit & traceability UX](./audit-traceability-ux-standard.md)).
- Whether to log **denied attempts** (and at what verbosity) is a **product/security** decision; if logged, align payloads with compliance retention and avoid storing secrets.

---

## 11. Anti-patterns (prohibited)

- **Client-only** gating for security-sensitive operations
- Hard-coded `if (userIsAdmin)` branches in **shared** rendering components
- Showing **disabled** destructive buttons with no explanation when the user is expected to understand why
- **Leaking** internal permission keys in toast copy for standard users
- Assuming **role name** in the JWT/session matches **effective permissions** without server resolution (roles can change)

---

## 12. Implementation checklist

**Metadata / engine**

- [ ] Permission contract covers visibility, masking, edit scope, and action eligibility
- [ ] Engine merges principal context + record context for policy evaluation
- [ ] Layout and action slots receive resolved eligibility, not raw role strings

**API / services**

- [ ] `can()` (or equivalent) invoked on mutations and sensitive reads
- [ ] Consistent forbidden response for UI messaging

**UI**

- [ ] No permission inference in `@afenda/erp-view-pack` patterns
- [ ] Presentation mode (omit / disable / mask) documented per module
- [ ] Bulk bars only show actions allowed for current principal + selection scope

---

## 13. Standard outcome

Users experience **predictable** access: they are not tricked into impossible actions, admins can reason about **roles and policies**, and engineering keeps **authorization logic** in the right layer—**server and interpretation**, not scattered in widgets.
