import type { Meta, StoryObj } from "@storybook/react-vite";
import { NotificationCenter, type Notification } from "./notification-center";
import { Users, Briefcase, CheckCircle, AlertCircle } from "lucide-react";

const meta = {
  title: "Patterns/NotificationCenter",
  component: NotificationCenter,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof NotificationCenter>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleNotifications: Notification[] = [
  {
    id: "1",
    title: "New employee onboarded",
    description: "Sarah Johnson has completed onboarding and is now active in the system.",
    timestamp: "2 minutes ago",
    read: false,
    icon: <Users className="h-4 w-4 text-primary" />,
  },
  {
    id: "2",
    title: "Job requisition approved",
    description: "REQ-2024-0234 for Senior Engineer has been approved by Finance.",
    timestamp: "1 hour ago",
    read: false,
    icon: <Briefcase className="h-4 w-4 text-success" />,
  },
  {
    id: "3",
    title: "Payroll processed successfully",
    description: "March 2024 payroll has been completed for 1,247 employees.",
    timestamp: "3 hours ago",
    read: true,
    icon: <CheckCircle className="h-4 w-4 text-success" />,
  },
  {
    id: "4",
    title: "Action required: Review time off request",
    description: "John Smith has requested 5 days of vacation starting April 15.",
    timestamp: "Yesterday",
    read: true,
    icon: <AlertCircle className="h-4 w-4 text-warning" />,
  },
];

export const Default: Story = {
  args: {
    notifications: sampleNotifications,
    onMarkAllRead: () => console.log("Mark all read"),
    onNotificationClick: (id) => console.log("Clicked notification:", id),
  },
};

export const Empty: Story = {
  args: {
    notifications: [],
  },
};

export const AllRead: Story = {
  args: {
    notifications: sampleNotifications.map((n) => ({ ...n, read: true })),
    onMarkAllRead: () => console.log("Mark all read"),
  },
};

export const ManyNotifications: Story = {
  args: {
    notifications: [
      ...sampleNotifications,
      ...sampleNotifications.map((n, i) => ({
        ...n,
        id: `${n.id}-${i}`,
        timestamp: `${i + 4} hours ago`,
        read: i % 2 === 0,
      })),
    ],
    onMarkAllRead: () => console.log("Mark all read"),
  },
};
