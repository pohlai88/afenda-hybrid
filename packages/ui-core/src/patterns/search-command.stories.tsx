import type { Meta, StoryObj } from "@storybook/react-vite";
import { SearchCommand, type SearchCommandGroup } from "./search-command";
import { Button } from "../primitives/button";
import {
  Users,
  Briefcase,
  Calendar,
  DollarSign,
  Settings,
  FileText,
  BarChart,
  Building2,
} from "lucide-react";
import * as React from "react";

const meta = {
  title: "Patterns/SearchCommand",
  component: SearchCommand,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof SearchCommand>;

export default meta;
type Story = StoryObj<typeof meta>;

const commandGroups: SearchCommandGroup[] = [
  {
    heading: "Quick Actions",
    items: [
      {
        id: "add-employee",
        label: "Add New Employee",
        icon: <Users className="h-4 w-4" />,
        description: "Create a new employee record",
        shortcut: "⌘N",
        onSelect: () => console.log("Add employee"),
      },
      {
        id: "create-req",
        label: "Create Job Requisition",
        icon: <Briefcase className="h-4 w-4" />,
        description: "Open a new position",
        onSelect: () => console.log("Create requisition"),
      },
      {
        id: "request-time-off",
        label: "Request Time Off",
        icon: <Calendar className="h-4 w-4" />,
        description: "Submit a leave request",
        onSelect: () => console.log("Request time off"),
      },
    ],
  },
  {
    heading: "Navigation",
    items: [
      {
        id: "nav-employees",
        label: "Employees",
        icon: <Users className="h-4 w-4" />,
        shortcut: "⌘E",
        onSelect: () => console.log("Navigate to employees"),
      },
      {
        id: "nav-payroll",
        label: "Payroll",
        icon: <DollarSign className="h-4 w-4" />,
        shortcut: "⌘P",
        onSelect: () => console.log("Navigate to payroll"),
      },
      {
        id: "nav-reports",
        label: "Reports",
        icon: <BarChart className="h-4 w-4" />,
        shortcut: "⌘R",
        onSelect: () => console.log("Navigate to reports"),
      },
      {
        id: "nav-orgs",
        label: "Organizations",
        icon: <Building2 className="h-4 w-4" />,
        onSelect: () => console.log("Navigate to organizations"),
      },
    ],
  },
  {
    heading: "Settings",
    items: [
      {
        id: "settings",
        label: "System Settings",
        icon: <Settings className="h-4 w-4" />,
        onSelect: () => console.log("Open settings"),
      },
      {
        id: "docs",
        label: "Documentation",
        icon: <FileText className="h-4 w-4" />,
        onSelect: () => console.log("Open docs"),
      },
    ],
  },
];

export const Default: Story = {
  args: {} as Story["args"],
  render: () => {
    const [open, setOpen] = React.useState(false);

    React.useEffect(() => {
      const down = (e: KeyboardEvent) => {
        if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          setOpen((open) => !open);
        }
      };
      document.addEventListener("keydown", down);
      return () => document.removeEventListener("keydown", down);
    }, []);

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Press{" "}
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>{" "}
          to open the command palette
        </p>
        <Button onClick={() => setOpen(true)}>Open Command Palette</Button>
        <SearchCommand open={open} onOpenChange={setOpen} groups={commandGroups} />
      </div>
    );
  },
};

export const CustomPlaceholder: Story = {
  args: {} as Story["args"],
  render: () => {
    const [open, setOpen] = React.useState(false);
    return (
      <div>
        <Button onClick={() => setOpen(true)}>Search Employees</Button>
        <SearchCommand
          open={open}
          onOpenChange={setOpen}
          groups={commandGroups}
          placeholder="Search employees, departments, or actions..."
          emptyMessage="No employees or actions found."
        />
      </div>
    );
  },
};
