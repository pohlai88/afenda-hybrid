import type { Meta, StoryObj } from "@storybook/react-vite";
import { Switch } from "./switch";
import { Label } from "./label";

const meta = {
  title: "Primitives/Switch",
  component: Switch,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    disabled: { control: "boolean" },
    checked: { control: "boolean" },
  },
} satisfies Meta<typeof Switch>;

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
      <Switch id="dark-mode" />
      <Label htmlFor="dark-mode">Dark Mode</Label>
    </div>
  ),
};

export const SettingsList: Story = {
  render: () => (
    <div className="w-[300px] space-y-4">
      {[
        { id: "notifications", label: "Push Notifications", defaultChecked: true },
        { id: "emails", label: "Email Alerts", defaultChecked: true },
        { id: "sms", label: "SMS Alerts", defaultChecked: false },
        { id: "marketing", label: "Marketing Emails", defaultChecked: false },
      ].map((item) => (
        <div key={item.id} className="flex items-center justify-between">
          <Label htmlFor={item.id}>{item.label}</Label>
          <Switch id={item.id} defaultChecked={item.defaultChecked} />
        </div>
      ))}
    </div>
  ),
};
