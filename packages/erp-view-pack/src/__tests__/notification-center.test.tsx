import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationCenter } from "../patterns/notification-center";
import type { Notification } from "../patterns/notification-center";

const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "New message",
    description: "You have a new message from John",
    timestamp: "2 min ago",
    read: false,
  },
  {
    id: "2",
    title: "Task completed",
    description: "Your export task has finished",
    timestamp: "1 hour ago",
    read: true,
  },
  {
    id: "3",
    title: "System update",
    timestamp: "Yesterday",
    read: false,
  },
];

describe("NotificationCenter", () => {
  describe("rendering", () => {
    it("renders bell icon button", () => {
      render(<NotificationCenter notifications={[]} />);
      expect(screen.getByRole("button", { name: /notifications/i })).toBeInTheDocument();
    });

    it("exposes notification surface identifiers on trigger and panel", async () => {
      const user = userEvent.setup();
      render(<NotificationCenter notifications={mockNotifications} />);
      const trigger = screen.getByRole("button", { name: /notifications/i });
      expect(trigger).toHaveAttribute("data-afenda-notification-surface", "inbox-trigger");
      await user.click(trigger);
      const panel = document.querySelector('[data-afenda-notification-surface="inbox-panel"]');
      expect(panel).toBeTruthy();
    });

    it("shows unread count badge when there are unread notifications", () => {
      render(<NotificationCenter notifications={mockNotifications} />);
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("shows 9+ badge when unread count exceeds 9", () => {
      const manyUnread = Array.from({ length: 12 }, (_, i) => ({
        id: String(i),
        title: `Notification ${i}`,
        timestamp: "now",
        read: false,
      }));
      render(<NotificationCenter notifications={manyUnread} />);
      expect(screen.getByText("9+")).toBeInTheDocument();
    });

    it("does not show badge when all notifications are read", () => {
      const allRead = mockNotifications.map((n) => ({ ...n, read: true }));
      render(<NotificationCenter notifications={allRead} />);
      expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
    });

    it("shows empty state when no notifications", async () => {
      const user = userEvent.setup();
      render(<NotificationCenter notifications={[]} />);
      await user.click(screen.getByRole("button", { name: /notifications/i }));
      expect(screen.getByText("No notifications")).toBeInTheDocument();
    });
  });

  describe("popover content", () => {
    it("displays notification list when opened", async () => {
      const user = userEvent.setup();
      render(<NotificationCenter notifications={mockNotifications} />);
      await user.click(screen.getByRole("button", { name: /notifications/i }));

      expect(screen.getByText("New message")).toBeInTheDocument();
      expect(screen.getByText("Task completed")).toBeInTheDocument();
      expect(screen.getByText("System update")).toBeInTheDocument();
    });

    it("displays notification descriptions when provided", async () => {
      const user = userEvent.setup();
      render(<NotificationCenter notifications={mockNotifications} />);
      await user.click(screen.getByRole("button", { name: /notifications/i }));

      expect(screen.getByText("You have a new message from John")).toBeInTheDocument();
    });

    it("displays notification timestamps", async () => {
      const user = userEvent.setup();
      render(<NotificationCenter notifications={mockNotifications} />);
      await user.click(screen.getByRole("button", { name: /notifications/i }));

      expect(screen.getByText("2 min ago")).toBeInTheDocument();
      expect(screen.getByText("1 hour ago")).toBeInTheDocument();
    });

    it("uses tabular numerals on timestamp text (audit standard §8.3)", async () => {
      const user = userEvent.setup();
      render(<NotificationCenter notifications={mockNotifications} />);
      await user.click(screen.getByRole("button", { name: /notifications/i }));
      const ts = screen.getByText("2 min ago");
      expect(ts.className).toContain("tabular-nums");
    });

    it("renders time element when timestampIso is provided", async () => {
      const user = userEvent.setup();
      render(
        <NotificationCenter
          notifications={[
            {
              id: "iso-1",
              title: "Audit event",
              timestamp: "2 min ago",
              timestampIso: "2025-03-23T12:00:00.000Z",
              read: true,
            },
          ]}
        />
      );
      await user.click(screen.getByRole("button", { name: /notifications/i }));
      const timeEl = screen.getByText("2 min ago");
      expect(timeEl.tagName).toBe("TIME");
      expect(timeEl).toHaveAttribute("datetime", "2025-03-23T12:00:00.000Z");
    });

    it("displays unread notifications with bold titles", async () => {
      const user = userEvent.setup();
      render(<NotificationCenter notifications={mockNotifications} />);
      await user.click(screen.getByRole("button", { name: /notifications/i }));

      const newMessageTitle = screen.getByText("New message");
      expect(newMessageTitle.className).toContain("font-medium");

      const taskCompletedTitle = screen.getByText("Task completed");
      expect(taskCompletedTitle.className).not.toContain("font-medium");
    });
  });

  describe("mark all read", () => {
    it("shows 'Mark all read' button when onMarkAllRead provided and unread exist", async () => {
      const user = userEvent.setup();
      const onMarkAllRead = vi.fn();
      render(
        <NotificationCenter notifications={mockNotifications} onMarkAllRead={onMarkAllRead} />
      );
      await user.click(screen.getByRole("button", { name: /notifications/i }));

      expect(
        screen.getByRole("button", { name: /mark all notifications as read/i })
      ).toBeInTheDocument();
    });

    it("does not show 'Mark all read' when all are read", async () => {
      const user = userEvent.setup();
      const allRead = mockNotifications.map((n) => ({ ...n, read: true }));
      render(<NotificationCenter notifications={allRead} onMarkAllRead={() => {}} />);
      await user.click(screen.getByRole("button", { name: /notifications/i }));

      expect(screen.queryByText("Mark all read")).not.toBeInTheDocument();
    });

    it("does not show 'Mark all read' when onMarkAllRead omitted", async () => {
      const user = userEvent.setup();
      render(<NotificationCenter notifications={mockNotifications} />);
      await user.click(screen.getByRole("button", { name: /notifications/i }));

      expect(screen.queryByText("Mark all read")).not.toBeInTheDocument();
    });

    it("calls onMarkAllRead when clicked", async () => {
      const user = userEvent.setup();
      const onMarkAllRead = vi.fn();
      render(
        <NotificationCenter notifications={mockNotifications} onMarkAllRead={onMarkAllRead} />
      );
      await user.click(screen.getByRole("button", { name: /notifications/i }));
      await user.click(screen.getByRole("button", { name: /mark all notifications as read/i }));

      expect(onMarkAllRead).toHaveBeenCalledTimes(1);
    });
  });

  describe("notification interactions", () => {
    it("calls onNotificationClick when notification clicked", async () => {
      const user = userEvent.setup();
      const onNotificationClick = vi.fn();
      render(
        <NotificationCenter
          notifications={mockNotifications}
          onNotificationClick={onNotificationClick}
        />
      );
      await user.click(screen.getByRole("button", { name: /notifications/i }));
      await user.click(screen.getByText("New message"));

      expect(onNotificationClick).toHaveBeenCalledWith("1");
    });

    it("calls notification.onClick when provided", async () => {
      const user = userEvent.setup();
      const notificationOnClick = vi.fn();
      const notificationsWithClick = [{ ...mockNotifications[0], onClick: notificationOnClick }];
      render(<NotificationCenter notifications={notificationsWithClick} />);

      await user.click(screen.getByRole("button", { name: /notifications/i }));
      await user.click(screen.getByText("New message"));

      expect(notificationOnClick).toHaveBeenCalledTimes(1);
    });

    it("calls both onClick and onNotificationClick when both provided", async () => {
      const user = userEvent.setup();
      const notificationOnClick = vi.fn();
      const onNotificationClick = vi.fn();
      const notificationsWithClick = [{ ...mockNotifications[0], onClick: notificationOnClick }];
      render(
        <NotificationCenter
          notifications={notificationsWithClick}
          onNotificationClick={onNotificationClick}
        />
      );

      await user.click(screen.getByRole("button", { name: /notifications/i }));
      await user.click(screen.getByText("New message"));

      expect(notificationOnClick).toHaveBeenCalledTimes(1);
      expect(onNotificationClick).toHaveBeenCalledWith("1");
    });
  });

  describe("accessibility", () => {
    it("has live region for unread count badge", () => {
      const { container } = render(<NotificationCenter notifications={mockNotifications} />);
      const badge = container.querySelector('[role="status"][aria-live="polite"]');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute("aria-label", "2 unread notifications");
    });

    it("has proper button types", async () => {
      const user = userEvent.setup();
      render(<NotificationCenter notifications={mockNotifications} onMarkAllRead={() => {}} />);
      await user.click(screen.getByRole("button", { name: /notifications/i }));

      const markAllButton = screen.getByRole("button", { name: /mark all notifications as read/i });
      expect(markAllButton).toHaveAttribute("type", "button");
    });

    it("marks decorative icon wrappers as aria-hidden", async () => {
      const user = userEvent.setup();
      const notificationsWithIcon = [
        { ...mockNotifications[0], icon: <span data-testid="custom-icon">📧</span> },
      ];
      render(<NotificationCenter notifications={notificationsWithIcon} />);
      await user.click(screen.getByRole("button", { name: /notifications/i }));

      expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    });

    it("uses semantic list markup", async () => {
      const user = userEvent.setup();
      render(<NotificationCenter notifications={mockNotifications} />);
      await user.click(screen.getByRole("button", { name: /notifications/i }));

      expect(screen.getByRole("list")).toBeInTheDocument();
    });
  });
});
