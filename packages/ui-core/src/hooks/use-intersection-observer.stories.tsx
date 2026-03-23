import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useIntersectionObserver } from "./use-intersection-observer";
import { Badge } from "../primitives/badge";
import { Card, CardContent } from "../primitives/card";
import { ScrollArea } from "../primitives/scroll-area";

function UseIntersectionObserverDemo() {
  const [ref1, isVisible1] = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.5,
  });
  const [ref2, isVisible2] = useIntersectionObserver<HTMLDivElement>({
    threshold: 1.0,
    freezeOnceVisible: true,
  });
  const [ref3, isVisible3] = useIntersectionObserver<HTMLDivElement>({
    rootMargin: "-100px",
  });

  return (
    <div className="w-[500px] space-y-4">
      <div className="rounded-md border bg-muted/50 p-3 text-xs">
        <p className="font-medium">Observer Status:</p>
        <ul className="mt-1 space-y-0.5">
          <li>Target 1 (50% visible): {isVisible1 ? "✓ Visible" : "✗ Hidden"}</li>
          <li>Target 2 (100% visible, freeze): {isVisible2 ? "✓ Visible" : "✗ Hidden"}</li>
          <li>Target 3 (-100px margin): {isVisible3 ? "✓ Visible" : "✗ Hidden"}</li>
        </ul>
      </div>

      <ScrollArea className="h-[400px] rounded-md border">
        <div className="space-y-4 p-4">
          <div className="h-[200px] rounded-md border-2 border-dashed border-muted-foreground/25 p-4">
            <p className="text-sm text-muted-foreground">Scroll down...</p>
          </div>

          <Card ref={ref1} className={isVisible1 ? "border-primary" : ""}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium">Target 1</p>
                <p className="text-xs text-muted-foreground">Triggers at 50% visibility</p>
              </div>
              <Badge variant={isVisible1 ? "default" : "secondary"}>
                {isVisible1 ? "Visible" : "Hidden"}
              </Badge>
            </CardContent>
          </Card>

          <div className="h-[150px] rounded-md border-2 border-dashed border-muted-foreground/25" />

          <Card ref={ref2} className={isVisible2 ? "border-success" : ""}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium">Target 2</p>
                <p className="text-xs text-muted-foreground">100% visible, freezes once seen</p>
              </div>
              <Badge variant={isVisible2 ? "default" : "secondary"}>
                {isVisible2 ? "Visible" : "Hidden"}
              </Badge>
            </CardContent>
          </Card>

          <div className="h-[150px] rounded-md border-2 border-dashed border-muted-foreground/25" />

          <Card ref={ref3} className={isVisible3 ? "border-info" : ""}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium">Target 3</p>
                <p className="text-xs text-muted-foreground">With -100px root margin</p>
              </div>
              <Badge variant={isVisible3 ? "default" : "secondary"}>
                {isVisible3 ? "Visible" : "Hidden"}
              </Badge>
            </CardContent>
          </Card>

          <div className="h-[200px] rounded-md border-2 border-dashed border-muted-foreground/25" />
        </div>
      </ScrollArea>

      <p className="text-xs text-muted-foreground">
        Scroll within the container to trigger intersection observers. Target 2 stays visible once
        seen.
      </p>
    </div>
  );
}

const meta = {
  title: "Hooks/useIntersectionObserver",
  component: UseIntersectionObserverDemo,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof UseIntersectionObserverDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
