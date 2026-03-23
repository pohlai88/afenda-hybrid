import type { Meta, StoryObj } from "@storybook/react-vite";
import { AuditFieldDiff } from "./audit-field-diff";
import { AUDIT_SURFACE_READONLY } from "./audit-chrome";
import { cn } from "@afenda/ui-core/lib/utils";

const meta = {
  title: "Patterns/AuditFieldDiff",
  component: AuditFieldDiff,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Read-only field change row for audit timelines (`audit-traceability-ux-standard.md` §6.1).",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof AuditFieldDiff>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StatusChange: Story = {
  args: {
    label: "Status",
    before: "Draft",
    after: "Posted",
  },
};

export const WithoutStrike: Story = {
  args: {
    label: "Description",
    before: "—",
    after: "Corrected invoice total",
    omitStrikeThrough: true,
  },
  decorators: [
    (Story) => (
      <div className={cn("max-w-md p-4", AUDIT_SURFACE_READONLY)}>
        <Story />
      </div>
    ),
  ],
};
