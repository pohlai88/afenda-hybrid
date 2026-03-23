import type { Meta, StoryObj } from "@storybook/react-vite";
import { FilterBar, type FilterChip } from "./filter-bar";
import { Button } from "../primitives/button";
import { Input } from "../primitives/input";
import { Label } from "../primitives/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../primitives/select";
import * as React from "react";

const meta = {
  title: "Patterns/FilterBar",
  component: FilterBar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof FilterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {} as Story["args"],
  render: () => {
    const [activeFilters, setActiveFilters] = React.useState<FilterChip[]>([
      { id: "dept", label: "Department", value: "Engineering" },
      { id: "status", label: "Status", value: "Active" },
    ]);

    return (
      <div className="w-[600px]">
        <FilterBar
          activeFilters={activeFilters}
          onClearFilter={(id) => setActiveFilters((prev) => prev.filter((f) => f.id !== id))}
          onClearAll={() => setActiveFilters([])}
        >
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="eng">Engineering</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="hr">Human Resources</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="active">
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </FilterBar>
      </div>
    );
  },
};

export const WithMoreFilters: Story = {
  args: {} as Story["args"],
  render: () => {
    const [activeFilters, setActiveFilters] = React.useState<FilterChip[]>([
      { id: "dept", label: "Department", value: "Engineering" },
    ]);

    return (
      <div className="w-[600px]">
        <FilterBar
          activeFilters={activeFilters}
          onClearFilter={(id) => setActiveFilters((prev) => prev.filter((f) => f.id !== id))}
          onClearAll={() => setActiveFilters([])}
          moreFilters={
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="Enter location" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hire-date">Hire Date Range</Label>
                <Input id="hire-date" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary">Salary Range</Label>
                <Input id="salary" placeholder="Min - Max" />
              </div>
              <Button className="w-full">Apply Filters</Button>
            </div>
          }
        >
          <Select defaultValue="eng">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="eng">Engineering</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="hr">Human Resources</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </FilterBar>
      </div>
    );
  },
};
