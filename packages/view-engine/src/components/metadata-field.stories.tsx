import type { Meta, StoryObj } from "@storybook/react-vite";
import { MetadataField } from "./metadata-field";
import type { FieldDef } from "../metadata/field-def";

const meta: Meta<typeof MetadataField> = {
  title: "Patterns/MetadataField",
  component: MetadataField,
};
export default meta;
type Story = StoryObj<typeof MetadataField>;

export const CharField: Story = {
  args: {
    field: {
      name: "employee_code",
      label: "Employee Code",
      type: "char",
      placeholder: "EMP-2024-0156",
      help: "Unique identifier, auto-generated if left blank",
    } satisfies FieldDef,
    value: "EMP-2024-0042",
  },
};

export const SelectionField: Story = {
  args: {
    field: {
      name: "department",
      label: "Department",
      type: "selection",
      required: true,
      options: [
        { value: "engineering", label: "Engineering" },
        { value: "hr", label: "Human Resources" },
        { value: "finance", label: "Finance" },
      ],
    } satisfies FieldDef,
    value: "engineering",
  },
};

export const BooleanField: Story = {
  args: {
    field: {
      name: "is_active",
      label: "Active",
      type: "boolean",
    } satisfies FieldDef,
    value: true,
  },
};

export const DateField: Story = {
  args: {
    field: {
      name: "hire_date",
      label: "Hire Date",
      type: "date",
      required: true,
    } satisfies FieldDef,
    value: new Date("2024-03-15"),
  },
};

export const MonetaryField: Story = {
  args: {
    field: {
      name: "salary",
      label: "Annual Salary",
      type: "monetary",
      digits: [10, 2],
      currencyField: "currency_id",
    } satisfies FieldDef,
    value: 85000,
  },
};

export const ReadonlyField: Story = {
  args: {
    field: {
      name: "employee_code",
      label: "Employee Code",
      type: "char",
      readonly: true,
    } satisfies FieldDef,
    value: "EMP-2024-0042",
  },
};

export const RadioWidget: Story = {
  args: {
    field: {
      name: "gender",
      label: "Gender",
      type: "selection",
      widget: "radio",
      options: [
        { value: "male", label: "Male" },
        { value: "female", label: "Female" },
        { value: "other", label: "Other" },
      ],
    } satisfies FieldDef,
    value: "female",
  },
};

export const WithError: Story = {
  args: {
    field: {
      name: "email",
      label: "Email",
      type: "char",
      widget: "email",
      required: true,
    } satisfies FieldDef,
    value: "invalid",
    error: "Please enter a valid email address",
  },
};
