/**
 * **Rendering layer** contract for `@afenda/erp-view-pack` (Metadata-Driven View Composition Standard §3.3).
 *
 * Patterns and widgets in this package are **props-in / UI-out**:
 *
 * - No direct domain data fetching (`fetch`, ad-hoc API clients).
 * - No permission or role inference; use props such as `disabled`, `onChange`, and data supplied by the view engine (see `permission-role-interaction-standard.md`).
 * - No embedded workflow business rules; lists of states, columns, and actions come from metadata contracts interpreted by `@afenda/view-engine` (`workflow-state-transition-standard.md`).
 *
 * Selection stores (`selection/`) hold **client UI state** for grids (selected ids, scope hints), not server-side authorization.
 *
 * @see `../../../../docs/patterns/metadata-driven-view-composition-standard.md`
 * @see `../../../../docs/patterns/permission-role-interaction-standard.md`
 * @see `../../../../docs/patterns/workflow-state-transition-standard.md`
 * @see `../../../../docs/patterns/cross-module-navigation-standard.md` (menu graphs as data; `SidebarNav` is presentation-only)
 */

/** Compile-time / diagnostic tag: this package is aligned with rendering-layer §3.3. */
export const ERP_PACK_RENDERING_LAYER = "metadata-driven-v1" as const;
