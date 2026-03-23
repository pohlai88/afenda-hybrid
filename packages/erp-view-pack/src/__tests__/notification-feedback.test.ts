import { describe, expect, it } from "vitest";
import {
  NOTIFICATION_FEEDBACK_ATTR,
  NOTIFICATION_SURFACE_INBOX_PANEL,
  NOTIFICATION_SURFACE_INBOX_TRIGGER,
  notificationSurfaceDataAttrs,
} from "../patterns/notification-feedback";

describe("notification-feedback", () => {
  it("notificationSurfaceDataAttrs sets the conformance attribute", () => {
    expect(notificationSurfaceDataAttrs(NOTIFICATION_SURFACE_INBOX_TRIGGER)).toEqual({
      [NOTIFICATION_FEEDBACK_ATTR]: NOTIFICATION_SURFACE_INBOX_TRIGGER,
    });
    expect(notificationSurfaceDataAttrs(NOTIFICATION_SURFACE_INBOX_PANEL)).toEqual({
      [NOTIFICATION_FEEDBACK_ATTR]: NOTIFICATION_SURFACE_INBOX_PANEL,
    });
  });
});
