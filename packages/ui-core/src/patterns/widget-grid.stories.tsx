import type { Meta, StoryObj } from "@storybook/react-vite";
import { WidgetGrid, WidgetGridItem } from "./widget-grid";
import { Card, CardContent, CardHeader, CardTitle } from "../primitives/card";

const meta = {
  title: "Patterns/WidgetGrid",
  component: WidgetGrid,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof WidgetGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

function WidgetPlaceholder({ label, className }: { label: string; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-16 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
          Widget content
        </div>
      </CardContent>
    </Card>
  );
}

export const Default: Story = {
  args: {
    columns: 12,
    gap: 4,
    children: null,
  },
  render: () => (
    <WidgetGrid columns={12} gap={4}>
      <WidgetGridItem position={{ x: 0, y: 0, w: 3, h: 1 }}>
        <WidgetPlaceholder label="Metric A" />
      </WidgetGridItem>
      <WidgetGridItem position={{ x: 3, y: 0, w: 3, h: 1 }}>
        <WidgetPlaceholder label="Metric B" />
      </WidgetGridItem>
      <WidgetGridItem position={{ x: 6, y: 0, w: 3, h: 1 }}>
        <WidgetPlaceholder label="Metric C" />
      </WidgetGridItem>
      <WidgetGridItem position={{ x: 9, y: 0, w: 3, h: 1 }}>
        <WidgetPlaceholder label="Metric D" />
      </WidgetGridItem>
      <WidgetGridItem position={{ x: 0, y: 1, w: 8, h: 2 }}>
        <WidgetPlaceholder label="Chart Widget" />
      </WidgetGridItem>
      <WidgetGridItem position={{ x: 8, y: 1, w: 4, h: 2 }}>
        <WidgetPlaceholder label="List Widget" />
      </WidgetGridItem>
    </WidgetGrid>
  ),
};

export const TwoColumns: Story = {
  args: {
    columns: 12,
    gap: 4,
    children: null,
  },
  render: () => (
    <WidgetGrid columns={12} gap={4}>
      <WidgetGridItem position={{ x: 0, y: 0, w: 6, h: 1 }}>
        <WidgetPlaceholder label="Left" />
      </WidgetGridItem>
      <WidgetGridItem position={{ x: 6, y: 0, w: 6, h: 1 }}>
        <WidgetPlaceholder label="Right" />
      </WidgetGridItem>
    </WidgetGrid>
  ),
};

export const FullWidth: Story = {
  args: {
    columns: 12,
    gap: 4,
    children: null,
  },
  render: () => (
    <WidgetGrid columns={12} gap={4}>
      <WidgetGridItem position={{ x: 0, y: 0, w: 12, h: 2 }}>
        <WidgetPlaceholder label="Full-Width Dashboard Widget" />
      </WidgetGridItem>
    </WidgetGrid>
  ),
};

export const DenseLayout: Story = {
  args: {
    columns: 12,
    gap: 2,
    children: null,
  },
  render: () => (
    <WidgetGrid columns={12} gap={2}>
      {Array.from({ length: 6 }, (_, i) => (
        <WidgetGridItem key={i} position={{ x: (i % 3) * 4, y: Math.floor(i / 3), w: 4, h: 1 }}>
          <WidgetPlaceholder label={`Widget ${i + 1}`} />
        </WidgetGridItem>
      ))}
    </WidgetGrid>
  ),
};
