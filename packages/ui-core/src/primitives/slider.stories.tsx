import type { Meta, StoryObj } from "@storybook/react-vite";
import { Slider } from "./slider";
import * as React from "react";

const meta = {
  title: "Primitives/Slider",
  component: Slider,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = React.useState([50]);
    return (
      <div className="w-[400px] space-y-4">
        <div className="flex justify-between text-sm">
          <span>Salary Range</span>
          <span className="font-medium">${value[0]}K</span>
        </div>
        <Slider value={value} onValueChange={setValue} max={200} step={5} className="w-full" />
      </div>
    );
  },
};

export const Range: Story = {
  render: () => {
    const [value, setValue] = React.useState([30, 70]);
    return (
      <div className="w-[400px] space-y-4">
        <div className="flex justify-between text-sm">
          <span>Experience Range</span>
          <span className="font-medium">
            {value[0]} - {value[1]} years
          </span>
        </div>
        <Slider value={value} onValueChange={setValue} max={100} step={1} className="w-full" />
      </div>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="w-[400px] space-y-4">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Locked Setting</span>
        <span className="font-medium text-muted-foreground">50%</span>
      </div>
      <Slider defaultValue={[50]} disabled className="w-full" />
    </div>
  ),
};
