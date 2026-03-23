import type { Meta, StoryObj } from "@storybook/react-vite";
import { Progress } from "./progress";

const meta: Meta<typeof Progress> = {
  title: "Primitives/Progress",
  component: Progress,
};
export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = { args: { value: 60 } };
export const Zero: Story = { args: { value: 0 } };
export const Complete: Story = { args: { value: 100 } };
export const Quarter: Story = { args: { value: 25 } };
