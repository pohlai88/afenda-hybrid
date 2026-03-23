import type { Meta, StoryObj } from "@storybook/react-vite";
import { RecordStatusBar } from "./record-status-bar";
import { fn } from "@storybook/test";

const meta: Meta<typeof RecordStatusBar> = {
  title: "Patterns/RecordStatusBar",
  component: RecordStatusBar,
};
export default meta;
type Story = StoryObj<typeof RecordStatusBar>;

const states = [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "done", label: "Done" },
];

export const PillVariant: Story = {
  args: {
    states,
    current: "submitted",
    onChange: fn(),
  },
};

export const ArrowVariant: Story = {
  args: {
    states,
    current: "approved",
    variant: "arrow",
    onChange: fn(),
  },
};

export const ReadOnly: Story = {
  args: {
    states,
    current: "done",
  },
};

export const WithFoldedStates: Story = {
  args: {
    states: [
      { value: "draft", label: "Draft" },
      { value: "submitted", label: "Submitted" },
      { value: "approved", label: "Approved" },
      { value: "cancelled", label: "Cancelled", folded: true },
      { value: "done", label: "Done" },
    ],
    current: "approved",
    onChange: fn(),
  },
};

/** Guarded transitions (`workflow-state-transition-standard.md` §5.1). */
export const GuardedTransitions: Story = {
  args: {
    states: [
      { value: "draft", label: "Draft" },
      {
        value: "approved",
        label: "Approved",
        disabled: true,
        disabledReason: "Requires two approvers",
      },
      { value: "done", label: "Done" },
    ],
    current: "draft",
    onChange: fn(),
  },
};
