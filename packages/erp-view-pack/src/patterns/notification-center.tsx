"use client";

import * as React from "react";
import { Button } from "@afenda/ui-core/primitives/button";
import { Popover, PopoverContent, PopoverTrigger } from "@afenda/ui-core/primitives/popover";
import { ScrollArea } from "@afenda/ui-core/primitives/scroll-area";
import { Separator } from "@afenda/ui-core/primitives/separator";
import { Bell } from "lucide-react";
import { cn } from "@afenda/ui-core/lib/utils";
import { AUDIT_TEXT_TIMESTAMP } from "./audit-chrome";
import {
  ERP_TYPO_BODY,
  ERP_TYPO_EMPHASIS,
  ERP_TYPO_META,
  ERP_TYPO_MICRO,
  ERP_TYPO_SECTION,
} from "./erp-typography";
import { PATTERN_DENSE_MOTION } from "./pattern-chrome";
import {
  NOTIFICATION_SURFACE_INBOX_PANEL,
  NOTIFICATION_SURFACE_INBOX_TRIGGER,
  notificationSurfaceDataAttrs,
} from "./notification-feedback";

export interface Notification {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  /** ISO 8601 for `<time datetime>` when `timestamp` is human-relative (audit traceability UX standard §8.3). */
  timestampIso?: string;
  read: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAllRead?: () => void;
  onNotificationClick?: (id: string) => void;
  className?: string;
}

/**
 * Shell notification popover with live unread count (`_CONVENTIONS.md`).
 * Conformance: `notification-system-feedback-standard.md` §5–8 (`notification-feedback.ts`).
 * Unread badge uses the destructive palette for visibility, not a destructive action control.
 * Timestamps use audit + ERP typography tokens; pass `timestampIso` for machine-parseable times
 * (`erp-visual-density-typography-standard.md` §4.2 micro, §4.3 tabular).
 */
export function NotificationCenter({
  notifications,
  onMarkAllRead,
  onNotificationClick,
  className,
}: NotificationCenterProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("relative", className)}
          {...notificationSurfaceDataAttrs(NOTIFICATION_SURFACE_INBOX_TRIGGER)}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive font-bold tabular-nums text-destructive-foreground",
                ERP_TYPO_MICRO
              )}
              role="status"
              aria-live="polite"
              aria-label={`${unreadCount} unread notifications`}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0"
        {...notificationSurfaceDataAttrs(NOTIFICATION_SURFACE_INBOX_PANEL)}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <h4 className={ERP_TYPO_SECTION}>Notifications</h4>
          {onMarkAllRead && unreadCount > 0 && (
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={onMarkAllRead}
              className="h-auto px-0 py-0 text-xs"
              aria-label="Mark all notifications as read"
            >
              Mark all read
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="max-h-[320px]">
          {notifications.length === 0 ? (
            <div className={cn("p-4 text-center text-muted-foreground", ERP_TYPO_BODY)}>
              No notifications
            </div>
          ) : (
            <ul role="list">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => {
                      notification.onClick?.();
                      onNotificationClick?.(notification.id);
                    }}
                    className={cn(
                      "flex w-full gap-3 px-4 py-3 text-left",
                      PATTERN_DENSE_MOTION,
                      "transition-colors hover:bg-muted/50",
                      !notification.read && "bg-primary/5"
                    )}
                  >
                    {notification.icon && (
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted"
                        aria-hidden
                      >
                        {notification.icon}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(ERP_TYPO_EMPHASIS, notification.read && "font-normal")}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span
                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                            aria-hidden
                          />
                        )}
                      </div>
                      {notification.description && (
                        <p
                          className={cn("mt-0.5 line-clamp-2 text-muted-foreground", ERP_TYPO_META)}
                        >
                          {notification.description}
                        </p>
                      )}
                      {notification.timestampIso ? (
                        <time
                          dateTime={notification.timestampIso}
                          className={cn("mt-1 block", ERP_TYPO_MICRO, AUDIT_TEXT_TIMESTAMP)}
                        >
                          {notification.timestamp}
                        </time>
                      ) : (
                        <p className={cn("mt-1", ERP_TYPO_MICRO, AUDIT_TEXT_TIMESTAMP)}>
                          {notification.timestamp}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
