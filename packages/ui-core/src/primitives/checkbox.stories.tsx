import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from "./checkbox";
import { Label } from "./label";

const meta = {
  title: "Primitives/Checkbox",
  component: Checkbox,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    disabled: { control: "boolean" },
    checked: { control: "boolean" },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = {
  args: { defaultChecked: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const DisabledChecked: Story = {
  args: { disabled: true, defaultChecked: true },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
};

export const CheckboxGroup: Story = {
  render: function CheckboxGroupDemo() {
    const items = ["Engineering", "Marketing", "Finance", "HR", "Sales"];
    return (
      <div className="space-y-3">
        <Label>Departments</Label>
        {items.map((item) => (
          <div key={item} className="flex items-center space-x-2">
            <Checkbox id={item.toLowerCase()} />
            <Label htmlFor={item.toLowerCase()} className="font-normal">
              {item}
            </Label>
          </div>
        ))}
      </div>
    );
  },
};
