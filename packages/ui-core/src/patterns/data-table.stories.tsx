import type { Meta, StoryObj } from "@storybook/react-vite";
import { DataTable } from "./data-table";
import { mockEmployeeData, mockEmployeeColumns, type MockEmployee } from "../__mocks__";

const meta = {
  title: "Patterns/DataTable",
  component: DataTable,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof DataTable<MockEmployee>>;

export const Default: Story = {
  args: {
    data: mockEmployeeData,
    columns: mockEmployeeColumns,
  },
};

export const WithPagination: Story = {
  args: {
    data: mockEmployeeData,
    columns: mockEmployeeColumns,
    pageSize: 5,
  },
};

export const SmallPage: Story = {
  args: {
    data: mockEmployeeData,
    columns: mockEmployeeColumns,
    pageSize: 3,
  },
};

export const Empty: Story = {
  args: {
    data: [],
    columns: mockEmployeeColumns,
  },
};

export const SingleRow: Story = {
  args: {
    data: [mockEmployeeData[0]],
    columns: mockEmployeeColumns,
  },
};

export const WithColumnVisibility: Story = {
  args: {
    data: mockEmployeeData,
    columns: mockEmployeeColumns.map((col) => ({ ...col, enableHiding: true })),
    enableColumnVisibility: true,
    searchable: true,
  },
};

export const WithExport: Story = {
  args: {
    data: mockEmployeeData,
    columns: mockEmployeeColumns,
    enableExport: true,
    exportFilename: "employees",
    searchable: true,
  },
};

export const FullFeatures: Story = {
  args: {
    data: mockEmployeeData,
    columns: mockEmployeeColumns.map((col) => ({ ...col, enableHiding: true })),
    enableColumnVisibility: true,
    enableExport: true,
    exportFilename: "employees-export",
    searchable: true,
    selectable: true,
    stickyHeader: true,
    pageSize: 10,
  },
};

export const Virtualized: Story = {
  args: {
    data: Array.from({ length: 1000 }, (_, i) => ({
      ...mockEmployeeData[i % mockEmployeeData.length],
      id: i + 1,
      employeeCode: `EMP-${String(i + 1).padStart(5, "0")}`,
    })),
    columns: mockEmployeeColumns,
    virtualized: true,
    virtualizedHeight: 600,
    searchable: true,
    enableColumnVisibility: true,
    enableExport: true,
  },
};
