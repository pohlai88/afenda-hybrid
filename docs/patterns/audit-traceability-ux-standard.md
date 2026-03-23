# AFENDA Audit & Traceability UX Standard

**Purpose**  
Establish a unified user experience framework for viewing, understanding, and investigating system history across AFENDA applications. This standard ensures operational transparency, accountability, compliance readiness, and trustworthy system narratives.

Audit UX is not merely historical display — it is the **evidence interface of system truth**.

---

## Related standards

- [Bulk interaction](./bulk-interaction-standard.md) — selection scope, bulk bars, and mass-action UX (feeds **bulk operation history** in §4.2).
- [Data grid interaction](./data-grid-interaction-standard.md) — grids as a common surface from which audits are opened or filtered.
- [Destructive action safety](./destructive-action-safety-standard.md) — high-impact actions that must appear clearly in audit narratives.
- [ERP visual density & typography](./erp-visual-density-typography-standard.md) — monospace, tabular numerals, and calm evidence surfaces (§8.3).
- [Metadata-driven view composition](./metadata-driven-view-composition-standard.md) — audit hooks and explainability in metadata (§12); UI as rendering outcome.
- [Notification & system feedback](./notification-system-feedback-standard.md) — ephemeral inbox vs immutable audit history; timestamps on notification items (§8.3 alignment).
- [Permission & role interaction](./permission-role-interaction-standard.md) — who may see audit exports and sensitive fields; optional logging of denied access (product policy).
- [Workflow & state transition](./workflow-state-transition-standard.md) — audit evidence for lifecycle moves, actors, and reasons.
- [Cross-module navigation](./cross-module-navigation-standard.md) — drill-down from audit entries to subject records when permitted.

---

## 1. Design intent

Audit interfaces enable users to:

- Understand what changed
- Identify who performed actions
- Determine when actions occurred
- Trace why state transitions happened
- Reconstruct operational timelines

Audit experiences must prioritize clarity, chronological integrity, and evidentiary precision.

---

## 2. Core principles

### 2.1 Truthfulness

Audit records must reflect backend truth without omission or reinterpretation.

### 2.2 Chronological integrity

Event order must be preserved and unambiguous.

### 2.3 Contextual clarity

Events must include sufficient business context for human understanding.

### 2.4 Investigative efficiency

Users must be able to locate relevant events quickly within large histories.

### 2.5 Non-destructive visibility

Audit data must be immutable and never user-editable.

---

## 3. Audit data model (UX perspective)

Each audit record must expose:

| Field             | Purpose                         |
| ----------------- | ------------------------------- |
| Actor             | Who performed the action        |
| Timestamp         | When the action occurred        |
| Action Type       | What operation occurred         |
| Object Type       | Entity category affected        |
| Object Identifier | Unique record reference         |
| Change Summary    | Human-readable description      |
| Before State      | Prior value snapshot            |
| After State       | Resulting value snapshot        |
| Source            | Originating interface or API    |
| Scope             | Single record or bulk operation |

---

## 4. Audit views

### 4.1 Record-level history

Shows the lifecycle of a single entity.

**Use cases**

- Investigating data discrepancies
- Compliance verification
- Reviewing approval chains

**Requirements**

- Timeline format
- Field-level change visibility
- Actor attribution

### 4.2 Bulk operation history

Shows mass actions affecting multiple records.

**Requirements**

- Affected record count
- Selection scope
- Permission authority
- Result summary

### 4.3 System-wide activity log

Cross-module operational monitoring.

**Use cases**

- Administrative oversight
- Security investigations
- Operational audits

**Requirements**

- Advanced filtering
- Cross-entity grouping
- Export capability

---

## 5. Timeline interaction pattern

### 5.1 Structure

Audit events must be presented chronologically using a vertical timeline.

### 5.2 Event density

| Density     | Use Case                  |
| ----------- | ------------------------- |
| Comfortable | Record history            |
| Compact     | Administrative monitoring |
| Dense       | Forensic investigations   |

### 5.3 Event grouping

Events may be grouped by:

- Time window
- Actor
- Action category

Grouping must not obscure individual event visibility.

---

## 6. Change visualization

### 6.1 Field-level diffs

When values change, UI must show:

| Element          | Requirement                         |
| ---------------- | ----------------------------------- |
| Old Value        | Muted tone, strike-through optional |
| New Value        | Emphasized tone                     |
| Unchanged Fields | Hidden by default                   |

### 6.2 Structured data

JSON or structured changes must support:

- Expand/collapse
- Syntax highlighting
- Side-by-side comparison

### 6.3 Status changes

State transitions must use semantic indicators and directional cues.

---

## 7. Filtering & search

### 7.1 Filtering capabilities

Users must be able to filter by:

- Actor
- Date range
- Action type
- Entity type
- Severity level
- Module source

### 7.2 Search

Full-text search across change summaries and identifiers.

### 7.3 Saved views

Administrative users may save frequent audit filters.

---

## 8. Visual system

### 8.1 Tone

Audit interfaces must feel:

- Neutral
- Precise
- Structured
- Evidence-focused

Avoid decorative styling.

### 8.2 Color semantics

| Meaning           | Treatment              |
| ----------------- | ---------------------- |
| Creation          | Positive semantic tone |
| Modification      | Neutral tone           |
| Deletion          | Muted destructive tone |
| Permission Change | Warning tone           |

### 8.3 Typography

- Monospace for identifiers
- Tabular numerals for timestamps
- Medium weight for actors

---

## 9. Traceability flows

### 9.1 Causal linking

Where possible, audits should link:

- Triggering event
- Dependent events
- Resulting state transitions

### 9.2 Cross-entity trace

Users must navigate across related records affected by a shared operation.

### 9.3 Workflow reconstruction

Audit views should support understanding of multi-step processes.

---

## 10. Safety & compliance

### 10.1 Immutability

Audit records must never be editable from UI.

### 10.2 Permission controls

Audit visibility must respect:

- Role permissions
- Data sensitivity
- Regulatory requirements

### 10.3 Redaction

Sensitive fields may be masked based on user role.

---

## 11. Export & reporting

### 11.1 Export formats

Audit logs must support:

- CSV for analysis
- PDF for compliance
- Structured data for integrations

### 11.2 Reporting integrity

Exports must preserve chronological ordering and data completeness.

---

## 12. Accessibility requirements

- Timeline keyboard navigable
- Screen readers announce event summaries
- Expandable diffs accessible via keyboard
- Sufficient contrast for semantic indicators

---

## 13. Performance standards

Audit systems must support:

- Millions of historical records
- Incremental loading
- Server-side filtering
- Virtualized timeline rendering

Avoid full-history rendering.

---

## 14. Edge case governance

| Scenario                | Required Behavior                |
| ----------------------- | -------------------------------- |
| Partial logging failure | Mark incomplete entries          |
| Clock skew              | Display standardized system time |
| Data retention limits   | Show retention notices           |
| Concurrent actions      | Preserve true order              |
| Reverted actions        | Show reversal chain              |

---

## 15. Anti-patterns (prohibited)

- Editable audit entries
- Missing actor attribution
- Vague change descriptions
- Collapsed bulk events hiding impact
- Decorative timeline visuals
- Non-chronological sorting

---

## 16. Integration with system architecture

Audit UX must integrate with:

- Domain event systems
- Bulk operation logs
- Permission governance
- Compliance reporting pipelines

Audit interfaces are **read-only truth surfaces** backed by system event streams.

---

## 17. Implementation checklist

### Data

- [ ] Actor identity
- [ ] Timestamps
- [ ] Before/after state
- [ ] Action classification

### UX

- [ ] Timeline interface
- [ ] Diff visualization
- [ ] Filtering tools
- [ ] Search capability

### Safety

- [ ] Immutability enforcement
- [ ] Permission-aware visibility
- [ ] Sensitive data masking

### Performance

- [ ] Incremental loading
- [ ] Virtualized rendering
- [ ] Server-side filtering

### Compliance

- [ ] Export support
- [ ] Retention policy visibility
- [ ] Chronological integrity

---

## 18. Maturity model

| Level        | Capability                 |
| ------------ | -------------------------- |
| Basic        | Simple change log          |
| Functional   | Record-level history       |
| Advanced     | Field-level diffs          |
| Professional | Cross-entity tracing       |
| Enterprise   | Full forensic auditability |

Mission-critical modules must achieve **Enterprise** maturity.

---

## 19. Standard outcome

Adopting this standard ensures:

- Transparent operational history
- Accountable system usage
- Compliance-ready reporting
- Efficient investigations
- Trustworthy reconstruction of events

Audit interfaces become **evidence-grade system narratives**, not activity feeds.

---

## 20. Implementation reference (`@afenda/erp-view-pack`)

Shared tokens and building blocks for audit-aligned UI live next to other ERP patterns:

| Export / API                                                                                                        | Standard sections                |
| ------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `AUDIT_TEXT_IDENTIFIER`, `AUDIT_TEXT_TIMESTAMP`, `AUDIT_TEXT_ACTOR`, `AUDIT_SURFACE_READONLY`, `AUDIT_FIELD_DIFF_*` | §6.1, §8                         |
| `AuditFieldDiff`                                                                                                    | §6.1, §12                        |
| `DescriptionList` + `valueTone` on items                                                                            | §3 (metadata presentation), §8.3 |
| `Notification` + `timestampIso` + timestamp styling in `NotificationCenter`                                         | §8.3                             |

Typography for identifiers, numerals, and calm surfaces also aligns with [ERP visual density & typography](./erp-visual-density-typography-standard.md) §4.3–4.4.

Bulk selection bars and scope hints remain governed by the [bulk interaction standard](./bulk-interaction-standard.md); they complement **bulk operation history** (§4.2) when wired to audit backends.
