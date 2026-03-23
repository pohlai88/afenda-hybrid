import type { Meta, StoryObj } from "@storybook/react-vite";
import { DescriptionList } from "./description-list";

const meta: Meta<typeof DescriptionList> = {
  title: "Patterns/DescriptionList",
  component: DescriptionList,
};
export default meta;
type Story = StoryObj<typeof DescriptionList>;

export const TwoColumns: Story = {
  args: {
    columns: 2,
    items: [
      { label: "Full Name", value: "Jane Doe" },
      { label: "Email", value: "jane.doe@acme.com" },
      { label: "Department", value: "Engineering" },
      { label: "Start Date", value: "Jan 15, 2024" },
      { label: "Manager", value: "John Smith" },
      { label: "Location", value: "New York, NY" },
    ],
  },
};

export const ThreeColumns: Story = {
  args: {
    columns: 3,
    items: [
      { label: "Full Name", value: "Jane Doe" },
      { label: "Email", value: "jane.doe@acme.com" },
      { label: "Phone", value: "+1 (555) 123-4567" },
      { label: "Department", value: "Engineering" },
      { label: "Title", value: "Senior Software Engineer" },
      { label: "Location", value: "New York, NY" },
    ],
  },
};
