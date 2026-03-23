/**
 * @afenda/erp-view-pack — ERP-Specific Patterns
 *
 * ERP-specific patterns, widgets, and presets.
 * Extends `@afenda/view-engine` with domain-specific **rendering** components.
 *
 * **Metadata-driven composition:** UI here is the rendering layer (§3.3) — presentation from props and
 * metadata-bound widgets; no domain fetch, permission inference, or workflow rules inside patterns.
 * See `docs/patterns/metadata-driven-view-composition-standard.md`, `docs/patterns/permission-role-interaction-standard.md`, `docs/patterns/workflow-state-transition-standard.md`, `docs/patterns/cross-module-navigation-standard.md`, and `ERP_PACK_RENDERING_LAYER`.
 *
 * @version 0.1.0
 */

// ERP Patterns
export { ERP_PACK_RENDERING_LAYER } from "./patterns/metadata-rendering-layer";
export {
  AUDIT_FIELD_DIFF_AFTER,
  AUDIT_FIELD_DIFF_BEFORE,
  AUDIT_SURFACE_READONLY,
  AUDIT_TEXT_ACTOR,
  AUDIT_TEXT_IDENTIFIER,
  AUDIT_TEXT_TIMESTAMP,
} from "./patterns/audit-chrome";
export { AuditFieldDiff, type AuditFieldDiffProps } from "./patterns/audit-field-diff";
export {
  ERP_SPACE_GAP_LG,
  ERP_SPACE_GAP_MD,
  ERP_SPACE_GAP_SM,
  ERP_SPACE_GAP_XL,
  ERP_SPACE_GAP_XS,
  ERP_SPACE_PAD_LG,
  ERP_SPACE_PAD_MD,
  ERP_SPACE_PAD_SM,
  ERP_SPACE_PAD_XL,
  ERP_SPACE_PAD_XS,
  ERP_TYPO_BODY,
  ERP_TYPO_DISPLAY,
  ERP_TYPO_EMPHASIS,
  ERP_TYPO_KPI_VALUE,
  ERP_TYPO_META,
  ERP_TYPO_META_STRONG,
  ERP_TYPO_MICRO,
  ERP_TYPO_OVERLINE_LABEL,
  ERP_TYPO_SECTION,
  ERP_TYPO_SIZE_BODY,
  ERP_TYPO_SIZE_COMPACT,
} from "./patterns/erp-typography";
export {
  COMMAND_SURFACE_ACTION_SCROLL,
  COMMAND_SURFACE_ATTR,
  COMMAND_SURFACE_BULK_SELECTION,
  COMMAND_SURFACE_COMPACT_ACTION_HIT,
  COMMAND_SURFACE_DESTRUCTIVE_CHROME,
  COMMAND_SURFACE_SELECTION_NOTICE,
  COMMAND_SURFACE_TOOLBAR_MOTION,
  COMMAND_SURFACE_ZONE_DIVIDER,
  COMMAND_SURFACE_ZONE_DIVIDER_COMPACT,
  commandSurfaceDataAttrs,
  type CommandSurfaceBulkRole,
} from "./patterns/command-surface-toolbar";
export {
  NAVIGATION_SURFACE_ATTR,
  NAVIGATION_SURFACE_MENU_ITEM_ACTIVE,
  NAVIGATION_SURFACE_MODULE_GROUP,
  NAVIGATION_SURFACE_SIDEBAR_RAIL,
  navigationSurfaceDataAttrs,
  type NavigationSurfaceRole,
} from "./patterns/navigation-chrome";
export {
  showFeedback,
  type FeedbackSeverity,
  type ShowFeedbackOptions,
} from "./patterns/feedback-toast";
export {
  BulkDestructiveConsequenceHint,
  type BulkDestructiveConsequenceHintProps,
} from "./patterns/destructive-bulk-consequence-hint";
export {
  DESTRUCTIVE_CONFIRM_LABEL_DELETE_PERMANENTLY,
  DESTRUCTIVE_CONFIRM_LABEL_RESET_RECORDS,
  DESTRUCTIVE_CONFIRM_LABEL_REVOKE_ACCESS,
  resolveBulkDestructiveSeverity,
  type BulkDestructiveSeverity,
} from "./patterns/destructive-bulk-ui";
export * from "./patterns/action-bar";
export * from "./patterns/animated-selection-count";
export {
  BulkSelectionScopeHint,
  type BulkSelectionScopeHintProps,
} from "./patterns/bulk-selection-scope-hint";
export * from "./patterns/bulk-selection-notice";
export * from "./patterns/compact-selection-bar";
export * from "./patterns/sticky-action-bar";
export * from "./patterns/app-module-icon";
export * from "./patterns/description-list";
export * from "./patterns/metric-card";
export {
  NOTIFICATION_FEEDBACK_ATTR,
  NOTIFICATION_SURFACE_INBOX_PANEL,
  NOTIFICATION_SURFACE_INBOX_TRIGGER,
  notificationSurfaceDataAttrs,
  type NotificationSurfaceRole,
} from "./patterns/notification-feedback";
export * from "./patterns/notification-center";
export * from "./patterns/record-status-bar";
export {
  WorkflowStateBanner,
  type WorkflowStateBannerProps,
  type WorkflowStateBannerStatus,
} from "./patterns/workflow-state-banner";
export * from "./patterns/sidebar-nav";
export * from "./patterns/stat-group";
export * from "./patterns/status-badge";

// Data grid selection (Zustand + checkboxes)
export * from "./selection";

// ERP Widget Registry
export { registerErpWidgets } from "./registry/register-erp-widgets";
