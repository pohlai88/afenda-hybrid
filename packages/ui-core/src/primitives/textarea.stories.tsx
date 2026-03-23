import type { Meta, StoryObj } from "@storybook/react-vite";
import { Textarea } from "./textarea";

const meta: Meta<typeof Textarea> = {
  title: "Primitives/Textarea",
  component: Textarea,
};
export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: { placeholder: "Enter your message..." },
};
export const Disabled: Story = {
  args: { placeholder: "Disabled textarea", disabled: true },
};
export const WithValue: Story = {
  args: {
    value: "This is some pre-filled content in the textarea field.",
  },
};
