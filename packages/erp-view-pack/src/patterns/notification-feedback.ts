/**
 * Conformance identifiers for notification / inbox UI.
 *
 * @see `../../../../docs/patterns/notification-system-feedback-standard.md` §8
 */

export const NOTIFICATION_FEEDBACK_ATTR = "data-afenda-notification-surface" as const;

/** Bell (or equivalent) control that opens the inbox panel. */
export const NOTIFICATION_SURFACE_INBOX_TRIGGER = "inbox-trigger" as const;

/** Popover / drawer panel listing notifications. */
export const NOTIFICATION_SURFACE_INBOX_PANEL = "inbox-panel" as const;

export type NotificationSurfaceRole =
  | typeof NOTIFICATION_SURFACE_INBOX_TRIGGER
  | typeof NOTIFICATION_SURFACE_INBOX_PANEL;

export function notificationSurfaceDataAttrs(role: NotificationSurfaceRole) {
  return { [NOTIFICATION_FEEDBACK_ATTR]: role } as Record<
    typeof NOTIFICATION_FEEDBACK_ATTR,
    NotificationSurfaceRole
  >;
}
