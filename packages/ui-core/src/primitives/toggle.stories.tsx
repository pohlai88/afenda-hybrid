import type { Meta, StoryObj } from "@storybook/react-vite";
import { Toggle } from "./toggle";
import { Bold, Italic, Underline } from "lucide-react";

const meta = {
  title: "Primitives/Toggle",
  component: Toggle,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg"],
    },
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: <Bold className="h-4 w-4" />,
    "aria-label": "Toggle bold",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: <Italic className="h-4 w-4" />,
    "aria-label": "Toggle italic",
  },
};

export const WithText: Story = {
  args: {
    children: (
      <>
        <Bold className="mr-2 h-4 w-4" />
        Bold
      </>
    ),
    "aria-label": "Toggle bold",
  },
};

export const Small: Story = {
  args: {
    size: "sm",
    children: <Underline className="h-3 w-3" />,
    "aria-label": "Toggle underline",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
    children: <Bold className="h-5 w-5" />,
    "aria-label": "Toggle bold",
  },
};
