import type { Meta, StoryObj } from "@storybook/react-vite";
import { FormSection } from "./form-section";
import { FormField } from "./form-field";
import { Input } from "../primitives/input";

const meta: Meta<typeof FormSection> = {
  title: "Patterns/FormSection",
  component: FormSection,
};
export default meta;
type Story = StoryObj<typeof FormSection>;

export const SingleColumn: Story = {
  render: () => (
    <FormSection title="Personal Information">
      <FormField label="Full Name" name="name" required>
        <Input placeholder="Jane Doe" />
      </FormField>
      <FormField label="Email" name="email" required>
        <Input type="email" placeholder="jane@example.com" />
      </FormField>
    </FormSection>
  ),
};

export const TwoColumns: Story = {
  render: () => (
    <FormSection title="Employment Details" columns={2}>
      <FormField label="Job Title" name="title" required>
        <Input placeholder="Software Engineer" />
      </FormField>
      <FormField label="Department" name="department" required>
        <Input placeholder="Engineering" />
      </FormField>
      <FormField label="Start Date" name="start_date">
        <Input type="date" />
      </FormField>
      <FormField label="Manager" name="manager">
        <Input placeholder="Search..." />
      </FormField>
    </FormSection>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <FormSection
      title="Compensation"
      description="Salary and benefits information for the current fiscal year."
      columns={2}
    >
      <FormField label="Base Salary" name="salary">
        <Input type="number" placeholder="85000" />
      </FormField>
      <FormField label="Currency" name="currency">
        <Input defaultValue="USD" />
      </FormField>
    </FormSection>
  ),
};
