import type { Meta, StoryObj } from "@storybook/react-vite";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Label } from "./label";

const meta = {
  title: "Primitives/RadioGroup",
  component: RadioGroup,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="full-time" className="space-y-3">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="full-time" id="full-time" />
        <Label htmlFor="full-time">Full-time</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="part-time" id="part-time" />
        <Label htmlFor="part-time">Part-time</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="contract" id="contract" />
        <Label htmlFor="contract">Contract</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="intern" id="intern" />
        <Label htmlFor="intern">Intern</Label>
      </div>
    </RadioGroup>
  ),
};

export const WithDescriptions: Story = {
  render: () => (
    <RadioGroup defaultValue="standard" className="space-y-4">
      <div className="flex items-start space-x-3">
        <RadioGroupItem value="standard" id="standard" className="mt-1" />
        <div className="grid gap-1.5">
          <Label htmlFor="standard" className="font-semibold">
            Standard Benefits
          </Label>
          <p className="text-sm text-muted-foreground">
            Health insurance, 401(k) matching, and paid time off
          </p>
        </div>
      </div>
      <div className="flex items-start space-x-3">
        <RadioGroupItem value="premium" id="premium" className="mt-1" />
        <div className="grid gap-1.5">
          <Label htmlFor="premium" className="font-semibold">
            Premium Benefits
          </Label>
          <p className="text-sm text-muted-foreground">
            All standard benefits plus dental, vision, and life insurance
          </p>
        </div>
      </div>
      <div className="flex items-start space-x-3">
        <RadioGroupItem value="executive" id="executive" className="mt-1" />
        <div className="grid gap-1.5">
          <Label htmlFor="executive" className="font-semibold">
            Executive Benefits
          </Label>
          <p className="text-sm text-muted-foreground">
            Premium benefits plus stock options, car allowance, and concierge services
          </p>
        </div>
      </div>
    </RadioGroup>
  ),
};
