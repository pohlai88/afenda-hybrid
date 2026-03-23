import type { Meta, StoryObj } from "@storybook/react-vite";
import { SearchFacetsBar } from "./search-facets-bar";
import type { SearchFacet } from "./search-facets-bar";
import { fn } from "@storybook/test";

const meta: Meta<typeof SearchFacetsBar> = {
  title: "Patterns/SearchFacetsBar",
  component: SearchFacetsBar,
};
export default meta;
type Story = StoryObj<typeof SearchFacetsBar>;

const fields = [
  { name: "name", label: "Name" },
  {
    name: "department",
    label: "Department",
    options: [
      { value: "engineering", label: "Engineering" },
      { value: "hr", label: "Human Resources" },
      { value: "finance", label: "Finance" },
    ],
  },
  {
    name: "status",
    label: "Status",
    operators: ["=" as const, "!=" as const],
    options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ],
  },
  { name: "salary", label: "Salary", operators: [">" as const, "<" as const, "=" as const] },
];

const sampleFacets: SearchFacet[] = [
  {
    id: "1",
    fieldName: "department",
    fieldLabel: "Department",
    operator: "=",
    value: "engineering",
    displayValue: "Engineering",
  },
  {
    id: "2",
    fieldName: "status",
    fieldLabel: "Status",
    operator: "=",
    value: "active",
    displayValue: "Active",
  },
];

export const Empty: Story = {
  args: {
    facets: [],
    fields,
    onAddFacet: fn(),
    onSearchChange: fn(),
    search: "",
  },
};

export const WithFacets: Story = {
  args: {
    facets: sampleFacets,
    fields,
    onAddFacet: fn(),
    onRemoveFacet: fn(),
    onClearAll: fn(),
    onSearchChange: fn(),
    search: "",
  },
};

export const WithoutSearch: Story = {
  args: {
    facets: sampleFacets,
    fields,
    onAddFacet: fn(),
    onRemoveFacet: fn(),
    onClearAll: fn(),
  },
};
