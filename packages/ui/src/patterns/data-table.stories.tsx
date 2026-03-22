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
