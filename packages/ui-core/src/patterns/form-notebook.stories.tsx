import type { Meta, StoryObj } from "@storybook/react-vite";
import { FormNotebook } from "./form-notebook";
import { FormSection } from "./form-section";
import { FormField } from "./form-field";
import { Input } from "../primitives/input";

const meta: Meta<typeof FormNotebook> = {
  title: "Patterns/FormNotebook",
  component: FormNotebook,
};
export default meta;
type Story = StoryObj<typeof FormNotebook>;

export const Default: Story = {
  render: () => (
    <FormNotebook
      pages={[
        {
          value: "personal",
          label: "Personal Info",
          children: (
            <FormSection title="Identity" columns={2}>
              <FormField label="First Name" name="first_name" required>
                <Input />
              </FormField>
              <FormField label="Last Name" name="last_name" required>
                <Input />
              </FormField>
            </FormSection>
          ),
        },
        {
          value: "employment",
          label: "Employment",
          children: (
            <FormSection title="Position" columns={2}>
              <FormField label="Job Title" name="job_title" required>
                <Input />
              </FormField>
              <FormField label="Department" name="department">
                <Input />
              </FormField>
            </FormSection>
          ),
        },
        {
          value: "compensation",
          label: "Compensation",
          children: (
            <FormSection title="Salary">
              <FormField label="Annual Salary" name="salary">
                <Input type="number" />
              </FormField>
            </FormSection>
          ),
        },
      ]}
    />
  ),
};

export const PillVariant: Story = {
  render: () => (
    <FormNotebook
      variant="default"
      pages={[
        {
          value: "overview",
          label: "Overview",
          children: <p className="text-sm p-4 text-muted-foreground">Overview tab content</p>,
        },
        {
          value: "details",
          label: "Details",
          children: <p className="text-sm p-4 text-muted-foreground">Details tab content</p>,
        },
      ]}
    />
  ),
};
