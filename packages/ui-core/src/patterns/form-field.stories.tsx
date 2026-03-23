import type { Meta, StoryObj } from "@storybook/react-vite";
import { FormField, FormFieldControl } from "./form-field";
import { Input } from "../primitives/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../primitives/select";

const meta: Meta<typeof FormField> = {
  title: "Patterns/FormField",
  component: FormField,
};
export default meta;
type Story = StoryObj<typeof FormField>;

export const Composition: Story = {
  args: {
    label: "Employee Code",
    name: "employee_code",
    description: "Unique identifier, auto-generated if left blank",
    required: true,
  },
  render: (args) => (
    <FormField {...args}>
      <Input placeholder="EMP-2024-0156" />
    </FormField>
  ),
};

export const WithError: Story = {
  args: {
    label: "Email",
    name: "email",
    error: "Email address is already in use",
    required: true,
  },
  render: (args) => (
    <FormField {...args}>
      <Input type="email" defaultValue="john@example.com" />
    </FormField>
  ),
};

export const WithSuccess: Story = {
  args: {
    label: "Username",
    name: "username",
    success: "Username is available",
  },
  render: (args) => (
    <FormField {...args}>
      <Input defaultValue="jdoe2024" />
    </FormField>
  ),
};

export const WithWarning: Story = {
  args: {
    label: "Leave Balance",
    name: "leave_balance",
    warning: "Balance is below threshold",
  },
  render: (args) => (
    <FormField {...args}>
      <Input type="number" defaultValue="2" />
    </FormField>
  ),
};

export const Readonly: Story = {
  args: {
    label: "Employee ID",
    name: "employee_id",
    readonly: true,
    readonlyValue: "EMP-2024-0156",
    copyable: true,
  },
};

export const WithCharacterCount: Story = {
  args: {
    label: "Bio",
    name: "bio",
    maxLength: 200,
    charCount: 142,
  },
  render: (args) => (
    <FormField {...args}>
      <Input defaultValue="Senior software engineer with 10+ years of experience..." />
    </FormField>
  ),
};

export const WithSelect: Story = {
  args: {
    label: "Department",
    name: "department",
    required: true,
  },
  render: (args) => (
    <FormField {...args}>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select department" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="engineering">Engineering</SelectItem>
          <SelectItem value="hr">Human Resources</SelectItem>
          <SelectItem value="finance">Finance</SelectItem>
        </SelectContent>
      </Select>
    </FormField>
  ),
};

export const AllInOneText: StoryObj<typeof FormFieldControl> = {
  render: () => (
    <FormFieldControl label="Full Name" name="full_name" type="text" value="Jane Doe" required />
  ),
};

export const AllInOneSelect: StoryObj<typeof FormFieldControl> = {
  render: () => (
    <FormFieldControl
      label="Status"
      name="status"
      type="select"
      value="active"
      options={[
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ]}
    />
  ),
};
