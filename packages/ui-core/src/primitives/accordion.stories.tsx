import type { Meta, StoryObj } from "@storybook/react-vite";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./accordion";

const meta = {
  title: "Primitives/Accordion",
  component: Accordion,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {} as Story["args"],
  render: () => (
    <Accordion type="single" collapsible className="w-[400px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>What is AFENDA?</AccordionTrigger>
        <AccordionContent>
          AFENDA is a comprehensive Human Capital Management platform designed for enterprise
          organizations.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>How does payroll work?</AccordionTrigger>
        <AccordionContent>
          The payroll module automates salary calculations, tax deductions, and compliance reporting
          across multiple jurisdictions.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Can I customize workflows?</AccordionTrigger>
        <AccordionContent>
          Yes, AFENDA supports fully customizable approval workflows, business rules, and field
          configurations.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const Multiple: Story = {
  args: {} as Story["args"],
  render: () => (
    <Accordion type="multiple" className="w-[400px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>Employee Management</AccordionTrigger>
        <AccordionContent>
          Manage employee records, contracts, and organizational assignments.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Time & Attendance</AccordionTrigger>
        <AccordionContent>
          Track working hours, absences, and overtime with automated approvals.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Benefits Administration</AccordionTrigger>
        <AccordionContent>
          Configure and manage employee benefits, enrollments, and eligibility.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
