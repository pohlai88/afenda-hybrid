import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FormField } from "./form-field";

const meta = {
  title: "Patterns/FormField",
  component: FormField,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "select", "checkbox", "switch", "date"],
    },
    required: { control: "boolean" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = {
  args: {
    label: "Full Name",
    name: "fullName",
    type: "text",
    placeholder: "Enter full name",
  },
};

export const Email: Story = {
  args: {
    label: "Email Address",
    name: "email",
    type: "email",
    placeholder: "name@company.com",
    required: true,
  },
};

export const Password: Story = {
  args: {
    label: "Password",
    name: "password",
    type: "password",
    placeholder: "Enter password",
  },
};

export const Number: Story = {
  args: {
    label: "Salary",
    name: "salary",
    type: "number",
    placeholder: "0.00",
  },
};

export const SelectField: Story = {
  args: {
    label: "Department",
    name: "department",
    type: "select",
    placeholder: "Choose department",
    options: [
      { value: "engineering", label: "Engineering" },
      { value: "marketing", label: "Marketing" },
      { value: "finance", label: "Finance" },
      { value: "hr", label: "Human Resources" },
    ],
  },
};

export const CheckboxField: Story = {
  args: {
    label: "I accept the terms and conditions",
    name: "acceptTerms",
    type: "checkbox",
    value: false,
  },
};

export const SwitchField: Story = {
  args: {
    label: "Enable notifications",
    name: "notifications",
    type: "switch",
    value: true,
  },
};

export const WithError: Story = {
  args: {
    label: "Employee Code",
    name: "code",
    type: "text",
    value: "",
    error: "Employee code is required",
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    label: "Employee ID",
    name: "id",
    type: "text",
    value: "EMP-001",
    disabled: true,
  },
};

export const FormLayout: Story = {
  args: { label: "First Name", name: "firstName" },
  render: function FormLayoutDemo() {
    return (
      <div className="w-[400px] space-y-4">
        <FormField label="First Name" name="firstName" required placeholder="Enter first name" />
        <FormField label="Last Name" name="lastName" required placeholder="Enter last name" />
        <FormField
          label="Email"
          name="email"
          type="email"
          required
          placeholder="name@company.com"
        />
        <FormField
          label="Department"
          name="department"
          type="select"
          placeholder="Select department"
          options={[
            { value: "engineering", label: "Engineering" },
            { value: "marketing", label: "Marketing" },
            { value: "finance", label: "Finance" },
          ]}
        />
        <FormField label="Active Employee" name="isActive" type="switch" value={true} />
      </div>
    );
  },
};
