import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stepper } from "./stepper";

const meta: Meta<typeof Stepper> = {
  title: "Patterns/Stepper",
  component: Stepper,
};
export default meta;
type Story = StoryObj<typeof Stepper>;

const steps = [
  { label: "Personal Info", description: "Basic details" },
  { label: "Employment", description: "Role and department" },
  { label: "Compensation", description: "Salary and benefits" },
  { label: "Review", description: "Confirm and submit" },
];

export const StepOne: Story = { args: { steps, currentStep: 0 } };
export const StepTwo: Story = { args: { steps, currentStep: 1 } };
export const StepThree: Story = { args: { steps, currentStep: 2 } };
export const Complete: Story = { args: { steps, currentStep: 4 } };
export const Vertical: Story = {
  args: { steps, currentStep: 1, orientation: "vertical" },
};
