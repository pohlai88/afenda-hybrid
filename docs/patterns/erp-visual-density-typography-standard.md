# AFENDA ERP Visual Density & Typography Standard

**Purpose**  
Define visual density, spacing systems, and typographic rules for ERP interfaces across AFENDA applications. This standard ensures high-volume operational usability, visual consistency, long-duration readability, and executive-grade information presentation.

ERP interfaces are work environments for professionals performing repetitive, precision tasks. Visual design must therefore optimize for efficiency, legibility, and cognitive endurance.

---

## Related standards

- [Data grid interaction](./data-grid-interaction-standard.md) — grid-specific layout, alignment, and density tokens (implements §8 below in part).
- [Bulk interaction](./bulk-interaction-standard.md) — selection toolbars and touch targets alongside compact density.
- [Audit & traceability UX](./audit-traceability-ux-standard.md) — evidence surfaces, monospace identifiers, tabular timestamps.
- [Destructive action safety](./destructive-action-safety-standard.md) — restrained use of color for risk signaling.
- [Metadata-driven view composition](./metadata-driven-view-composition-standard.md) — rendering layer must stay token-driven and free of domain logic (§3.3).
- [Notification & system feedback](./notification-system-feedback-standard.md) — severity tone, meta/micro roles on inbox items.
- [Permission & role interaction](./permission-role-interaction-standard.md) — read-only and masked field presentation stays calm and token-driven.
- [Workflow & state transition](./workflow-state-transition-standard.md) — status bars, banners, and pipeline views stay operationally calm (meta-strong labels, SLA signals).
- [Cross-module navigation](./cross-module-navigation-standard.md) — collapsed rail, sidebar badges, and compact module labels (§4.2 micro).

---

## 1. Design intent

ERP visual design must:

- Maximize information throughput
- Reduce eye fatigue during prolonged use
- Support rapid data scanning
- Preserve visual hierarchy under dense layouts
- Convey seriousness and operational trust

Aesthetic expression must never compromise functional clarity.

---

## 2. Core principles

### 2.1 Density with structure

High information density is acceptable only when structured by strong alignment, spacing rhythm, and typographic hierarchy.

### 2.2 Hierarchy through typography

Font weight, size, and spacing — not color — must establish hierarchy.

### 2.3 Consistency over decoration

Visual consistency builds operational confidence and reduces cognitive load.

### 2.4 Calm operational tone

ERP interfaces must feel stable, professional, and trustworthy.  
Avoid playful or expressive visual styles.

---

## 3. Density system

### 3.1 Density modes

| Mode        | Use Case                  | Characteristics                   |
| ----------- | ------------------------- | --------------------------------- |
| Comfortable | General operations        | Spacious rows, relaxed scanning   |
| Compact     | High-volume workflows     | Reduced padding, tighter layout   |
| Financial   | Analytical precision work | Maximum density, strict alignment |

All ERP modules must support Comfortable and Compact modes.  
Financial mode is required for data-intensive modules.

### 3.2 Spacing scale

Spacing must follow a predictable rhythm:

| Token | Size | Usage                     |
| ----- | ---- | ------------------------- |
| XS    | 4px  | Tight control padding     |
| SM    | 8px  | Compact gaps              |
| MD    | 12px | Default component padding |
| LG    | 16px | Section spacing           |
| XL    | 24px | Layout separation         |

Arbitrary spacing values are prohibited.

### 3.3 Row heights

| Density     | Height  |
| ----------- | ------- |
| Comfortable | 44–48px |
| Compact     | 32–36px |
| Financial   | 24–28px |

Row height must remain consistent within a view.

---

## 4. Typography system

### 4.1 Font characteristics

Typography must prioritize:

- Neutral tone
- High legibility
- Tabular numeral support
- Clear distinction between similar characters

Decorative or expressive fonts are prohibited.

### 4.2 Text roles

| Role     | Size    | Weight   | Usage            |
| -------- | ------- | -------- | ---------------- |
| Display  | 20–24px | Semibold | Page titles      |
| Section  | 16–18px | Semibold | Section headers  |
| Emphasis | 14–16px | Medium   | Primary data     |
| Body     | 13–14px | Regular  | Standard content |
| Meta     | 12px    | Regular  | Secondary info   |
| Micro    | 11px    | Medium   | Dense metadata   |

Font sizes must not vary outside this scale.

### 4.3 Numeric typography

Numeric data must use:

- Tabular numerals
- Right alignment
- Consistent decimal precision

Used for:

- Financial values
- Quantities
- Timestamps
- Identifiers

### 4.4 Monospace usage

Monospace fonts reserved for:

- Record identifiers
- Codes
- Logs
- Structured data

Avoid monospace for general UI text.

---

## 5. Hierarchy rules

### 5.1 Emphasis methods

Hierarchy must be created through:

1. Size
2. Weight
3. Position
4. Spacing

Color must be secondary and minimal.

### 5.2 Visual noise reduction

Avoid:

- Excessive font weights
- Too many size variations
- Decorative separators
- Overuse of uppercase text

---

## 6. Alignment standards

Consistent alignment improves scan efficiency.

| Content Type | Alignment            |
| ------------ | -------------------- |
| Text         | Left                 |
| Numbers      | Right                |
| Status       | Center               |
| Actions      | Right                |
| Headers      | Match column content |

Mixed alignment within a column is prohibited.

---

## 7. Color restraint

Typography must rely primarily on luminance contrast rather than hue contrast.

Use color only for:

- Status semantics
- Warnings
- Critical highlights

Avoid colorful text for decorative emphasis.

---

## 8. Data grid typography

Grids are primary ERP surfaces and require stricter density.

### Requirements

- Slightly reduced font size vs forms
- Tight line height
- Medium weight for primary identifiers
- Muted tone for secondary attributes

### Prohibited

- Multi-line wrapping in dense modes
- Decorative fonts in headers
- Excessive letter spacing

---

## 9. Form typography

Forms require higher readability than grids.

### Labels

- Medium weight
- Slight size reduction vs body

### Inputs

- Body size
- Clear placeholder distinction

### Help text

- Meta size
- Muted tone

---

## 10. Long-duration usability

ERP users often operate systems for extended periods.  
Visual design must therefore minimize fatigue.

### Required

- Comfortable line height
- Predictable spacing rhythm
- Limited contrast extremes

### Avoid

- High-glare color schemes
- Ultra-thin font weights
- Visually cluttered layouts

---

## 11. Responsive density

Density may adapt based on screen size.

| Screen        | Default Density |
| ------------- | --------------- |
| Large Desktop | Compact         |
| Laptop        | Comfortable     |
| Tablet        | Comfortable     |

Financial density should not be used on small screens.

---

## 12. Accessibility requirements

- Minimum readable text size
- Sufficient contrast ratios
- Avoid reliance on color alone
- Zoom resilience up to 200%

Dense modes must remain readable under accessibility scaling.

---

## 13. Performance considerations

- Avoid layout shifts from dynamic font loading
- Limit font weight variants
- Prefer system font stacks where feasible

Typography must not degrade rendering performance in large data grids.

---

## 14. Anti-patterns (prohibited)

- Decorative typefaces
- Excessively large headers
- Inconsistent spacing scales
- Mixed numeric alignment
- Overly colorful typography
- Playful UI styling in operational modules

---

## 15. Integration with system standards

This standard supports:

- [Data Grid Interaction Standard](./data-grid-interaction-standard.md)
- [Bulk Interaction Standard](./bulk-interaction-standard.md)
- [Audit & Traceability UX Standard](./audit-traceability-ux-standard.md)
- [Destructive action safety](./destructive-action-safety-standard.md)
- [Command surface & toolbar](./command-surface-toolbar-standard.md)

Visual density and typography provide the foundation for operational clarity.

---

## 16. Implementation checklist

### Density

- [ ] Density modes implemented
- [ ] Spacing scale enforced
- [ ] Consistent row heights

### Typography

- [ ] Type scale enforced
- [ ] Numeric alignment rules
- [ ] Monospace usage rules

### Hierarchy

- [ ] Emphasis through weight/size
- [ ] Reduced visual noise

### Accessibility

- [ ] Contrast compliance
- [ ] Zoom resilience
- [ ] Readability in dense modes

### Performance

- [ ] Limited font variants
- [ ] Stable rendering in grids

---

## 17. Maturity model

| Level        | Capability                      |
| ------------ | ------------------------------- |
| Basic        | Consistent font usage           |
| Functional   | Structured type scale           |
| Advanced     | Density modes                   |
| Professional | Grid-optimized typography       |
| Enterprise   | Full operational visual harmony |

Mission-critical ERP modules must achieve **Enterprise** maturity.

---

## 18. Standard outcome

Adopting this standard ensures:

- Efficient information scanning
- Reduced user fatigue
- Professional operational tone
- Predictable visual hierarchy
- Scalable interface density

ERP interfaces become **precision operational environments** rather than general-purpose applications.

---

## 19. Implementation reference (`@afenda/erp-view-pack`)

Shared tokens map to this standard as follows (evolve with the design system):

| Export / area                                                                                                                  | Standard sections                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `ERP_TYPO_*`, `ERP_SPACE_*` (`erp-typography.ts`)                                                                              | §3.2, §4.2, §5, §9.1                                                                                   |
| `DATA_GRID_DENSITY_COMFORTABLE`, `DATA_GRID_DENSITY_COMPACT`, `DATA_GRID_DENSITY_FINANCIAL`                                    | §3.1, §3.3, §8                                                                                         |
| `DATA_GRID_CELL_PRIMARY`, `DATA_GRID_CELL_ATTRIBUTE`, `DATA_GRID_CELL_NUMERIC`, `DATA_GRID_CELL_STATUS`, `DATA_GRID_CELL_TEXT` | §4.3, §6, §8                                                                                           |
| `PATTERN_DENSE_TEXT`, `PATTERN_DENSE_MOTION`, `PATTERN_BAR_SURFACE` (`pattern-chrome.ts`)                                      | §4.2 (body / emphasis density), §10                                                                    |
| `SELECTION_EXEC_TEXT`, selection bars                                                                                          | §3.1 compact executive tone                                                                            |
| `command-surface-toolbar.ts` / `action-bar-chrome.ts` (bulk toolbars)                                                          | §3.2 spacing on command strips; see [Command surface & toolbar](./command-surface-toolbar-standard.md) |
| `AUDIT_TEXT_*`, metric/stat patterns with `tabular-nums`                                                                       | §4.3, [Audit standard](./audit-traceability-ux-standard.md) §8.3                                       |

Global font stacks and theme tokens live in `@afenda/ui-core`; keep new ERP patterns on the scale in §4.2 unless a standard explicitly documents an exception.
