import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppModuleIcon } from "./app-module-icon";

const meta = {
  title: "Patterns/AppModuleIcon",
  component: AppModuleIcon,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    size: { control: { type: "range", min: 12, max: 48, step: 4 } },
  },
} satisfies Meta<typeof AppModuleIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { iconName: "Users", size: 24 },
};

export const Fallback: Story = {
  args: { iconName: "NonExistentIcon", size: 24 },
};

export const AllModuleIcons: Story = {
  args: { iconName: "Users" },
  render: () => {
    const icons = [
      { name: "Settings", label: "Core", color: "#6366f1" },
      { name: "Shield", label: "Security", color: "#8b5cf6" },
      { name: "ClipboardList", label: "Audit", color: "#64748b" },
      { name: "Users", label: "HR", color: "#10b981" },
      { name: "DollarSign", label: "Payroll", color: "#f59e0b" },
      { name: "Heart", label: "Benefits", color: "#ec4899" },
      { name: "Star", label: "Talent", color: "#06b6d4" },
      { name: "GraduationCap", label: "Learning", color: "#14b8a6" },
      { name: "Briefcase", label: "Recruitment", color: "#f97316" },
    ];

    return (
      <div className="grid grid-cols-3 gap-6">
        {icons.map((icon) => (
          <div key={icon.name} className="flex items-center gap-3">
            <div
              className="rounded-lg p-2"
              style={{ backgroundColor: `${icon.color}20`, color: icon.color }}
            >
              <AppModuleIcon iconName={icon.name} size={20} />
            </div>
            <div>
              <div className="text-sm font-medium">{icon.label}</div>
              <div className="text-xs text-muted-foreground">{icon.name}</div>
            </div>
          </div>
        ))}
      </div>
    );
  },
};

export const Sizes: Story = {
  args: { iconName: "Users" },
  render: () => (
    <div className="flex items-end gap-4">
      {[12, 16, 20, 24, 32, 48].map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <AppModuleIcon iconName="Users" size={size} />
          <span className="text-xs text-muted-foreground">{size}px</span>
        </div>
      ))}
    </div>
  ),
};
