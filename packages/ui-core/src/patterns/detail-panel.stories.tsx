import type { Meta, StoryObj } from "@storybook/react-vite";
import { DetailPanel } from "./detail-panel";
import { Button } from "../primitives/button";
import { Label } from "../primitives/label";
import { Input } from "../primitives/input";
import { Badge } from "../primitives/badge";
import * as React from "react";

const meta = {
  title: "Patterns/DetailPanel",
  component: DetailPanel,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof DetailPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {} as Story["args"],
  render: () => {
    const [open, setOpen] = React.useState(false);
    return (
      <div className="p-8">
        <Button onClick={() => setOpen(true)}>View Employee Details</Button>
        <DetailPanel
          open={open}
          onOpenChange={setOpen}
          title="Employee Profile"
          description="View and edit employee information"
          footer={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setOpen(false)}>Save Changes</Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Sarah Johnson</h3>
                <p className="text-sm text-muted-foreground">EMP-2024-0156</p>
              </div>
              <Badge>Active</Badge>
            </div>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" defaultValue="sarah.johnson@company.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" defaultValue="Engineering" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="position">Position</Label>
                <Input id="position" defaultValue="Senior Software Engineer" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hire-date">Hire Date</Label>
                <Input id="hire-date" type="date" defaultValue="2023-06-15" />
              </div>
            </div>
          </div>
        </DetailPanel>
      </div>
    );
  },
};

export const LeftSide: Story = {
  args: {} as Story["args"],
  render: () => {
    const [open, setOpen] = React.useState(false);
    return (
      <div className="p-8">
        <Button onClick={() => setOpen(true)}>Open Filters</Button>
        <DetailPanel
          open={open}
          onOpenChange={setOpen}
          title="Advanced Filters"
          description="Refine your search results"
          side="left"
          footer={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Reset
              </Button>
              <Button onClick={() => setOpen(false)}>Apply</Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="dept-filter">Department</Label>
              <Input id="dept-filter" placeholder="All departments" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status-filter">Status</Label>
              <Input id="status-filter" placeholder="All statuses" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location-filter">Location</Label>
              <Input id="location-filter" placeholder="All locations" />
            </div>
          </div>
        </DetailPanel>
      </div>
    );
  },
};
